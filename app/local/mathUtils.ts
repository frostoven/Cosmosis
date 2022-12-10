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

export {
  applyPolarRotation,
}
