import { ControlSchema } from './ControlSchema';

interface InputSchemeEntry {
  /** Name of the schema variable. */
  key: string,
  /** Your plugin's control schema. */
  schema: ControlSchema,
  /** The name as it will be displayed to the humans in the UI. */
  friendly: string,
  /** Higher priority items are displayed earlier in menus. Normal range
   *  0-100, where 100 is displayed first. Default is 0. */
  priority?: number,
  /** If set, this control scheme will appear to be part of the name
   *  specified in mergeInto. */
  mergeInto?: string,
}

export {
  InputSchemeEntry,
}
