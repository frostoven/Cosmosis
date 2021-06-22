import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button that can be rendered as 'selected' (a.k.a clearly more visible
 * because the player has selected it with the keyboard) or disabled.
 */
export default class KosmButton extends React.Component {

  static propTypes = {
    example: PropTypes.string,
  };

  static defaultProps = {
    example: 'Example string.',
  };

  static defaultState = {
    someVar: 'Some value.',
  };

  constructor(props) {
    super(props);
    this.state = KosmButton.defaultState;
  }

  render() {
    return (
      <div className='ui button'>
        Test
      </div>
    );
  }
}
