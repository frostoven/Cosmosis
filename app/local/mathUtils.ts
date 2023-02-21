import { Euler, Quaternion, Vector3 } from 'three';

const xAxis = new Vector3(1, 0, 0);
const yAxis = new Vector3(0, 1, 0);
const zAxis = new Vector3(0, 0, 1);

const _aprEuler = new Euler(0, 0, 0, 'YXZ');
function applyPolarRotation(x, y, observerQuaternion, minPolarAngle = 0, maxPolarAngle = Math.PI) {
  const PI_2 = Math.PI / 2;

  _aprEuler.setFromQuaternion(observerQuaternion);
  _aprEuler.y = x * -0.002;
  _aprEuler.x = y * -0.002;
  _aprEuler.x = Math.max(PI_2 - maxPolarAngle, Math.min(PI_2 - minPolarAngle, _aprEuler.x));
  observerQuaternion.setFromEuler(_aprEuler);
}

function getQuatAxis(quat: Quaternion) {
  const radicand = 1 - (quat.w * quat.w);
  if (radicand < Number.EPSILON) {
    // As we approach zero, we can substitute an effective division-by-1.
    return new Vector3(quat.x, quat.y, quat.z);
  }
  const squared = Math.sqrt(radicand);
  return new Vector3(quat.x / squared, quat.y / squared, quat.z / squared);
}

function getQuatAngle(quaternion: Quaternion) {
  return Math.acos(quaternion.w) * 2;
}

// Returns a max relative to the amount's sign. Acts like Math.max if amount
// positive, or Math.min with a negative max if amount is negative.
function signRelativeMax(amount, max) {
  if (amount > max) return max;
  else if (amount < -max) return -max;
  else return amount;
}

// // Like signRelativeMax, but in the opposite direction.
// function signRelativeMin(amount, min) {
//   if (amount > 0) {
//     return Math.min(amount, min);
//   }
//   else if (amount < 0) {
//     return
//   }
// }

function lerp(min, max, percentage) {
  return min + percentage * (max - min);
}

function lerpToZero(number, stepAmount) {
  if (number < 0) {
    if (number + stepAmount > 0) {
      return 0;
    }
    return number + stepAmount;
  }
  else if (number > 0) {
    if (number - stepAmount < 0) {
      return 0;
    }
    else {
      return number - stepAmount;
    }
  }
  else {
    return 0;
  }
}

// x^2 / max
function easeIntoExp(step, max) {
  return (Math.pow(step, 2) / max) * Math.sign(step);
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

// Moves toward a target value at a set speed.
function chaseValue(stepSize, current: number, target: number) {
  if (current === target) {
    return target;
  }

  if (current < target) {
    current += stepSize;
    if (current > target) {
      return target;
    }
  }
  else {
    current -= stepSize;
    if (current < target) {
      return target;
    }
  }

  return current;
}

export {
  xAxis,
  yAxis,
  zAxis,
  applyPolarRotation,
  getQuatAxis,
  getQuatAngle,
  signRelativeMax,
  lerp,
  lerpToZero,
  easeIntoExp,
  clamp,
  chaseValue,
}
