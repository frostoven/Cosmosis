import * as THREE from 'three';
import ChangeTracker from 'change-tracker/src';

function pickIconByTime() {
  const date = new Date();
  const mm = date.getMinutes();
  const hh = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) {
    return hh % 2 ? 'cocktail' : 'beer';
  }
  else if (month === 12 && day === 25) {
    return 'tree';
  }
  else if (month === 4 && day === 1) {
    return 'rocket';
  }
  else if ((hh === 4 || hh === 16) && mm === 20) {
    return 'fire';
  }
  else if (hh === 12 && mm === 0) {
    return 'thermometer full';
  }
  else if (hh === 3 && mm > 1 && mm < 15) {
    return 'bug';
  }
  else if (hh === 4) {
    return 'lightbulb';
  }
  else if (hh === 5) {
    return 'sun';
  }
  else if (hh >= 22 || hh < 6) {
    return mm === 28 ? 'moon outline' : 'moon';
  }
  else {
    return 'lab';
  }
}

// A tedious type guesser. Gives a human-readable guess on type information.
function guessTypeInfo(value): {
  // Friendly name. Note that this is *not* a type (for example, null is
  // returned as "null" instead of "Object").
  friendlyName: string,
  // Whether you can safely put this in a string without seeing
  // "[object Object]". Note that this is false for arrays.
  stringCompatible: boolean,
} {
  let friendlyName = typeof value;
  switch (value) {
    case 'bigint':
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return { friendlyName, stringCompatible: true };
  }

  if (value === null) {
    return { friendlyName: 'null', stringCompatible: true };
  }

  let result: { friendlyName: string, stringCompatible: boolean } = {
    friendlyName: '',
    stringCompatible: false,
  };

  if (Array.isArray(value)) {
    result.friendlyName = 'Array';
  }
  else if (value instanceof ChangeTracker) {
    result.friendlyName = 'ChangeTracker';
  }
  else if (value instanceof THREE.Vector3) {
    result.friendlyName = 'Vector3';
  }
  else if (value instanceof THREE.Object3D) {
    if (value instanceof THREE.Scene) {
      result.friendlyName = 'Scene';
    }
    if (value instanceof THREE.Mesh) {
      result.friendlyName = 'Mesh';
    }
    else {
      result.friendlyName = 'Object3D';
    }
  }
  else {
    result.friendlyName = 'Object';
  }

  return result;
}

export {
  pickIconByTime,
  guessTypeInfo,
}
