import {
  OnDependenciesMetFn,
  PluginInterface
} from '../../interfaces/PluginInterface';

class TestLate implements PluginInterface {
  constructor() {
    console.log('-> constructing TestLate');
  }

  onDependenciesMet: OnDependenciesMetFn = ({ next, replaceClass }) => {
    console.log('-> running TestLate');
  }
}

const testLatePlugin = new TestLate();

export {
  testLatePlugin,
}
