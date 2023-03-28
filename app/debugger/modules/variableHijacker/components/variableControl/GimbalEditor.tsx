// maybe:
//   4 num input, pass a 'disableSlider' prop.
//   static method: isTypeSupported(Vector3) - generate icon if true

import React from 'react';
import * as THREE from 'three';
import { gameRuntime } from '../../../../../plugins/gameRuntime';
import Core from '../../../../../plugins/built-ins/Core';
import PreventRender from '../../../../components/PreventRender';
import NumberEditor from './NumberEditor';

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

interface Props {
  // The name of the variable you wish to control.
  targetName: string,
  // The parent object instance that your target is a child of.
  parent: object,
}

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
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('mousemove', mouseMouse);
      };

      document.addEventListener('mouseup', mouseUp);
    });
  };

  onMouseMove = (event) => {
    if (this.followingMouse) {
      const { screenX, screenY } = event;
      const deltaX = this.lastMouseX - screenX;
      const deltaY = this.lastMouseY - screenY;
      this.lastMouseX = screenX;
      this.lastMouseY = screenY;
      const cube: THREE.Object3D = this.world3d.cube;

      const group = new THREE.Group;
      group.attach(cube);
      group.rotateY(-deltaX * 0.07);
      group.rotateX(-deltaY * 0.07);
      this.world3d.scene.attach(cube);
    }
  };

  create3dWorld = () => {
    const width = 64;
    const height = 64;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
    cube.rotation.x = ((Math.random() * 4) + 3) * (Math.random() < 0.5 ? 1 : -1);
    cube.rotation.y = ((Math.random() * 4) + 3) * (Math.random() < 0.5 ? 1 : -1);
    cube.rotation.z = ((Math.random() * 4) + 3) * (Math.random() < 0.5 ? 1 : -1);
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

    const epsilon = 0.02;
    const rotation: THREE.Euler = cube.rotation;
    let allAxesReady = true;

    [ 'x', 'y', 'z' ].forEach(axis => {
      const distance = rotation[axis];
      if (Math.abs(distance) > epsilon) {
        const difference = distance - epsilon;
        rotation[axis] -= difference * delta * 10;
        allAxesReady = false;
      }
    });

    this.bootTimeout -= delta;
    if (this.bootTimeout < 0) {
      this.bootAnimDone = true;
      allAxesReady = true;
    }

    if (allAxesReady) {
      rotation.set(0, 0, 0);
      this.bootAnimDone = true;
      this.setupMouseControls();
    }
    else {
      const { x, y, z } = rotation;
    }
  }

  renderScene = ({ delta }) => {
    const { scene, camera, renderer } = this.world3d;
    if (!this.bootAnimDone) {
      this.renderCubeBoot({ delta });
    }
    renderer.render(scene, camera);
  };

  render() {
    const { parent, targetName } = this.props;
    const { scene, camera, renderer, element } = this.world3d;
    return (
      <div style={CONTAINER_STYLE}>
        <div>
          <NumberEditor style={INPUT_STYLE} targetName={targetName} parent={parent} simplified/>
          <NumberEditor style={INPUT_STYLE} targetName={targetName} parent={parent} simplified/>
          <NumberEditor style={INPUT_STYLE} targetName={targetName} parent={parent} simplified/>
        </div>
        <PreventRender>
          <div style={CANVAS_FRAME}>
            <div style={CANVAS_BACKGROUND}></div>
            <canvas key="gimbal-canvas" ref={this.canvasRef} style={CANVAS_STYLE}/>
          </div>
        </PreventRender>
      </div>
    );
  }
}
