import React from 'react';
import KosmButton from '../../../../reactExtra/components/KosmButton';
import { RegisteredMenu } from '../types/compositionSignatures';

const menuEntriesStyle: React.CSSProperties = {
  float: 'left',
};

const centerBothStyle: React.CSSProperties = {
  top: '50%',
  transform: 'translateY(-50%)',
  justifyContent: 'center',
  position: 'absolute',
  display: 'flex',
  width: '100%',
};

type Entry = string[];

interface MenuGridProps {
  // Options used to make the plugin a menu-based mode controller.
  pluginOptions: RegisteredMenu,
  // Settings used to build the menu.
  options: {
    // Menu entry index that is active when the menu opens. Defaults to [0, 0].
    defaultIndex?: { row: number, column: number },
    // The actual menu entries. Supports strings and JSX. Any items included in
    // this object will be sent to your callback.
    entries: Entry[],
  },
  style: object,
}

interface State {
  selected: { row: number, column: number }, // new type for selected state
}

export default class MenuGrid extends React.Component<MenuGridProps, State> {
  public static defaultProps = {
    style: {},
  };

  state: State = {
    selected: { row: 0, column: 0 },
  };

  componentDidMount() {
    const input = this.props.pluginOptions.getInputBridge();
    input.onAction.getEveryChange(this.handleAction);
    const defaultIndex = this.props.options.defaultIndex;
    if (defaultIndex) {
      this.setState({ selected: defaultIndex });
    }
  }

  componentWillUnmount() {
    const input = this.props.pluginOptions.getInputBridge();
    input.onAction.removeGetEveryChangeListener(this.handleAction);
  }

  handleAction = (action: string) => {
    const entries = this.props.options.entries;
    if (!entries?.length) {
      return;
    }

    switch (action) {
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        this.navigateArrows(action, entries);
        break;
      case 'select':
        this.select();
    }
  };


  navigateArrows = (action: string, entries: Entry[]) => {
    let { row, column } = this.state.selected;

    const directions = {
      up: { rowOffset: -1, columnOffset: 0 },
      down: { rowOffset: 1, columnOffset: 0 },
      left: { rowOffset: 0, columnOffset: -1 },
      right: { rowOffset: 0, columnOffset: 1 },
    };

    if(!directions[action]) {
      return;
    }

    const rowMin = 0;
    const rowMax = entries.length - 1;
    const colMin = 0;
    const colMax = entries[row].length - 1;

    // Assume all rows are the same width.
    const loopLimit = entries.length * entries[0].length * 2;

    let newCell: any = null;

    const findOrthogonal = () => {
      const rowOffset = directions[action].rowOffset;
      const columnOffset = directions[action].columnOffset;

      let tmpRow = row;
      let tmpColumn = column;

      let loopCount = 0;
      while (true) {
        if (loopCount++ > loopLimit) {
          console.error(
            `[MenuGrid] Error: Exceeded ${loopLimit} loops looking for a ` +
            `nearby button.`
          );
          break;
        }

        tmpColumn += columnOffset;
        tmpRow += rowOffset;


        if (tmpColumn < colMin || tmpColumn > colMax || tmpRow < rowMin || tmpRow > rowMax) {
          break;
        }

        const cell = entries[tmpRow][tmpColumn];
        if (cell) {
          newCell = { row: tmpRow, column: tmpColumn };
          break;
        }
      }
    };

    const findDiagonal = () => {
      const rowOffset = directions[action].rowOffset;
      const columnOffset = directions[action].columnOffset;

      let rowOverreach = 0;
      let colOverreach = 0;

      let loopCount = 0;
      while (true) {
        if (loopCount++ > loopLimit) {
          console.error(
            `[MenuGrid] Error: Exceeded ${loopLimit} loops looking for a ` +
            `nearby button.`
          );
          break;
        }

        rowOverreach += rowOffset;
        colOverreach += columnOffset;

        if (rowOffset) {
          const searchLeft = entries[row + rowOffset]?.[column - rowOverreach];
          const searchRight = entries[row + rowOffset]?.[column + rowOverreach];
          if (typeof searchLeft === 'undefined' && typeof searchRight === 'undefined') {
            break;
          }
          else if (searchLeft) {
            newCell = {
              row: row + rowOffset,
              column: column - rowOverreach,
            };
            break;
          }
          else if (searchRight) {
            newCell = {
              row: row + rowOffset,
              column: column + rowOverreach,
            };
            break;
          }
        }
        else if (columnOffset) {
          const searchUp = entries[row - colOverreach]?.[column + columnOffset];
          const searchDown = entries[row + colOverreach]?.[column + columnOffset];
          if (typeof searchUp === 'undefined' && typeof searchDown === 'undefined') {
            break;
          }
          else if (searchUp) {
            newCell = {
              row: row - colOverreach,
              column: column + columnOffset,
            };
            break;
          }
          else if (searchDown) {
            newCell = {
              row: row + colOverreach,
              column: column + columnOffset,
            };
            break;
          }
        }
        else {
          console.warn('[MenuGrid] Menu not diagonally traversable.');
        }
      }
    };

    // Look for a button within the direction of the arrow.
    findOrthogonal();
    if (!newCell) {
      // If this point is reached, then we didn't find anything. Look for
      // buttons diagonally.
      findDiagonal();
    }

    if (!newCell) {
      return;
    }

    this.setState({
      selected: newCell,
    });
  };

  genMenu = (entries: Entry[], selected: {
    row: number,
    column: number
  }) => {
    return entries.map((row, rowIndex) => {
      const buttons = row.map((buttonLabel, columnIndex) => {
        if (buttonLabel === '') return null;

        return (
          <KosmButton
            key={`MenuBasic-${rowIndex}-${columnIndex}`}
            halfWide={true}
            isActive={selected.row === rowIndex && selected.column === columnIndex}
            onClick={() => {
              this.select({ row: rowIndex, column: columnIndex });
            }}
          >
            {buttonLabel}
          </KosmButton>
        );
      });
      return <div key={`MenuBasic-row${rowIndex}`} style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 8,
      }}>{buttons}</div>;
    });
  };

  select = (options?: { row: number, column: number }) => {
    let row: number, column: number;
    if (options) {
      row = options.row;
      column = options.column;
    }
    else {
      row = this.state.selected.row;
      column = this.state.selected.column;
    }

    const entries = this.props.options?.entries;
    if (!entries?.length) {
      return;
    }

    const name = entries[row][column];
  };

  render() {
    const options = this.props.options;
    const entries = this.props.options?.entries;
    if (!options || !entries?.length) {
      return <div>[no menu entries available]</div>;
    }

    const selected = this.state.selected || 0;

    return (
      <div style={{ ...centerBothStyle, ...this.props.style }}>
        <div style={menuEntriesStyle}>
          {this.genMenu(entries, selected)}
        </div>
      </div>
    );
  }
}

export {
  MenuGridProps,
};
