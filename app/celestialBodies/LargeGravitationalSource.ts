import * as THREE from 'three';
import { stepKeplerOrbitalMotion } from './astrophysics/keplerOrbitalStepper';
import { stepBodyRotation } from './astrophysics/bodyRotor';
import { OrbitalElements } from './interfaces/OrbitalElements';
import { GravitationalBody } from './interfaces/GravitationalBody';
import { BodyVisuals } from './interfaces/BodyVisuals';

// How many nth frames should we update body distance?
const DIST_UPDATE_FREQ = 2;
const NEAR_FACTOR = 10;

/** Grants us a bit of autocomplete while still allowing easy modding. */
type KnownGravitationalBodyTypes =
  'LargeGravitationalSource' | 'Star' | 'Planet' | 'Moon' | string;

/**
 * Includes local stars, planets, and moons.
 */
abstract class LargeGravitationalSource {
  // Stop increasing sphere detail beyond a certain size.
  static WIDTH_SEGMENTS = 512;
  // Stop increasing sphere detail beyond a certain size.
  static HEIGHT_SEGMENTS = 256;

  type: KnownGravitationalBodyTypes = 'LargeGravitationalSource';

  // Name as displayed by the UI.
  name: string;
  // Required for moons only.
  parentPlanet: LargeGravitationalSource | null;
  // Defines the body's orbit.
  orbitalElements: OrbitalElements;
  // Textures, maps, etc.
  visuals: BodyVisuals;
  // The physical manifestation.
  sphereMesh: THREE.Object3D;
  // Used as the object's glow when far away, and the atmosphere when close.
  bodyGlow: THREE.Object3D;
  // Holds 3D both the body and its shader objects.
  container: THREE.Group;

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

  // Squared distance from the camera. As an example, if the camera is 5 meters
  // from the camera, this value will be 25, because 5 = √25. We use a squared
  // units to avoid having to find square roots each frame, which is both
  // expensive and makes no difference to the involved formulas.
  squareMDistanceFromCamera: number = 1e20;
  // How many frames from now should we recalculate the distance?
  nextDistanceUpdate: number = 1;
  // While true, nextDistUpdate is ignored (though still updated for
  // synchronization reasons).
  continuallyUpdateDistance: boolean = false;
  // An object is considered to be nearby if it's closer than 10x its radius.
  isNearby: boolean = false;
  nearDistance: number;

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
    this.nearDistance = this.radiusM * this.radiusM * NEAR_FACTOR;

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
    const bodyGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSize, planeSize, 256, 256),
      // new THREE.BoxGeometry(planeSize, planeSize, planeSize, 64, 64, 64),
      // new THREE.IcosahedronGeometry(planeSize, 5),
      this.visuals.getGlowMaterial(),
    );

    const group = new THREE.Group();
    group.add(sphere);
    group.add(bodyGlow);

    this.sphereMesh = sphere;
    this.bodyGlow = bodyGlow;
    this.container = group;
  }

  calculateDistance(viewerPosition: THREE.Vector3) {
    this.squareMDistanceFromCamera = viewerPosition.distanceToSquared(this.positionM);
    this.isNearby = this.nearDistance > this.squareMDistanceFromCamera;
    this.bodyGlow.lookAt(0, 0, 0);
  }

  step(time: number, viewerPosition: THREE.Vector3) {
    stepKeplerOrbitalMotion(this, this.container, time);
    stepBodyRotation(this, this.sphereMesh, time);

    // Calculate the distance to the body. This is used by various other
    // functions. We halve CPU requirements, each body's distance is computed
    // every second frame only (the parent object ensures these are
    // interleaved). If continualDistUpdates is true, this body will update
    // every frame instead (needed when nearing a body, and by the UI).
    this.nextDistanceUpdate--;
    if (this.nextDistanceUpdate === 0) {
      this.nextDistanceUpdate = DIST_UPDATE_FREQ;
      this.calculateDistance(viewerPosition);
    }
    else if (this.isNearby || this.continuallyUpdateDistance) {
      this.calculateDistance(viewerPosition);
    }
  }
}

export {
  LargeGravitationalSource,
  KnownGravitationalBodyTypes,
};
