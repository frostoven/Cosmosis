import React from 'react';
import { capitaliseEachWord } from '../../local/utils';
import KosmButton from '../elements/KosmButton';
import MenuNavigation from '../elements/MenuNavigation';
import { defaultMenuProps, defaultMenuPropTypes } from './defaults';

// Unique name that identifies this menu.
const thisMenu = 'simple menu';

export default class SimpleMenu extends React.Component {

  // Contains the bare minimum propType requirements for menus.
  static propTypes = defaultMenuPropTypes;

  // Props that may optionally be omitted by the parent.
  static defaultProps = defaultMenuProps;

  // Storing initial state separately makes it easy to quickly reset state
  // later.
  static defaultState = {
    activeItem: 0,
    select: false,
    isVisible: false,
  };

  constructor(props) {
    super(props);
    this.state = SimpleMenu.defaultState;
  }

  // Set up menu change listeners.
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

  handleMenuChange = ({ next, previous }) => {
    this.setState({
      isVisible: thisMenu === next,
    });
    // This tells the Menu component how many menus are taking on menu change
    // responsibility. If the amount of responses aren't right, the menu system
    // can immediately point it out as a bug.
    return thisMenu === next;
  };

  // Note that the MenuNavigation component in the render function below will
  // snatch most input; we'll only receive here whatever it doesn't care about.
  handleInput = ({ action }) => {
    switch (action) {
      case 'back':
        return this.handleBack();
    }
  };

  // Pressing the back button (Escape or Backspace) should usually send the
  // user to the previous menu, though you may add exceptions.
  handleBack = () => {
    this.props.changeMenu({ next: 'game menu' });
  };

  // Returns a CSS animation class.
  getAnimation = (reverse = false) => {
    if (this.state.isVisible) {
      return 'fadeInUpBig'
    } else {
      return 'fadeOutDownBig';
    }
  };

  render() {
    // CSS animation class. Animations themselves are optional. However, if you
    // don't want an animation, you'll still need to specify some CSS class that
    // has 'opacity: 0;' because components are visually hidden rather than
    // unmounted.
    const animation = this.getAnimation();

    // We indicate that an item can be clicked or selected with keyboard by
    // passing the 'selectable' prop to selectable components. The
    // MenuNavigation component (used below) will then detect this and use
    // that to automatically select things.
    //
    // MenuNavigation will add an 'isActive' prop to selected items. You may
    // instead have it use a CSS class for visually indicating selection by
    // passing the prop 'activeClass="whatever"' (a good test class is
    // kosm-gradient-box).
    //
    const inputProps = {
      // Inherit listener registration functions from parent.
      ...this.props,
      // This is used as a unique name when registering listeners.
      identifier: thisMenu,
      // This is called if MenuNavigation has no use for some action.
      onUnhandledInput: this.handleInput,
      // CSS class that will be used to indicate a menu item is currently
      // selected. If not specified, MenuNavigation will pass an isActive prop
      // instead. By default, you should omit activeClass. It's useful when you
      // build custom components, and is here for demonstration purposes only.
      activeClass: 'kosm-gradient-box',
      // Specifies if your menu navigation is up/down, or left/right. Default
      // is up/down.
      direction: MenuNavigation.direction.UpDown,
    }

    return (
      <div className={`primary-menu ${animation}`}>
        <div className='game-menu vertical-center horizontal-center'>
          <MenuNavigation {...inputProps}>

            {/* Header. */}
            <h1>{capitaliseEachWord(thisMenu)}</h1>

            {/* The 'selectable' prop is the important part. */}
            <KosmButton selectable wide block onClick={()=>alert('** ey b0ss **')}>Alert</KosmButton>

            {/* This one is purely aesthetic. */}
            <KosmButton wide block>This is not selectable.</KosmButton>

            {/* Note: onClick will also trigger if pressing enter on a selected component. */}
            <h3 selectable onClick={()=>alert('Hello, world!')}>Any component of your choice is selectable.</h3>

            {/* Always point this to what is the most logical 'previous' menu. */}
            <KosmButton selectable wide block onClick={this.handleBack}>Back</KosmButton>

          </MenuNavigation>
        </div>
      </div>
    );
  }
}
