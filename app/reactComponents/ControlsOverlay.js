import React from 'react';
import {controls, keymapFriendlyName} from '../local/controls';

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

export default class ControlsOverlay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    // return null;
    return (
      <div className='quick-controls-overlay'>
        - {getKeyBindings({ targetMode: 'allModes', targetAction: 'showKeyBindings', useFriendly: true})}: show all controls.<br/>{/* F1 */}
        - {getKeyBindings({ targetMode: 'allModes', targetAction: 'toggleMousePointer', useFriendly: true})}: show / hide mouse pointer.<br/>{/* F1 */}
        - {getKeyBindings({ targetMode: 'helmControl', targetAction: 'engageHyperdrive', useFriendly: true})}: engage hyperdrive.`<br/>{/* J */}
        - {getKeyBindings({ targetMode: 'helmControl', targetAction: 'toggleMouseSteering', useFriendly: true})}: lock mouse steering.`<br/>{/* Middle click or Num5 */}
        - WASD / mouse: move ship.`<br/> {/* We'll leave this one hardcoded for brevity. */}
        - Right click in-ship menu for quick assign.`
      </div>
    );
  }
}
