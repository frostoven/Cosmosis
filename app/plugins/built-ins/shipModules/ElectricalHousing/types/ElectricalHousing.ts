import { gameRuntime } from '../../../../gameRuntime';
import { CoreType } from '../../../Core';

export default class ElectricalHousing {
  private readonly _modules: any[];

  constructor() {
    this._modules = [];
    gameRuntime.tracked.core.getOnce((core: CoreType) => {
      core.onAnimate.getEveryChange(this.stepAll.bind(this));
    });
  }

  embed(oneOrMoreModules: Array<any> | any) {
    if (!oneOrMoreModules) {
      return console.error(
        'Error: ElectricalHousing.embed() appears to have received something supernatural.',
      );
    }

    if (Array.isArray(oneOrMoreModules)) {
      for (let i = 0, len = oneOrMoreModules.length; i < len; i++) {
        this._modules.push(oneOrMoreModules[i]);
      }
    }
    else {
      this._modules.push(oneOrMoreModules);
    }
  }

  step() {
    console.error(
      'ElectricalHousing instances aren\'t meant to be stepped manually ' +
      '(they do have a stepAll function, but should be left along in most ' +
      'cases).'
    );
  }

  stepAll({ delta }) {
    for (let i = 0, len = this._modules.length; i < len; i++) {
      const shipModule = this._modules[i];
      shipModule.step();
    }
  }
}
