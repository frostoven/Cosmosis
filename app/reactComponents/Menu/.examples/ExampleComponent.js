import React from 'react';
import PropTypes from 'prop-types';

export default class ExampleComponent extends React.Component {

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
    this.state = ExampleComponent.defaultState;
  }

  render() {
    return (
      <div>
        ExampleComponent.
        <br/>
        ExampleComponent prop: {this.props.example}
        <br/>
        ExampleComponent state value: {this.state.someVar}
      </div>
    );
  }
}
