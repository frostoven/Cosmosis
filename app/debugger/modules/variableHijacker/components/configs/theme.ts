import ChangeTracker from 'change-tracker/src';

const iconPath = '/css/debuggerIcons';

const defaultColor = '#565b5d';
const light = '#727777';
const dark = '#3a3f41';
const red = '#8e5b5d';
const darkOrange = '#70665c';
const blue = '#565b69';
const green = '#56695d';
// const greyGreen = '#606963';
const pink = '#695665';
const darkAqua = '#4e646b';

const icon = {
  Array: { img: `${iconPath}/Array.png`, backgroundColor: defaultColor },
  bigint: { img: `${iconPath}/bigInt.png`, backgroundColor: blue },
  boolean: { img: `${iconPath}/boolean.png`, backgroundColor: darkOrange },
  booleanOn: { img: `${iconPath}/booleanOn.png`, backgroundColor: darkOrange },
  booleanOff: { img: `${iconPath}/booleanOff.png`, backgroundColor: darkOrange },
  null: { img: `${iconPath}/null.png`, backgroundColor: dark },
  Mesh: { img: `${iconPath}/Mesh.png`, backgroundColor: pink },
  number: { img: `${iconPath}/number.png`, backgroundColor: green },
  Object: { img: `${iconPath}/Object.png`, backgroundColor: light },
  Object3D: { img: `${iconPath}/Object3D.png`, backgroundColor: pink },
  OrthographicCamera: { img: `${iconPath}/aperture.png`, backgroundColor: pink },
  PerspectiveCamera: { img: `${iconPath}/aperture.png`, backgroundColor: pink },
  Scene: { img: `${iconPath}/Scene.png`, backgroundColor: pink },
  string: { img: `${iconPath}/string.png`, backgroundColor: blue },
  undefined: { img: `${iconPath}/undefined.png`, backgroundColor: red },
  Vector2: { img: `${iconPath}/Vector2.png`, backgroundColor: pink },
  Vector3: { img: `${iconPath}/Vector3.png`, backgroundColor: pink },
  // No icons yet, but still recognized as special types.
  Quaternion: { img: `${iconPath}/class.png`, backgroundColor: pink },
  Euler: { img: `${iconPath}/class.png`, backgroundColor: pink },
  Matrix3: { img: `${iconPath}/class.png`, backgroundColor: pink },
  Matrix4: { img: `${iconPath}/class.png`, backgroundColor: pink },
  Layers: { img: `${iconPath}/class.png`, backgroundColor: pink },
  Clock: { img: `${iconPath}/class.png`, backgroundColor: pink },
  WebGLRenderer: { img: `${iconPath}/class.png`, backgroundColor: pink },
  // General internal classes
  ChangeTracker: { img: `${iconPath}/ChangeTracker.png`, backgroundColor: darkAqua },
  '[Internal]SpacetimeControl': { img: `${iconPath}/class.png`, backgroundColor: darkAqua },
  // Icons not directly related to classes
  sphere: { img: `${iconPath}/sphere.png`, backgroundColor: defaultColor },
};

export {
  defaultColor,
  icon,
}
