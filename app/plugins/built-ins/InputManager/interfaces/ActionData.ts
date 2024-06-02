import { ControlSchema } from './ControlSchema';

interface BasicActionData {
  action: string,
  value: number,
}

interface ReceiverActionData extends BasicActionData {
  key: string | undefined,
  analogData: {
    delta: number,
    gravDelta: number,
    complement: number | undefined
  } | undefined,
}

interface FullActionData extends ReceiverActionData {
  control: ControlSchema['key'],
}

export {
  BasicActionData,
  ReceiverActionData,
  FullActionData,
}
