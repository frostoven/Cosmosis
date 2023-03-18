import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Icon } from 'semantic-ui-react';
import { CosmDbgRootUtils } from '../../components/interfaces/CosmDbgRootUtils';

interface RootUtils extends CosmDbgRootUtils {
  rootState: {
    hmrEnabled: boolean | undefined,
  }
}

export default class Actions extends React.Component<{ rootUtils: RootUtils }> {
  static propTypes = { rootUtils: PropTypes.any };

  componentDidMount() {
    // @ts-ignore
    window.hmrEnabled = this.props.rootUtils.rootState.hmrEnabled;
  }

  toggleHmr = () => {
    const hmrEnabled = !this.props.rootUtils.rootState.hmrEnabled;
    // @ts-ignore
    window.hmrEnabled = hmrEnabled;
    // console.log('[Actions] hmrEnabled:', hmrEnabled);
    this.props.rootUtils.setPersistentState({
      hmrEnabled: hmrEnabled,
    });
  };

  render() {
    const { rootUtils } = this.props;
    const hmrEnabled = rootUtils.rootState.hmrEnabled;

    return (
      <div>
        {/* @ts-ignore */}
        <Form>
          <Form.Field>
            <label>Auto-reload if source code changes</label>
            <Button fluid onClick={this.toggleHmr}>HMR enabled: {hmrEnabled ? 'yes' : 'no'}</Button>
          </Form.Field>
        </Form>
      </div>
    );
  }
}
