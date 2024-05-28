import { EciStructure } from '../../types/EciStructure';

interface PropulsionManagerECI extends EciStructure {
  capabilities: {
    setThrust: boolean,
    canReverse: boolean,
    cycleEngineType: boolean,
    impulse: boolean,
    warp: boolean,
    hyper: boolean,
    cascade: boolean,
    modalShift: boolean,
  },
  activeFlags: {
    canReverse: boolean,
  },
  cli: {
    // Cycles to the next engine type (example: impulse, warp).
    cycleEngineType: Function,
    // Activates the first engine of the specified type.
    activateSpecificEngineType: Function,
  },
}

export {
  PropulsionManagerECI,
};
