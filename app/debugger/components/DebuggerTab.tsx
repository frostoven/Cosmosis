import _ from 'lodash';
import React from 'react';
import { Tab } from 'semantic-ui-react';
import { pluginLoader } from '../../plugins';
import { cosmDbg } from '../index';

const TAB_STYLE = {
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
    this.ref.current.removeEventListener('scroll');
  };

  persistScrollPosition = () => {
    cosmDbg.setOption('tabScrollPosition', {
      x: 0,
      y: this.ref.current.scrollTop,
    });
  };

  render() {
    return (
      // @ts-ignore
      <div ref={this.ref} style={TAB_STYLE}>
        <Tab.Pane>
          {this.props.children}
        </Tab.Pane>
      </div>
    );
  }
}
