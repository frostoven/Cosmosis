interface InterceptInterface {
  // Continue the loading chain.
  next: Function,
  // Use this to override / patch another plugin's class. Note that your plugin
  // needs to run before the plugin being overridden, otherwise this will
  // execute only after the other plugin has already loaded, effectively making
  // your override meaningless.
  replaceClass: {
    ( Object: { pluginName: string, replaceClassWith: any } )
  },
}

export {
  InterceptInterface,
}
