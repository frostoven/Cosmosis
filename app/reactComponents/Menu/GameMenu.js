import React from 'react';
import { Grid } from 'semantic-ui-react';
import KosmButton from '../elements/KosmButton';
import { defaultMenuProps, defaultMenuPropTypes } from './defaults';
import { randomArrayItem } from '../../local/utils';
import { getInverseSchema } from '../../local/controls';

const thisMenu = 'game menu';

// Suicide quit confirmations. More games should do this.
const deaths = [
  // TODO: don't display 'space all crew' if in multiplayer session as it's a
  //  tad too immersion breaking.
  'space all crew.', 'overdose on mushrooms.', 'jump off the cliff.',
  'activate electric chair.', 'slide your hand into the warp reactor.',
  'drink the anti-matter syrup.', 'bathe in radioactive sludge.',
  'hatch the alien egg.',
  // TODO: produce chocking and coughing noises when this is selected:
  'increase life support efficiency by 19%!!',
  'quickly reply before closing reactor door.', 'lick the alien toad.',
  'chew on the loose wire.',
];

/**
 * Used to generate the menu layout.
 * TODO:
 *  The advantage of this type of definition is that users may rearrange the
 *  menu to match their preferences in future. We just need to make a UI for
 *  rearranging, and then save the changes to their profile.
 *  [CREATE ISSUE FOR THIS]
 *  [create label nice-to-have]
 *  [mention that we'd need to warn the user of resets during upgrades]
 * @type {string[][]}
 */
const menuButtons = [
  ['',   '',        '',          '',            '',           '',      ''],
  ['',   '',        '',     'debug tools',      '',           '',      ''],
  ['',   '',        '',      'tutorials',       '',           '',      ''],
  ['',   '',        '',     'multiplayer',      '',           '',      ''],
  ['', 'stats', 'inventory',  'resume',     'galaxy map', 'solar map', ''],
  ['',   '',        '',       'journal',        '',           '',      ''],
  ['',   '',        '',       'options',        '',           '',      ''],
  ['',   '',        '',        'quit',          '',           '',      ''],
  ['',   '',        '',          '',            '',           '',      ''],
];

// TODO: check if there's an easy algorithmic way of doing this.
/**
 * Used to indicate which button should be selected if the user presses an
 * arrow key.
 * @type {Object}
 */
const directionConfig = {
  'debug tools': { up: '',            down: 'tutorials',   left: 'inventory',  right: 'galaxy map', },
  'tutorials':   { up: 'debug tools', down: 'multiplayer', left: 'inventory',  right: 'galaxy map', },
  'multiplayer': { up: 'tutorials',   down: 'resume',      left: 'inventory',  right: 'galaxy map', },
  'stats':       { up: 'multiplayer', down: 'journal',     left: '',           right: 'inventory',  },
  'inventory':   { up: 'multiplayer', down: 'journal',     left: 'stats',      right: 'resume',     },
  'resume':      { up: 'multiplayer', down: 'journal',     left: 'inventory',  right: 'galaxy map', },
  'galaxy map':  { up: 'multiplayer', down: 'journal',     left: 'resume',     right: 'solar map',  },
  'solar map':   { up: 'multiplayer', down: 'journal',     left: 'galaxy map', right: '',           },
  'journal':     { up: 'resume',      down: 'options',     left: 'inventory',  right: 'galaxy map', },
  'options':     { up: 'journal',     down: 'quit',        left: 'inventory',  right: 'galaxy map', },
  'quit':        { up: 'options',     down: '',            left: 'inventory',  right: 'galaxy map', },
};

export default class GameMenu extends React.Component {
  static propTypes = defaultMenuPropTypes;
  static defaultProps = defaultMenuProps;
  static defaultState = {
    isVisible: false,
    activeButton: 'resume',
    previousMenu: thisMenu,
    currentMenu: thisMenu,
  };

  constructor(props) {
    super(props);
    this.state = GameMenu.defaultState;
  }

  componentDidMount() {
    this.props.registerInputListener({
      name: thisMenu,
      onAction: this.handleAction,
    });

    this.props.registerMenuChangeListener({
      onChange: this.handleMenuChange,
    });
  }

  handleAction = ({ action }) => {
    switch (action) {
      case 'back':
        return this.handleBack();
      case 'emergencyMenuClose':
        return this.handleEmergencyMenuClose();
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        return this.handleArrow({ action });
      case 'select':
        return this.handleSelect({ action });
    }
  };

  handleBack = () => {
    if (this.state.isVisible) {
      this.resume();
    }
    else {
      this.showMenu();
    }
  };

  handleEmergencyMenuClose = () => {
    this.resume();
  };

  handleSelect = () => {
    this.changeMenuFn(this.state.activeButton)();
  };

  handleArrow = ({ action }) => {
    const current = this.state.activeButton;
    const target = directionConfig[current][action];
    if (target) {
      this.setState({
        activeButton: target,
      });
    }
  };

  handleMenuChange = ({ next, previous }) => {
    this.setState({
      previousMenu: previous,
      currentMenu: next,
    });
    return thisMenu === next;
  };

