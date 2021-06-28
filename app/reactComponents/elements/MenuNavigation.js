import React from 'react';
import PropTypes from 'prop-types';
import { defaultMenuPropTypes } from '../Menu/defaults';

export default class MenuNavigation extends React.Component {
  static direction = {
    UpDown: 2,
    LeftRight: 4,
  };

  static propTypes = {
    ...defaultMenuPropTypes,
    direction: PropTypes.number.isRequired,
    onUnhandledInput: PropTypes.func,
    activeClass: PropTypes.string,
    recursive: PropTypes.bool,
    children: PropTypes.any,
  };

  static defaultProps = {
    direction: MenuNavigation.direction.UpDown,
    onUnhandledInput: ()=>{},
    activeClass: null,
    recursive: true,
  };

  static defaultState = {
    activeItem: 0,
  };

  constructor(props) {
    super(props);
    this.state = MenuNavigation.defaultState;
    // Updated whenever the list is read. This is not stored in state because
    // input is managed outside of state.
    this.listLength = 0;
    this.activeChildCallback = null;
  }

  componentDidMount() {
    this.props.registerInputListener({
      name: this.props.identifier,
      onAction: this.handleAction,
    });
  }

  componentWillUnmount() {
    this.props.deregisterInputListener({
      name: this.props.identifier,
    });
  }

  // Note: the up/down mode and left/right mode are mutually exclusive.
  handleAction = (inputInfo) => {
    const { action } = inputInfo;
    const { activeItem } = this.state;
    const { UpDown, LeftRight } = MenuNavigation.direction;

    const isUpDown = this.props.direction === UpDown;
    const isLeftRight = this.props.direction === LeftRight;

    if ((isUpDown && action === 'up') || (isLeftRight && action === 'left')) {
      if (activeItem > 0) {
        this.setState({ activeItem: activeItem - 1 });
      }
    }
    else if ((isUpDown && action === 'down') || (isLeftRight && action === 'right')) {
      if (activeItem < this.listLength - 1) {
        this.setState({ activeItem: activeItem + 1 });
      }
    }
    else if (action === 'select') {
      return this.handleSelect(inputInfo);
    }
    else {
      this.props.onUnhandledInput(inputInfo)
    }
  };

  handleBack = () => {
    this.props.changeMenu({ next: 'game menu' });
  };

  handleSelect = ({ action }) => {
    if (this.activeChildCallback) {
      this.activeChildCallback({ action });
    }
  };

  /**
   * Modifies {props} and adds a something to visually indicate the item is
   * current selected.
   * @param props
   * @param child
   */
  addActiveItemFlag = ({ props, child }) => {
    if (this.props.activeClass) {
      props.className = child.props.className || '';
      props.className = `${props.className} ${this.props.activeClass}`;
    }
    else {
      props.isActive = true;
    }
  };

  makeChildrenSelectable = ({ children }) => {
    return React.Children.map(children, child => {
      const { activeItem } = this.state;
      if (React.isValidElement(child)) {
        const props = {};
        if (child.props.selectable) {
          if (this.listLength === activeItem) {
            this.addActiveItemFlag({ props, child });
            this.activeChildCallback = child.props.onClick;
          }
          this.listLength++;
        }

        // Recursively make children selectable.
        if (this.props.recursive) {
          // const subChildren = React.Children.toArray(child.props.children);
          const subChildren = React.Children.toArray(child.props.children);
          if (subChildren.length > 0) {
            const nestedChildren = this.makeChildrenSelectable({
              children: child.props.children,
            });
            return React.cloneElement(child, props, nestedChildren);
          }
        }

        return React.cloneElement(child, props);
      }
      // Things like strings are not considered 'valid'; we simply pass
      // those through.
      return child;
    });
  };

  render() {
    if (!this.props.children) {
      return null;
    }
    // Extract components from this.props.children so that we may add more
    // props to them.
    this.listLength = 0;
    return this.makeChildrenSelectable({
      children: this.props.children,
    });
  }
}
