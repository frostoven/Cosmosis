import PropTypes from 'prop-types';

// Standard menu prop types.
export const defaultMenuPropTypes = {
  registerInputListener: PropTypes.func.isRequired,
  deregisterInputListener: PropTypes.func.isRequired,
  registerMenuChangeListener: PropTypes.func.isRequired,
  deregisterMenuChangeListener: PropTypes.func.isRequired,
  changeMenu: PropTypes.func.isRequired,
  changeMenuFn: PropTypes.func.isRequired,
};

// Standard menu props.
export const defaultMenuProps = {
};

export const preventInvisibleRender = function shouldComponentUpdate(nextProps, nextState) {
  if (!this.state.isVisible && !nextState.isVisible) {
    return false;
  }
  return true;
};
