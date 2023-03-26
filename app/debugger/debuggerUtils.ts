import * as THREE from 'three';
import ChangeTracker from 'change-tracker/src';
import { Location } from '../plugins/built-ins/Location';
import ShipModule from '../plugins/built-ins/shipModules/types/ShipModule';
import Generator from '../plugins/built-ins/shipModules/Generator/types/Generator';
import VisorHud from '../plugins/built-ins/shipModules/VisorHud/types/VisorHud';
import CockpitLights from '../plugins/built-ins/shipModules/CockpitLights/types/CockpitLights';
import ExternalLights from '../plugins/built-ins/shipModules/ExternalLights/types/ExternalLights';
import Multimeter from '../plugins/built-ins/shipModules/Multimeter/types/Multimeter';
import ElectricalHousing from '../plugins/built-ins/shipModules/ElectricalHousing/types/ElectricalHousing';
import PropulsionManager from '../plugins/built-ins/shipModules/PropulsionManager/types/PropulsionManager';
import WarpDrive from '../plugins/built-ins/shipModules/WarpDrive/types/WarpDrive';

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
  switch (friendlyName) {
    case 'bigint':
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return { friendlyName, stringCompatible: true };
  }

  if (friendlyName === 'function') {
    return { friendlyName, stringCompatible: false };
  }

  // -- General types ------------------------------------------- //

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

  // -- Three.js ------------------------------------------------ //

  else if (value instanceof THREE.Vector2) {
    result.friendlyName = 'Vector2';
  }
  else if (value instanceof THREE.Vector3) {
    result.friendlyName = 'Vector3';
  }
  else if (value instanceof THREE.Object3D) {
    if (value instanceof THREE.Scene) {
      result.friendlyName = 'Scene';
    }
    else if (value instanceof THREE.Mesh) {
      result.friendlyName = 'Mesh';
    }
    else if (value instanceof THREE.PerspectiveCamera) {
      result.friendlyName = 'PerspectiveCamera';
    }
    else if (value instanceof THREE.OrthographicCamera) {
      result.friendlyName = 'OrthographicCamera';
    }
    else {
      result.friendlyName = 'Object3D';
    }
  }
  else if (value instanceof THREE.Quaternion) {
    result.friendlyName = 'Quaternion';
  }
  else if (value instanceof THREE.Euler) {
    result.friendlyName = 'Euler';
  }
  else if (value instanceof THREE.Matrix3) {
    result.friendlyName = 'Matrix3';
  }
  else if (value instanceof THREE.Matrix4) {
    result.friendlyName = 'Matrix4';
  }
  else if (value instanceof THREE.Layers) {
    result.friendlyName = 'Layers';
  }
  else if (value instanceof THREE.Clock) {
    result.friendlyName = 'Clock';
  }
  else if (value instanceof THREE.WebGLRenderer) {
    result.friendlyName = 'WebGLRenderer';
  }

  // -- Internals and ship modules------------------------------- //

  else if (value instanceof Location) {
    result.friendlyName = '[Internal]Location';
  }
  else if (value instanceof ShipModule) {
    if (value instanceof VisorHud) {
      result.friendlyName = '[Module] VisorHud';
    }
    else if (value instanceof CockpitLights) {
      result.friendlyName = '[Module] CockpitLights';
    }
    else if (value instanceof ExternalLights) {
      result.friendlyName = '[Module] ExternalLights';
    }
    else if (value instanceof Multimeter) {
      result.friendlyName = '[Module] Multimeter';
    }
    else if (value instanceof PropulsionManager) {
      result.friendlyName = '[Module] PropulsionManager';
    }
    else if (value instanceof WarpDrive) {
      result.friendlyName = '[Module] WarpDrive';
    }
  }
  else if (value instanceof ElectricalHousing) {
    result.friendlyName = '[Module] ElectricalHousing';
  }
  else if (value instanceof Generator) {
    result.friendlyName = '[Module] Generator';
  }

  // -- Fallthroughs -------------------------------------------- //

  else {
    result.friendlyName = 'Object';
  }

  return result;
}

export {
  pickIconByTime,
  guessTypeInfo,
}
