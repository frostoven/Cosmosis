import BoolEditor from './BoolEditor';
import NumberEditor from './NumberEditor';
import StringEditor from './StringEditor';
import TypeChanger from './TypeChanger';

const gizmoMap = {
  boolean: BoolEditor,
  number: NumberEditor,
  string: StringEditor,
  null: TypeChanger,
  undefined: TypeChanger,
};

export {
  gizmoMap,
}
