import React from 'react';
import _ from 'lodash';
import { Grid, Icon, Segment } from 'semantic-ui-react';
import Button from '../elements/KosmButton';
import MenuNavigation from '../elements/MenuNavigation';
import { defaultMenuProps, defaultMenuPropTypes } from './defaults';
import { capitaliseFirst } from '../../local/utils';
import {
  controls,
  doublePresses,
  getInverseSchema,
  invalidateInverseSchemaCache,
  keySchema,
} from '../../local/controls';
import { ContextualInput } from '../../local/contextualInput';
import { modeName } from '../../modeControl/reactControllers/menuViewer'
import { showRawKeyGrabber } from '../Modal/rawKeyGrabber';
import userProfile from '../../userProfile';

// Menu's unique name.
const thisMenu = 'controls';

export default class Controls extends React.Component {
  static propTypes = defaultMenuPropTypes;
  static defaultProps = defaultMenuProps;
  static defaultState = {
    isVisible: false,
    restrictToGroup: 1,
  };

  constructor(props) {
    super(props);
    this.state = Controls.defaultState;

    // Debounced by this.setActiveGroup. Used to prevent excessive rerenders
    // when rapidly scrolling through elements.
    this.debouncedRestrictToGroup = null;
    // Used to keep track of how many controls were rebound.
    this.reboundActions = {};
    // Currently used as work-around for a bug. TODO: fix me.
    this.promptingUser = false;
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

  handleMenuChange = ({ next }) => {
    const isVisible = thisMenu === next;
    this.setState({
      isVisible,
    });

    if (isVisible) {
      // TODO: add this to customisation menu.
      $game.ptrLockControls.unlock();
    }
    else {
      // TODO: add this to customisation menu.
      // $game.ptrLockControls.lock();
    }

    return isVisible;
  };

  handleInput = ({ action, metadata }) => {
    switch (action) {
      case 'advanced':
        break;
      case 'back':
        return this.handleBack();
      case 'delete':
        console.log('handleInput delete:', metadata);
        break;
      case 'manageMacros':
        break;
      case 'saveChanges':
        this.saveAndClose();
        break;
    }
  };

  handleBack = () => {
    const amount = Object.keys(this.reboundActions).length;
    if (amount > 0) {
      // FIXME: investigate this. For some reason handleBack is hit twice.
      if (this.promptingUser) {
        return;
      }
      this.promptingUser = true;

      const changes = `change${amount === 1 ? '' : 's'}`;
      $modal.buttonPrompt({
        header: '',
        body: `You have ${amount} unsaved ${changes}.\n\n` +
          'Save before closing?',
        buttons: [ 'Yes', 'No', 'Cancel' ],
        callback: (chosenItem) => {
          this.promptingUser = false;
          this.reboundActions = {};

          if (chosenItem === 'Yes') {
            this.saveAndClose();
          }
          else if (chosenItem === 'No') {
            // Exit out to options.
            this.props.changeMenu({ next: 'options' });
            this.reloadAndClose();
          }
          // Else: cancel and do nothing.
        },
      });
    }
    else {
      // Exit out to options.
      this.props.changeMenu({ next: 'options' });
    }
  };

  // Saves configs to disk and closes the controls menu.
  saveAndClose = () => {
    userProfile.saveActiveConfig({
      identifier: 'controls',
      dump: { controls, doublePresses },
      callback: (error) => {
        invalidateInverseSchemaCache();
        if (error) {
          $modal.alert({
            header: 'Profile not saved',
            body: 'Your controls have been retained in memory, ' +
              'but could not be written to disk. Your changes ' +
              'will be lost if you exit without saving.'
          });
        }
        // Exit out to options.
        this.props.changeMenu({ next: 'options' });
      }
    });
  };

  // Loads configs from disk and closes the controls menu.
  reloadAndClose = () => {
    userProfile.reloadConfigs({
      onComplete: (error) => {
        invalidateInverseSchemaCache();
        if (error) {
          $modal.alert({
            header: 'Error',
            body: 'An error occurred while processing your profile. ' +
              'Please restart the game.',
          });
        }
      }
    });
  };

  deleteBinding = ({ action, control, sectionName }) => {
    this.reboundActions[`${action}-deleted`] = true;
    delete controls[sectionName][control];
    invalidateInverseSchemaCache();
    this.forceUpdate();
  };

  getAnimation = () => {
    if (this.state.isVisible) {
      return 'fadeIn';
    } else {
      return 'fadeOut';
    }
  };

  setActiveGroup = (group) => {
    // To keep thing completely dynamic, MenuNavigation needs to update
    // Controls state exactly once during render. However, this (rightfully)
    // throws errors because the render then isn't pure. Using deferral as
    // temporary work-around.
    // TODO: find a mechanism that doesn't need to update during render, and
    //  delete this block.
    if (!this.debouncedRestrictToGroup) {
      this.debouncedRestrictToGroup = _.debounce((group) => {
        if (this.state.restrictToGroup === group) {
          return;
        }
        this.setState({ restrictToGroup: group });
      }, $options.repeatRate + 30);
    }
    this.debouncedRestrictToGroup(group);
  };

  assignControl = ({ action, sectionName, isExisting=true, control=null }) => {
    if (!sectionName) {
      return console.error('Cannot reassign control that is', sectionName);
    }

    ContextualInput.takeFullExclusivity({ mode: modeName });

    const grabberOptions = {
      ...this.props,
      identifier: thisMenu,
      control, action, sectionName, isExisting,
      onClose: ({ reboundAction }) => {
        this.reboundActions[reboundAction] = true;
        console.log('reboundAction:', reboundAction);
        ContextualInput.relinquishFullExclusivity({ mode: modeName });
      },
    };

    showRawKeyGrabber(grabberOptions);
  };

  prepareLine = ({ actions, inverseSectionSchema, sectionName, key }) => {
    const left = [];
    const right = [];

    _.each(actions, (action) => {
      const bindings = inverseSectionSchema[action];
      const bindingElements = [];
      _.each(bindings, (control) => {
        // Right side buttons; exising controls.
        bindingElements.push(
          <Button
            key={`rbtn-${control}-${key}`}
            selectable
            group={action}
            onClick={() => this.assignControl({ action, control, sectionName })}
            onDelete={() => this.deleteBinding({ action, control, sectionName })} //*bookm*/}
          >{control}</Button>,
        );
      });

      left.push([
        // Left side buttons; control names.
        <Button
          key={`lbtn-${action}-${key}`}
          autoScroll
          selectable
          group={action}
        >{action}</Button>,
        <div key={`lbr-${action}-${key}`} className='kosm-break'/>,
      ]);
      right.push(bindingElements);
      right.push(
        // Right side buttons; adds new control assignment.
        <Button
          className='kosm-btn-plus'
          key={`rbtn-${action}-${key}-plus`}
          selectable
          group={action}
          onClick={() => this.assignControl({ action, sectionName, isExisting: false })}
        ><Icon name='plus' /></Button>,
        // Line break.
        <div key={`rbr-${action}-${key}`} className='kosm-break'/>,
      );
    });

    return { left, right };
  };

  genControls = () => {
    const { inverseActionSchema } = getInverseSchema();

    let childKey = 0;
    const allLeft = [];
    const allRight = [];
    _.each(keySchema, (actions, sectionName) => {
      if (actions.length === 0) {
        return;
      }
      _.each(actions, (/*actionName*/) => {
        // const section = controls[sectionName];
        // console.log(actionName)
      });

      if (controls[sectionName]._options && controls[sectionName]._options.hidden) {
        // If hidden, do not display in controls menu.
        // TODO: decide if we need this. It was implemented to allow something
        //  like "controls.modeName._options.hidden === true" but all menus
        //  using such functionality has since been removed...
        return;
      }

      const rows = this.prepareLine({
        actions,
        inverseSectionSchema: inverseActionSchema[sectionName],
        sectionName,
        key: childKey++,
      });

      allLeft.push([
        <h3 key={`lh3-${actions}-${sectionName}`} className='terminal-font'>{sectionName}</h3>,
        <div key={`lbr-${actions}-${sectionName}`} className='kosm-break'/>,
      ]);

      allLeft.push(rows.left);

      allRight.push([
        <h3 key={`rh3-${actions}-${sectionName}`} className='terminal-font'>--</h3>,
        <div key={`rbr-${actions}-${sectionName}`} className='kosm-break'/>,
      ]);

      allRight.push(rows.right);
    });

    const restrictToGroup = this.state.restrictToGroup;
    const leftRight = MenuNavigation.direction.LeftRight;

    const inputProps = {
      ...this.props, identifier: thisMenu, onUnhandledInput: this.handleInput,
    };

    return ([
      <Grid key='controls-main-grid' className='kosm-collapsed-grid two-part-column'>
        {/*{modeSections}*/}

        {/* Controls for this section.*/}
        <Grid.Row>
          {/* Left side */}
          <Grid.Column width={6}>
            <MenuNavigation {...inputProps} setActiveGroup={this.setActiveGroup}>
              {allLeft}
            </MenuNavigation>
          </Grid.Column>

          {/* Right side */}
          <Grid.Column width={10}>
            <MenuNavigation {...inputProps} restrictToGroup={restrictToGroup} direction={leftRight}>
              {allRight}
            </MenuNavigation>
          </Grid.Column>
        </Grid.Row>
      </Grid>,
    ]);
  };

  render() {
    console.log('** rerendering controls.');
    const animation = this.getAnimation();

    return (
      <div className={`secondary-menu ${animation}`}>
        <div className='game-menu vertical-center horizontal-center'>
          <h1>{capitaliseFirst(thisMenu)}</h1>
          <Segment>
            <div className='twin-segment'>
              <div>
                Controls take immediate effect but are reverted if not saved.
              </div>
              <div>
                <Button invalid selectable>[/] Search</Button>
                &nbsp;|&nbsp;
                <Button invalid selectable>[F4] Filter by type</Button>
              </div>
            </div>
          </Segment>
          {this.genControls()}
        </div>
        <div className='floating-footer terminal-font'>
          {/* TODO: base these on actual controls */}
          {/* TODO: if a particular hotkey has zero bindings, don't show it at all. */}
          [Delete] Remove binding | [F2] Manage macros | [F3] Advanced Options | [F10] Save and exit
        </div>
      </div>
    );
  }
}
