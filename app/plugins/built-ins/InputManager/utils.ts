import _ from 'lodash';
import { ControlSchema } from './interfaces/ControlSchema';
import { camelToTitleCase } from '../../../local/utils';


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

    let friendly = camelToTitleCase(action);
    friendly = friendly
      .replace('_dev', '[Dev]')
      .replace('_debug', '[Dev]')
      .replace(/Inc Dec$/, '[Analog]')
      .replace(/Up Down$/, '[Analog]')
      .replace(/Left Right$/, '[Analog]')
      .replace(/Forward Backward$/, '[Analog]')
      .replace(/Held$/, ' [Held]')
      .replace(/Inc$/, 'Increase')
      .replace(/Dec$/, 'Decrease');

    entry.friendly = friendly;
  });
}

export {
  genAutoFriendlyNames,
}
