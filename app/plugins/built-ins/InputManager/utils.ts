import _ from 'lodash';
import { ControlSchema } from './interfaces/ControlSchema';


/**
 * Takes a group control actions and searches for entries without a defined
 * 'friendly' field. For each entry that does not have a friendly field, this
 * function will generate one and store it inside each respective action.
 * Modifies each object in-place.
 * @param {ControlSchema} controls
 */
function genAutoFriendlyNames(controls: ControlSchema) {
  _.each(controls, (entry, action) => {
    if (entry.friendly) {
      return;
    }

    let friendly = action.replace(/([A-Z]|([0-9]+))/g, ' $1');
    friendly = action[0].toUpperCase() + friendly.slice(1);
    friendly = friendly
      .replace('_dev', '[Dev]')
      .replace('_debug', '[Dev]')
      .replace(/Inc Dec$/, '[Slider]')
      .replace(/Held$/, ' [Held]')
      .replace(/Inc$/, 'Increase')
      .replace(/Dec$/, 'Decrease');

    entry.friendly = friendly;
  });
}

export {
  genAutoFriendlyNames,
}
