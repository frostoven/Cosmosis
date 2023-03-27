// maybe:
//   4 num input, pass a 'disableSlider' prop.
//   static method: isTypeSupported(Vector3) - generate icon if true

import React from 'react';

interface Props {
  //
}

export default class GimbalEditor extends React.Component<Props>{
  static isTypeSupported(typeName) {
    return [ 'Quaternion', 'Vector3', 'Euler' ].includes(typeName);
  }

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        //
      </div>
    );
  }
}
