/* Loads special HTML elements
 * ---------------------------------
 * Most (if not all) of these may need to be replaced with better solutions in
 * future.
 */

const fs = require('fs');

import build from '../../build.json';
import { loadAllCrosshairImages } from './crosshairs';

export default function windowLoadListener() {
  // Loading text
  const div = document.getElementById('loading-text');
  if (div) {
    div.innerHTML = `Cosmosis build ${build.buildNumber}<br>Loading...<br>`;
    fs.access('prodHqAssets', (error) => {
      if (error) {
        div.innerHTML =
          `Cosmosis build ${build.buildNumber}<br>` +
          'NOTE: high quality assets folder missing.<br>' +
          'Loading...<br>';
      }
    });
  }
  else {
    console.warn('Could not find #loading-text div.');
  }

  // Crosshairs
  const crosshairsDiv = document.getElementById('crosshairs');
  if (crosshairsDiv) {
    loadAllCrosshairImages(crosshairsDiv);
  }
  else {
    console.error('Could not find #crosshairs div.');
  }
}

window.onload = windowLoadListener;
