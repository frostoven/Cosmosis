// maybe:
//   4 num input, pass a 'disableSlider' prop.
//   static method: isTypeSupported(Vector3) - generate icon if true

import React from 'react';
import * as THREE from 'three';
import { gameRuntime } from '../../../../../plugins/gameRuntime';
import Core from '../../../../../plugins/built-ins/Core';
import PreventRender from '../../../../components/PreventRender';
import NumberEditor from './NumberEditor';

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
  backgroundSize: 'cover',
  width: 64,
  height: 64,
  opacity: 0.5,
  zIndex: 1,
};

const CANVAS_STYLE: React.CSSProperties = {
  position: 'absolute',
  border: 'thin dashed #775b77',
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

  static isTypeSupported(typeName) {
    return [ 'Quaternion', 'Vector3', 'Euler' ].includes(typeName);
  }

  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.world3d = {};
    this.renderSceneFunction = this.renderScene.bind(this);
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

  create3dWorld = () => {
    const width = 64;
    const height = 64;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
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

  renderScene = ({ delta }) => {
    const { scene, camera, renderer } = this.world3d;
    renderer.render(scene, camera);
  };

  render() {
    const { parent, targetName } = this.props;
    const { scene, camera, renderer, element } = this.world3d;
    return (
      <div style={CONTAINER_STYLE}>
        <div>
          <NumberEditor targetName={targetName} parent={parent} simplified={true}/>
          <NumberEditor targetName={targetName} parent={parent} simplified={true}/>
          <NumberEditor targetName={targetName} parent={parent} simplified={true}/>
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
