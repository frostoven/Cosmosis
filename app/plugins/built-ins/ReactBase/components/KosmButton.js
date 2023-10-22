import React from 'react';
import PropTypes from 'prop-types';
import scrollIntoView from './scrollIntoView';

/**
 * Button that can be rendered as 'selected' (a.k.a clearly more visible
 * because the player has selected it with the keyboard) or disabled.
 */
export default class KosmButton extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    className: PropTypes.any,
    isActive: PropTypes.bool,
    autoScroll: PropTypes.bool,
    secondary: PropTypes.bool,
    wide: PropTypes.bool,
    block: PropTypes.bool,
    aggressiveOptimisation: PropTypes.bool,
    // If true, uses static borders instead of animated gradients to colour
    // buttons.
    onClick: PropTypes.func,
  };

  static defaultProps = {
    children: null,
    className: '',
    isActive: false,
    autoScroll: false,
    secondary: false,
    wide: false,
    block: false,
    aggressiveOptimisation: true,
    onClick: () => {},
  };

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.previousAnimation = null;
  }

  scrollIntoView = () => {
    if (!this.myRef.current) {
      return;
    }
    this.myRef.current.scrollIntoView();
  };

  shouldComponentUpdate(nextProps) {
    // return true;
    if (nextProps.aggressiveOptimisation) {
      // For our purposes, we never need a rerender unless the CSS class
      // changes. Normally, simply pressing the down arrow to select a new menu
      // item often triggers over 200 renders in large menus such as controls.
      // This optimisation reduces that to a consistent 2 renders and looks
      // identical.
      if (this.previousAnimation === this.getAnimation(nextProps)) {
        return false;
      }
    }
    return true;
  }

  getAnimation = (props) => {
    let buttonType = props.secondary ? 'secondary' : 'primary';
    let gradientClass = props.secondary ? 'kosm-gradient-box-secondary' : 'kosm-gradient-box';
    let wide = props.wide ? 'kosm-wide' : '';
    let block = props.block ? 'kosm-block' : '';
    let invalid = props.invalid ? 'kosm-invalid' : '';

    let extraCss = `${wide} ${block} ${invalid}`;

    let className;
    if (props.isActive) {
      className = `ui button ${gradientClass} kosm-active-${buttonType}-button ${props.className} ${extraCss}`;
    }
    else {
      className = `ui button kosm-inactive-${buttonType}-button ${props.className} ${extraCss}`;
    }

    this.previousAnimation = className;
    return className;
  };

  render() {
    const className = this.getAnimation(this.props);

    if (this.props.isActive && this) {
      this.scrollIntoView();
    }

    let scrollToMe;
    if (this.props.autoScroll && this.props.isActive) {
      scrollToMe = scrollIntoView;
    }

    return (
      <div ref={scrollToMe} className={className} onClick={this.props.onClick}>
        {this.props.children}
      </div>
    );
  }
}
