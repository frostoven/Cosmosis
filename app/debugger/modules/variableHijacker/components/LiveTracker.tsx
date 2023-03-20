import React from 'react';
import { Button } from 'semantic-ui-react';
import TypeImageIcon from './TypeImageIcon';
import { defaultColor, icon } from './configs/theme';
import { gizmoMap } from './gizmos/gizmoMap';

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

    const buttonStyle = { ...BUTTON_STYLE };
    buttonStyle.backgroundColor = icon[iconName]?.backgroundColor;
    if (!buttonStyle.backgroundColor) {
      console.warn(`[LiveTracker] No theme entry for icon['${iconName}']`);
      buttonStyle.backgroundColor = defaultColor;
    }

    if (this.state.inspecting) {
      let Component = gizmoMap[typeInfo?.friendlyName];
      if (!Component) {
        return (
          <Button fluid style={buttonStyle}>
            <TypeImageIcon name={iconName}/>
            {text}
          </Button>
        )
      }
      else {
        return (
          <Button fluid style={buttonStyle}>
            <TypeImageIcon name={iconName}/>
            {key}
            <Component/>
          </Button>
        )
      }
    }
    else {
      return (
        <Button fluid style={buttonStyle} onClick={this.onClick}>
          <TypeImageIcon name={iconName}/>
          {text}
        </Button>
      );
    }
  }
}
