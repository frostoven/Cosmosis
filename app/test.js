import { tests as controls } from './local/controls';

/**
 * Runs all integration tests.
 */
export default function powerOnSelfTest() {
  const allTargets = [
    // Please place all test imports here. Please give each test a name to
    // help make the output readable.
    { name: 'app/local/controls.js', tests: controls },
  ];

  console.log('--- ✄ integration tests start --------------------');

  let testCount = 0;
  let testsPassed = 0
  let testsFailed = 0

  const start = Date.now();
  for (const target of allTargets) {
    console.group('Running tests for', target.name);
    for (const [name, test] of Object.entries(target.tests)) {
      console.group(`Running test ${name}()`);
      testCount++;
      try {
        if (test() === false) {
          testsFailed++;
        }
        else {
          testsPassed++;
        }
      }
      catch (error) {
        testsFailed++;
        console.error(`Test "${name}" crashed before completion:`, error);
      }
      console.groupEnd();
    }
    console.groupEnd();
  }
  const end = Date.now();

  console.log('--- ✄ stats --------------------------------------');
  console.log(`Tests completed after ${end-start}ms.`);
  console.log(`${testsPassed} passed, ${testsFailed} failed, ${testCount} total.`);
  console.log('--- ✄ thank you for your contributions! ----------');
}
