import React from 'react';

import RotatingBox from './components/RotatingBox';

export default function BoxScene() {
  return [
    <ambientLight key="ambientLight" />,
    // <pointLight key="pointLight" position={[10, 10, 10]} />,
    <RotatingBox key="RotatingBox1" position={[-2.2, 0, 0]} />,
    <RotatingBox key="RotatingBox2" position={[2.2, 0, 0]} />,
  ]
}
