import React from 'react';
import * as THREE from 'three';
import { gameRuntime } from '../../../../../plugins/gameRuntime';
import Core from '../../../../../plugins/built-ins/Core';
import PreventRender from '../../../../components/PreventRender';
import NumberEditor from './NumberEditor';
import { guessTypeInfo } from '../../../../debuggerUtils';
import ChangeTracker from 'change-tracker/src';
import { cosmDbg } from '../../../../index';
import { HeightSetting } from '../../../../components/types/HeightSetting';

const INPUT_STYLE: React.CSSProperties = {
  marginTop: -1,
};

const CONTAINER_STYLE: React.CSSProperties = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  borderLeft: '2px solid #d2d2d2',
  marginTop: 4,
  marginLeft: 3,
  padding: 4,
  paddingLeft: 19,
  position: 'relative',
};

const CANVAS_BACKGROUND: React.CSSProperties = {
  position: 'absolute',
  background: 'url(/css/debuggerImages/background-1.jpg)',
  border: 'thin dashed #775b77',
  backgroundSize: 'cover',
  width: 64,
  height: 64,
  opacity: 0.5,
  zIndex: 1,
};

const CANVAS_STYLE: React.CSSProperties = {
  position: 'absolute',
  zIndex: 2,
};

const CANVAS_FRAME: React.CSSProperties = {
  position: 'absolute',
  width: 64,
  height: 64,
  top: '50%',
  right: 0,
  transform: 'translateY(-50%)',
};

type AxisName = 'x' | 'y' | 'z' | '_x' | '_y' | '_z' | '_w';

interface SpatialDefinition {
  // Axis variable names.
  controlVars: AxisName[],
  // Convert variable being watched into a quaternion for easier processing.
  copyToQuaternion: (source: any, local: THREE.Quaternion) => any,
  // Convert local quaternion into a form compatible with the source.
  copyToSource: (local: THREE.Quaternion, target: any) => any,
}

interface SpatialDefinitions {
  [key: string]: SpatialDefinition,
}

const tempEuler = new THREE.Euler();
const typeDefinition: SpatialDefinitions = {
  Vector3: {
    controlVars: [ 'x', 'y', 'z' ],
    copyToQuaternion: (sourceVec3: THREE.Vector3, targetQuaternion) => {
      tempEuler.setFromVector3(sourceVec3);
      targetQuaternion.setFromEuler(tempEuler);
    },
    copyToSource: (local: THREE.Quaternion, target: THREE.Vector3) => {
      tempEuler.setFromQuaternion(local);
      target.copy(tempEuler.toVector3())
    },
  },
  Euler: {
    controlVars: [ '_x', '_y', '_z' ],
    copyToQuaternion: (sourceEuler: THREE.Euler, targetQuaternion) =>
      targetQuaternion.setFromEuler(sourceEuler),
    copyToSource: (local: THREE.Quaternion, target: THREE.Euler) =>
      target.setFromQuaternion(local),
  },
  Quaternion: {
    controlVars: [ '_x', '_y', '_z', '_w' ],
    copyToQuaternion: (sourceQuaternion: THREE.Quaternion, targetQuaternion) =>
      targetQuaternion.copy(sourceQuaternion),
    copyToSource: (local: THREE.Quaternion, target: THREE.Quaternion) =>
      target.copy(local),
  },
};

interface Props {
  // The name of the variable you wish to control.
  targetName: string,
  // The parent object instance that your target is a child of.
  parent: object,
}

// Dev note: we can create around 20 simultaneous renderers before we start
// hurting the application. Exceeding that may cause the game (or other
// canvases) to black-out for a second while it recovers context.
export default class GimbalEditor extends React.Component<Props> {
  private world3d: { scene, camera, renderer, element, cube } | { [key: string]: any };
  private readonly canvasRef: React.RefObject<any>;
  private readonly renderSceneFunction: OmitThisParameter<({ delta }: { delta: any }) => void>;
  private bootAnimDone: boolean;
  private bootTimeout: number;
  // If true, mouse button is currently down.
  private followingMouse: boolean;
  // What the mouse position was before the user started interacting.
  private lastMouseX: number;
  private lastMouseY: number;
  // Cumulative position. Obviously.
  private fineControl: boolean;
  // While the user holds x, y, or z, rotate the object along the held axis
  // only.
  private lockXAxis: boolean;
  private lockYAxis: boolean;
  private lockZAxis: boolean;
  private axisNames: AxisName[];
  private readonly axisValueTrackers: { [key: string]: ChangeTracker };
  private readonly startingPosition: THREE.Quaternion;
  private targetTypeDef: SpatialDefinition | null;

