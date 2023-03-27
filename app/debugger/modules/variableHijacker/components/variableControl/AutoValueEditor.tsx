import React from 'react';
import TypeImageIcon from '../TypeImageIcon';
import { gizmoMap } from './gizmoMap';
import ThemedSegment from '../ThemedSegment';
import ObjectScanner from '../ObjectScanner';
import { concatVarPath } from '../../../../debuggerUtils';
import GimbalEditor from './GimbalEditor';

const COLLAPSED_STYLE: any = {
  fontFamily: 'inherit',
  display: 'inline',
  cursor: 'inherit',
  padding: 8,
  margin: -8,
};

const GimbalIcon = (props) => {
  return (
    <TypeImageIcon
      name='sphere'
      style={{ float: 'right', padding: 8, margin: -8  }}
      onClick={props.onClick}
    />
  );
};

interface Props {
  type: string,
  typeInfo: any,
  treeObject: any,
  invalidateObjectTree?: Function,
  name: string,
  parent: object,
  fullPath?: string,
}

export default class AutoValueEditor extends React.Component<Props>{
  state = {
    // If true, variable is expanded into an editor view.
    inspecting: false,
    // If true, a special editor for 3D and 4D objects are shown.
    gimbalEditActive: false,
    // If true, the variable icon has just been clicked and started animating.
    ghostIcon: false,
  };

  constructor(props) {
    super(props);
  }

  toggleInspection = (event: any = null,  onDone = () => {}) => {
    event?.stopPropagation();
    if (typeof this.props.invalidateObjectTree === 'function') {
      this.props.invalidateObjectTree(() => {
        this.setState({
          ghostIcon: false,
          inspecting: !this.state.inspecting,
        }, onDone);
      });
    }
    else {
      this.setState({
        ghostIcon: false,
        inspecting: !this.state.inspecting,
      }, onDone);
    }
  };

  repopulate(event = null) {
    this.toggleInspection(event, () => {
      this.toggleInspection()
    });
  }

  onIconClick = (event) => {
    event.stopPropagation();
    const path = concatVarPath(this.props.fullPath, this.props.treeObject.key);
    if (path) {
      console.log(path);
    }
    else {
      console.log('[AutoValueEditor: icon click] Full path not available.');
    }

    // Make the icon fly down.
    if (!this.state.ghostIcon) {
      this.setState({ ghostIcon: true });
    }
    else {
      this.setState({ ghostIcon: false }, () => {
        // @ts-ignore
        requestPostAnimationFrame(() => {
          this.setState({ ghostIcon: true });
        });
      });
    }
  };

  toggleGimbalEdit = (event) => {
    event.stopPropagation();
    this.setState({
      inspecting: false,
      gimbalEditActive: !this.state.gimbalEditActive,
    });
  };

  render() {
    const {
      type, treeObject: { key, value, isPrivate, isAccessor }, typeInfo
    } = this.props;

    const style: any = { ...COLLAPSED_STYLE };
    isPrivate && (style.fontStyle = 'italic');

    let text;
    if (isAccessor) {
      text = `⇄ ${key} [accessor]`;
      style.opacity = 0.5;
    }
    else if (typeInfo?.stringCompatible && typeInfo?.friendlyName !== 'bigint') {
      text = `${key}: ${value}`;
    }
    else if (typeInfo?.friendlyName === 'bigint') {
      text = `${key}: ${value}n`;
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

    const divClass = this.state.ghostIcon ? 'ghost-down' : undefined;

    if (this.state.gimbalEditActive) {
      // The gimbal editor is a multi-dimensional-variable editor.
      return (
        <ThemedSegment friendlyType={iconName} onClick={e => e.stopPropagation()}>
          <GimbalIcon onClick={this.toggleGimbalEdit}/>
          <div style={style} onClick={this.toggleGimbalEdit}>
            <TypeImageIcon name={iconName} onClick={this.onIconClick}/>
            {text}
          </div>
          <GimbalEditor/>
        </ThemedSegment>
      )
    }
    else if (this.state.inspecting) {
      // Standard variableControl components (mostly for primitives).
      let Component = gizmoMap[typeInfo?.friendlyName];
      if (Component)  {
        const parent = this.props.parent;
        return (
          <ThemedSegment friendlyType={iconName} onClick={e => e.stopPropagation()}>
            <div className={divClass} style={style} onClick={this.toggleInspection}>
              <TypeImageIcon name={iconName} onClick={this.onIconClick}/>
              {key}
            </div>
            <Component targetName={key} parent={parent} repopulate={() => this.repopulate()}/>
          </ThemedSegment>
        );
      }
      else if (!typeInfo.stringCompatible) {
        // Recursion - used to nest deeper into objects.
        return (
          <ThemedSegment friendlyType={iconName}>
            <TypeImageIcon name={iconName} onClick={this.onIconClick}/>
            <div className={divClass} style={style} onClick={this.toggleInspection}>
              {text}
            </div>
            <br/>
            <br/>
            {/* @ts-ignore */}
              <ObjectScanner
                parent={this.props.parent[key]}
                name={key}
                fullPath={concatVarPath(this.props.fullPath, key)}
              />
          </ThemedSegment>
        );
      }
    }

    // Display the variable name, allow clicking to inspect.
    const gimbalSupport = GimbalEditor.isTypeSupported(typeInfo?.friendlyName);
    return (
      <ThemedSegment friendlyType={iconName} onClick={this.toggleInspection}>
        <TypeImageIcon name={iconName} onClick={this.onIconClick}/>
        <div className={divClass} style={style}>
          {text}
        </div>
        {
          gimbalSupport
            ? <GimbalIcon onClick={this.toggleGimbalEdit}/>
            : null
        }
      </ThemedSegment>
    );
  }
}
