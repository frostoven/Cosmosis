import React from 'react';
import { capitaliseFirst } from '../../local/utils';
import Button from '../elements/KosmButton';
import MenuNavigation from '../elements/MenuNavigation';
import { defaultMenuProps, defaultMenuPropTypes } from './defaults';
import userProfile from '../../userProfile';
import { setPlayerShipLocation, setPlayerShipRotation, triggerAction } from '../../local/api';
import { getStartupEmitter, startupEvent } from '../../emitters';
import { activateSceneGroup, logicalSceneGroup } from '../../logicalSceneGroup';

// Menu's unique name.
const thisMenu = 'debug tools';

export default class DebugTools extends React.Component {
  static propTypes = defaultMenuPropTypes;
  static defaultProps = defaultMenuProps;
  static defaultState = {
    isVisible: false,
  };

  constructor(props) {
    super(props);
    this.state = DebugTools.defaultState;
  }

  componentDidMount() {
    this.props.registerMenuChangeListener({
      onChange: this.handleMenuChange,
    });
  }

  componentWillUnmount() {
    this.props.deregisterMenuChangeListener({
      onChange: this.handleMenuChange,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!this.state.isVisible && !nextState.isVisible) {
      return false;
    }
    return true;
  }

  handleMenuChange = ({ next, previous }) => {
    this.setState({
      isVisible: thisMenu === next,
    });
    return thisMenu === next;
  };

  handleInput = ({ action }) => {
    switch (action) {
      case 'back':
        return this.handleBack();
    }
  };

  handleBack = () => {
    this.props.changeMenu({ next: 'game menu' });
  };

  getAnimation = (reverse = false) => {
    if (this.state.isVisible) {
      return 'fadeInUpBig';
    } else {
      return 'fadeOutDownBig';
    }
  };

  startStarFreeFlight = () => {
    getStartupEmitter().on(startupEvent.gameViewReady, () => {
      triggerAction('emergencyMenuClose');
      activateSceneGroup({
        renderer: $game.renderer,
        camera: $game.camera,
        logicalSceneGroup: logicalSceneGroup.starFieldFreeFlight,
      });
    });
  };

  saveShipPos = () => {
    //
  };

  loadShipPos = () => {
    const positions = userProfile.getCurrentConfig({
      identifier: 'debugTools'
    }).storedShipPositions;

    $modal.listPrompt({
      list: positions,
      callback: (itemSelected) => {
        positions.some(pos => {
          if (pos.text === itemSelected.text) {
            setPlayerShipLocation(pos.location);
            setPlayerShipRotation(pos.rotation);
            return true;
          }
          return false;
        });
      },
    });
  };

  setShipPosDefault = () => {
    //
  };

  setMaxShipSpeed = () => {
    //
  };

  render() {
    const changeMenuFn = this.props.changeMenuFn;
    const animation = this.getAnimation();

    const inputProps = {
      // Inherit listener registration functions from parent.
      ...this.props,
      // This is used as a unique name when registering listeners.
      identifier: thisMenu,
      // This is called if MenuNavigation has no use for some action.
      onUnhandledInput: this.handleInput,
    };

    const btnProps = {
      selectable: true,
      block: true,
      wide: true,
    };

    return (
      <div className={`primary-menu ${animation}`}>
        <div className='game-menu vertical-center horizontal-center'>
          <MenuNavigation {...inputProps}>
            <h1>{capitaliseFirst(thisMenu)}</h1>
            <Button {...btnProps} onClick={this.startStarFreeFlight}>Star free-flight (real Earth-visible stars)</Button>
            <Button {...btnProps} onClick={()=>{}} invalid>Star free-flight (completely procedural)</Button>
            <Button {...btnProps} onClick={this.saveShipPos} invalid>Save current ship position</Button>
            <Button {...btnProps} onClick={this.loadShipPos} invalid>Load previous ship position</Button>
            <Button {...btnProps} onClick={this.setShipPosDefault} invalid>Set current ship position as starting position</Button>
            <Button {...btnProps} onClick={this.setMaxShipSpeed} invalid>Override max ship speed</Button>
            <Button {...btnProps} onClick={this.handleBack}>Back</Button>
          </MenuNavigation>
        </div>
      </div>
    );
  }
}
