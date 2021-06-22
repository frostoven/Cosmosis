import React from 'react';
import { Button, Dropdown, Grid, Segment } from 'semantic-ui-react';

import { getUiEmitter } from '../emitters';
import { keySchema } from '../local/controls';
import core from '../local/core';
import KosmButton from './elements/KosmButton';

const uiEmitter = getUiEmitter();

export default class GameMenu extends React.Component {
  static propTypes = {
    // visible: PropTypes.bool.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.state = {
      // Used directly by CSS.
      isVisible: false,
      changeMenu: null,
    };
  }

  componentDidMount() {
    this.registerListeners();
  }

  componentWillUnmount() {
    this.deregisterListeners();
  }

  registerListeners = () => {
    const actions = keySchema.gameMenu;
    for (let i = 0, len = actions.length; i < len; i++) {
      uiEmitter.on(actions[i], this.handlePress);
    }
  };

  deregisterListeners = () => {
    const actions = keySchema.gameMenu;
    for (let i = 0, len = actions.length; i < len; i++) {
      uiEmitter.removeListener(actions[i], this.handlePress);
    }
  };

  handlePress = ({ action, isDown }) => {
    const fn = this.controls[action];
    if (fn) {
      fn({ isDown });
    }
  };

  controls = {
    back: ({ isDown }) => {
      if (isDown) {
        if (this.state.isVisible) {
          this.resume();
        }
        else {
          this.showMenu();
        }
      }
    },
  };

  showMenu = () => {
    $game.ptrLockControls.unlock();
    this.setState({ isVisible: true });
  }

  resume = () => {
    $game.ptrLockControls.lock();
    this.setState({ isVisible: false });
  };

  /**
   * @param {string} key
   * @param {array} columnItems
   */
  generateRow = (key, columnItems=[]) => {
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
    )
  };

  genButton = (name, onClick) => {
    return <Button className='button-fill-parent' onClick={onClick}>{name}</Button>
  };

  getVisibilityAnimation = () => {
    if (this.state.isVisible) {
      return 'fadeInDown';
    }
    else {
      return 'fadeOutDown';
    }
  };

  getDeferalAnimation = () => {
    switch (this.state.changeMenu) {
      case 'galaxyMap':
        return 'fadeOutLeftBig';
    }
  };

  enterSubMenuFn = (target) => {
    return () => this.setState({ changeMenu: target });
  };

  render() {
    let row = 1;

    const debugTools =   this.genButton('debug tools', this.enterSubMenuFn('tools'));
    const tutorials =    this.genButton('tutorials', this.enterSubMenuFn('tutorials'));
    const multiplayer =  this.genButton('multiplayer', this.enterSubMenuFn('multiplayer'));
    const stats =        this.genButton('stats', this.enterSubMenuFn('stats'));
    const inventory =    this.genButton('inventory', this.enterSubMenuFn('inventory'));
    const resume =       this.genButton('resume', this.resume);
    const galaxyMap =    this.genButton('galaxy map', this.enterSubMenuFn('galaxyMap'));
    const solarMap =     this.genButton('solar map', this.enterSubMenuFn('solarMap'));
    const journal =      this.genButton('journal', this.enterSubMenuFn('journal'));
    const options =      this.genButton('options', this.enterSubMenuFn('options'));
    const quit =         this.genButton('quit', () => {
      if (prompt('Are you sure you want to exit?')) {
        // TODO: move to central place, and use Semantic UI.
        process.exit();
      }
    });

    let animation;
    if (this.state.changeMenu) {
      animation = this.getDeferalAnimation();
    }
    else {
      animation = this.getVisibilityAnimation();
    }

    return (
      <div className={`primary-menu ${animation}`}>

        {/*<KosmButton>Resume</KosmButton>*/}

        {/*<Button onClick={this.resume}>Resume</Button><br />*/}
        {/*<Button>Options</Button><br />*/}
        {/*<Button><strike>Tutorial</strike></Button><br />*/}


        <Grid className='game-menu vertical-center' columns='equal'>
          {this.generateRow(`row${row++}`, ['', '', '', '', '', '', ''])}
          {this.generateRow(`row${row++}`, ['', '', '', debugTools, '', '', ''])}
          {this.generateRow(`row${row++}`, ['', '', '', tutorials, '', '', ''])}
          {this.generateRow(`row${row++}`, ['', '', '', multiplayer, '', '', ''])}
          {this.generateRow(`row${row++}`, ['', stats, inventory, resume, galaxyMap, solarMap, ''])}
          {this.generateRow(`row${row++}`, ['', '', '', journal, '', '', ''])}
          {this.generateRow(`row${row++}`, ['', '', '', options, '', '', ''])}
          {this.generateRow(`row${row++}`, ['', '', '', quit, '', '', ''])}
          {this.generateRow(`row${row++}`, ['', '', '', '', '', '', ''])}
        </Grid>

      </div>
    );
  }
}
