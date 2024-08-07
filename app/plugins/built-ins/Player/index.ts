import * as THREE from 'three';
import userProfile from '../../../userProfile';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { logBootTitleAndInfo } from '../../../local/windowLoadListener';
import PluginLoader from '../../types/PluginLoader';
import Core from '../Core';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';

// 1 micrometer to 100 billion light years in one scene, with 1 unit = 1 meter?
// preposterous!  and yet...
const NEAR = 0.001, FAR = 1e27;
// const NEAR = 0.000001, FAR = 1e27;

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
};
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------


export default class Player {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;

  // World position of the camera when the render loop started this frame. You
  // should prefer this over calculating it yourself unless you need a
  // sub-frame accuracy.
  public camWorldPosition = new THREE.Vector3();

  public camera: THREE.PerspectiveCamera;
  // public worldCoords: Vector3;
  // public coordsType: CoordType;

  constructor() {
    logBootTitleAndInfo('Driver', 'Pilot Interface', PluginLoader.bootLogIndex);
    const { display } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });
    this.camera = new THREE.PerspectiveCamera(
      display.fieldOfView, window.innerWidth / window.innerHeight, NEAR, FAR,
    );
    this.camera.name = 'primaryCamera';
    // this.worldCoords = new Vector3();
    // this.coordsType = CoordType.galaxyCentric;

    // Ensure the player always has a tiny point-light emanating from their
    // head so that the scene is never pitch black.
    // const light = new PointLight(0xffffff, 2, 10);
    const light = new THREE.AmbientLight(0xffffff);
    // @ts-ignore
    const illumination = new THREE.PointLight(0xffffff, 5);
    this.camera.add(light);
    this.camera.add(illumination);

    // const timerId = setInterval(() => {
    //   if (!window.debug.sol) {
    //     return;
    //   }
    //   clearInterval(timerId);
    //   // this.camera.position.set(-0.0038711067754775286, 0, 0.26675403118133545);
    //   this.camera.position.copy(window.debug.sol);
    // }, 20);

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.onWindowResize();

    this._pluginCache.core.prependRendererHook(this.step);
  }

  step = () => {
    // Compute it once so that the rest of the application can reuse as needed.
    this.camera.getWorldPosition(this.camWorldPosition);
  };

  onWindowResize() {
    const { graphics } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });

    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;

    const scale = graphics.resolutionScale;
    // TODO: move this to player module.
    this.camera.aspect = screenWidth / screenHeight;
    this.camera.updateProjectionMatrix();
  }
}

const playerPlugin = new CosmosisPlugin('player', Player);

export {
  playerPlugin,
};
