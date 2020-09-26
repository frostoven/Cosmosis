import React, { useRef } from 'react';
import { useLoader } from 'react-three-fiber';

import Ship from './Ship';

export default class PlayerShip extends React.Component {
  render() {
    return (
      <Ship {...this.props} model="DS69F" />
    )
  }
}
