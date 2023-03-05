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
  }
}

export default class Settings extends React.Component<{ rootUtils: RootUtils }> {
  static propTypes = { rootUtils: PropTypes.any };

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

  render() {
    const { rootUtils } = this.props;
    const currentSetting = rootUtils.rootState.settingsDefaultPosition || 'topRight';
    const defaultPosStyle = { transform: arrowTransform + ' ' + arrowAngle[currentSetting] };

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
        </Form>
      </div>
    );
  }
}
