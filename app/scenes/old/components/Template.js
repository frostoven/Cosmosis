import React from 'react';
import PropTypes from 'prop-types';

export default class Template extends React.Component {

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
    this.state = Template.defaultState;
  }

  render() {
    return (
      <div>
        Template component.
        <br/>
        Example prop: {this.props.example}
        <br/>
        Example state value: {this.state.someVar}
      </div>
    );
  }
}
