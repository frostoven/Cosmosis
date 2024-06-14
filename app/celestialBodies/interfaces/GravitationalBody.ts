import { OrbitalElements } from './OrbitalElements';
import { BodyVisuals } from './BodyVisuals';
import { LargeGravitationalSource } from '../LargeGravitationalSource';

interface GravitationalBody {
  name: string,
  massKg: number,
  radiusM: number,
  rotationPeriodS: number,
  axialTilt: number,
  orbitalElements: OrbitalElements,
  visuals: BodyVisuals,
  parentPlanet?: LargeGravitationalSource | undefined,
}

export {
  GravitationalBody,
};
