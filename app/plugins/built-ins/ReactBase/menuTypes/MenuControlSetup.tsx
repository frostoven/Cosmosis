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
  marginRight: 62,
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

function keyCodeToJsx(keyCode: string | JSX.Element, type: InputType, includeIcon = true) {
  let icon: JSX.Element | null;
  if (includeIcon) {
    icon = <><Icon name={keyTypeIcons[type]}/>&nbsp;</>;
  }
  else {
    icon = null;
  }

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
        minWidth: 23,
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
    <div style={{ display: 'inline-block' }}>{icon}{keyCode}</div>
  );
}

// Returns all keys associated with the specified action.
function getKeysByAction(schemaName: string, action: string) {
  const actions = InputManager.allKeyLookups[schemaName];
  return actions[action] || [];
}

// Returns the first key associated with the specified schema and action.
function getKeyByAction(schemaName: string, action: string) {
  return getKeysByAction(schemaName, action)[0] || {
    key: '???', type: InputType.none,
  };
}

function getJsxByAction(schemaName: string, action: string, includeIcon = true) {
  const actionData = getKeyByAction(schemaName, action);
  return keyCodeToJsx(actionData.key, actionData.type, includeIcon);
}

function StatusbarButton({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-block',
        fontWeight: 'bold',
        // TODO: include this within the project.
        fontFamily: 'DejaVu Sans Mono, monospace',
        paddingRight: 24 }}
    >
      {children}
    </div>
  )
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
  actionsSelect?: string[],
  actionsBack?: string[],
}

export default class MenuControlSetup extends React.Component<MenuControlSetupProps> {
  private _input = new InputBridge();
  private _processedBindingCache: InputSchemeEntry[] | null = null;
  private _processedBindingCount: number = 0;
  // If true, scrolling further right is not allowed.
  private _subsectionLimitReached: boolean = false;

  public selectionInfo: {
    type: InputType;
    key: string;
    actionName: any
  } | {} = {};

  public static defaultProps = {
    style: {},
    actionsNext: [ 'down', 'right' ],
    actionsPrevious: [ 'up', 'left' ],
    actionsSelect: [ 'right', 'select' ],
    actionsBack: [ 'back' ],
  };

  state = {
    selected: 0,
    subSelection: 0,
    // If true, browsing up/down. If false, we're editing controls
    // (horizontal).
    scrollingVertically: true,
  };
  componentDidMount() {
    this._processedBindingCache = null;
    this._input.onAction.getEveryChange(this.handleAction);
    const defaultIndex = this.props.options.defaultIndex;
    if (typeof defaultIndex === 'number') {
      this.setState({ selected: defaultIndex });
    }
  }

  componentWillUnmount() {
    this._input.onAction.removeGetEveryChangeListener(this.handleAction);
  }

  handleAction = (action: string) => {
    if (action === 'delete') {
      this.removeExistBinding();
    }
    else if (this.state.scrollingVertically) {
      this.handleVerticalScrolling(action);
    }
    else {
      this.handleHorizontalScrolling(action);
    }
  };

