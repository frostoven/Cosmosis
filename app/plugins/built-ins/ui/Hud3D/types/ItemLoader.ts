import MeshLoader from '../../../NodeOps/types/MeshLoader';

export default class ItemLoader {
  mesh: MeshLoader;

  constructor(name: string) {
    this.mesh = new MeshLoader(name, 'getHudModel');
  }
}
