import { Scene } from 'three';
import HudItem from './HudItem';

export default class HudPage {
  public name: string;
  public children: Array<HudItem>;
  public scene: any;

  constructor(name, hudItems: Array<HudItem>) {
    this.name = name;
    this.children = [ ...hudItems ];
    this.scene = new Scene();
  }

  build(parent) {
    for (let i = 0, len = this.children.length; i < len; i++) {
      const item: HudItem = this.children[i];
      item.init(parent);
      // Note: if the scene already contains the item, nothing happens.
      this.scene.add(item.scene);
    }
  }
}
