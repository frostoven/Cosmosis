import * as THREE from 'three';
import React from 'react';
import { Button, Grid, GridColumn, GridRow } from 'semantic-ui-react';
import { Navigation } from '../../../../Navigation';
import PluginCacheTracker from '../../../../../../emitters/PluginCacheTracker';
import {
  RegisteredMenu,
} from '../../../../ReactBase/types/compositionSignatures';
import {
  LargeGravitationalSource,
} from '../../../../../../celestialBodies/LargeGravitationalSource';
import { BodyListItem } from './solarSubComponents/BodyListItem';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

const RAD2DEG = THREE.MathUtils.RAD2DEG;
const { abs, ceil, round } = Math;

const containerStyle: React.CSSProperties = {
  height: '95%',
};

const gridStyle: React.CSSProperties = {
  height: '100%',
};

const rowStyle: React.CSSProperties = {
  maxHeight: '100%',
};

const menuItemStyle = {
  padding: 4,
  marginBottom: 2,
  fontWeight: 'bold',
};

const selectedBodyStyle: React.CSSProperties = {
  ...menuItemStyle,
  color: '#000',
  backgroundColor: '#ffc227f7',
};

const unSelectedBodyStyle: React.CSSProperties = {
  ...menuItemStyle,
  color: '#eeb01c',
  backgroundColor: '#ff3e0029',
};

const buttonStartStyle: React.CSSProperties = {
  color: '#000',
  backgroundColor: '#ffc227f7',
  borderRadius: 4,
  border: 'none',
  marginTop: 20,
};

const buttonEndStyle: React.CSSProperties = {
  ...buttonStartStyle,
  backgroundColor: 'rgba(255,166,166,0.97)',
};

const listStyle: React.CSSProperties = {
  maxHeight: '100%',
  overflowY: 'scroll',
};

interface PlanetTrackingData {
  body: LargeGravitationalSource,
  label: CSS2DObject,
  index: number,
}

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  navigation: Navigation,
};
type Dependencies = typeof pluginDependencies;
const pluginList = Object.keys(pluginDependencies);

// -- ✀ -----------------------------------------------------------------------+

interface Props {
  pluginOptions: RegisteredMenu;
}

interface State {
  selectedBody: number;
}

class SolarSystemNav extends React.Component<Props, State> {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  // noinspection JSMismatchedCollectionQueryUpdate - IDE bug?
  private _bodyCache: LargeGravitationalSource[] = [];
  private static _currentlyTracking: PlanetTrackingData | null = null;

  constructor(props: Props | Readonly<Props>) {
    super(props);
    if (SolarSystemNav._currentlyTracking) {
      this.state.selectedBody = SolarSystemNav._currentlyTracking.index;
    }
  }

  componentDidMount() {
    const input = this.props.pluginOptions.getInputBridge();
    input.onAction.getEveryChange(this.handleAction, true);
  }

  nextOrOverflow = (current: number, maxPlusOne: number, direction = 1) => {
    current += direction;
    maxPlusOne -= 1;
    if (current > maxPlusOne) {
      return 0;
    }
    if (current < 0) {
      return maxPlusOne;
    }
    return current;
  };

  handleAction = (action: string) => {
    const bodies = this._bodyCache;
    const { selectedBody } = this.state;
    switch (action) {
      case 'up':
        return this.setState({
          selectedBody: this.nextOrOverflow(selectedBody, bodies.length, -1),
        });
      case 'down':
        return this.setState({
          selectedBody: this.nextOrOverflow(selectedBody, bodies.length),
        });
      case 'select':
        if (SolarSystemNav._currentlyTracking) {
          console.log('-> end navigation');
          this.endNavigation();
          this.forceUpdate();
        }
        else if (this._bodyCache.length) {
          console.log('-> start navigation');
          const body = this._bodyCache[selectedBody];
          this.startNavigation(body);
          this.forceUpdate();
        }
        else {
          console.log('-> CANNOT START NAV');
        }
    }
  };

  state = {
    selectedBody: 0,
  };

