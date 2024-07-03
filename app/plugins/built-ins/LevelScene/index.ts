import {
  Layers,
  Group,
  WebGLRenderer, Camera,
} from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { gameRuntime } from '../../gameRuntime';
import Core, { CoreType } from '../Core';
import userProfile from '../../../userProfile';
import SpaceshipLoader from './types/SpaceshipLoader';
import { GLTFInterface } from '../../interfaces/GLTFInterface';
import ChangeTracker from 'change-tracker/src';
import { ShipModuleHub } from '../ShipModuleHub';
import Generator from '../shipModules/Generator/types/Generator';
import CockpitLights from '../shipModules/CockpitLights/types/CockpitLights';
import Multimeter from '../shipModules/Multimeter/types/Multimeter';
import ElectricalHousing
  from '../shipModules/ElectricalHousing/types/ElectricalHousing';
import ExternalLights
  from '../shipModules/ExternalLights/types/ExternalLights';
import WarpDrive from '../shipModules/WarpDrive/types/WarpDrive';
import PropulsionManager
  from '../shipModules/PropulsionManager/types/PropulsionManager';
import { SpacetimeControl } from '../SpacetimeControl';
import VisorHud from '../shipModules/VisorHud/types/VisorHud';
import { EciEnum } from '../shipModules/types/EciEnum';
import {
  EciRegistrationObject,
  EciRegistrationSignature,
} from '../shipModules/types/EciRegistrationSignature';
import Player from '../Player';
import { logBootTitleAndInfo } from '../../../local/windowLoadListener';
import PluginLoader from '../../types/PluginLoader';
import { NodeOps } from '../NodeOps';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';

const BLOOM_SCENE = 1;
const bloomLayer = new Layers();
bloomLayer.set(BLOOM_SCENE);

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

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
  nodeOps: NodeOps,
  spacetimeControl: SpacetimeControl,
  player: Player,
};
const shallowTracking = { player: { camera: 'camera' } };
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies & {
  camera: Camera, // declare shallow-tracked aliases
};

// -- ✀ -----------------------------------------------------------------------


export default class LevelScene extends Group {
  private _pluginCache = new PluginCacheTracker<Dependencies>(
    pluginList, shallowTracking,
  ).pluginCache;

  moduleHub: ShipModuleHub | undefined;

  // @ts-ignore
  private _renderer: WebGLRenderer;
  private _vehicle: GLTFInterface;
  private _vehicleInventory: { [moduleHookName: string]: Array<any> };
  private _eciRegistrations: Map<EciEnum, EciRegistrationObject[]> = new Map();
  private _ready = false;

  public onVehicleEntered: ChangeTracker;
  private _electricalHousing: ElectricalHousing | null;

  constructor() {
    super();
    logBootTitleAndInfo('Driver', 'Particle Sensor', PluginLoader.bootLogIndex);
    this._pluginCache.tracker.onAllPluginsLoaded.getOnce(() => {
      this._pluginCache.spacetimeControl.enterReality(this);
      this._ready = true;
    });
    // this.fog = new FogExp2(0xDFE9F3, 0.0000005);

    // @ts-ignore
    this._vehicle = null;
    this._vehicleInventory = {};
    this._electricalHousing = null;
    this.loadAndEnterLastVehicle();

    this._configureRenderer();

    gameRuntime.tracked.core.getOnce((core: CoreType) => {
      core.appendRenderHook(this.render);
    });

    // --------------------------------------------------------------------- //
    // const geometry = new BoxGeometry(1, 1, 1);
    // const material = new MeshBasicMaterial({ color: 0x00ff00 });
    // const cube = new Mesh(geometry, material);
    // this.add(cube);
    // cube.position.copy(new Vector3(-1.5, 0.25, -6));
    // --------------------------------------------------------------------- //

    this.onVehicleEntered = new ChangeTracker();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.onWindowResize();
  }

