/* Loads special HTML elements
 * ---------------------------------
 * Most (if not all) of these may need to be replaced with better solutions in
 * future.
 */

const fs = require('fs');
const _ = require('lodash');

import build from '../../build.json';
import { loadAllCrosshairImages } from './crosshairs';
import { controls, keySchema, keymapFriendlyName } from './controls';

import { addSpacesBetweenWords, toTitleCase } from './utils';

function spacedTitled(string) {
  return addSpacesBetweenWords(toTitleCase(string));
}

function getKeyBindings({ targetMode, targetAction, useFriendly }) {
  let resultFound = [];

  const mode = controls[targetMode];
  _.each(mode, (action, key) => {
    if (action === targetAction) {
      // We can have multiple keys per action, which is why we use an array.
      if (useFriendly) {
        resultFound.push(keymapFriendlyName(key));
      }
      else {
        resultFound.push(key);
      }
    }
  });

  if (useFriendly) {
    if (resultFound.length === 0) {
      resultFound = '???';
    }
    else {
      // Looks like: 'Middle click or Num5: to lock mouse'.
      return resultFound.join(' or ');
    }
  }
  return resultFound;
}

export default function windowLoadListener() {
  // Loading text
  const loadingTextDiv = document.getElementById('loading-text');
  if (loadingTextDiv) {
    loadingTextDiv.innerHTML = `Cosmosis build ${build.buildNumber}<br>Loading...<br>`;
    fs.access('prodHqAssets', (error) => {
      if (error) {
        loadingTextDiv.innerHTML =
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

  // Quick controls list
  const controlsDiv = document.getElementById('quick-controls');
  if (controlsDiv) {
    controlsDiv.innerText =
      `- ${getKeyBindings({ targetMode: 'allModes', targetAction: 'showKeyBindings', useFriendly: true})}: show all controls.\n` + // F1
      `- ${getKeyBindings({ targetMode: 'allModes', targetAction: 'toggleMousePointer', useFriendly: true})}: show / hide mouse pointer.\n` + // F1
      `- ${getKeyBindings({ targetMode: 'shipPilot', targetAction: 'engageHyperdrive', useFriendly: true})}: engage hyperdrive.\n` + // J
      `- ${getKeyBindings({ targetMode: 'shipPilot', targetAction: 'toggleMouseSteering', useFriendly: true})}: lock mouse steering.\n` + // Middle click or Num5
      `- WASD / mouse: move ship.\n` + // We'll leave this one hardcoded for brevity.
      `- Right click in-ship menu for quick assign.`
  }
  else {
    console.warning('Could not find #quick-controls div.');
  }

  // All controls page
  let controlsHtml = '';
  let allControlsDiv = document.getElementById('all-controls-page');
  if (allControlsDiv) {
    _.each(controls, (modeKeys, modeName) => {
      controlsHtml += `<h3>${spacedTitled(modeName)}</h3>`;
      controlsHtml += `<table>`;
      _.each(modeKeys, (key, action) => {
        controlsHtml += `<tr>`;
        if (action === '_description') {
          controlsHtml += `<td><b>Description</b></td><td><b>${key}</b></td>`;
        }
        else {
          controlsHtml += `<td>${keymapFriendlyName(action)}</td><td>${spacedTitled(key)}</td>`;
        }
        controlsHtml += `</tr>`;
      });
      controlsHtml += `</table>`;
    });
  }
  allControlsDiv.innerHTML = controlsHtml;
}

window.onload = windowLoadListener;
