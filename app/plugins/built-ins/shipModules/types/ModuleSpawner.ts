export default class ModuleSpawner {
  createPart({ inventory } : { inventory? } = {}): any {
    throw 'Child class has not implemented createPart()';
  }
}
