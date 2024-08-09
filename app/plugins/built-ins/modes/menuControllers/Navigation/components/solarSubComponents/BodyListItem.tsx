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
  distanceRef: HTMLDivElement | null = null;

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

    const element = this.distanceRef;
    if (!element) {
      return console.error(`Error updating UI nav distance for "${body.name}"`);
    }

    let distanceKm = floor(
      sqrt(body.squareMDistanceFromCamera - body.radiusM) * 0.001,
    );

    if (distanceKm > 10e14) {
      // 105 light years. Unlikely the final game will count such distances as
      // still being in the same system, but we may as well safeguard it.
      element.textContent = 'Out of range';

      if (distanceKm > 10e+17) {
        // This is more than the length of the entire Milky Way. Let's assume
        // the player is cheating, and give them a dn3d-style easter-egg:
        const style = 'color: red; font-variant: small-caps; float:right;';
        element.innerHTML =
          `<sup style="${style} margin-top: -14px;">` +
          'You\'re not supposed to be here' +
          '</sup>' +
          `<sup style="${style} margin-top: -4px;">Aggregate1166877</sup>`;
      }
    }
    else {
      element.textContent = distanceKm.toLocaleString() + ' km';
    }
  };

  autoScrollToHighlighted = (delay = 0) => {
    // The delay is needed when opening the menu from closed state. Scrolling
    // is unfortunately a no-op if we attempt it while the opening animation is
    // still progress, best we can do is wait longer than the animation. The
    // animation is 75ms, so we wait 100ms upon first render.
    setTimeout(() => {
      if (this.props.isActive && this.distanceRef) {
        this.distanceRef.scrollIntoView({
          block: 'nearest',
        });
      }
    }, delay);
  };

  handleDistanceRef = (element: HTMLDivElement) => {
    this.distanceRef = element;
    this.autoScrollToHighlighted(100);
  };

  render() {
    let { body, style, onMouseDown } = this.props;

    if (body.type === 'Moon') {
      style = { ...style, paddingLeft: 32 };
    }
    else if (body.type !== 'Star') {
      style = { ...style, paddingLeft: 16 };
    }

    this.autoScrollToHighlighted();

    return (
      <div onMouseDown={onMouseDown} style={style}>
        <div style={subItemStyle}>{/* Icon here */}</div>
        <div style={subItemStyle}>{body.name}</div>
        <div ref={this.handleDistanceRef} style={distanceStyle}>Distance</div>
      </div>
    );
  }
}

export {
  BodyListItem,
};