  _configureRenderer() {
    const { display, graphics } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });

    const nearObjectCanvas = document.getElementById('near-object-canvas');
    const renderer = new WebGLRenderer({
      alpha: true,
      // @ts-ignore
      canvas: nearObjectCanvas,
      powerPreference: 'high-performance',
      antialias: true,
    });

    renderer.useLegacyLights = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !!graphics.enableShadows;
    renderer.shadowMap.type = graphics.shadowType;
    renderer.toneMapping = display.toneMapping;

    // renderer.outputEncoding = sRGBEncoding;

    this._renderer = renderer;
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
    // TODO: move this to player module.
    const camera = this._pluginCache.player.camera;
    camera.aspect = screenWidth / screenHeight;
    camera.updateProjectionMatrix();
  }

  // Load last vehicle the player was piloting previous sessions, and enter it.
  loadAndEnterLastVehicle() {
    const { playerInfo } = userProfile.getCurrentConfig({
      identifier: 'gameState',
    });
    let ship = playerInfo?.vehicleInfo?.piloting;
    if (typeof ship === 'undefined') {
      ship = 'DS69F';
      // ship = 'minimal scene';
      console.error(`Could get read ship info from configs. Defaulting to ${ship}.`);
      // TODO: if this happens, we should actually offer a save rollback
      //  option, and/or go to ship selector.
    }

    this.loadVehicle(ship, this.enterVehicle);
  }

  loadVehicle(ship, onDone) {
    const shipLoader = new SpaceshipLoader(ship);
    shipLoader.trackedMesh.getOnce(onDone.bind(this));
  }

  enterVehicle({ gltf, inventory }: { gltf: GLTFInterface, inventory: {} }) {
    this._pluginCache.spacetimeControl.setLevel(this.id);
    this._vehicle = gltf;
    this._vehicleInventory = inventory;
    // console.log('-> gltf:', gltf);
    const scene = this._vehicle.scene;

    // // Temporary hack to always face Orion.
    // scene.rotateY(3.5);
    // scene.rotateX(-0.2);
    // this._cachedLocation.universeRotationM.quaternion.copy(scene.quaternion);

    this.add(scene);
    scene.add(this._pluginCache.player.camera);
    // Blender direction is 90 degrees off from what three.js considers to be
    // 'straight-ahead'.
    this._pluginCache.player.camera.rotateX(-Math.PI / 2);
    this.onVehicleEntered.setValue(gltf);
    this.resetCameraSeatPosition();
    this.bootShip();
  }

  installVehicleElectronics() {
    //
  }

  _spawnSimplePart(hub: ShipModuleHub, name: string) {
    const inventory = this._vehicleInventory;
    return hub.acquirePart({
      name,
      inventory,
      eciRegistration: this._setUpEciHook,
    });
  }

  bootShip() {
    // TODO: formalise the hardcoded ship modules here into a proper system.
    gameRuntime.tracked.shipModuleHub?.getOnce((hub: ShipModuleHub) => {
      this.moduleHub = hub;
      const inventory = this._vehicleInventory;

      const electricalHousing: ElectricalHousing =
        this._spawnSimplePart(hub, 'electricalHousing');
      this._electricalHousing = electricalHousing;

      const multimeter: Multimeter =
        this._spawnSimplePart(hub, 'multimeter');
      const generator: Generator =
        this._spawnSimplePart(hub, 'generator');
      const visorHud: VisorHud =
        this._spawnSimplePart(hub, 'visorHud');
      const cockpitLights: CockpitLights =
        this._spawnSimplePart(hub, 'cockpitLights');
      const externalLights: ExternalLights =
        this._spawnSimplePart(hub, 'externalLights');
      const propulsionManager: PropulsionManager =
        this._spawnSimplePart(hub, 'propulsionManager');
      const warpDrive: WarpDrive =
        this._spawnSimplePart(hub, 'warpDrive');

      // Note: this starts the process of stepping modules each frame. We do
      // this before assembly, and not after, because it has potential to show
      // the player things going online spontaneously (though, realistically,
      // code setup probably happens in under one frame).
      // TODO: Add module boot delays.
      electricalHousing.embed([
        generator, visorHud, cockpitLights, externalLights, multimeter,
        propulsionManager, warpDrive,
      ]);

      generator.powerOn();
      //
      hub.plug(multimeter).intoPowerOutletOf(generator);
      hub.plug(visorHud).intoPowerOutletOf(generator);
      hub.plug(cockpitLights).intoPowerOutletOf(generator);
      hub.plug(externalLights).intoPowerOutletOf(generator);
      hub.plug(propulsionManager).intoPowerOutletOf(generator);
      hub.plug(warpDrive).intoPowerOutletOf(generator);
      //
      hub.delegate(warpDrive).controlMechanismsTo(propulsionManager);

      console.log('Generator state:', generator.getSupplyState());
    });
  }

  // Any system that wants to send commands to a generic interface may do so
  // via this mechanism.
  _setUpEciHook: EciRegistrationSignature = ({ key, getEci }) => {
    if (!this._eciRegistrations.get(key)) {
      this._eciRegistrations.set(key, []);
    }
    this._eciRegistrations.get(key)!.push({ key, getEci });
  };

  // Modules may optionally expose an electronic control interface, which other
  // modules or non-module system may send commands to. An example of this is
  // the helmControl plugin, which uses the electronic control interface to
  // send propulsion commands. Note that the ECI works on a key:value system,
  // and will expose only the last interface that overrides the given key name.
  // Where system require dynamic switching, a management interface should be
  // such, such as the propulsionManager in the case of multi-engine support.
  getElectronicControlInterface(target: EciEnum) {
    const entry = this._eciRegistrations.get(target);
    if (entry && entry.length) {
      // Return the latest ECI registration with the specified name;
      return entry[entry.length - 1];
    }
    else {
      return null;
    }
  }

  resetCameraSeatPosition() {
    gameRuntime.tracked.player.getOnce((player) => {
      this.onVehicleEntered.getOnce((vehicle) => {
        player.camera.position.copy(vehicle.cameras[0].position);
        player.camera.rotation.copy(vehicle.cameras[0].rotation);
      });
    });
  }

  step() {
    if (!this._vehicle) {
      return;
    }
  }

  render = () => {
    if (!this._ready) {
      return;
    }
    this._renderer.render(this, this._pluginCache.camera);
  };
}

const levelScenePlugin = new CosmosisPlugin(
  'levelScene', LevelScene, pluginDependencies,
);

export {
  levelScenePlugin,
};
