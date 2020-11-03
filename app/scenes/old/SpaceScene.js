import React from 'react';

import RotatingBox from './components/RotatingBox';

export default function SpaceScene() {

  return [
    <ambientLight key="ambientLight" />,
    <pointLight key="pointLight" position={[19, 10, 10]} />,
    <RotatingBox key="RotatingBox1" position={[-3, 2, 0]} />,
    <RotatingBox key="RotatingBox2" position={[1.2, 0, 2]} />,
  ]
}
