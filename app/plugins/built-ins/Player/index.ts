import { PerspectiveCamera, Vector3 } from 'three';
import { CoordType } from './types/CoordType';
import userProfile from '../../../userProfile';
import CosmosisPlugin from '../../types/CosmosisPlugin';

// 1 micrometer to 100 billion light years in one scene, with 1 unit = 1 meter?
// preposterous!  and yet...
const NEAR = 0.001, FAR = 1e27;

export default class Player {
  public camera: PerspectiveCamera;
  public worldCoords: Vector3;
  public coordsType: CoordType;

  constructor() {
    const { display } = userProfile.getCurrentConfig({
      identifier: 'userOptions',
    });
    this.camera = new PerspectiveCamera(display.fieldOfView, window.innerWidth / window.innerHeight, NEAR, FAR);
    this.camera.name = 'primaryCamera';
    this.worldCoords = new Vector3();
    this.coordsType = CoordType.galaxyCentric;
  }
}

const playerPlugin = new CosmosisPlugin('player', Player);

export {
  playerPlugin,
}