  changeMenuFn = (target) => {
    if (target === 'resume') {
      return () => this.resume();
    }
    else if (target === 'quit') {
      // We are guaranteed that we'll have a [0] index set because the game
      // should prevent the user from completely unbinding essential controls.
      const key = getInverseSchema().inverseActionSchema.menuViewer.select[0];
      return () => $modal.confirm({
        header: `Press [${key}] to ${randomArrayItem(deaths)}`,
        body: 'Are you sure you want to exit?',
        callback: (jumpOffACliffAndDie) => {
          if (jumpOffACliffAndDie) {
            nw.Window.get().leaveFullscreen();
            require('nw.gui').App.closeAllWindows();
          }
        }
      });
    }
    else {
      return this.props.changeMenuFn(target);
    }
  };

  showMenu = () => {
    $game.ptrLockControls.unlock();
    this.setState({ isVisible: true });
  };

  resume = () => {
    $game.ptrLockControls.lock();
    this.setState({ isVisible: false, previousMenu: thisMenu });
  };

  genButton = (name, onClick) => {
    const isActive = this.state.activeButton === name;
    return <KosmButton className='button-fill-parent console-text' isActive={isActive} onClick={onClick}>{name}</KosmButton>;
  };

  /**
   * Creates a React button for each entry listed in directionConfig.
   * @returns {{}}
   */
  genButtonMap = () => {
    const buttonMap = {};
    const allButtonNames = Object.keys(directionConfig);
    allButtonNames.forEach((name) => {
      buttonMap[name] = this.genButton(name, this.changeMenuFn(name));
    });
    return buttonMap;
  };

  /**
   * @param {string} key
   * @param {array} columnItems
   */
  genRow = (key, columnItems=[]) => {
    const result = [];
    for (let i = 0, len = columnItems.length; i < len; i++) {
      const colKey = `${key}${i}`;
      const col = columnItems[i];
      if (!col) {
        // Empty string, or null.
        result.push(<Grid.Column key={colKey}>&nbsp;</Grid.Column>);
      }
      else {
        result.push(<Grid.Column key={colKey}>{col}</Grid.Column>);
      }
    }
    return (
      <Grid.Row key={key}>
        {result}
      </Grid.Row>
    );
  };

  /**
   * Generates the game menu based on the contents of menuButtons and
   * directionConfig.
   */
  genMenu = () => {
    const buttonMap = this.genButtonMap();
    const allRows = [];
    let row = 1;
    menuButtons.forEach((entry) => {
      // Example of what an entry might look like:
      // ['', 'stats', 'inventory', 'resume', galaxy map', 'solar map', ''],

      const compiledRow = [];
      entry.forEach((buttonName) => {
        if (buttonName) {
          compiledRow.push(buttonMap[buttonName]);
        }
        else {
          compiledRow.push(null);
        }
      });

      allRows.push(this.genRow(`row${row++}`, compiledRow));
    });
    return allRows;
  };

  getAnimation = () => {
    const { isVisible, currentMenu, previousMenu } = this.state;
    // console.log(`=> GameMenu isVisible=${isVisible}, currentMenu=${currentMenu}, previousMenu=${previousMenu}`)
    let transitioningFromFirstLevelChild = !!directionConfig[previousMenu];
    let reverse = false;
    if (currentMenu === thisMenu && transitioningFromFirstLevelChild) {
      reverse = true;
    }

    if (currentMenu === thisMenu && previousMenu === thisMenu) {
      if (isVisible) {
        // User opened menu from gameplay.
        return 'fadeInDown';
      }
      else {
        // User is either exiting back to gameplay, or game has just loaded.
        return 'fadeOutDown';
      }
    }
    else if (previousMenu === thisMenu || reverse) {
      // User is moving from this menu to another menu.
      // Or, if 'reverse' is true, use is moving here from a child menu.
      switch (currentMenu) {
        // TODO: if we can manage to algorithmically generate directionConfig
        //  in future, then we can likely remove block and generate this too.
        case 'debug tools':
        case 'tutorials':
        case 'multiplayer':
          if (reverse) return 'fadeOutUpBig';
          else return 'fadeOutDownBig';
        //
        case 'stats':
        case 'inventory':
          if (reverse) return 'fadeOutLeftBig';
          else return 'fadeOutRightBig';
        //
        case 'galaxy map':
        case 'solar map':
          if (reverse) return 'fadeOutRightBig';
          else return 'fadeOutLeftBig';
        //
        case 'journal':
        case 'options':
        case 'quit':
          if (reverse) return 'fadeOutDownBig';
          else return 'fadeOutUpBig';
      }
    }
    else {
      // User is transitioning from one child menu to another child menu.
      return 'hidden-menu';
    }
  };

  render() {
    const gameMenu = this.genMenu();
    const animation = this.getAnimation();
    return (
      <div className={`primary-menu ${animation}`}>
        <Grid className='game-menu vertical-center' columns='equal'>
          {gameMenu}
        </Grid>
      </div>
    );
  }
}
