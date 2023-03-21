import React from 'react';
import TypeImageIcon from '../TypeImageIcon';
import { gizmoMap } from './gizmoMap';
import ThemedSegment from '../ThemedSegment';

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
  parent: object,
}

export default class AutoValueEditor extends React.Component<Props>{
  state = { inspecting: false };

  constructor(props) {
    super(props);
  }

  onInspect = () => {
    this.setState({ inspecting: true });
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
      if (Component)  {
        const parent = this.props.parent;
        return (
          <ThemedSegment friendlyType={iconName}>
            <TypeImageIcon name={iconName}/>
            {key}
            <Component target={key} parent={parent}/>
          </ThemedSegment>
        )
      }
    }

    return (
      <ThemedSegment friendlyType={iconName} onClick={this.onInspect}>
        <TypeImageIcon name={iconName}/>
        {text}
      </ThemedSegment>
    );
  }
}