  handleVerticalScrolling = (action: string) => {
    let selected = this.state.selected;
    const selectionMax = Math.max(this._processedBindingCount - 1, 0);

    // If pressing Enter or ArrowRight on control to open it:
    if (this.props.actionsSelect?.includes(action)) {
      return this.setState({ scrollingVertically: false });
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

  handleHorizontalScrolling = (action: string) => {
    const {
      actionsBack, actionsNext, actionsPrevious, actionsSelect,
    } = this.props;
    const subSelection = this.state.subSelection;

    const goNext = actionsNext?.includes(action);
    const goPrevious = actionsPrevious?.includes(action);
    const goBack = actionsBack?.includes(action);
    const activate = actionsSelect?.includes(action) && !actionsNext?.includes(action);
    const backToScrollMenu = goBack || (subSelection === 0 && goPrevious);

    if (backToScrollMenu) {
      return this.setState({
        scrollingVertically: true,
        subSelection: 0,
      });
    }
    else if (activate && this._subsectionLimitReached) {
      this.addNewBinding();
    }
    else if (goNext) {
      if (!this._subsectionLimitReached) {
        this.setState({ subSelection: subSelection + 1 });
      }
    }
    else if (goPrevious) {
      this.setState({ subSelection: subSelection - 1 });
    }
  };

  addNewBinding = () => {
    console.log('--> addNewBinding tba');
    console.log('  > selectionInfo:', this.selectionInfo);
  };

  removeExistBinding = () => {
    if (this.state.scrollingVertically || this._subsectionLimitReached) {
      return window.$modal.alert('Cannot delete - no key selected.');
    }
    const cache = this.getBindingsCache();
    const { selected, subSelection } = this.state;
    console.log('--> cache:', cache);
    console.log('  > item indexes:', { selected, subSelection });
    console.log('  > selectionInfo:', this.selectionInfo);
  };

  resetBinding = (actionName: string) => {
  };

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

  getBindingsCache = (): InputSchemeEntry[] => {
    if (!this._processedBindingCache) {
      this.buildBindingCache();
    }
    return this._processedBindingCache as InputSchemeEntry[];
  };

  genMenu = () => {
    let cache = this.getBindingsCache();

    const majorSection: JSX.Element[] = [];
    const selected = this.state.selected;
    const subSelection = this.state.subSelection;
    const scrollingVertically = this.state.scrollingVertically;

    let controlIndex = 0;
    let controlSubIndex = 0;

    for (let i = 0, len = cache.length; i < len; i++) {
      const entry: InputSchemeEntry = cache[i];
      majorSection.push(
        <div key={`MenuControlSetup-${i}`}>
          <h4 style={{ paddingTop: 16 }}>
            <Icon name='crosshairs'/>&nbsp;
            {entry.friendly}
          </h4>
          {_.map(entry.schema, (control, actionName) => {
            const entryControlCount = Object.values(control.current).length;
            const descriptor = entry.schema[actionName];
            const currentVerticalIndex = controlIndex++;
            let subIndexCount = 0;
            return (
              <div key={`MenuControlSetup-${actionName}`}>
                {/* Left ride */}
                <div style={{ textAlign: 'left', display: 'inline-block' }}>
                  <KosmButton
                    isActive={currentVerticalIndex === selected}
                    wide
                    autoScroll
                    style={{ minWidth: 240, textAlign: 'left', marginTop: 2, marginBottom: 2 }}
                    onClick={() => {
                      this.setState({
                        selected: currentVerticalIndex,
                        subSelection: 0,
                        scrollingVertically: true,
                      });
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
                    const currentSubIndex = subIndexCount++;

                    let active = false;
                    if (!scrollingVertically) {
                      if (controlIndex - 1 !== selected) {
                        controlSubIndex = 0;
                      }
                      else {
                        active = controlSubIndex++ === subSelection;
                      }
                    }

                    if (active) {
                      // Store position for easier use by tools like control
                      // deletion and editing.
                      this.selectionInfo = {
                        actionName, key: keyCode, type,
                      };
                    }

                    return (
                      <KosmButton
                        key={`MenuControlSetup-${actionName}-${keyCode}`}
                        isActive={active}
                        autoScroll
                        halfWide={true}
                        style={{ minWidth: 200, textAlign: 'left', marginTop: 2, marginBottom: 2 }}
                        onClick={() => {
                          this.setState({
                            selected: currentVerticalIndex,
                            subSelection: currentSubIndex,
                            scrollingVertically: false,
                          });
                        }}
                      >
                        {keyCodeToJsx(keyCode, type)}
                      </KosmButton>
                    )
                  })}

                  {/* The '+' button right of the bindings. */}
                  <KosmButton
                    isActive={(() => {
                      if (currentVerticalIndex !== selected) {
                        return false;
                      }
                      const limitReached = subSelection >= entryControlCount;
                      this._subsectionLimitReached = limitReached;
                      return limitReached;
                    })()}
                    autoScroll
                    halfWide={true}
                    style={{ minWidth: 200, padding: 11, marginTop: 2, height: 39 }}
                    onClick={() => {
                      this.setState({
                        selected: currentVerticalIndex,
                        subSelection: 0,
                        scrollingVertically: false,
                      },
                      this.addNewBinding);
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

  showAdvancedOptions = () => {
    let cache = this.getBindingsCache();
  };

  render() {
    const options = this.props.options;
    const selected = this.state.selected;

    // console.log('--> Reverse lookup:', InputManager.allKeyLookups);

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

        {/* Statusbar */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          paddingLeft: 4,
          paddingTop: 7,
          paddingBottom: 8,
          // backgroundColor: 'rgb(33 33 33 / 90%)',
          backgroundColor: 'rgb(128 0 0 / 90%)',
        }}>
          <img
            alt="" src="/prodHqAssets/icons/menu_status_redC0.png"
            style={{
              display: 'inline-block',
              transform: 'translateY(1px)',
              height: 12,
            }}
          />

          <div style={{ paddingLeft: 8, display: 'inline-block' }}/>

          <StatusbarButton onClick={() => {}}>
            {getJsxByAction('reactMenuControls', 'search', false)}
            &nbsp;Search
          </StatusbarButton>

          <StatusbarButton onClick={() => {}}>
            {getJsxByAction('reactMenuControls', 'emergencyMenuClose', false)}
            &nbsp;Emergency Menu Close
          </StatusbarButton>

          <StatusbarButton onClick={this.showAdvancedOptions}>
            {getJsxByAction('reactMenuControls', 'advanced', false)}
            &nbsp;Advanced Options
          </StatusbarButton>

          <StatusbarButton onClick={this.removeExistBinding}>
            {getJsxByAction('reactMenuControls', 'delete', false)}
            &nbsp;Remove Binding
          </StatusbarButton>

          <StatusbarButton onClick={() => {}}>
            {getJsxByAction('reactMenuControls', 'saveChanges', false)}
            &nbsp;Save Changes
          </StatusbarButton>
        </div>
      </div>
    );
  }
}

export {
  MenuControlSetupProps,
}