  startNavigation = (body: LargeGravitationalSource) => {
    if (SolarSystemNav._currentlyTracking) {
      this.endNavigation();
    }

    // This div contains our nav labels and images.
    const containerDiv = document.createElement('div');
    containerDiv.className = 'css2d-label-container';

    // Name of the body we're flying to.
    const labelDiv = document.createElement('div');
    labelDiv.className = 'css2d-label';
    labelDiv.style.bottom = '0px';
    labelDiv.textContent = body.name;

    // Distance to the body we're flying to. We use a hook elsewhere in this
    // class to update this on a per-frame basis.
    const distanceDiv = document.createElement('div');
    distanceDiv.className = 'css2d-label';
    distanceDiv.style.top = '0px';
    distanceDiv.textContent = 'Distance';

    // Add our detail divs to the container.
    containerDiv.appendChild(labelDiv);
    containerDiv.appendChild(distanceDiv);

    // Create a three.js object from the container div.
    const container = new CSS2DObject(containerDiv);
    // label.position.set(0, body.radiusM * 10, 0);
    body.sphereMesh.add(container);

    console.log('startNavigation:', {
      selected: this.state.selectedBody,
      body,
    });

    const { selectedBody: index } = this.state;
    SolarSystemNav._currentlyTracking = {
      index, body, label: container,
    };
  };

  endNavigation = () => {
    if (!SolarSystemNav._currentlyTracking) {
      return;
    }

    const { body, label } = SolarSystemNav._currentlyTracking;
    body.sphereMesh.remove(label);
    SolarSystemNav._currentlyTracking = null;
  };

  handleListItemClick = (i) => {
    this.setState({
      selectedBody: i,
    });
  };

  genBodyList = () => {
    const bodies = this._bodyCache;
    if (!bodies.length) {
      return 'System offline.';
    }

    const selectedBody = this.state.selectedBody;
    const jsx: JSX.Element[] = [];
    for (let i = 0, len = bodies.length; i < len; i++) {
      const body = bodies[i];
      let style = selectedBody === i ? selectedBodyStyle : unSelectedBodyStyle;
      jsx.push(
        <BodyListItem
          key={body.name}
          body={body}
          initialFrameSkip={i}
          isActive={selectedBody === i}
          style={style}
          onMouseDown={() => this.handleListItemClick(i)}
        >
          {body.name}
        </BodyListItem>,
      );
    }
    return jsx;
  };

  genBodyDetails = () => {
    const bodies = this._bodyCache;
    const { selectedBody } = this.state;
    const body = bodies[selectedBody];
    let dayLength = round(body.rotationPeriodS * 0.0011574) * 0.01;
    let dayLengthPlural = dayLength === 1 ? 'day' : 'days';
    return (
      <div>
        <h3>{body.name}</h3>
        <div>Mass: {body.massKg} kg</div>
        <div>Diameter: {ceil(body.radiusM * 2 * 0.001).toLocaleString()} km</div>
        <div>Axial Tilt: {(body.axialTilt * RAD2DEG).toFixed(2)}°</div>
        <div>Day Length: {abs(dayLength)} Earth {dayLengthPlural}</div>
        {this.genNavButton(body)}
      </div>
    );
  };

  genNavButton = (body: LargeGravitationalSource) => {
    const trackingThisItem = SolarSystemNav._currentlyTracking?.body === body;
    if (!trackingThisItem) {
      return (
        <Button
          fluid
          onClick={() => {
            this.startNavigation(body);
            this.forceUpdate();
          }}
          style={buttonStartStyle}
        >
          Start Navigation
        </Button>
      );
    }
    else {
      return (
        <Button
          fluid
          onClick={() => {
            this.endNavigation();
            this.forceUpdate();
          }}
          style={buttonEndStyle}
        >
          End Navigation
        </Button>
      );
    }
  };

  render() {
    this._bodyCache = this._pluginCache.navigation.getAllPlanetaryBodies();
    return (
      <div style={containerStyle}>
        <b>System: {this._pluginCache.navigation.getSystemName()}</b>
        <Grid columns={2} style={gridStyle}>
          <GridRow style={rowStyle}>
            <GridColumn style={listStyle}>
              {this.genBodyList()}
            </GridColumn>
            <GridColumn>
              {this.genBodyDetails()}
            </GridColumn>
          </GridRow>
        </Grid>
      </div>
    );
  }
}

export {
  SolarSystemNav,
};
