import {
  OnDependenciesMetFn,
  PluginInterface
} from '../../interfaces/PluginInterface';

class TestEarly implements PluginInterface {
  constructor() {
    console.log('-> constructing TestEarly');
  }

  onDependenciesMet: OnDependenciesMetFn = ({ next }) => {
    console.log('-> running TestEarly');
    next();
  };
}

const testEarlyPlugin = new TestEarly();

export {
  testEarlyPlugin,
}
