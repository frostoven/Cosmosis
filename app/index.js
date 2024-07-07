import './polyfills';
import './earlyProfileLoad';
import './modal';
import './local/PerfTest';
import './debugger';
import v8 from 'v8';

import { loadPlugins } from './plugins';
// import powerOnSelfTest from './test';
import packageJson from '../package.json';
import {
  onReadyToBoot,
  logBootInfo,
} from './local/windowLoadListener';

// Game modules.
// import './local/toast';
import * as THREE from 'three';

// Debug reference to three.
window.debug.THREE = THREE;

// Integration tests. Note that these will no longer run by itself. The user
// manually runs these by opening the dev console and entering
// 'powerOnSelfTest()'.
// window.powerOnSelfTest = powerOnSelfTest;

/* Main
/* --------------------------------- */

// Generated using https://fsymbols.com/signs/square/
console.log(
  '\n' +
  ' █████╗  █████╗  ██████╗███╗   ███╗ █████╗  ██████╗██╗ ██████╗\n' +
  '██╔══██╗██╔══██╗██╔════╝████╗░████║██╔══██╗██╔════╝██║██╔════╝\n' +
  '██║░░╚═╝██║░░██║╚█████╗░██╔████╔██║██║░░██║╚█████╗░██║╚█████╗ \n' +
  '██║░░██╗██║░░██║░╚═══██╗██║╚██╔╝██║██║░░██║░╚═══██╗██║░╚═══██╗\n' +
  '╚█████╔╝╚█████╔╝██████╔╝██║░╚═╝░██║╚█████╔╝██████╔╝██║██████╔╝\n' +
  ' ╚════╝  ╚════╝ ╚═════╝ ╚═╝     ╚═╝ ╚════╝ ╚═════╝ ╚═╝╚═════╝ ' +
  '\n\n',
);

console.log(`%c► Build ${packageJson.version}`, 'font-weight: bold;');
logBootInfo(`System boot v${packageJson.version}`); // ▓
const heapSize = (
  (v8.getHeapStatistics().heap_size_limit / (1024 * 1024 * 1024)).toFixed(2)
);
console.log(`▪ Max heap size: ${heapSize}GB`);

function closeLoadingScreen() {
  const loaders = document.getElementsByClassName('loading-indicator');
  if (loaders) {
    for (let i = 0, len = loaders.length; i < len; i++) {
      loaders[i].classList.add('splash-fade-out');
    }
  }
}

onReadyToBoot(() => {
  logBootInfo('Init hardware sweep');
  loadPlugins(() => {
    closeLoadingScreen();
  });
});
