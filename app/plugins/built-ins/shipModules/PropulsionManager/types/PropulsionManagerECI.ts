import { EciStructure } from '../../types/EciStructure';

interface PropulsionManagerECI extends EciStructure {
  capabilities: {
    setThrust: boolean,
    cycleEngineType: boolean,
    // activateSpecificEngineType: boolean,
    // availableEngineTypes: string[], // use enum instead?
    // Model names of all engines connected to the propulsion manager.
    // availableEngines: string[],
    impulse: boolean,
    warp: boolean,
    hyper: boolean,
    cascade: boolean,
    modalShift: boolean,
  },
  cli: {
    setThrottle: Function,
    // Cycles to the next engine type (example: impulse, warp).
    cycleEngineType: Function,
    // Activates the first engine of the specified type.
    activateSpecificEngineType: Function,
  },
}

export {
  PropulsionManagerECI,
};
