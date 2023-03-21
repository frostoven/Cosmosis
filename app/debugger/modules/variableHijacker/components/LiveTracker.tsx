import React from 'react';
import TypeImageIcon from './TypeImageIcon';
import { defaultColor, icon } from './configs/theme';
import { gizmoMap } from './variableControl/gizmoMap';
import ThemedSegment from './ThemedSegment';

const BUTTON_STYLE: { [key: string]: any } = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  fontWeight: 'normal',
  display: 'block',
  textAlign: 'left',
  marginBottom: -1,
};

interface Props {
  type: string,
  typeInfo: any,
  treeObject: any,
}

export default class LiveTracker extends React.Component<Props>{
  state = { inspecting: false };

  constructor(props) {
    super(props);
  }

  onClick = () => {
    this.setState({ inspecting: !this.state.inspecting });
  };

  render() {
    const { type, treeObject: { key, value }, typeInfo } = this.props;
    let text;
    if (typeInfo?.stringCompatible) {
      text = `${key}: ${value}`;
    }
    else {
      text = `${key}: ${typeInfo?.friendlyName || 'Object'}`;
    }

    let iconName = typeInfo?.friendlyName;
    if (iconName === 'boolean') {
      if (value === true) {
        iconName = 'booleanOn';
      }
      else {
        iconName = 'booleanOff';
      }
    }

    if (this.state.inspecting) {
      let Component = gizmoMap[typeInfo?.friendlyName];
      if (!Component) {
        return (
          <ThemedSegment friendlyType={iconName}>
            <TypeImageIcon name={iconName}/>
            {text}
          </ThemedSegment>
        )
      }
      else {
        return (
          <ThemedSegment friendlyType={iconName}>
            <TypeImageIcon name={iconName}/>
            {key}
            <Component/>
          </ThemedSegment>
        )
      }
    }
    else {
      return (
        <ThemedSegment friendlyType={iconName} onClick={this.onClick}>
          <TypeImageIcon name={iconName}/>
          {text}
        </ThemedSegment>
      );
    }
  }
}
