import {
  BufferAttribute,
  BufferGeometry,
  Euler,
  Quaternion,
  Vector3,
} from 'three';
import * as THREE from 'three';

const acos = Math.acos;
const floor = Math.floor;
const max = Math.max;
const min = Math.min;
const pi = Math.PI;
const pow = Math.pow;
const sign = Math.sign;
const sqrt = Math.sqrt;

const xAxis = new Vector3(1, 0, 0);
const yAxis = new Vector3(0, 1, 0);
const zAxis = new Vector3(0, 0, 1);

const _aprEuler = new Euler(0, 0, 0, 'YXZ');
function applyPolarRotation(x, y, observerQuaternion, minPolarAngle = 0, maxPolarAngle = pi) {
  const halfPi = pi / 2;

  _aprEuler.setFromQuaternion(observerQuaternion);
  _aprEuler.y = x * -0.002;
  _aprEuler.x = y * -0.002;
  _aprEuler.x = max(halfPi - maxPolarAngle, min(halfPi - minPolarAngle, _aprEuler.x));
  observerQuaternion.setFromEuler(_aprEuler);
}

function getQuatAxis(quat: Quaternion) {
  const radicand = 1 - (quat.w * quat.w);
  if (radicand < Number.EPSILON) {
    // As we approach zero, we can substitute an effective division-by-1.
    return new Vector3(quat.x, quat.y, quat.z);
  }
  const squared = sqrt(radicand);
  return new Vector3(quat.x / squared, quat.y / squared, quat.z / squared);
}

function getQuatAngle(quaternion: Quaternion) {
  return acos(quaternion.w) * 2;
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
function easeIntoExp(step, maxValue) {
  return (pow(step, 2) / maxValue) * sign(step);
}

function clamp(n, low, high) {
  return min(max(n, low), high);
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

// Extract vertices and return them as a Vector3 array.
// The purpose of this function is simply to convert geometry to points in CPU.
function extractVertsFromGeo(geo: BufferGeometry): Vector3[] {
  // @ts-ignore
  const vertices: BufferAttribute = geo.attributes.position;
  // console.log('--> Vertices:', vertices);
  const vertPositions: Vector3[] = [];
  for (let i = 0, len = vertices.count; i < len; i++) {
    let vector = new Vector3();
    vector.fromBufferAttribute(vertices, i);
    vertPositions.push(vector);
  }
  return vertPositions;
}

// The purpose of this function is to ensure that curves do not have large
// areas of no points. For example, along a galaxy arm, we don't necessarily
// want gas / dust density decreasing as the arm straightens out. Extended
// version of extractVertsFromGeo.
//
// Technical description:
// Extracts vertices and stores them as a Vector3 array. While extracting
// verts, this function also find the smallest distance between two connected
// points. After vertex extraction, it then runs along the line again,
// artificially producing verts along each path matching that smallest
// distance.
function extractAndPopulateVerts(geo: BufferGeometry, /* distReduction=0 */) {
  let smallestDistance = Infinity;
  // @ts-ignore
  const vertices: BufferAttribute = geo.attributes.position;
  const vertPositions: Vector3[] = [];
  for (let i = 0, len = vertices.count; i < len; i++) {
    const vector = new Vector3();
    vector.fromBufferAttribute(vertices, i);
    vertPositions.push(vector);
    if (i === 0) {
      continue;
    }
    let previousVector = vertPositions[i - 1];
    const distance = vector.distanceToSquared(previousVector);
    if (distance < smallestDistance) {
      smallestDistance = distance;
    }
  }

  if (vertPositions.length < 3) {
    return vertPositions;
  }

  let lastInsertedIndex: number | null = null;

  for (let i = 0, len = vertPositions.length; i < len; i++) {
    if (i === 0) {
    // if (i < 20) {
      continue;
    }
    const vertex = vertPositions[i];
    const previousVertex = vertPositions[i - 1];
    const distance = vertex.distanceToSquared(previousVertex);
    if (distance > smallestDistance) {
      // console.log(`-> ${distance} is greater than ${smallestDistance}; inserting vert.`);
    }
    else {
      continue;
    }

    const childVertex = previousVertex.clone();
    childVertex.lerp(vertex, 0.5);
    lastInsertedIndex = i;
    vertPositions.splice(i++, 0, childVertex);
  }

  // When a sequence of synthetic verts suddenly stops, it creates a jarring
  // gap. This attempts to fix that.
  if (lastInsertedIndex !== null) {
    const positionToAdjust = lastInsertedIndex + 1;
    if (positionToAdjust < vertPositions.length + 1) {
      const postSynthetic = vertPositions[positionToAdjust];
      const target = vertPositions[positionToAdjust + 1];
      postSynthetic.lerp(target, 0.25);
    }
  }

  return vertPositions;
}

// https://stackoverflow.com/questions/42812861/three-js-pivot-point/42866733#42866733
// obj - your object (THREE.Object3D or derived)
// point - the point of rotation (THREE.Vector3)
// axis - the axis of rotation (normalized THREE.Vector3)
// theta - radian value of rotation
// pointIsWorld - boolean indicating the point is in world coordinates (default = false)
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
  pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

  if(pointIsWorld){
    obj.parent.localToWorld(obj.position); // compensate for world coordinate
  }

  obj.position.sub(point); // remove the offset
  obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
  obj.position.add(point); // re-add the offset

  if(pointIsWorld){
    obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
  }

  obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

/**
 * Transforms a cube into a sphere. This is slower to initialize than
 * Three.Sphere but preferred to Three.Sphere because Three.Sphere causes UV
 * pin distortion at the poles. Note that you need a lot of geo on your cube
 * for this function to be effective. This function preserves normals.
 * @example
 * const geometry = new THREE.BoxGeometry(1, 1, 1, 64, 64, 64);
 * cubeToSphere(geometry);
 * @param geometry
 * @param radius
 */
function cubeToSphere(geometry: BufferGeometry, radius: number) {
  const positionAttribute = geometry.attributes.position;
  const vector = new THREE.Vector3();
  for (let i = 0, len = positionAttribute.count; i < len; i++) {
    // Obtain the vertex.
    vector.fromBufferAttribute(positionAttribute, i);
    vector.normalize().multiplyScalar(radius);
    positionAttribute.setXYZ(i, vector.x, vector.y, vector.z)
  }
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
  extractVertsFromGeo,
  extractAndPopulateVerts,
  rotateAboutPoint,
  cubeToSphere,
}
