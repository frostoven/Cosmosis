import userProfile from '../../../../userProfile';

export default class ControlSchema {
  public name: string;
  public allControls: Array<string>;
  public controlMappings: Object;
  public metadata: { [key: string]: any } | undefined;

  constructor(
    { name, allControls, metadata }: { name: string, allControls: Array<string>, metadata?: { [key: string]: any } }
  ) {
    this.name = name;
    this.allControls = allControls;
    this.metadata = metadata;

    // This currently controls a special field, _description, which effectively
    // is from metadata. This is an old legacy method for menu description.
    // No longer needed? TODO: revise menu system that loads this.
    const savedControls = userProfile.getCurrentConfig({ identifier: 'controls' }).controls;
    this.controlMappings = savedControls[name];
  }
}
