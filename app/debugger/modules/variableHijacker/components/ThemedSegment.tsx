import React from 'react';
import { defaultColor, icon } from './configs/theme';

const SEGMENT_STYLE: { [key: string]: any } = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  fontWeight: 'normal',
  display: 'block',
  textAlign: 'left',
  marginBottom: -1,
};

interface Props {
  friendlyType: string,
  onClick?: (event) => any,
  children: any,
}

export default class ThemedSegment extends React.Component<Props>{
  state = { inspecting: false };

  onClick = (event) => {
    if (this.props.onClick) {
      this.props.onClick(event);
    }
  };

  render() {
    const friendlyType = this.props.friendlyType;

    const segmentStyle = { ...SEGMENT_STYLE };
    segmentStyle.backgroundColor = icon[friendlyType]?.backgroundColor;
    if (!segmentStyle.backgroundColor) {
      console.warn(`[LiveTracker] No theme entry for icon['${friendlyType}']`);
      segmentStyle.backgroundColor = defaultColor;
    }

    return (
      <div className='ui fluid button' style={segmentStyle} onClick={this.onClick}>
        {this.props.children}
      </div>
    );
  }
}
