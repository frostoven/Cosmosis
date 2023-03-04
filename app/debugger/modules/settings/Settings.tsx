import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'semantic-ui-react';

export default class Settings extends React.Component<{ rootUtils }> {
  static propTypes = { rootUtils: PropTypes.any };

  handleReset = () => {
    this.props.rootUtils.resetRootState();
  };

  render() {
    return (
      <div>
        <Button fluid onClick={this.handleReset}>Reset</Button>
      </div>
    );
  }
}
