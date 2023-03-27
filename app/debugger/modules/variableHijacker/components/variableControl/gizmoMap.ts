import BoolEditor from './BoolEditor';
import NumberEditor from './NumberEditor';
import StringEditor from './StringEditor';

const gizmoMap = {
  boolean: BoolEditor,
  number: NumberEditor,
  string: StringEditor,
};

export {
  gizmoMap,
}
