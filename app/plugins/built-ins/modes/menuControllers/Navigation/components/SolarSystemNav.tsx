import React from 'react';
import { Grid, GridColumn, GridRow } from 'semantic-ui-react';

const containerStyle: React.CSSProperties = {
  height: '95%',
};

const gridStyle: React.CSSProperties = {
  height: '100%',
};

class SolarSystemNav extends React.Component {
  render() {
    return (
      <div style={containerStyle}>
        <b>Current System Name Here</b>
        <Grid columns={2} style={gridStyle}>
          <GridRow>
            <GridColumn>
              Col1
            </GridColumn>
            <GridColumn style={{ borderLeft: 'thin solid white' }}>
              Col2
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
