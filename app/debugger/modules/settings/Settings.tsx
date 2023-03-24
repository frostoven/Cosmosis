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

const defaultPosition = 'left';
const angleKeys = Object.keys(arrowAngle);

interface RootUtils extends CosmDbgRootUtils {
  rootState: {
    settingsDefaultPosition: string,
    allowDragging: boolean,
    hmrDisabled: boolean | undefined,
  }
}

export default class Settings extends React.Component<{ rootUtils: RootUtils }> {
  static propTypes = { rootUtils: PropTypes.any };

  componentDidMount() {
    // TODO: have a look at adding to a different boot mechanism; this function
    //  is only called if the settings tab is opened, meaning HMR settings are
    //  not applied when booting with other tabs active.
    this.applyHmr();
  }

  componentWillUnmount() {
    if (this.props.rootUtils.rootState.hmrDisabled) {
      // This is here because of current difficulties in consistently applying
      // this on start-up.
      // @ts-ignore
      window.hmrDisabled = false;
      console.log('[Settings] HMR now re-enabled.');
      this.props.rootUtils.setPersistentState({
        hmrDisabled: false,
      });
    }
  }

  // Resets all UI state.
  handleReset = () => {
    this.props.rootUtils.resetPersistentState(() => {
      // @ts-ignore
      window.hmrDisabled = false;
    });
  };

  cycleDefaultPosition = () => {
    const { rootUtils: { rootState: { settingsDefaultPosition } } } = this.props;
    let currentSetting = settingsDefaultPosition || defaultPosition;

    const keyIndex = angleKeys.indexOf(currentSetting);

    const newPosition = angleKeys[(keyIndex + 1) % angleKeys.length];
    this.props.rootUtils.setPersistentState({
      settingsDefaultPosition: newPosition
    });
  };

  toggleDebuggerDragging = () => {
    this.props.rootUtils.setPersistentState({
      allowDragging: !this.props.rootUtils.rootState.allowDragging,
    });
  };

  toggleHmr = () => {
    // @ts-ignore
    const newSetting = !window.hmrDisabled;
    console.log('[Settings] hmrDisabled:', newSetting);
    this.props.rootUtils.setPersistentState({
      hmrDisabled: newSetting,
    }, (newState) => {
      this.applyHmr();
    });
  };

  applyHmr = () => {
    // @ts-ignore - variable does indeed exist on window. A relic from when
    // there was no debug window.
    window.hmrDisabled = !!this.props.rootUtils.rootState.hmrDisabled;
  };

  render() {
    const { rootUtils } = this.props;

    // Boot-time window position.
    const currentSetting = rootUtils.rootState.settingsDefaultPosition || defaultPosition;
    const defaultPosStyle = { transform: arrowTransform + ' ' + arrowAngle[currentSetting] };

    // Window dragging
    const allowDragging = rootUtils.rootState.allowDragging;

    // Auto-reload on code change.
    const hmrDisabled = !!rootUtils.rootState.hmrDisabled;

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
            <label>If disabled, the debug window cannot be dragged</label>
            <Button fluid onClick={this.toggleDebuggerDragging}>
              Window dragging: {allowDragging ? 'allowed' : 'disabled'}
            </Button>
          </Form.Field>

          <Form.Field>
            <label>Auto-reload if source code changes</label>
            <label>(auto-enabled next change after leaving this tab)</label>
            <Button fluid onClick={this.toggleHmr}>
              HMR enabled: {hmrDisabled ? 'no' : 'yes'}
            </Button>
          </Form.Field>
        </Form>
      </div>
    );
  }
}
