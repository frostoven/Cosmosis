import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Icon } from 'semantic-ui-react';
import { CosmDbgRootUtils } from '../../components/interfaces/CosmDbgRootUtils';

const arrow = 'long arrow alternate up';
const arrowTransform = 'translateY(2.5px)';
const arrowAngle = {
  top: 'rotate(0deg)',
  topRight: 'rotate(45deg)',
  right: 'rotate(90deg)',
  bottomRight: 'rotate(135deg)',
  bottom: 'rotate(180deg)',
  bottomLeft: 'rotate(225deg)',
  left: 'rotate(270deg)',
  topLeft: 'rotate(315deg)',
};

const angleKeys = Object.keys(arrowAngle);

interface RootUtils extends CosmDbgRootUtils {
  rootState: {
    settingsDefaultPosition: string,
    hmrEnabled: boolean | undefined,
  }
}

export default class Settings extends React.Component<{ rootUtils: RootUtils }> {
  static propTypes = { rootUtils: PropTypes.any };

  componentDidMount() {
    // @ts-ignore
    window.hmrEnabled = this.props.rootUtils.rootState.hmrEnabled;
  }

  handleReset = () => {
    this.props.rootUtils.resetPersistentState();
  };

  cycleDefaultPosition = () => {
    const { rootUtils: { rootState: { settingsDefaultPosition } } } = this.props;
    let currentSetting = settingsDefaultPosition || 'topRight';

    const keyIndex = angleKeys.indexOf(currentSetting);

    const newPosition = angleKeys[(keyIndex + 1) % angleKeys.length];
    this.props.rootUtils.setPersistentState({
      settingsDefaultPosition: newPosition
    });
  };

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

    // Boot-time window position.
    const currentSetting = rootUtils.rootState.settingsDefaultPosition || 'topRight';
    const defaultPosStyle = { transform: arrowTransform + ' ' + arrowAngle[currentSetting] };

    // Auto-reload on code change.
    const hmrEnabled = rootUtils.rootState.hmrEnabled;

    return (
      <div>
        {/* @ts-ignore - doing React in TS was a mistake. */}
        <Form>
          <Form.Field>
            <label>Completely resets the debugger</label>
            <Button fluid onClick={this.handleReset}>Reset</Button>
          </Form.Field>

          <Form.Field>
            <label>Default debugger position on boot</label>
            <Button fluid onClick={this.cycleDefaultPosition}>
              Default position:&nbsp;&nbsp;
              <Icon
                name={arrow}
                style={defaultPosStyle}
              />
            </Button>
          </Form.Field>

          <Form.Field>
            <label>Auto-reload if source code changes</label>
            <Button fluid onClick={this.toggleHmr}>HMR enabled: {hmrEnabled ? 'yes' : 'no'}</Button>
          </Form.Field>
        </Form>
      </div>
    );
  }
}
