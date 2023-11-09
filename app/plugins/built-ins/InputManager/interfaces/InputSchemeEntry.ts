import { ControlSchema } from './ControlSchema';
import ModeController from '../types/ModeController';

interface InputUiInfo {
  /** The name as it will be displayed to the humans in the UI. */
  friendly: string,
  /** Higher priority items are displayed earlier in menus. Normal range
   *  0-100, where 100 is displayed first. Default is 0. */
  priority?: number,
  /** If set, this control scheme will appear to be part of the name
   *  specified in mergeInto. */
  // mergeInto?: string,
}

interface InputSchemeEntry extends InputUiInfo {
  /** Name of the schema variable. */
  key: string,
  /** ModeController instance managing plugin's controls. */
  modeController: ModeController,
  /** The name as it will be displayed to the humans in the UI. */
  friendly: string,
}

export {
  InputUiInfo,
  InputSchemeEntry,
}
