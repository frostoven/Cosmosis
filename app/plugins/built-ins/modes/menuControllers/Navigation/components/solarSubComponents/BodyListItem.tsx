import React from 'react';
import {
  LargeGravitationalSource,
} from '../../../../../../../celestialBodies/LargeGravitationalSource';

const subItemStyle: React.CSSProperties = {
  display: 'inline-block',
};

const distanceStyle: React.CSSProperties = {
  ...subItemStyle,
  float: 'right',
};

interface Props {
  body: LargeGravitationalSource,
  style: React.CSSProperties,
}

class BodyListItem extends React.Component<Props> {
  render() {
    let { body, style } = this.props;

    if (body.type === 'Moon') {
      style = { ...style, paddingLeft: 32 };
    }
    else if (body.type !== 'Star') {
      style = { ...style, paddingLeft: 16 };
    }

    return (
      <div style={style}>
        <div style={subItemStyle}>{/* Icon here */}</div>
        <div style={subItemStyle}>{body.name}</div>
        <div style={distanceStyle}>[Distance here]</div>
      </div>
    );
  }
}

export {
  BodyListItem,
};
