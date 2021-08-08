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
    // Render prop. Used in multi-nav setups.
    setActiveGroup: PropTypes.func,
    // Used by render props in multi-nav setups.
    restrictToGroup: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ]),
    // Completely disabled input.
    disable: PropTypes.bool,
    // Completely stops all input, including that passed back to the parent.
    // Still sends escape.
    // TODO: probably delete this
    suspendAllInput: PropTypes.bool,
    children: PropTypes.any,
  };

  static defaultProps = {
    direction: MenuNavigation.direction.UpDown,
    onUnhandledInput: ()=>{},
    activeClass: null,
    recursive: true,
    // Render prop. Used in multi-nav setups.
    setActiveGroup: null,
    // Render prop. Used in multi-nav setups.
    restrictToGroup: null,
    disable: false,
    suspendAllInput: false,
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
    this.activeClickCallback = null;
    // TODO: think of a cleaner way of implementing this.
    //  MenuNavigation probably shouldn't be aware of custom callbacks
    //  like this, even if they're menu related.
    this.activeDeleteCallback = null;
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
    if (this.props.suspendAllInput) {
      // If suspendAllInput, completely cock block everything except exiting out.
      if (inputInfo.action === 'back') {
        this.props.onUnhandledInput(inputInfo);
      }
      return;
    }

    if (this.props.disable) {
      // Send all input to parent.
      this.props.onUnhandledInput(inputInfo);
    }

    const { action } = inputInfo;
    const { activeItem } = this.state;
    const { UpDown, LeftRight } = MenuNavigation.direction;

    const isUpDown = this.props.direction === UpDown;
    const isLeftRight = this.props.direction === LeftRight;

    if (activeItem >= this.listLength) {
      // This can happen if the component inherits old state from a previous
      // render.
      return this.setState({ activeItem: this.listLength - 1 });
    }

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
    else if (action === 'delete') {
      return this.handleDelete(inputInfo);
    }
    else {
      this.props.onUnhandledInput(inputInfo)
    }
  };

  handleSelect = ({ action }) => {
    if (this.activeClickCallback) {
      this.activeClickCallback({ action });
    }
  };

  handleDelete = ({ action }) => {
    if (this.activeDeleteCallback) {
      this.activeDeleteCallback({ action });
    }
  };

  /**
   * Modifies {props} and adds a something to visually indicate the item is
   * current selected.
   * @param props
   * @param child
   */
  addActiveItemFlag = ({ props, child }) => {
    // console.log('[MenuNavigation] Marking [', child.props.children, '] active.');
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
      let { activeItem } = this.state;

      if (child.type === MenuNavigation) {
        // Leave child MenuNavigation components to do their own thing.
        return child;
      }

      if (React.isValidElement(child)) {
        const restrictToGroup = this.props.restrictToGroup;
        let childSelectable = child.props.selectable;
        if (restrictToGroup && child.props.group !== restrictToGroup) {
          childSelectable = false;
        }

        const props = {};
        if (childSelectable) {
          if (this.listLength === activeItem) {
            this.addActiveItemFlag({ props, child });
            this.activeClickCallback = child.props.onClick;
            this.activeDeleteCallback = child.props.onDelete;
            if (this.props.setActiveGroup) {
              this.props.setActiveGroup(child.props.group);
            }
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
      console.warn('MenuNavigation received no children.');
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
