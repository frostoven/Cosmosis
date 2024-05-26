interface EciStructure {
  capabilities: object,
  cli: object,
  manufacturerInfo: {
    manufacturer: string,
    model: string,
    tamperCheck: 'pass' | 'fail',
    // we should probably also have some field that implies the part is
    // constantly trying to contact the manufacturer for "compliancy checks."
  }
}

export {
  EciStructure,
};
