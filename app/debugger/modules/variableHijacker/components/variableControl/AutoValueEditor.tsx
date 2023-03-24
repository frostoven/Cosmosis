import React from 'react';
import TypeImageIcon from '../TypeImageIcon';
import { gizmoMap } from './gizmoMap';
import ThemedSegment from '../ThemedSegment';

const COLLAPSED_STYLE: any = {
  display: 'inline',
  cursor: 'inherit',
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
    const {
      type, treeObject: { key, value, isPrivate, isAccessor }, typeInfo
    } = this.props;

    const style: any = { ...COLLAPSED_STYLE };
    isPrivate && (style.fontStyle = 'italic');

    let text;
    if (isAccessor) {
      text = `⇄ ${key} [accessor]`; // or maybe ● instead
      style.opacity = 0.5;
    }
    else if (typeInfo?.stringCompatible) {
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
            <Component targetName={key} parent={parent}/>
          </ThemedSegment>
        )
      }
    }

    return (
      <ThemedSegment friendlyType={iconName} onClick={this.onInspect}>
        <TypeImageIcon name={iconName}/>
        <div style={style}>
          {text}
        </div>
      </ThemedSegment>
    );
  }
}
