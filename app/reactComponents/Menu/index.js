import React from 'react';

import { getStartupEmitter, getUiEmitter, startupEvent } from '../../emitters';
import { keySchema } from '../../local/controls';
import CbQueueExtra from '../../local/CbQueueExtra';
import GameMenu from './GameMenu';
import Options from './Options';
import Controls from './Controls';
import Modal from '../Modal';

const startupEmitter = getStartupEmitter();
const uiEmitter = getUiEmitter();

export default class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Mad ramblings:
      // If we ever have a use-case to have multiple menus visible and
      // receiving input at once, we should probably change this into an array
      // and implement multiple actives.
      activeMenu: 'game menu',
    };

    // All menus (and special components) that listen for input.
    this.inputListeners = new CbQueueExtra();

    // This calls listeners in a loop, so a queue makes things a little easier.
    this.menuChangeListeners = new CbQueueExtra();

    // We allow arrows to repeat (i.e. holding down an arrow will cause it to
    // keep going until the button is released). We however only do this for
    // arrows and no other buttons. This is to prevent the chaos of
    // accidentally holding wrong buttons while in the menu.
    this.repeatArrow = {
      action: null,
      keyUpCount: 0,
    };
  };

  componentDidMount() {
    startupEmitter.emit(startupEvent.menuLoaded);
    this.registerListeners();
    this.changeMenu({
      next: this.state.activeMenu,
    });
  }

  componentWillUnmount() {
    this.deregisterListeners();
    this.stopRepeatArrowTimer();
  }

  stopRepeatArrowTimer = () => {
    this.repeatArrow.action = null;
  }

  registerListeners = () => {
    const actions = keySchema.menuViewer;
    for (let i = 0, len = actions.length; i < len; i++) {
      uiEmitter.on(actions[i], this.handlePress);
    }
  };

  deregisterListeners = () => {
    const actions = keySchema.menuViewer;
    for (let i = 0, len = actions.length; i < len; i++) {
      uiEmitter.removeListener(actions[i], this.handlePress);
    }
  };

  handlePress = (inputInfo) => {
    if (!inputInfo.isDown) {
      this.repeatArrow.keyUpCount++;
    }
    switch (inputInfo.action) {
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        return this.handleArrow(inputInfo);
      default:
        return this.handleAction(inputInfo);
    }
  };

  handleAction = (inputInfo) => {
    if (!inputInfo.isDown) {
      return;
    }
    this.sendActionToActive(inputInfo)
  };

  handleArrow = (inputInfo) => {
    const { action, isDown } = inputInfo;
    if (!isDown) {
      return this.repeatArrow.action = null;
    }

    this.repeatArrow.action = action;

    this.sendActionToActive(inputInfo);

    this.setKeyDelayTimeout(
      action,
      () => this.handleArrow({ action, isDown }),
      $options.repeatDelay,
      $options.repeatRate,
    );
  };

  /**
   * Sends a key action to the currently active menu.
   * @param inputInfo
   */
  sendActionToActive = (inputInfo) => {
    this.inputListeners.notifyAllViaName(this.state.activeMenu, inputInfo);
  };

  setKeyDelayTimeout = (action, callback, repeatDelay, repeatRate) => {
    const keyUpCount = this.repeatArrow.keyUpCount;
    const internalCallback = () => {
      if (this.repeatArrow.action !== action || keyUpCount !== this.repeatArrow.keyUpCount) {
        return;
      }
      callback();
      setTimeout(internalCallback, repeatRate);
    };

    setTimeout(internalCallback, repeatDelay);
  };

  registerInputListener = ({ name, onAction }) => {
    this.inputListeners.register(onAction, name);
  };

  deregisterInputListener = ({ name }) => {
    this.inputListeners.deregisterViaName(name);
  };

  registerMenuChangeListener = ({ onChange }) => {
    this.menuChangeListeners.register(onChange);
  };

  deregisterMenuChangeListener = ({ onChange }) => {
    this.menuChangeListeners.deregister(onChange);
  };

  /**
   * Changes to a different menu.
   * @param {string} next - Menu to change to.
   * @param {boolean} [suppressNotify] - If true, menus won't be notified of
   *   menu changes. Default is false. This is useful for overlay menus such as
   *   modals that do not require a screen for themselves.
   */
  changeMenu = ({ next, suppressNotify=false }) => {
    const previous = this.state.activeMenu;
    this.setState({
      activeMenu: next,
    }, () => {
      if (suppressNotify) {
        return;
      }
      const { pings } = this.menuChangeListeners.notifyAll({ next, previous });
      if (pings === 0) {
        alert(`No menus are willing to accept responsibility for "${next}".`);
        // Default to 'game menu' as a fallback.
        return this.setState({ activeMenu: 'game menu' }, () => {
          this.menuChangeListeners.notifyAll({
            next: 'game menu',
            previous: null,
          });
        });
      }
      else if (pings > 1) {
        alert(`More than one menu is attempting to assume "${next}" as their own identity.`);
      }
    });
  };

  /**
   * Returns a function that changes to a different menu.
   * @param {string} next - Menu to change to.
   * @param {boolean} [suppressNotify] - If true, menus won't be notified of
   *   menu changes. Default is false. This is useful for overlay menus such as
   *   modals that do not require a screen for themselves.
   * @returns {function(): void}
   */
  changeMenuFn = (next, suppressNotify=false) => {
    return () => this.changeMenu({ next, suppressNotify });
  };

  render() {
    const props = {
      registerMenuChangeListener: this.registerMenuChangeListener,
      deregisterMenuChangeListener: this.deregisterMenuChangeListener,
      registerInputListener: this.registerInputListener,
      deregisterInputListener: this.deregisterInputListener,
      changeMenuFn: this.changeMenuFn,
      changeMenu: this.changeMenu,
    };

    return (
      <div>
        <GameMenu {...props} />
        <Options {...props} />
        <Controls {...props} />
        <Modal {...props} />
      </div>
    );
  }
}
