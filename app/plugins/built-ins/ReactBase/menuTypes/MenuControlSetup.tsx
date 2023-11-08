import _ from 'lodash';
import React from 'react';
import InputBridge from '../types/InputBridge';
import KosmButton from '../../../../reactExtra/components/KosmButton';
import { Icon } from 'semantic-ui-react';
import { InputManager } from '../../InputManager';
import {
  InputSchemeEntry,
} from '../../InputManager/interfaces/InputSchemeEntry';
import { InputType } from '../../InputManager/types/InputTypes';

const menuEntriesStyle: React.CSSProperties = {
  overflow: 'auto',
  display: 'inline-block',
  whiteSpace: 'nowrap',
  marginTop: 64,
  marginBottom: 32,
};

const spacerStyle: React.CSSProperties = {
  // float: 'left',
  paddingLeft: 16,
  display: 'inline-block',
};

const descriptionBoxStyle: React.CSSProperties = {
  // float: 'left',
  display: 'inline-block',
  backgroundColor: 'rgb(33 33 33 / 70%)',
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 10,
  paddingBottom: 10,
  border: '4px solid black',
  borderRadius: 4,
  marginTop: 62,
  marginBottom: 32,
  minWidth: 200,
};

const centerStyle: React.CSSProperties = {
  justifyContent: 'center',
  position: 'absolute',
  display: 'flex',
  width: '100%',
  height: '100%',
};

const keyTypeIcons = {
  default: 'dna',
  [InputType.keyboardButton]: 'keyboard',
  [InputType.mouseButton]: 'mouse pointer',
  [InputType.mouseAxisInfinite]: 'crosshairs',
  [InputType.mouseAxisThreshold]: 'bullseye',
  [InputType.mouseAxisGravity]: 'bullseye',
  [InputType.analogSlider]: 'fighter jet',
  [InputType.analogStickAxis]: 'fighter jet',
  [InputType.analogButton]: 'gamepad',
};

function keyCodeToJsx(keyCode: string | JSX.Element, type: InputType) {
  let icon: JSX.Element | null = <><Icon name={keyTypeIcons[type]}/>&nbsp;</>;

  switch (keyCode) {
    case 'spNorthSouth':
      keyCode = <><Icon name='arrows alternate vertical'/> MouseY</>;
      icon = null;
      break;
    case 'spEastWest':
      icon = null;
      keyCode = <><Icon name='arrows alternate horizontal'/> MouseX</>;
      break;
    case 'spNorth':
      keyCode = <><Icon name='arrows alternate vertical'/> MouseMoveUp</>;
      icon = null;
      break;
    case 'spSouth':
      keyCode = <><Icon name='arrows alternate vertical'/> MouseMoveDown</>;
      icon = null;
      break;
    case 'spEast':
      icon = null;
      keyCode = <><Icon name='arrows alternate horizontal'/> MouseMoveLeft</>;
      break;
    case 'spWest':
      icon = null;
      keyCode = <><Icon name='arrows alternate horizontal'/> MouseMoveRight</>;
      break;
    case 'spScrollUp':
      keyCode = 'MouseScrollUp';
      break;
    case 'spScrollDown':
      keyCode = 'MouseScrollDown';
      break;
    case 'spMouseMiddle':
      keyCode = 'MouseMiddleClick';
      break;
  }

  if (type === InputType.keyboardButton) {
    let key = keyCode as string;

    if (key.startsWith('Key')) {
      key = key.slice(3);
    }
    else if (key === 'Slash') {
      key = '/';
    }
    else if (key === 'Backslash') {
      key = '\\';
    }

    keyCode = (
      <div style={{
        display: 'inline-block',
        borderRadius: 4,
        border: 'thin solid grey',
        textAlign: 'center',
        minWidth: 22,
        padding: 4,
        marginTop: -6,
        marginBottom: -6,
      }}>
        {key}
      </div>
    );
  }
  else {

  }

  return (
    <div>{icon}{keyCode}</div>
  );
}

type Entry = {
  name: string,
  description?: string | React.ReactNode,
  onSelect: Function,
  assignedControls: any[],
};

interface MenuControlSetupProps {
  // Settings used to build the menu.
  options: {
    // Menu entry index that is active when the menu opens. Defaults to 0.
    defaultIndex?: number,
    // The actual menu entries. Supports strings and JSX. Any items included in
    // this object will be sent to your callback.
    entries: Entry[],
  },
  style: object,
  // Used to override what the 'next item' action is. Defaults to 'up'.
  actionsNext?: string[],
  // Used to override what the 'previous item' action is. Defaults to 'down'.
  actionsPrevious?: string[],
  actionsOpenControl?: string[],
}

export default class MenuControlSetup extends React.Component<MenuControlSetupProps> {
  private _input = new InputBridge();
  private _processedBindingCache: InputSchemeEntry[] | null = null;
  private _processedBindingCount: number = 0;
  public static defaultProps = {
    style: {},
    actionsNext: [ 'down' ],
    actionsPrevious: [ 'up' ],
    actionsOpenControl: [ 'right', 'select' ],
    actionsCloseControl: [ 'back' ],
  };

  state = {
    selected: null,
  };

  componentDidMount() {
    this._processedBindingCache = null;
    this._input.onAction.getEveryChange(this.handleAction);
    const defaultIndex = this.props.options.defaultIndex;
    if (this.state.selected === null && typeof defaultIndex === 'number') {
      this.setState({ selected: defaultIndex });
    }
  }

  componentWillUnmount() {
    this._input.onAction.removeGetEveryChangeListener(this.handleAction);
  }

