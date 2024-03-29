import _ from 'lodash';
import React from 'react';
import { Tab } from 'semantic-ui-react';
import { pluginLoader } from '../../plugins';
import { cosmDbg } from '../index';
import { HeightSetting } from './types/HeightSetting';

const TAB_STYLE: any = {
  maxHeight: 400,
  overflowX: 'hidden',
  overflowY: 'auto',
};

export default class DebuggerTab extends React.Component<any, any> {
  private readonly ref: React.RefObject<any>;
  private readonly persistAfterDelay: Function;

  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.persistAfterDelay = _.debounce(this.persistScrollPosition, 250);
  }

  componentDidMount() {
    pluginLoader.onLoaded.getOnce(() => {
      this.scrollToLastPosition();
      this.addScrollListener();
    });
  }

  componentWillUnmount() {
    this.removeScrollListener();
  }

  scrollToLastPosition = () => {
    const pos = cosmDbg.getState().tabScrollPosition || { x: 0, y: 0 };
    if (pos.x || pos.y) {
      this.ref.current.scrollTo(pos.x, pos.y);
    }
  };

  addScrollListener = () => {
    this.ref.current.addEventListener('scroll', this.persistAfterDelay);
  };

  removeScrollListener = () => {
    this.ref.current.removeEventListener('scroll', this.persistAfterDelay);
  };

  persistScrollPosition = () => {
    cosmDbg.setOption('tabScrollPosition', {
      x: 0,
      y: this.ref.current.scrollTop,
    });
  };

  render() {
    const tabStyle = { ...TAB_STYLE };
    if (cosmDbg.getState().uiState?.modalSize === HeightSetting.large) {
      tabStyle.height = window.innerHeight - 79;
      tabStyle.maxHeight = tabStyle.height;
    }

    return (
      // @ts-ignore
      <div ref={this.ref} style={tabStyle}>
        <Tab.Pane>
          {this.props.children}
        </Tab.Pane>
      </div>
    );
  }
}
