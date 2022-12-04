import MeshLoader from './MeshLoader';

export default class SpaceshipLoader extends MeshLoader {
  constructor(shipName) {
    super('getSpaceship', shipName);
  }
}
