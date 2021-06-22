import React from 'react';
import { Button, Grid } from 'semantic-ui-react';

import { getUiEmitter } from '../emitters';

const uiEmitter = getUiEmitter();

export default class GalaxyMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Used directly by CSS.
      isVisible: false,
    };
  }

  showMenu = () => {
    $game.ptrLockControls.unlock();
    this.setState({ isVisible: true });
  }

  resume = () => {
    $game.ptrLockControls.lock();
    this.setState({ isVisible: false });
  };

  /**
   * @param {string} key
   * @param {array} columnItems
   */
  generateRow = (key, columnItems=[]) => {
    const result = [];
    for (let i = 0, len = columnItems.length; i < len; i++) {
      const colKey = `${key}${i}`;
      const col = columnItems[i];
      if (!col) {
        // Empty string, or null.
        result.push(<Grid.Column key={colKey}>&nbsp;</Grid.Column>);
      }
      else {
        result.push(<Grid.Column key={colKey}>{col}</Grid.Column>);
      }
    }
    return (
      <Grid.Row key={key}>
        {result}
      </Grid.Row>
    )
  };

  genButton = (name, onClick) => {
    return <Button className='button-fill-parent' onClick={onClick}>{name}</Button>
  };

  getVisibilityAnimation = () => {
    if (this.state.isVisible) {
      return 'fadeInDown';
    }
    else {
      return 'fadeOutDown';
    }
  };

  render() {
    // if (!this.state.visible) {
    //   return null;
    // }

    const animation = this.getVisibilityAnimation();

    return (
      <div className={`primary-menu ${animation}`}>

        {/*<KosmButton>Resume</KosmButton>*/}

        {/*<Button onClick={this.resume}>Resume</Button><br />*/}
        {/*<Button>Options</Button><br />*/}
        {/*<Button><strike>Tutorial</strike></Button><br />*/}


        <Grid className='game-menu vertical-center' columns='equal'>
          {this.generateRow(`row${row++}`, ['', 'Under construction', ''])}
        </Grid>

      </div>
    );
  }
}
