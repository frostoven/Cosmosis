import { EciRegistrationSignature } from './EciRegistrationSignature';

export default class ModuleSpawner {
  createPart({ inventory, eciRegistration }: {
    inventory?,
    eciRegistration?: EciRegistrationSignature
  } = {}): any {
    throw 'Child class has not implemented createPart()';
  }
}
