import React from 'react';
import {
  LargeGravitationalSource,
} from '../../../../../../../celestialBodies/LargeGravitationalSource';
import Core from '../../../../../Core';
import PluginCacheTracker
  from '../../../../../../../emitters/PluginCacheTracker';

const { round, sqrt } = Math;

// How many frames to skip when the body is far away.
const FRAME_SKIP = 3;
// How many frames to skip when the body is nearby.
const FRAME_SKIP_NEAR = 1;

const subItemStyle: React.CSSProperties = {
  display: 'inline-block',
};

const distanceStyle: React.CSSProperties = {
  ...subItemStyle,
  float: 'right',
};

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  core: Core,
};
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------

interface Props {
  initialFrameSkip: number,
  body: LargeGravitationalSource,
  style: React.CSSProperties,
}

interface State {
  // key: type,
}

class BodyListItem extends React.Component<Props, State> {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  private _nextTick: number;
  private _previousDistance: number = Infinity;
  distanceRef: React.RefObject<HTMLDivElement> = React.createRef();

  state = {
    // key: value,
  };

  constructor(props: Props | Readonly<Props>) {
    super(props);
    this._nextTick = props.initialFrameSkip;
  }

  // constructor(props: Props | Readonly<Props>) {
  //   super(props);
  // }

  componentDidMount() {
    this._pluginCache.core.appendRenderHook(this.refreshData);
  }

  componentWillUnmount() {
    this._pluginCache.core.removeRenderHook(this.refreshData);
  }

  refreshData = () => {
    if (this._nextTick-- > 0) {
      return;
    }
    this._nextTick = FRAME_SKIP;

    const body = this.props.body;
    const distanceKm = round(sqrt(body.squareMDistanceFromCamera) * 0.001);
    if (this._previousDistance === distanceKm) {
      return;
    }
    this._previousDistance = distanceKm;

    const element = this.distanceRef.current;
    if (!element) {
      return console.error(`Error updating UI nav distance for "${body.name}"`);
    }

    element.textContent = distanceKm.toLocaleString() + ' km';
  };

  render() {
    let { body, style } = this.props;

    if (body.type === 'Moon') {
      style = { ...style, paddingLeft: 32 };
    }
    else if (body.type !== 'Star') {
      style = { ...style, paddingLeft: 16 };
    }

    return (
      <div style={style}>
        <div style={subItemStyle}>{/* Icon here */}</div>
        <div style={subItemStyle}>{body.name}</div>
        <div ref={this.distanceRef} style={distanceStyle}>Distance</div>
      </div>
    );
  }
}

export {
  BodyListItem,
};
