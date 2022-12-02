import {
  OnDependenciesMetFn,
  PluginInterface
} from '../../interfaces/PluginInterface';

export default class TestLate implements PluginInterface {
  constructor() {
    console.log('-> constructing TestLate');
  }

  onDependenciesMet: OnDependenciesMetFn = ({ next, replaceClass }) => {
    console.log('-> running TestLate');
  }
}
