import React from 'react';
import { capitaliseFirst } from '../../local/utils';
import Button from '../elements/KosmButton';
import MenuNavigation from '../elements/MenuNavigation';
import { defaultMenuProps, defaultMenuPropTypes } from './defaults';

// Menu's unique name.
const thisMenu = 'options';

export default class Options extends React.Component {
  static propTypes = defaultMenuPropTypes;
  static defaultProps = defaultMenuProps;
  static defaultState = {
    isVisible: false,
  };

  constructor(props) {
    super(props);
    this.state = Options.defaultState;
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
      return 'fadeInUpBig'
    } else {
      return 'fadeOutDownBig';
    }
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
            <Button {...btnProps} onClick={changeMenuFn('controls')}>Controls</Button>
            <Button {...btnProps} invalid onClick={changeMenuFn('graphics')}>Graphics</Button>
            <Button {...btnProps} invalid onClick={changeMenuFn('audio')}>Audio</Button>
            <Button {...btnProps} invalid onClick={changeMenuFn('customisation')}>Customisation</Button>
            <Button {...btnProps} invalid onClick={changeMenuFn('credits')}>Credits</Button>
            <Button {...btnProps} onClick={changeMenuFn('profile')}>Profile</Button>
            <Button {...btnProps} onClick={this.handleBack}>Back</Button>
          </MenuNavigation>
        </div>
      </div>
    );
  }
}
