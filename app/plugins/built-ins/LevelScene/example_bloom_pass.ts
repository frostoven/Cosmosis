import {
  Layers,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
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
import ExternalLights from '../shipModules/ExternalLights/types/ExternalLights';
import WarpDrive from '../shipModules/WarpDrive/types/WarpDrive';
import PropulsionManager
  from '../shipModules/PropulsionManager/types/PropulsionManager';
import { Location } from '../Location';
import VisorHud from '../shipModules/VisorHud/types/VisorHud';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';


const BLOOM_SCENE = 1;
const bloomLayer = new Layers();
bloomLayer.set( BLOOM_SCENE );

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

export default class LevelScene extends Scene {
  moduleHub: ShipModuleHub | undefined;

  // @ts-ignore
  private _renderer: WebGLRenderer;
  private _cachedLocation: Location;
  private _cachedCamera: PerspectiveCamera;
  private _vehicle: GLTFInterface;
  private _vehicleInventory: { [moduleHookName: string]: Array<any> };

  public onVehicleEntered: ChangeTracker;
  private _electricalHousing: ElectricalHousing | null;

  constructor() {
    super();
    this._cachedCamera = new PerspectiveCamera();
    this._cachedLocation = gameRuntime.tracked.location.cachedValue;
    // this.fog = new FogExp2(0xDFE9F3, 0.0000005);

    // @ts-ignore
    this._vehicle = null;
    this._vehicleInventory = {};
    this._electricalHousing = null;
    this.loadAndEnterLastVehicle();

    this._setupWatchers();
    this._configureRenderer();

    gameRuntime.tracked.core.getOnce((core: CoreType) => {
      core.appendRenderHook(this.render.bind(this));
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

  _setupWatchers() {
    gameRuntime.tracked.player.getEveryChange((player) => {
      this._cachedCamera = player.camera;
    });
    gameRuntime.tracked.location.getEveryChange((location) => {
      this._cachedLocation = location;
    });
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

    const MIN_EXT = 0x8007;
    const MAX_EXT = 0x8008;


    // Allows for crazy-good fast rectangle area lights. Note that these
    // unfortunately don't case shadows, so only use them for wall lighting
    // where shadows wouldn't naturally form anyway (we can probably
    // investigate stenciling at some point).
    RectAreaLightUniformsLib.init();

    const gl = renderer.getContext();
    const ext = gl.getExtension('EXT_blend_minmax');
    window.debug.gl = gl;
    window.debug.ext = ext;
    //
    gl.disable(gl.DEPTH_TEST);
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_COLOR);
    // gl.blendEquation(MAX_EXT);
    // // gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    // gl.blendFunc(gl.ONE, gl.ONE);
    //
    gameRuntime.tracked.player.getOnce(({ camera }) => {
      const renderScene = new RenderPass(this, camera);

      const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
      bloomPass.threshold = 0; // 0-1. 0 = give all meshes bloom, 1 = no bloom.
      bloomPass.strength = 1; // 0-3 - how fuzzy the bloom is.
      bloomPass.radius = 0; // 0-1 - how blurred the bloom is.

      const outputPass = new OutputPass();

      this.bloomComposer = new EffectComposer( renderer );
      this.bloomComposer.addPass( renderScene );
      // this.bloomComposer.addPass( bloomPass );
      // this.bloomComposer.addPass( outputPass );

      const mixPass = new ShaderPass(
        new ShaderMaterial( {
          uniforms: {
            // 0.18 is quite realistic, assuming you're inside one of the outer
            // galactic arms and there's no ambient light. 1.0 is really
            // pretty. It's probably useful for special effects and being
            // inside the galactic center.
            // brightness: { value: 0.18 },
            brightness: { value: 0.18 },
            baseTexture: { value: null },
            // bloomTexture: { value: null }
          },
          vertexShader: `
            varying vec2 vUv;
            
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);      
            }
          `,
          fragmentShader: `
          uniform float brightness;
          uniform sampler2D baseTexture;
          // uniform sampler2D bloomTexture;
          
          varying vec2 vUv;
          
          void main() {
            vec4 base_color = texture2D(baseTexture, vUv);
            vec4 bloom_color = vec4(0.0);//texture2D(bloomTexture, vUv);
            
            // float lum = 0.21 * bloom_color.r + 0.71 * bloom_color.g + 0.07 * bloom_color.b;
            // vec4 color4 = vec4(base_color.rgb + bloom_color.rgb, max(base_color.a, 1.0));
            vec4 color4 = vec4(base_color.rgb * brightness, 1.0);
            gl_FragColor = color4;
          }
          `,
          defines: {}
        } ), 'baseTexture'
      );
      mixPass.needsSwap = true;

      this.finalComposer = new EffectComposer( renderer );
      this.finalComposer.addPass( renderScene );
      this.finalComposer.addPass( mixPass );
      this.finalComposer.addPass( outputPass );
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
    // TODO: move this to player module.
    this._cachedCamera.aspect = screenWidth / screenHeight;
    this._cachedCamera.updateProjectionMatrix();
  }

  // Load last vehicle the player was piloting previous sessions, and enter it.
  loadAndEnterLastVehicle() {
    const { playerInfo } = userProfile.getCurrentConfig({
      identifier: 'gameState'
    });
    let ship = playerInfo?.vehicleInfo?.piloting;
    if (typeof ship === 'undefined') {
      // ship = 'DS69F';
      ship = 'minimal scene';
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
    this._vehicle = gltf;
    this._vehicleInventory = inventory;
    // console.log('-> gltf:', gltf);
    const scene = this._vehicle.scene;
    this.add(scene);
    scene.add(this._cachedCamera);
    // Blender direction is 90 degrees off from what three.js considers to be
    // 'straight-ahead'.
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
      const inventory = this._vehicleInventory;

      const electricalHousing: ElectricalHousing = hub.acquirePart({ name: 'electricalHousing', inventory });
      const generator: Generator = hub.acquirePart({ name: 'generator', inventory });
      const visorHud: VisorHud = hub.acquirePart({ name: 'visorHud', inventory });
      const cockpitLights: CockpitLights = hub.acquirePart({ name: 'cockpitLights', inventory });
      const externalLights: ExternalLights = hub.acquirePart({ name: 'externalLights', inventory });
      const multimeter: Multimeter = hub.acquirePart({ name: 'multimeter', inventory });

      this._electricalHousing = electricalHousing;

      const propulsionManager: PropulsionManager = hub.acquirePart({ name: 'propulsionManager', inventory });
      const warpDrive: WarpDrive = hub.acquirePart({ name: 'warpDrive', inventory });

      // Note: this starts the process of stepping modules each frame. We do
      // this before assembly, and not after, because it has potential to show
      // the player things going online spontaneously (though, realistically,
      // code setup probably happens in under one frame).
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

    this._vehicle.scene.position.copy(this._cachedLocation.universeCoordsM.position);
    this._vehicle.scene.quaternion.copy(this._cachedLocation.universeRotationM.quaternion);
  }

  render() {
    this.step();
    // this._renderer.render(this, this._cachedCamera);
    // this.bloomComposer.render();
    this.finalComposer.render();
  }
}

const levelScenePlugin = new CosmosisPlugin('levelScene', LevelScene);

export {
  levelScenePlugin,
}
