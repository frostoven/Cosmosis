import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'semantic-ui-react';
import { CosmDbgRootUtils } from '../../components/interfaces/CosmDbgRootUtils';

export default class Settings extends React.Component<{ rootUtils: CosmDbgRootUtils }> {
  static propTypes = { rootUtils: PropTypes.any };

  handleReset = () => {
    this.props.rootUtils.resetPersistentState();
  };

  render() {
    return (
      <div>
        <Button fluid onClick={this.handleReset}>Reset</Button>
      </div>
    );
  }
}
