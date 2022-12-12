import _ from 'lodash';
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
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { gameRuntime } from '../../gameRuntime';
import { CoreType } from '../Core';
import userProfile from '../../../userProfile';
import SpaceshipLoader from './types/SpaceshipLoader';
import { GLTFInterface } from '../../interfaces/GLTFInterface';
import ChangeTracker from 'change-tracker/src';
import { ShipModuleHub } from '../ShipModuleHub';
import Generator from '../shipModules/Generator/types/Generator';
import CockpitLights from '../shipModules/CockpitLights/types/CockpitLights';
import Multimeter from '../shipModules/Multimeter/types/Multimeter';
import ElectricalHousing from '../shipModules/ElectricalHousing/types/ElectricalHousing';


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
  moduleHub: ShipModuleHub | undefined;

  // @ts-ignore
  private _renderer: WebGLRenderer;
  private _cachedCamera: PerspectiveCamera;
  private _vehicle: GLTFInterface;
  private _vehicleInventory: { [moduleHookName: string]: Array<any> };

  public onVehicleEntered: ChangeTracker;

  constructor() {
    super();
    this._cachedCamera = new PerspectiveCamera();

    // @ts-ignore
    this._vehicle = null;
    this._vehicleInventory = {};
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

    this.onVehicleEntered = new ChangeTracker();

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

    // Allows for crazy-good fast rectangle area lights. Note that these
    // unfortunately don't case shadows, so only use them for wall lighting
    // where shadows wouldn't naturally form anyway (we can probably
    // investigate stenciling at some point).
    RectAreaLightUniformsLib.init();
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

  enterVehicle({ gltf, inventory }: { gltf: GLTFInterface, inventory: {} }) {
    this._vehicle = gltf;
    this._vehicleInventory = inventory;
    // console.log('-> gltf:', gltf);
    const scene = this._vehicle.scene;
    this.add(scene);
    scene.add(this._cachedCamera);
    // Blender direction is 90 degrees off from what three.js considers to be
    // 'stright-ahead'.
    this._cachedCamera.rotateX(-Math.PI / 2);
    this.onVehicleEntered.setValue(gltf);
    this.resetCameraSeatPosition();
    this.bootShip();
  }

  installVehicleElectronics() {
    //
  }

  bootShip() {
    // TODO: formalise the hardcoded ship modules here into a proper system.
    gameRuntime.tracked.shipModuleHub.getOnce((hub: ShipModuleHub) => {
      this.moduleHub = hub;

      const electricalHousing: ElectricalHousing = hub.acquirePart('electricalHousing');
      const generator: Generator = hub.acquirePart('generator');
      const cockpitLights: CockpitLights = hub.acquirePart('cockpitLights');
      const multimeter: Multimeter = hub.acquirePart('multimeter');

      // Note: this starts the process of stepping modules each frame. We do
      // this before assembly, and not after, because it has potential to show
      // the player things going online spontaneously (though, realistically,
      // code setup probably happens in under one frame).
      electricalHousing.embed([
        generator, cockpitLights, multimeter,
      ]);

      generator.powerOn();
      hub.plug(multimeter).intoPowerOutletOf(generator);

      _.each(this._vehicleInventory, (inventoryArray, responsibleModule) => {
        // console.log('--->', {responsibleModule, inventoryArray});
        //
      });
    });
  }

  resetCameraSeatPosition() {
    gameRuntime.tracked.player.getOnce((player) => {
      this.onVehicleEntered.getOnce((vehicle) => {
        player.camera.position.copy(vehicle.cameras[0].parent.position);
        player.camera.rotation.copy(vehicle.cameras[0].parent.rotation);
      });
    });
  }

  render() {
    this._renderer.render(this, this._cachedCamera);
  }
}

const levelScenePlugin = new CosmosisPlugin('levelScene', LevelScene);

export {
  levelScenePlugin,
}