  static isTypeSupported(typeName) {
    return [ 'Quaternion', 'Vector3', 'Euler' ].includes(typeName);
  }

  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.world3d = {};
    this.renderSceneFunction = this.renderScene.bind(this);
    this.bootAnimDone = false;
    this.bootTimeout = 0.5;

    this.followingMouse = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.fineControl = false;

    this.axisNames = [];
    this.axisValueTrackers = {};
    // this.updatingCube = false;
    this.startingPosition = new THREE.Quaternion();
    this.targetTypeDef = null;

    this.lockXAxis = false;
    this.lockYAxis = false;
    this.lockZAxis = false;
  }

  componentDidMount() {
    this.world3d = this.create3dWorld();
    gameRuntime.tracked.core.getOnce((core: Core) => {
      this.world3d = this.create3dWorld();
      core.onAnimate.getEveryChange(this.renderSceneFunction);
    });
  }

  componentWillUnmount() {
    gameRuntime.tracked.core.getOnce((core: Core) => {
      core.onAnimate.removeGetEveryChangeListener(this.renderSceneFunction);
    });

    const renderer = this.world3d.renderer;
    if (renderer) {
      renderer.dispose();
      // TODO: this causes a message to be logged: THREE.WebGLRenderer: Context
      //  Lost. Maybe raise an issue with the Three.js community to silence the
      //  message via some  mechanism.
      renderer.forceContextLoss();
    }
  }

  setupMouseControls = () => {
    const element: HTMLCanvasElement = this.canvasRef.current;

    // This prevents a scroll hijack from happening on Windows machines.
    element.onmousedown = function(event) {
      if(event.button == 1) {
        event.preventDefault();
        return false;
      }
    };

    // Note: we don't need to clean up persistent mouse listeners when the
    // component is destroyed because they are automatically marked for garbage
    // collection. Mouse-down is manually dealt with to allow for out-of-canvas
    // mouse-up checks.
    element.addEventListener('mousedown', (event) => {
      event.stopPropagation();
      this.followingMouse = true;
      this.lastMouseX = event.screenX;
      this.lastMouseY = event.screenY;

      const mouseMouse = event => this.onMouseMove(event);
      document.addEventListener('mousemove', mouseMouse);

      const mouseUp = () => {
        this.followingMouse = false;
        this.fineControl = false;
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('mousemove', mouseMouse);
      };

      document.addEventListener('mouseup', mouseUp);
    });

    element.addEventListener('keydown', (event) => {
      event.key === 'Shift' && (this.fineControl = true);
      event.code === 'KeyX' && (this.lockXAxis = true);
      event.code === 'KeyY' && (this.lockYAxis = true);
      event.code === 'KeyZ' && (this.lockZAxis = true);
    });

    element.onkeyup = (event) => {
      event.key === 'Shift' && (this.fineControl = false);
      event.code === 'KeyX' && (this.lockXAxis = false);
      event.code === 'KeyY' && (this.lockYAxis = false);
      event.code === 'KeyZ' && (this.lockZAxis = false);
    }
  };

  onMouseMove = (event) => {
    if (this.followingMouse) {
      const { screenX, screenY } = event;
      const deltaX = this.lastMouseX - screenX;
      const deltaY = this.lastMouseY - screenY;
      this.lastMouseX = screenX;
      this.lastMouseY = screenY;
      const cube: THREE.Object3D = this.world3d.cube;

      const factor = this.fineControl ? 0.001 : 0.07;
      const group = new THREE.Group;
      group.attach(cube);
      if (this.lockZAxis) {
        // Note z does not naturally activate, so logic is inverted.
        this.lockZAxis && group.rotateZ(-deltaY * factor);
      }
      else {
        !this.lockXAxis && group.rotateY(-deltaX * factor);
        !this.lockYAxis && group.rotateX(-deltaY * factor);
      }
      this.world3d.scene.attach(cube);
      this.imposeCubeChanges();
    }
  };

  // While dragging the cube, send new values to children.
  imposeCubeChanges = () => {
    if (!this.followingMouse || !this.bootAnimDone || !this.targetTypeDef) {
      return;
    }

    const parent = this.props.parent[this.props.targetName];
    this.targetTypeDef.copyToSource(this.world3d.cube.quaternion, parent);
  };

  create3dWorld = () => {
    const width = 64;
    const height = 64;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
    cube.rotation.x = ((Math.random() * 4) + 6.2) * (Math.random() < 0.5 ? 1 : -1);
    cube.rotation.y = ((Math.random() * 4) + 6.2) * (Math.random() < 0.5 ? 1 : -1);
    cube.rotation.z = ((Math.random() * 4) + 6.2) * (Math.random() < 0.5 ? 1 : -1);
    scene.add(cube);

    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.current,
      alpha: true,
      powerPreference: "high-performance",
      antialias: true,
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    const element = renderer.domElement;

    return {
      scene, camera, renderer, element, cube,
    }
  };

  renderCubeBoot({ delta }) {
    const { cube } = this.world3d;

    let allAxesReady = false;
    cube.quaternion.slerp(this.startingPosition, delta * 8);

    this.bootTimeout -= delta;
    if (this.bootTimeout < 0) {
      this.bootAnimDone = true;
      allAxesReady = true;
    }

    if (allAxesReady) {
      cube.quaternion.copy(this.startingPosition);
      this.bootAnimDone = true;
      if (this.targetTypeDef) {
        const parent = this.props.parent[this.props.targetName];
        this.targetTypeDef.copyToQuaternion(parent, cube.quaternion);
      }
      this.setupMouseControls();
    }
  }

  renderScene = ({ delta }) => {
    const { scene, camera, renderer } = this.world3d;
    if (!this.bootAnimDone) {
      this.renderCubeBoot({ delta });
    }
    renderer.render(scene, camera);
  };
  
  genNumberEditors = () => {
    let typeDef;
    const target = this.props.parent[this.props.targetName];
    if (this.axisNames.length === 0) {
      const typeName = guessTypeInfo(target).friendlyName;
      typeDef = typeDefinition[typeName];
      if (!typeDef) {
        console.error(`[GimbalEditor] ${typeName} not (yet) supported.`);
        return null;
      }
      else {
        this.axisNames = [ ...typeDef.controlVars ];
      }
    }

    if (typeDef) {
      this.targetTypeDef = typeDef;
      if (!this.bootAnimDone) {
        const parent = this.props.parent[this.props.targetName];
        typeDef.copyToQuaternion(parent, this.startingPosition);
      }
    }

    // We're working with the original target's children; make that target the
    // new parent.
    const parent = this.props.parent[this.props.targetName];

    const components: Array<any> = [];
    for (let i = 0, len = this.axisNames.length; i < len; i++) {
      const axis = this.axisNames[i];
      components.push(
        <NumberEditor
          key={`GimbalEditor-Input-${axis}`}
          style={INPUT_STYLE}
          targetName={axis}
          parent={parent}
          getChildValueTracker={(valueTracker) => {
            this.axisValueTrackers[axis] = valueTracker;
            valueTracker.getEveryChange(() => this.followVariable());
          }}
          simplified
        />
      );
    }

    return components;
  };

  followVariable = () => {
    if (!this.targetTypeDef) {
      console.warn('[GimbalEditor] targetTypeDef not ready.');
      return;
    }

    const { cube } = this.world3d;
    if (!cube) {
      return;
    }
    const parent = this.props.parent[this.props.targetName];

    if (!this.bootAnimDone) {
      this.targetTypeDef.copyToQuaternion(parent, this.startingPosition);
      return;
    }

    if (!this.followingMouse) {
      this.targetTypeDef.copyToQuaternion(parent, cube.quaternion);
    }
  };

  render() {
    const canvasFrame = { ...CANVAS_FRAME };
    if (cosmDbg.getState().uiState?.modalSize !== HeightSetting.large) {
      canvasFrame.width = 27;
    }

    return (
      <div style={CONTAINER_STYLE}>
        <div>
          {this.genNumberEditors()}
        </div>
        <PreventRender>
          <div style={canvasFrame}>
            <div style={CANVAS_BACKGROUND}></div>
            <canvas key="gimbal-canvas" ref={this.canvasRef} style={CANVAS_STYLE} tabIndex={1}/>
          </div>
        </PreventRender>
      </div>
    );
  }
}
