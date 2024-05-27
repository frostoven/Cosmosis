import { EciEnum } from './EciEnum';

type EciRegistrationObject = { key: EciEnum, getEci: () => object };
type EciRegistrationSignature = ({
  key,
  getEci,
}: EciRegistrationObject) => void;

export {
  EciRegistrationSignature,
  EciRegistrationObject,
};
