const _ = require('lodash');
import React from 'react';
import PropTypes from 'prop-types';

import { controls, keymapFriendlyName } from '../local/controls';
import { spacedTitled } from '../local/utils';

export default class ControlsMenuReadOnly extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  static propTypes = {
    visible: PropTypes.bool.isRequired,
  };
  static defaultProps = {};

  buildView = () => {
    // All controls page
    let allControls = [];
    _.each(controls, (modeKeys, modeName) => {
      allControls.push(<h3 key={`${modeName}-header`}>${spacedTitled(modeName)}</h3>);
      const rows = [];
      _.each(modeKeys, (key, action) => {
        if (action === '_description') {
            rows.push(<tr key={action}><td><b>Description</b></td><td><b>${key}</b></td></tr>);
        }
        else {
            rows.push(<tr key={action}><td>${keymapFriendlyName(action)}</td><td>${spacedTitled(key)}</td></tr>);
        }
      });
      allControls.push(
        <table key={modeName}>
          <tbody>
            {rows}
          </tbody>
        </table>
      );
    });
    return allControls;
  }

  render() {
    if (!this.props.visible) {
      return null;
    }

    return (
      <div className='controls-menu-read-only'>
        {this.buildView()}
      </div>
    );
  }
}
