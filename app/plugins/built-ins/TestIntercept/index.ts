import {
  OnDependenciesMetFn,
  PluginInterface
} from '../../interfaces/PluginInterface';

export default class TestIntercept implements PluginInterface {
  constructor() {
    console.log('-> constructing TestIntercept');
  }

  onDependenciesMet: OnDependenciesMetFn = ({ next, replaceClass }) => {
    console.log('-> running TestIntercept');
    replaceClass({ pluginName: 'TestLate', replaceClassWith: DuckType });
    next();
  }
}

class DuckType implements PluginInterface {
  constructor() {
    console.log('Quack!');
  }

  onDependenciesMet: OnDependenciesMetFn = ({ next, replaceClass }) => {
    console.log('-> Type TestLate has been replaced with DuckType.');
    next();
  }
}
