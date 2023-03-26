import React from 'react';
import TypeImageIcon from '../TypeImageIcon';
import { gizmoMap } from './gizmoMap';
import ThemedSegment from '../ThemedSegment';
import ObjectScanner from '../ObjectScanner';

const COLLAPSED_STYLE: any = {
  fontFamily: 'inherit',
  display: 'inline',
  cursor: 'inherit',
};

interface Props {
  type: string,
  typeInfo: any,
  treeObject: any,
  invalidateObjectTree?: Function,
  name: string,
  parent: object,
}

export default class AutoValueEditor extends React.Component<Props>{
  state = { inspecting: false };

  constructor(props) {
    super(props);
  }

  toggleInspection = (event) => {
    event.stopPropagation();
    if (typeof this.props.invalidateObjectTree === 'function') {
      this.props.invalidateObjectTree(() => {
        this.setState({ inspecting: !this.state.inspecting });
      });
    }
    else {
      this.setState({ inspecting: !this.state.inspecting });
    }
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
          <ThemedSegment friendlyType={iconName} onClick={e => e.stopPropagation()}>
            <div style={style} onClick={this.toggleInspection}>
              <TypeImageIcon name={iconName}/>
              {key}
            </div>
            <Component targetName={key} parent={parent}/>
          </ThemedSegment>
        );
      }
      else if (!typeInfo.stringCompatible) {
        return (
          <ThemedSegment friendlyType={iconName} onClick={this.toggleInspection}>
            <TypeImageIcon name={iconName}/>
            <div style={style}>
              {text}
            </div>
            <br/>
            <br/>
            {/* @ts-ignore */}
              <ObjectScanner
                parent={this.props.parent[this.props.treeObject.key]}
                name={this.props.treeObject.key}
              />
          </ThemedSegment>
        );
      }
    }

    return (
      <ThemedSegment friendlyType={iconName} onClick={this.toggleInspection}>
        <TypeImageIcon name={iconName}/>
        <div style={style}>
          {text}
        </div>
      </ThemedSegment>
    );
  }
}
