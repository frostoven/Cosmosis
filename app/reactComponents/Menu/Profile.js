import React from 'react';
import { capitaliseEachWord } from '../../local/utils';
import Button from '../elements/KosmButton';
import MenuNavigation from '../elements/MenuNavigation';
import { Segment } from 'semantic-ui-react';
import { defaultMenuProps, defaultMenuPropTypes } from './defaults';
import userProfile from '../../userProfile'
import { showRawKeyGrabber } from '../Modal/rawKeyGrabber';
import ModalNavigation from '../elements/ModalNavigation';

// Menu's unique name.
const thisMenu = 'profile';

const defaultBtnProps = {
  selectable: true,
  block: true,
  wide: true,
};

export default class Profile extends React.Component {
  static propTypes = defaultMenuPropTypes;
  static defaultProps = defaultMenuProps;
  static defaultState = {
    isVisible: false,
  };

  constructor(props) {
    super(props);
    this.state = Profile.defaultState;
  }

  componentDidMount() {
    this.props.registerMenuChangeListener({
      onChange: this.handleMenuChange,
    });
  }

  componentWillUnmount() {
    this.props.deregisterMenuChangeListener({
      onChange: this.handleMenuChange,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!this.state.isVisible && !nextState.isVisible) {
      return false;
    }
    return true;
  }

  handleMenuChange = ({ next, previous }) => {
    this.setState({
      isVisible: thisMenu === next,
    });
    return thisMenu === next;
  };

  handleInput = ({ action }) => {
    switch (action) {
      case 'back':
        return this.handleBack();
    }
  };

  handleBack = () => {
    this.props.changeMenu({ next: 'options' });
  };

  // TODO: remove 'reverse'. It's not used anywhere.
  getAnimation = (reverse = false) => {
    if (this.state.isVisible) {
      return 'fadeInUpBig'
    } else {
      return 'fadeOutDownBig';
    }
  };

  showCreateNewProfileModal = () => {
    $modal.prompt('Enter the new profile name:', (profileName) => {
      if (profileName === null) {
        // Do a refresh of the active profile for good measure in case mods did
        // something unexpected.
        this.forceUpdate();
      }
      else {
        userProfile.createProfile({
          profileName,
          // Activate new profile.
          callback: error => error || this.loadProfile({ profileName }),
        });
      }
    });
  };

  loadProfile = ({ profileName }) => {
    // TODO: add toast: profile {name} activated.
    userProfile.setActiveProfile({
      profileName,
      // The update causes a re-read of the active profile, which is not stored
      // in state.
      callback: () => this.forceUpdate(),
    });
  };

  showLoadProfileModal = () => {
    userProfile.getAvailableProfiles({
      callback: (error, { profileNames }) => {
        if (error) {
          $modal.alert('Could not load profile list. Error:', error.toString());
        }
        else {
          const buttons = [];
          for (let i = 0, len = profileNames.length; i < len; i++) {
            const profileName = profileNames[i];
            buttons.push(
              <Button
                {...defaultBtnProps}
                key={`profile-button-${profileName}`}
                onClick={() => {
                  $modal.deactivateByTag({ tag: 'showLoadProfileModal' });
                  this.loadProfile({ profileName });
                }}
              >
                {profileName}
              </Button>
            );
          }

          $modal.show({
            header: 'Load profile',
            tag: 'showLoadProfileModal',
            body: (
              <ModalNavigation {...this.props}>
                {buttons}
              </ModalNavigation>
            ),
            actions: (
              <div>&nbsp;</div>
            ),
          });
        }
      }
    });
  };

  render() {
    const changeMenuFn = this.props.changeMenuFn;
    const animation = this.getAnimation();

    const inputProps = {
      // Inherit listener registration functions from parent.
      ...this.props,
      // This is used as a unique name when registering listeners.
      identifier: thisMenu,
      // This is called if MenuNavigation has no use for some action.
      onUnhandledInput: this.handleInput,
    };

    return (
      <div className={`primary-menu ${animation}`}>
        <div className='game-menu vertical-center horizontal-center'>
          <MenuNavigation {...inputProps}>
            <h1>{capitaliseEachWord(thisMenu)}</h1>
            <Segment>
              Profiles contain all your control bindings, customisations, save game files, etc.<br/>
            </Segment>
            <h3>Active profile: {userProfile.getActiveProfile()}</h3>
            <Button {...defaultBtnProps} onClick={this.showLoadProfileModal}>Load profile</Button>
            <Button {...defaultBtnProps} onClick={this.showCreateNewProfileModal}>Create new profile</Button>
            <Button {...defaultBtnProps} onClick={()=>{}}>Open backup dir</Button>
            <Button {...defaultBtnProps} onClick={()=>{}}>Backups to keep: [n]</Button>
            <Button {...defaultBtnProps} onClick={this.handleBack}>Back</Button>
          </MenuNavigation>
        </div>
      </div>
    );
  }
}
