import MeshLoader from '../../NodeOps/types/MeshLoader';

export default class SpaceshipLoader extends MeshLoader {
  constructor(shipName) {
    super(shipName, 'getSpaceship');
  }
}
