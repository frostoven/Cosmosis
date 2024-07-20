import React from 'react';
import InputBridge from '../types/InputBridge';
import KosmButton from '../../../../reactExtra/components/KosmButton';
import { RegisteredMenu } from '../types/compositionSignatures';

const menuEntriesStyle: React.CSSProperties = {
  float: 'left',
};

const spacerStyle: React.CSSProperties = {
  float: 'left',
  paddingLeft: 16,
};

const descriptionBoxStyle: React.CSSProperties = {
  float: 'left',
  backgroundColor: 'rgb(33 33 33 / 70%)',
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 10,
  paddingBottom: 10,
  border: '4px solid black',
  borderRadius: 4,
  marginTop: -2,
  marginBottom: 8,
  minWidth: 300,
};

const centerBothStyle: React.CSSProperties = {
  top: '50%',
  transform: 'translateY(-50%)',
  justifyContent: 'center',
  position: 'absolute',
  display: 'flex',
  width: '100%',
};

type Entry = {
  name: string,
  description?: string | React.ReactNode,
  onSelect: Function
};

interface MenuBasicProps {
  // Options used to make the plugin a menu-based mode controller.
  pluginOptions: RegisteredMenu,
  // Settings used to build the menu.
  options: {
    // Menu entry index that is active when the menu opens. Defaults to 0.
    defaultIndex?: number,
    // The actual menu entries. Supports strings and JSX. Any items included in
    // this object will be sent to your callback.
    entries: Entry[],
    // If true, will show a blank description box when menu entries have no
    // description specified. Else, the description box will disappear in the
    // absence of a description.
    alwaysShowDescriptionBox?: boolean,
  },
  style: object,
  // Used to override what the 'next item' action is. Defaults to 'up'.
  actionsNext?: string[],
  // Used to override what the 'previous item' action is. Defaults to 'down'.
  actionsPrevious?: string[],
  inlineButtons?: boolean,
}

export default class MenuBasic extends React.Component<MenuBasicProps> {
  public static defaultProps = {
    style: {},
    actionsNext: [ 'down' ],
    actionsPrevious: [ 'up' ],
    inlineButtons: false,
  };

  state = {
    selected: null,
  };

  componentDidMount() {
    const input = this.props.pluginOptions.getInputBridge();
    input.onAction.getEveryChange(this.handleAction);
    const defaultIndex = this.props.options.defaultIndex;
    if (this.state.selected === null && typeof defaultIndex === 'number') {
      this.setState({ selected: defaultIndex });
    }
  }

  componentWillUnmount() {
    const input = this.props.pluginOptions.getInputBridge();
    input.onAction.removeGetEveryChangeListener(this.handleAction);
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
        <KosmButton
          key={`MenuBasic-${index}`}
          isActive={selected === index}
          wide={!this.props.inlineButtons}
          block={!this.props.inlineButtons}
          onClick={() => {
            this.setState({ selected: index }, () => {
              this.select(index);
            });
          }}
        >
          {menuEntry.name}
        </KosmButton>
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
    const inlineButtons = this.props.inlineButtons;
    const activeEntry = entries[selected];

    let leftCols: number, rightCols: number;
    if (options.alwaysShowDescriptionBox || activeEntry.description) {
      leftCols = rightCols = 8;
    }
    else {
      leftCols = 16;
      rightCols = 0;
    }

    return (
      <div style={{ ...centerBothStyle, ...this.props.style }}>
        <div style={menuEntriesStyle}>
          {this.genMenu(entries, selected)}
        </div>
        <div
          style={rightCols ? spacerStyle : { display: 'none' }}
        >
          &nbsp;
        </div>
        <div
          style={rightCols ? descriptionBoxStyle : { display: 'none' }}
        >
          {activeEntry.description || ''}
        </div>
      </div>
    );
  }
}

export {
  MenuBasicProps,
}
