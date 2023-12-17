import { ControlSchema } from './ControlSchema';

interface BasicActionData {
  action: string,
  value: number,
}

interface ReceiverActionData extends BasicActionData {
  key: string | undefined,
  analogData: object | undefined
}

interface FullActionData extends ReceiverActionData {
  control: ControlSchema['key'],
}

export {
  BasicActionData,
  ReceiverActionData,
  FullActionData,
}
