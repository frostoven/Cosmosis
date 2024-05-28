enum ModuleUpdateMode {
  /**
   * When passive, a module will wait for instructions to perform actions. For
   * example, a propulsion system in passive mode would wait for commands such
   * as setThrust and setRotationalAxes.
   */
  passive,
  /**
   * When active, a module will scan a known interface for values and act
   * automatically. For example, a propulsion module in active mode would read
   * thrust and rotational data from the helm and act on those values
   * automatically.
   */
  active,
}

export {
  ModuleUpdateMode,
};
