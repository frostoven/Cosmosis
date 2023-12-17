import ChangeTracker from 'change-tracker/src';

export default class GalaxyDB {
  private onModuloPositionChance: ChangeTracker;
  private onSgtAStarPositionReady: ChangeTracker;
  private onSolPositionReady: ChangeTracker;
  private onGalaxyPointsReady: ChangeTracker;
  constructor() {
    this.onModuloPositionChance = new ChangeTracker();
    this.onSgtAStarPositionReady = new ChangeTracker();
    this.onSolPositionReady = new ChangeTracker();
    this.onGalaxyPointsReady = new ChangeTracker();
  }

  isNonProceduralStarNearby() {
    //
  }

  isProceduralStarNearby() {
    //
  }

  isStarNearby() {
    // isNonProceduralStarNearby
    // isProceduralStarNearby
  }

  generateSemiSphere() {
    //
  }

  createGalacticCenterPositions() {
    //
  }

  createGalacticArmPositions() {
    //
  }

  prepareBSC5P() {
    //
  }
}