import * as THREE from 'three';
import { stepKeplerOrbitalMotion } from './astrophysics/keplerOrbitalStepper';
import { stepBodyRotation } from './astrophysics/bodyRotor';
import { OrbitalElements } from './interfaces/OrbitalElements';
import { GravitationalBody } from './interfaces/GravitationalBody';
import { BodyVisuals } from './interfaces/BodyVisuals';

/**
 * Includes local stars, planets, and moons.
 */
class LargeGravitationalSource {
  // Stop increasing sphere detail beyond a certain size.
  static WIDTH_SEGMENTS = 512;
  // Stop increasing sphere detail beyond a certain size.
  static HEIGHT_SEGMENTS = 256;

  // Name as displayed by the UI.
  name: string;
  // Required for moons only.
  parentPlanet: LargeGravitationalSource | null;
  // Defines the body's orbit.
  orbitalElements: OrbitalElements;
  // Textures, maps, etc.
  visuals: BodyVisuals;
  // The physical manifestation.
  mesh: THREE.Object3D;

  // Mass in kilograms.
  massKg: number;
  // Radius in meters.
  radiusM: number;
  // Position in meters.
  positionM = new THREE.Vector3();
  // Velocity in meters per second.
  velocity = new THREE.Vector3();

  // Rotational period in seconds.
  rotationPeriodS: number;
  // Axial tilt in radians.
  axialTilt: number;

  constructor(
    options: GravitationalBody,
  ) {
    this.name = options.name;
    this.massKg = options.massKg;
    this.radiusM = options.radiusM;
    this.rotationPeriodS = options.rotationPeriodS;
    this.axialTilt = options.axialTilt;
    this.parentPlanet = options.parentPlanet || null;
    this.orbitalElements = options.orbitalElements;
    this.visuals = options.visuals;

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(
        this.radiusM,
        LargeGravitationalSource.WIDTH_SEGMENTS,
        LargeGravitationalSource.HEIGHT_SEGMENTS,
      ),
      this.visuals.getSphereMaterial(),
    );

    // const planeSize = starSize * unitFactor * 3;
    const planeSize = this.radiusM * 2;
    const distantLight = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSize, planeSize),
      this.visuals.getDistantMaterial(),
    );

    const group = new THREE.Group();
    group.add(sphere);
    group.add(distantLight);

    this.mesh = group;
    // this.mesh = distantLight;
  }

  step(time: number) {
    stepKeplerOrbitalMotion(this, this.mesh, time);
    stepBodyRotation(this, this.mesh, time);
  }
}

export {
  LargeGravitationalSource,
};