  handleAction = (action: string) => {
    let selected = this.state.selected || 0;
    const selectionMax = Math.max(this._processedBindingCount - 1, 0);

    if (action === 'select') {
      return this.select(selected);
    }

    const cursorNextBindings = this.props.actionsNext;
    const cursorPreviousBindings = this.props.actionsPrevious;
    let direction: number;
    if (cursorNextBindings?.includes(action)) {
      direction = 1;
    }
    else if (cursorPreviousBindings?.includes(action)) {
      direction = -1;
    }
    else {
      return;
    }

    selected += direction;
    if (selected < 0) {
      return this.setState({ selected: 0 });
    }
    else if (selected >= selectionMax) {
      return this.setState({ selected: selectionMax });
    }
    else {
      this.setState({ selected });
    }
  };

  select(index: number) {
  }

  buildBindingCache = () => {
    const orderedSchemes = InputManager.getControlSchemes();
    console.log('InputManager orderedSchemes:', orderedSchemes);

    const bindingsInfo: InputSchemeEntry[] = [];
    const mergeDependants: InputSchemeEntry[] = [];
    const entryByKey: Record<string, InputSchemeEntry> = {};
    let controlCount = 0;

    for (let i = 0, len = orderedSchemes.length; i < len; i++) {
      const entry: InputSchemeEntry = orderedSchemes[i];
      if (!entry.key) {
        console.error('Entry is missing a key:', entry);
        continue;
      }

      // We don't want to modify the original configs; make a copy.
      entry.schema = { ...entry.schema };
      entryByKey[entry.key] = entry;

      if (entry.mergeInto) {
        mergeDependants.push(entry);
      }
      else {
        controlCount += Object.values(entry.schema || 0).length;
        bindingsInfo.push(entry);
      }
    }

    for (let i = 0, len = mergeDependants.length; i < len; i++) {
      const entry: InputSchemeEntry = mergeDependants[i];
      const mergeInto = entry.mergeInto as string;

      if (!entryByKey[mergeInto]) {
        console.error(
          `Cannot merge view '${entry.key}' into '${entry.mergeInto}' ` +
          `- ${entry.mergeInto} does not (yet?) exist.`,
        );
        continue;
      }

      const source: InputSchemeEntry = entryByKey[entry.key];
      const target: InputSchemeEntry = entryByKey[mergeInto];
      target.schema = { ...target.schema, ...source.schema };
    }

    this._processedBindingCount = controlCount;
    return this._processedBindingCache = bindingsInfo;
  };

  genMenu = () => {
    let cache = this._processedBindingCache;
    if (!cache) {
      cache = this.buildBindingCache();
    }

    const majorSection: JSX.Element[] = [];

    let controlIndex = 0;
    const selected = this.state.selected || 0;
    for (let i = 0, len = cache.length; i < len; i++) {
      const entry: InputSchemeEntry = cache[i];
      majorSection.push(
        <div key={`MenuControlSetup-${i}`}>
          <h4 style={{ paddingTop: 16 }}>
            <Icon name='crosshairs'/>&nbsp;
            {entry.friendly}
          </h4>
          {_.map(entry.schema, (control, actionName) => {
            const descriptor = entry.schema[actionName];
            return (
              <div key={`MenuControlSetup-${actionName}`}>
                {/* Left ride */}
                <div style={{ textAlign: 'left', display: 'inline-block' }}>
                  <KosmButton
                    isActive={controlIndex++ === selected}
                    wide
                    autoScroll
                    style={{ minWidth: 240, textAlign: 'left', marginTop: 2, marginBottom: 2 }}
                    onClick={() => {
                      // this.setState({ selected: index }, () => {
                      //   this.select(index);
                      // });
                    }}
                  >
                    {control.friendly || actionName}
                  </KosmButton>

                  <div style={{
                    display: 'inline-block',
                    paddingLeft: 4,
                    paddingRight: 8,
                  }}>
                    <code>-&gt;</code>
                  </div>
                </div>

                {/* Right side */}
                <div style={{ textAlign: 'right', display: 'inline-block' }}>
                  {_.map(control.current, (type: InputType, keyCode: string) => {
                    return (
                      <KosmButton
                        key={`MenuControlSetup-${actionName}-${keyCode}`}
                        isActive={false}
                        halfWide={true}
                        style={{ minWidth: 200, textAlign: 'left', marginTop: 2, marginBottom: 2 }}
                        onClick={() => {
                          // this.setState({ selected: index }, () => {
                          //   this.select(index);
                          // });
                        }}
                      >
                        {keyCodeToJsx(keyCode, type)}
                      </KosmButton>
                    )
                  })}
                  {/* The '+' button right of the bindings. */}
                  <KosmButton
                    // isActive={selected === index}
                    halfWide={true}
                    style={{ minWidth: 200, padding: 11, marginTop: 2, height: 39 }}
                    onClick={() => {
                    }}
                  >
                    <Icon name="plus"/>
                  </KosmButton>
                </div>
              </div>
            );
          })}
        </div>,
      );
    }

    return majorSection;
  };

  render() {
    const options = this.props.options;

    const selected = this.state.selected || 0;

    return (
      <div style={{ ...centerStyle, ...this.props.style }}>
        <h3 style={{ paddingTop: 16 }}>Controls</h3>
        <div style={menuEntriesStyle}>
          {this.genMenu()}
        </div>
        <div
          style={spacerStyle}
        >
          &nbsp;
        </div>
        <div
          style={descriptionBoxStyle}
        >
          {/*{activeEntry.description || ''}*/ ''}
        </div>
      </div>
    );
  }
}

export {
  MenuControlSetupProps,
}
