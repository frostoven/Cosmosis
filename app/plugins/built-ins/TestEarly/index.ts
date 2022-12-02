import {
  OnDependenciesMetFn,
  PluginInterface
} from '../../interfaces/PluginInterface';

export default class TestEarly implements PluginInterface {
  constructor() {
    console.log('-> constructing TestEarly');
  }

  onDependenciesMet: OnDependenciesMetFn = ({ next }) => {
    console.log('-> running TestEarly');
    next();
  };
}
