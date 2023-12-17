import { AmbientLight, PerspectiveCamera } from 'three';
import userProfile from '../../../userProfile';
import CosmosisPlugin from '../../types/CosmosisPlugin';

// 1 micrometer to 100 billion light years in one scene, with 1 unit = 1 meter?
// preposterous!  and yet...
const NEAR = 0.001, FAR = 1e27;
// const NEAR = 0.000001, FAR = 1e27;

export default class Player {
  public camera: PerspectiveCamera;
  // public worldCoords: Vector3;
  // public coordsType: CoordType;

  constructor() {
    const { display } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });
    this.camera = new PerspectiveCamera(display.fieldOfView, window.innerWidth / window.innerHeight, NEAR, FAR);
    this.camera.name = 'primaryCamera';
    // this.worldCoords = new Vector3();
    // this.coordsType = CoordType.galaxyCentric;

    // Ensure the player always has a tiny point-light emanating from their
    // head so that the scene is never pitch black.
    // const light = new PointLight(0xffffff, 2, 10);
    const light = new AmbientLight(0xffffff);
    // @ts-ignore
    const allumination = new THREE.PointLight(0xffffff, 5);
    this.camera.add(light);
    this.camera.add(allumination);

    // const timerId = setInterval(() => {
    //   if (!window.debug.sol) {
    //     return;
    //   }
    //   clearInterval(timerId);
    //   // this.camera.position.set(-0.0038711067754775286, 0, 0.26675403118133545);
    //   this.camera.position.copy(window.debug.sol);
    // }, 20);
  }
}

const playerPlugin = new CosmosisPlugin('player', Player);

export {
  playerPlugin,
}
