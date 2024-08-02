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

const buttonStyle: React.CSSProperties = {
  color: '#000',
  backgroundColor: '#ffc227f7',
  borderRadius: 4,
  border: 'none',
  marginTop: 20,
};

const listStyle: React.CSSProperties = {
  maxHeight: '100%',
  overflowY: 'scroll',
};

const previewStyle: React.CSSProperties = {
  borderLeft: 'thin solid white',
};

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

  componentDidMount() {
    const input = this.props.pluginOptions.getInputBridge();
    input.onAction.getEveryChange(this.handleAction);
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
    }
  };

  state = {
    selectedBody: 0,
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

        <Button fluid style={buttonStyle}>Start Navigation</Button>
      </div>
    );
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
            <GridColumn style={previewStyle}>
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
