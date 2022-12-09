import { ModeId } from '../types/ModeId';
import { ControlSchema } from './ControlSchema';

interface ModeStructure {
  name: string,
  modeId: ModeId,
  controlsByKey: { [key: string]: string },
  controls: ControlSchema,
  handler: Function,
}

export {
  ModeStructure,
}
