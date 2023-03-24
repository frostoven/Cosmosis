const performanceNow = performance.now.bind(performance);
let measureStatic = 0;

export default class PerfTest {
  private _time: number;

  /**
   * Quick convenience live test. Don't use this in more than one part of the
   * application at once.
   * Example:
   * PerfTest.beginStatic(); myTest(); console.log(PerfTest.endStatic());
   */
  static beginStatic() {
    measureStatic = performanceNow();
  }

  /**
   * Quick convenience live test. Don't use this in more than one part of the
   * application at once.
   */
  static endStatic(silent = false) {
    const r =  performanceNow() - measureStatic;
    !silent && console.log(`Duration: ${r}ms.`);
    return r;
  }

  // ----------------------------------------------------------------------- //

  constructor() {
    this._time = 0;

    // Make sure the first-time use of start / stop doesn't somehow slow down
    // the application.
    for (let i = 0; i < 10; i++) {
      this.start();
      this.stop(true);
    }
    this._time = 0;
  }

  start() {
    this._time = performanceNow();
  }

  stop(silent = false) {
    const r = performanceNow() - this._time;
    !silent && console.log(`Duration: ${r}ms.`);
    return r;
  }
}

// Make sure the first-time use of being / end doesn't somehow slow down the
// application. Don't worry, this takes only 0.1ms to execute, meaning it
// doesn't noticeably slow down application boot.
for (let i = 0; i < 10; i++) {
  PerfTest.beginStatic();
  PerfTest.endStatic(true);
}
measureStatic = 0;

// Debugging:
// @ts-ignore
window.$PerfTest = PerfTest;
