import { Euler, Quaternion } from 'three';

const _aprEuler = new Euler(0, 0, 0, 'YXZ');
function applyPolarRotation(x, y, observerQuaternion, minPolarAngle = 0, maxPolarAngle = Math.PI) {
  const PI_2 = Math.PI / 2;

  _aprEuler.setFromQuaternion(observerQuaternion);
  _aprEuler.y = x * -0.002;
  _aprEuler.x = y * -0.002;
  _aprEuler.x = Math.max(PI_2 - maxPolarAngle, Math.min(PI_2 - minPolarAngle, _aprEuler.x));
  observerQuaternion.setFromEuler(_aprEuler);
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

export {
  applyPolarRotation,
  signRelativeMax,
  lerpToZero,
}
