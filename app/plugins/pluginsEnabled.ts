import { PluginEntry } from './interfaces/PluginEntry';
import TestEarly from './built-ins/TestEarly';
import TestIntercept from './built-ins/TestIntercept';
import TestLate from './built-ins/TestLate';

const builtInPluginsEnabled: PluginEntry[] = [
  {
    name: 'TestEarly',
    type: TestEarly,
  },
  {
    name: 'TestIntercept',
    dependencies: [ 'TestEarly' ],
    type: TestIntercept,
  },
  // {
  //   name: 'levelScene',
  // },
  // {
  //   name: 'spaceScene',
  // },
  // {
  //   name: 'playerShip',
  // },
  {
    name: 'TestLate',
    type: TestLate,
  },
];

export {
  builtInPluginsEnabled,
}
