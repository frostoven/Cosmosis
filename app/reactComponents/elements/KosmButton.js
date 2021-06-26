import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button that can be rendered as 'selected' (a.k.a clearly more visible
 * because the player has selected it with the keyboard) or disabled.
 */
export default class KosmButton extends React.Component {

  static propTypes = {
    children: PropTypes.any,
    className: PropTypes.any,
    isActive: PropTypes.bool,
    secondary: PropTypes.bool,
    wide: PropTypes.bool,
    block: PropTypes.bool,
    onClick: PropTypes.func,
  };

  static defaultProps = {
    children: null,
    className: '',
    isActive: false,
    secondary: false,
    wide: false,
    block: false,
    onClick: () => {},
  };

  render() {
    let buttonType = this.props.secondary ? 'secondary' : 'primary';
    let gradientClass = this.props.secondary ? 'kosm-gradient-box-secondary' : 'kosm-gradient-box';
    let wide = this.props.wide ? 'kosm-wide' : '';
    let block = this.props.block ? 'kosm-block' : '';
    let invalid = this.props.invalid ? 'kosm-invalid' : '';

    let extraCss = `${wide} ${block} ${invalid}`;

    let className;
    if (this.props.isActive) {
      className = `ui button ${gradientClass} kosm-active-${buttonType}-button ${this.props.className} ${extraCss}`;
    }
    else {
      className = `ui button kosm-inactive-${buttonType}-button ${this.props.className} ${extraCss}`;
    }

    return (
      <div className={className} onClick={this.props.onClick}>
        {this.props.children}
      </div>
    );
  }
}
