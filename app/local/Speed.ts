const SPEED_UNIT = 14.388;

export default class Speed {
  public currentSpeed: number;
  constructor(initialSpeed = 0) {
    this.currentSpeed = initialSpeed;
  }

  setSpeedKmh(speedKmh) {
    this.currentSpeed = speedKmh / SPEED_UNIT;
  };

  // TODO: post-refactor to plugin structure, this value no longer seems to be
  //  correct. Investigate before using in real code.
  getSpeedKmh() {
    console.warn(
      'This function currently returns wrong values. Don\'t use just yet.'
    );
    return this.currentSpeed * SPEED_UNIT;
  }

  // Ramps up slowly. Ramp amount increases with speed.
  rampUpSmall(amount) {
    this.currentSpeed += amount + (this.currentSpeed * 0.01);
  }

  // Ramps down slowly. Ramp amount decreases with speed.
  rampDownSmall(amount) {
    this.currentSpeed = Math.max(
      0, this.currentSpeed - (amount + (this.currentSpeed * 0.01)),
    );
  }

  // Ramps up rapidly. Ramp amount increases with speed. If the amount is 2,
  // then the pattern roughly matches an upward opening parabola.
  rampUpBig(amount) {
    this.currentSpeed += amount + this.currentSpeed;
  }

  // Ramps up rapidly. Ramp amount decreases with speed. If the amount is 2,
  // then the pattern roughly matches an upward opening parabola.
  rampDownBig(amount) {
    this.currentSpeed -= amount + this.currentSpeed;
  }
}
