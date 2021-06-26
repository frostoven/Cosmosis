import React from 'react';
// import PropTypes from 'prop-types';
import { Button, Checkbox, Dropdown, Grid, Segment } from 'semantic-ui-react';

import { getUiEmitter } from '../emitters';
import { keySchema } from '../local/controls';

const uiEmitter = getUiEmitter();

export default class UiDemo extends React.Component {
  static propTypes = {
    // visible: PropTypes.bool.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  componentDidMount() {
    this.registerListeners();
  }

  componentWillUnmount() {
    this.deregisterListeners();
  }

  registerListeners = () => {
    const actions = keySchema.gameMenu;
    for (let i = 0, len = actions.length; i < len; i++) {
      uiEmitter.on(actions[i], this.handlePress);
    }
  };

  deregisterListeners = () => {
    const actions = keySchema.gameMenu;
    for (let i = 0, len = actions.length; i < len; i++) {
      uiEmitter.removeListener(actions[i], this.handlePress);
    }
  };

  handlePress = ({ action, isDown }) => {
    const fn = this.controls[action];
    if (fn) {
      fn({ isDown });
    }
  };

  controls = {
    back: ({ isDown }) => {
      if (isDown) {
        const visible = !this.state.visible;
        this.setState({ visible });
        if (visible) {
          $game.ptrLockControls.unlock();
        }
        else {
          $game.ptrLockControls.lock();
        }
      }
    },
  };

  render() {
    if (!this.state.visible) {
      return null;
    }

    const friendOptions = [
      {
        key: 'Elliot Fu',
        text: 'Elliot Fu',
        value: 'Elliot Fu',
      },
      {
        key: 'Jenny Hess',
        text: 'Jenny Hess',
        value: 'Jenny Hess',
      },
    ]

    return (
      <div className='primary-menu'>
        <Button>Resume</Button><br />
        <Button>Options</Button><br />
        <Button>Opti ertyu iyutyr trons</Button><br />
        <Button><strike>Tutorial</strike></Button><br />
        <Checkbox label='Make my profile visible' /><br />

        <Dropdown
          placeholder='Select Friend'
          fluid
          selection
          options={friendOptions}
        /><br />

        <div class="squaredOne" style={{ whiteSpace: 'nowrap' }}>
          <input type="checkbox" value="None" id="squaredOne" name="check" />
          <label for="squaredOne"></label>
          <div style={{
            marginTop: -15,
            marginLeft: 36,
          }}>
            Some awesome text.
          </div>
        </div><br />

        <Segment>Pellentesque habitant morbi tristique senectus.</Segment><br/>

        <Grid columns='equal'>
          <Grid.Row>
            <Grid.Column>
              <Segment>1</Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>2</Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>3</Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>4</Segment>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Segment>1</Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>2</Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>3</Segment>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Segment>1</Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>2</Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid><br/>


      </div>
    );
  }
}
