import {
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Vector3,
  sRGBEncoding,
} from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { gameRuntime } from '../../gameRuntime';
import { CoreType } from '../Core';
import userProfile from '../../../userProfile';
import SpaceshipLoader from './types/SpaceshipLoader';
import { GLTFInterface } from '../../interfaces/GLTFInterface';


// TODO:
//  The space scene can load a vehicle. The player can be attached to the
//  vehicle, which effectively means that the camera is a child of the vehicle.
//  The vehicle can be attached to a point of interest. That simply means the
//  vehicle is now a child of that POI. While the vehicle is a child of a POI,
//  warp is not allowed (or, it is, but causes obvious problem like slamming
//  into a space station interior at light speed - seriously, allow this for
//  lolz). All this means we have full context of what's going on, allowing for
//  easy if..then logic that looks like fancy features. Note that this also
//  allows player to then dock ships into other larger ships. When the player
//  gets out, their vehicle is no longer programmatically their vehicle. And
//  interactable however can allow reentry. This means that docking into
//  another larger ship means you can use an interactable to pilot the larger
//  ship while the player's original ship is now just a prop in the hangar,
//  which they may later interact with to reenter.

class LevelScene extends Scene {
  // @ts-ignore
  private _renderer: WebGLRenderer;
  private _cachedCamera: PerspectiveCamera;
  private _vehicle: GLTFInterface;

  constructor() {
    super();
    this._cachedCamera = new PerspectiveCamera();

    // @ts-ignore
    this._vehicle = null;
    this.loadAndEnterLastVehicle();

    this._setupWatchers();
    this._configureRenderer();

    gameRuntime.tracked.core.getOnce((core: CoreType) => {
      core.appendRenderHook(this.render.bind(this));
    });

    // --------------------------------------------------------------------- //
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    this.add(cube);
    cube.position.copy(new Vector3(-1.5, 0.25, -6));
    // --------------------------------------------------------------------- //

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.onWindowResize();
  }

  _configureRenderer() {
    const { display, graphics } = userProfile.getCurrentConfig({
      identifier: 'userOptions'
    });

    const nearObjectCanvas = document.getElementById('near-object-canvas');
    const renderer = new WebGLRenderer({
      alpha: true,
      // @ts-ignore
      canvas: nearObjectCanvas,
      powerPreference: "high-performance",
      antialias: false,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !!graphics.enableShadows;
    renderer.shadowMap.type = graphics.shadowType;
    renderer.toneMapping = display.toneMapping;

    renderer.outputEncoding = sRGBEncoding;

    this._renderer = renderer;
  }

  _setupWatchers() {
    gameRuntime.tracked.player.getEveryChange((player) => {
      this._cachedCamera = player.camera;
    });
  }

  onWindowResize() {
    const { graphics } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });

    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;

    const scale = graphics.resolutionScale;
    this._renderer.setSize(screenWidth * scale, screenHeight * scale);
    this._renderer.domElement.style.width = '100%';
    this._renderer.domElement.style.height = '100%';
    this._cachedCamera.aspect = screenWidth / screenHeight;
    this._cachedCamera.updateProjectionMatrix();
  }

  // Load last vehicle the player was piloting previous sessions, and enter it.
  loadAndEnterLastVehicle() {
    const { playerInfo } = userProfile.getCurrentConfig({
      identifier: 'gameState'
    });
    const ship = playerInfo.vehicleInfo.piloting;
    this.loadVehicle(ship, this.enterVehicle);
  }

  loadVehicle(ship, onDone) {
    const shipLoader = new SpaceshipLoader(ship);
    shipLoader.trackedMesh.getOnce(onDone.bind(this));
  }

  enterVehicle(gltf: GLTFInterface) {
    this._vehicle = gltf;
    console.log('-> gltf:', gltf);
    const scene = this._vehicle.scene;
    this.add(scene);
    scene.add(this._cachedCamera);
    this._cachedCamera.position.copy(gltf.cameras[0].parent.position);
    this._cachedCamera.rotation.copy(gltf.cameras[0].parent.rotation);
    // Blender direction is 90 degrees off from what three.js considers to be
    // 'stright-ahead'.
    this._cachedCamera.rotateX(-Math.PI / 2);
  }

  render() {
    this._renderer.render(this, this._cachedCamera);
  }
}

const levelScenePlugin = new CosmosisPlugin('levelScene', LevelScene);

export {
  levelScenePlugin,
}
