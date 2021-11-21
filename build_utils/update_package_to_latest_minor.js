#!/usr/bin/env node

// Attempts to update all package.json packages to the lastest minor version
// using naive methods. Expect this to break in future.
//
// Excludes three.js and nw from automatic updates as these need to be done on
// an ad-hoc basis.
//
// This initially started as a shell script doing this:
// cat package.json | grep -A99 devDependencies | tail -n +2 | head -n -2
// Keeping it here for reference purposes.

const child_process = require('child_process');
const packageJson = require('../package.json');
const { devDependencies } = packageJson;

function pressEnterToContinue() {
  if (process.platform === 'win32') {
    require('child_process').spawnSync('pause >nul', {
      shell: true,
      stdio: [ 0, 1, 2 ]
    });
  }
  else {
    require('child_process').spawnSync('read _', {
      shell: true,
      stdio: [ 0, 1, 2 ]
    });
  }
}

const skipPkg = {
  three: true, // This is now in dependencies (not devDependencies) so is skipped anyway.
  nw: true,
  'extract-text-webpack-plugin': true,
};

let fixedVersionItems = [];
let commands = [];
let entries = Object.entries(devDependencies);
for (let i = 0, len = entries.length; i < len; i++) {
  const [ pkg, version ] = entries[i];

  if (skipPkg[pkg]) {
    // Skip all manually tracked packages.
    console.log('-- Skipping', pkg);
    continue;
  }

  if (version.includes('^')) {
    // Skip all packages that used latest version.
    continue;
  }
  fixedVersionItems.push(pkg);

  const major = `${version}`.replace(/\..*/g, '');
  const nextMajor = `${Number(major) + 1}.0.0`;
  console.log(`-> Package "${pkg}" has version "${version}", will be upgraded to "@<${nextMajor}".`);
  commands.push(`npm install --ignore-scripts --save-dev ${pkg}@"<${nextMajor}"`);
}

console.log('');
console.log('The following commands will be run:');
console.log(commands);
console.log('');
console.log('Press any key to continue, or Ctrl+C to exit.');
pressEnterToContinue();

console.log('');
console.log('Will now attempt to update packages.');
console.log('');
for (let i = 0, len = commands.length; i < len; i++) {
  const command = commands[i];
  console.log('Running:', command);
  child_process.execSync(command, { stdio: [ 0, 1, 2 ] });
  console.log('');
}

console.log('');
console.log('All done. Please check above output for errors.');
console.log('');
console.log('Next steps:');
console.log('* Test that code building and hot reloading works.');
console.log('* Test menus.');
console.log('* Test scene switching.');
console.log('* Test all cam modes.');
console.log('');
console.log('Please remove the "^" from the following package.json entries:');
console.log(fixedVersionItems);
console.log('');
