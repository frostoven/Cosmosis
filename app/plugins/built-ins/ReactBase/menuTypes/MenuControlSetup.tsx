import React from 'react';
import InputBridge from '../types/InputBridge';
import KosmButton from '../../../../reactExtra/components/KosmButton';
import { Icon } from 'semantic-ui-react';

const menuEntriesStyle: React.CSSProperties = {
  overflow: 'auto',
  display: 'inline-block',
  whiteSpace: 'nowrap',
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
  marginTop: -2,
  marginBottom: 8,
  minWidth: 200,
};

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
    const entries = this.props.options?.entries;
    if (!entries?.length) {
      return;
    }

    let selected = this.state.selected || 0;

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
    else if (selected >= entries.length) {
      return this.setState({ selected: entries.length - 1 });
    }
    else {
      this.setState({ selected });
    }
  };

  select(index: number) {
    const entries = this.props.options?.entries;
    if (!entries?.length) {
      return;
    }

    const callback = entries[index].onSelect;
    if (typeof callback === 'function') {
      callback({ selected: index, ...entries[index] });
    }
  }

  genMenu = (entries: Entry[], selected: number) => {
    return entries.map((menuEntry, index) => {
      return (
        <div key={`MenuControlSetup-${index}`}>
          <div style={{ textAlign: 'left', display: 'inline-block' }}>
            <KosmButton
              isActive={selected === index}
              halfWide={true}
              onClick={() => {
                this.setState({ selected: index }, () => {
                  this.select(index);
                });
              }}
            >
              {menuEntry.name}
            </KosmButton>

            <div style={{ display: 'inline-block', paddingLeft: 4, paddingRight: 8 }}>
              <code>-&gt;</code>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'inline-block' }}>
          {Math.random() < 0.5 ?
            <KosmButton
              isActive={selected === index}
              halfWide={true}
              onClick={() => {
                this.setState({ selected: index }, () => {
                  this.select(index);
                });
              }}
            >
              {menuEntry.name}
            </KosmButton>
            : null
          }
          {Math.random() < 0.5 ?
            <KosmButton
              isActive={selected === index}
              halfWide={true}
              onClick={() => {
                this.setState({ selected: index }, () => {
                  this.select(index);
                });
              }}
            >
              {menuEntry.name}
            </KosmButton>
            : null
          }
          <KosmButton
            // isActive={selected === index}
            halfWide={true}
            onClick={() => {}}
          >
            <Icon name='plus'/>
          </KosmButton>
        </div>
        </div>
      )
    })
  };

  render() {
    const options = this.props.options;
    const entries = this.props.options?.entries;
    if (!options || !entries?.length) {
      return <div>[no menu entries available]</div>;
    }

    const selected = this.state.selected || 0;
    // TODO: do as state instead. Basically, allow per-button.
    const activeEntry = entries[selected];

    return (
      <div style={this.props.style}>
        <div style={menuEntriesStyle}>
          {this.genMenu(entries, selected)}
        </div>
        <div
          style={spacerStyle}
        >
          &nbsp;
        </div>
        <div
          style={descriptionBoxStyle}
        >
          {activeEntry.description || ''}
        </div>
      </div>
    );
  }
}

export {
  MenuControlSetupProps,
}
