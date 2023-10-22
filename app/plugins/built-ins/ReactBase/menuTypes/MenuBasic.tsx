import React from 'react';
import InputBridge from '../types/InputBridge';
import KosmButton from '../components/KosmButton';

interface MenuBasicProps {
  options: {
    default?: number,
    entries: { name: string, onSelect: Function }[],
  },
  style: object,
  // Used to override what the 'next item' action is. Defaults to 'up'.
  actionsNext?: string[],
  // Used to override what the 'previous item' action is. Defaults to 'down'.
  actionsPrevious?: string[],
  inlineButtons?: boolean,
}

export default class MenuBasic extends React.Component<MenuBasicProps> {
  private _input = new InputBridge();
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
    this._input.onAction.getEveryChange(this.handleAction);
    const defaultIndex = this.props.options.default;
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

  render() {
    const entries = this.props.options?.entries;
    if (!entries?.length) {
      return <div>[no menu entries available]</div>;
    }

    const selected = this.state.selected || 0;
    const inlineButtons = this.props.inlineButtons;

    return (
      <div style={this.props.style}>
        {entries.map((menuEntry, index) => {
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
        })}
      </div>
    );
  }
}

export {
  MenuBasicProps,
}
