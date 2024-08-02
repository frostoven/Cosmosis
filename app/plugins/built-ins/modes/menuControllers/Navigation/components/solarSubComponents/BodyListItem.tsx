import React, { MouseEventHandler } from 'react';
import {
  LargeGravitationalSource,
} from '../../../../../../../celestialBodies/LargeGravitationalSource';
import Core from '../../../../../Core';
import PluginCacheTracker
  from '../../../../../../../emitters/PluginCacheTracker';

const { floor, sqrt } = Math;

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
  isActive: boolean,
  body: LargeGravitationalSource,
  style: React.CSSProperties,
  onMouseDown: MouseEventHandler<HTMLDivElement>,
}

class BodyListItem extends React.Component<Props> {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  private _nextTick: number;
  private _previousDistance: number = Infinity;
  distanceRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: Props | Readonly<Props>) {
    super(props);
    this._nextTick = props.initialFrameSkip;
  }

  componentDidMount() {
    this._pluginCache.core.appendRenderHook(this.refreshData);
  }

  componentWillUnmount() {
    this._pluginCache.core.removeRenderHook(this.refreshData);
  }

  shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    // Only rerender if the element's highlighting is no longer valid.
    return nextProps.isActive !== this.props.isActive;
  }

  refreshData = () => {
    if (this._nextTick-- > 0) {
      return;
    }
    this._nextTick = FRAME_SKIP;

    const body = this.props.body;
    const intDistance = floor(body.squareMDistanceFromCamera);
    if (this._previousDistance === intDistance) {
      return;
    }
    this._previousDistance = intDistance;

    const element = this.distanceRef.current;
    if (!element) {
      return console.error(`Error updating UI nav distance for "${body.name}"`);
    }

    const distanceKm = floor(
      sqrt(body.squareMDistanceFromCamera - body.radiusM) * 0.001,
    );
    element.textContent = distanceKm.toLocaleString() + ' km';
  };

  render() {
    let { body, isActive, style, onMouseDown } = this.props;

    if (body.type === 'Moon') {
      style = { ...style, paddingLeft: 32 };
    }
    else if (body.type !== 'Star') {
      style = { ...style, paddingLeft: 16 };
    }

    // Auto-scroll to highlighted menu items.
    if (isActive && this.distanceRef.current) {
      this.distanceRef.current.scrollIntoView({
        block: 'nearest',
      });
    }

    return (
      <div onMouseDown={onMouseDown} style={style}>
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
