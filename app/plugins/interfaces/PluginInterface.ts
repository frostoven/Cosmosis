import { InterceptInterface } from './InterceptInterface';

interface PluginInterface {
  onDependenciesMet: OnDependenciesMetFn,
}

type OnDependenciesMetFn = {
  ( modInterface: InterceptInterface )
};

export {
  PluginInterface,
  OnDependenciesMetFn,
}
