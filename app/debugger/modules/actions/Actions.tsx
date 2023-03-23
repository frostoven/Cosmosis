import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Icon } from 'semantic-ui-react';
import { CosmDbgRootUtils } from '../../components/interfaces/CosmDbgRootUtils';
import userProfile from '../../../userProfile';

interface RootUtils extends CosmDbgRootUtils {
  rootState: {
  }
}

export default class Actions extends React.Component<{ rootUtils: RootUtils }> {
  static propTypes = { rootUtils: PropTypes.any };

  openProfileDir = () => {
    userProfile.navigateToDataDir();
  };

  reloadApplication = () => {
    // @ts-ignore
    chrome.tabs.reload();
  };

  render() {
    return (
      <div>
        {/* @ts-ignore */}
        <Form>
          <Form.Field>
            <label>Opens the user profile directory</label>
            <Button fluid onClick={this.openProfileDir}>Open profile directory</Button>
          </Form.Field>
          <Form.Field>
            <label>Soft reload (same thing HMR does)</label>
            <Button fluid onClick={this.reloadApplication}>Reload application</Button>
          </Form.Field>
        </Form>
      </div>
    );
  }
}
