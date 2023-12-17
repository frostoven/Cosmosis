import React from 'react';
import { Icon, Input, Modal as SemanticModal } from 'semantic-ui-react';
import Button from '../reactExtra/components/KosmButton';
import { MoveDown } from '../reactExtra/animations/MoveDown';
import { MoveUp } from '../reactExtra/animations/MoveUp';
import { FadeIn } from "../reactExtra/animations/FadeIn";
import ScrollIntoView from '../reactExtra/components/ScrollIntoView';
import GamepadDriver from '../GamepadDriver';
import { InputType } from '../configs/types/InputTypes';
import { keyTypeIcons } from '../configs/ui';
import {
  MouseButtonName,
  scrollDeltaToEnum,
  ScrollName,
} from '../configs/types/MouseButtonName';

// Unique name used to identify modals.
const thisMenu = 'modal';

export const icons = {
  text: 'pencil alternate',
  number: 'numbered list',
};

let totalInstances = 0;

export default class Modal extends React.Component {
  static keyboardCaptureMode = false;
  static allowExternalListeners = true;

  // How much an axis should change, in percentage from initial position,
  // before it's accepted as a binding.
  static axisDeadzone = 0.2;

  // When a gamepad is captured for the first time, you'll often get a flood of
  // button presses. This number is the amount of time that should pass before
  // we assume the flood has passed.
  static gamepadSpamTimeMs = 40;

  /**
   * To prevent laptop users accidentally scrolling horizontally, we explicitly
   * only allow vertical scrolling. Modders may enable 2-way scrolling like so:
   * @example
   * Modal.scrollDetector = scrollTouchpadDeltaToEnum;
   * @tutorial - Modders will need to override the InputManager class as well.
   * @type {(scrollDelta: number) => ScrollName.spScrollUp | ScrollName.spScrollDown}
   */
  static scrollDetector = scrollDeltaToEnum;

  static defaultState = {
    isVisible: false,
    modalCount: 0,
    currentClosedCount: 0,
    highestRecentCount: 0,
    selectionIndex: 0,
  };

  constructor(props) {
    super(props);
    this.state = Modal.defaultState;
    this._currentMenu = null;
    this._modalQueue = [];
    // Used specifically to listen for the user pressing escape. This is
    // overwritten by buildModal whenever a new dialog is shown.
    this._forceCloseListener = null;
  }

  componentDidMount() {
    if (++totalInstances > 1) {
      console.warn(
        'More than one modal component has been mounted. This will likely ' +
        'cause bugs. Please investigate.'
      );
    }

    // Replace all window.$modal placeholder boot functions with the real, now
    // loaded ones.
    window.$modal = this;
    window.$modal.static = Modal;
  }

  componentWillUnmount() {
    totalInstances--;
    console.warn('Modal component unmounted. This is probably a bug.');
    delete window.$modal;
  }

  _reprocessQueue = (optionalCallback) => {
    const modalQueue = this._modalQueue;
    if (!modalQueue.length) {
      // Reset modal to initial state.
      this._hide(optionalCallback);
    }
    else {
      if (modalQueue[modalQueue.length - 1].deactivated) {
        // This happens if the user requested deactivation by name. Close that
        // modal and move on.
        // Note: This is recursive as deactivateModal calls _reprocessQueue.
        return this.deactivateModal(optionalCallback);
      }

      this.setState({
        modalCount: modalQueue.length,
        currentClosedCount: this.state.currentClosedCount + 1,
      }, optionalCallback);
    }
  };

  _activateModal = () => {
    this.setState({
      isVisible: true,
    });
  };

  deactivateModal = (optionalCallback) => {
    this._modalQueue.shift();
    this._reprocessQueue(optionalCallback);
  };

  deactivateByTag = ({ tag }, optionalCallback) => {
    if (!tag) {
      return console.error('deactivateByTag requires a tag.');
    }

    const queue = this._modalQueue;
    for (let i = 0, len = queue.length; i < len; i++) {
      const modal = queue[i];
      if (modal.tag === tag) {
        modal.deactivated = true;
        break;
      }
    }
    this._reprocessQueue(optionalCallback);
  };

  /**
   * Creates a modal based on the specified options.
   * @param {string|object} options
   * @param {string|JSX.Element} options.header - Title at top of dialog.
   * @param {string|JSX.Element} options.body - The core content.
   * @param {undefined|Object[]} options.actions - Div containing buttons or status info.
   * @param {boolean} [options.unskippable] - If true, dialog cannot be skipped. Avoid where possible.
   * @param {boolean} [options.prioritise] - If true, pushes the dialog to the front. Avoid where possible.
   * @returns {Modal}
   */
  buildModal = (
    {
      header='Message', body='', actions, unskippable=false, prioritise=false,
      tag, inline=false, renderCustomDialog=null, onForceClose=()=>{},
    }
  ) => {
    Modal.allowExternalListeners = false;

    if (onForceClose) {
      this._forceCloseListener = onForceClose;
    }
    else {
      this._forceCloseListener = () => {};
    }

    this._registerKeyListeners();
    if (!actions) {
      actions = [
        { name: 'Close', onSelect: () => this.deactivateModal() },
      ];
    }

    this._activateModal();

    const options = {
      header, body, actions, unskippable, prioritise, tag,
      deactivated: false, inline, renderCustomDialog,
    };

    if (prioritise) {
      this._modalQueue.unshift(options);
    }
    else {
      this._modalQueue.push(options);
    }

    this.setState({
      modalCount: this._modalQueue.length - 1,
      highestRecentCount: this.state.highestRecentCount + 1,
      selectionIndex: 0,
    });
  };

  _hide = (optionalCallback) => {
    this._removeKeyListeners();
    Modal.allowExternalListeners = true;
    Modal.keyboardCaptureMode = false;
    this.setState({
      isVisible: false,
      currentClosedCount: 0,
      highestRecentCount: 0,
    }, optionalCallback);
  };

  _registerKeyListeners = () => {
    document.addEventListener('keydown', this._receiveKeyEvent, true);
  };

  _removeKeyListeners = () => {
    document.removeEventListener('keydown', this._receiveKeyEvent, true);
  };

  _receiveKeyEvent = (event) => {
    const { code } = event;
    if (code === 'Escape') {
      // Hard-quit; 'Escape' means cancel.
      return this.deactivateModal(() => {
        this._forceCloseListener && this._forceCloseListener(null);
      });
    }

    Modal.allowExternalListeners = false;
    if (Modal.keyboardCaptureMode) {
      return;
    }
    else{
      // Capture mode is used by features such as setting key bindings to
      // detect which controls the user wants to map. Unless we're capturing
      // keys, we have no need for special keys, and can allow external
      // listeners such as the input manager plugin to process keys.
      if (code === 'F11' || code === 'F12') {
        Modal.allowExternalListeners = true;
        return;
      }
    }

    event.stopPropagation();

    if (code === 'Enter' || code === 'NumpadEnter') {
      return this._select();
    }

    let selected = this.state.selectionIndex || 0;

    if (code === 'ArrowDown' || code === 'ArrowRight') {
      selected++;
      let length = this.getActiveModal()?.actions?.length;
      if (typeof length !== 'number') {
        length = 1;
      }
      if (selected >= length) {
        selected = length - 1;
      }
      this.setState({ selectionIndex: selected });
    }
    else if (code === 'ArrowUp' || code === 'ArrowLeft') {
      selected--;
      if (selected < 0) {
        selected = 0;
      }
      this.setState({ selectionIndex: selected });
    }
  };

  _select = (selected) => {
    if (typeof selected !== 'number') {
      selected = this.state.selectionIndex || 0;
    }
    const activeModal = this.getActiveModal() || {};
    if (!activeModal.actions?.length) {
      return;
    }
    const action = activeModal.actions[selected];

    const callback = action.onSelect;
    if (typeof callback === 'function') {
      callback({ selected, ...action });
    }
  };

  _getModalCountText() {
    const modalCount = this._modalQueue.length;
    let modalCountText = '';
    const { currentClosedCount, highestRecentCount } = this.state;
    if (modalCount > 1 || currentClosedCount > 0) {
      modalCountText = `(${currentClosedCount + 1}/${highestRecentCount}) `;
    }
    return modalCountText;
  }

  /**
   * Retrieves the active modal from the modal queue.
   * @returns {Object|undefine} The active modal object, or undefined if the
   * queue is empty.
   */
  getActiveModal = () => {
    return this._modalQueue[0];
  };

  /**
   * Backwards compatible with window.alert.
   * @param {string|object} options
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   * @param [optionalCallback]
   */
  alert = (options, optionalCallback) => {
    if (typeof options === 'string') {
      options = {
        body: options,
      };
    }

    if (typeof optionalCallback === 'function' && !options.actions) {
      options.actions = [
        {
          name: 'OK',
          onSelect: () => {
            this.deactivateModal(() => optionalCallback(true));
          }
        },
      ];
    }

    options.onForceClose = optionalCallback;
    this.buildModal(options);
  };

  /**
   * @param {string|object} options
   * @param {undefined|function} [callback] - Optional. Omit if using options.
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   * @param {undefined|string} options.yesText - Text to use for positive button.
   * @param {undefined|string} options.noText - Text to use for negative button.
   */
  confirm = (options, callback) => {
    if (typeof options === 'string') {
      options = {
        body: options,
      };
    }

    if (typeof callback !== 'function') {
      callback = () => console.warn('No callbacks passed to confirm.');
    }

    if (!options.actions) {
      options.actions = [
        {
          name: options.yesText ? options.yesText : 'Yes',
          onSelect: () => {
            this.deactivateModal(() => callback(true));
          }
        },
        {
          name: options.noText ? options.noText : 'No',
          onSelect: () => {
            this.deactivateModal(() => callback(false));
          }
        },
      ];
    }

    options.onForceClose = callback;
    this.buildModal(options);
  };

  /**
   * Asks a question and offers the user with a list of options to select from.
   * Intended to be used in place of dropdowns, which in their standard form
   * are somewhat difficult to get right in a video game context if not using
   * the mouse.
   * @param {object} options
   * @param {string|JSX.Element} options.header
   * @param {undefined|JSX.Element} options.actions
   * @param callback
   */
  buttonPrompt = (options={}, callback) => {
    if (typeof callback !== 'function') {
      callback = () => console.warn('No callbacks passed to buttonPrompt.');
    }

    if (!options.actions) {
      options.actions = [{ name: 'Default', value: 0 }];
    }

    options.actions.forEach((item) => {
      item.onSelect = () => {
        this.deactivateModal(() => callback(item));
      }
    });

    options.inline = true;
    if (typeof options.body !== 'string') {
        options.body = 'Please select an option:';
    }

    options.onForceClose = callback;
    this.buildModal(options);
  };

  /**
   * @param {string|object} options
   * @param {undefined|function} [callback] - Optional. Omit if using options.
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   */
  prompt = (options, callback) => {
    let recordedText = '';

    let question = 'Enter a value:';
    if (typeof options === 'string') {
      question = options;
      options = {};
    }
    else if (typeof options.body === 'string') {
      question = options.body;
    }

    options.body = (
      <div>
        {question}<br/><br/>
        {/* auto focus: */}
        <Input fluid icon={icons.text} focus autoFocus onChange={
          event => {
            recordedText = event.target.value;
            this.setState({ selectionIndex: 0 });
          }
        }/>
      </div>
    );

    if (typeof callback !== 'function') {
      callback = () => console.warn('No callbacks passed to prompt.');
    }

    if (!options.actions) {
      const onClick = (text) => {
        this.deactivateModal(() => callback(text));
      };

      options.actions = [
        {
          name: 'Submit',
          onSelect: () => {
            this.deactivateModal(() => callback(recordedText));
          }
        },
        {
          name: 'Cancel',
          onSelect: () => {
            this.deactivateModal(() => callback(null));
          }
        },
      ];
    }

    options.onForceClose = callback;
    this.buildModal(options);
  };

  /**
   * Shows a list of options to select from.
   * @param {object} options
   * @param {string|JSX.Element} options.header
   * @param {undefined|JSX.Element} options.actions
   * @param {undefined|boolean} options.enableAnimations - Default is true.
   * @param callback
   */
  listPrompt = (options = {}, callback) => {
    if (!options.actions) {
      options.actions = [ { name: 'Close', value: 0 } ];
    }

    if (typeof callback !== 'function') {
      callback = () => console.warn('No callbacks passed to listPrompt.');
    }

    if (typeof options.enableAnimations !== 'boolean') {
      // Being JS based, spring is extremely slow on large sets. Downgrade to
      // no animation unless the user forces a value.
      options.enableAnimations = options.actions < 20;
    }

    for (let i = 0, len = options.actions.length; i < len; i++) {
      const action = options.actions[i];
      action.onSelect = () => {
        this.deactivateModal(() => callback(action));
      };
    }

    let lastIndex = this.state.selectionIndex;
    options.renderCustomDialog = () => {
      const actions = options.actions;
      const selectionIndex = this.state.selectionIndex;
      const activeItem = actions[selectionIndex];

      const handleClick = (action) => {
        callback(action);
      };

      let MoveComponent;
      let FadeComponent;
      let moveDistance = null;
      let duration = 75;
      if (options.enableAnimations === false) {
        FadeComponent = (props) => (
          <div
            className='bold-on-hover'
            style={{ display: 'inline-block' }}
            onClick={props.onClick}
          >
            {props.children}
          </div>
        );
        MoveComponent = (props) => (
          <div
            className='bold-on-hover'
            style={{ display: 'block' }}
            onClick={props.onClick}
          >
            {props.children}
          </div>
        );
      }
      else if (lastIndex > selectionIndex) {
        FadeComponent = FadeIn;
        MoveComponent = MoveDown;
        moveDistance = -50;
      }
      else {
        FadeComponent = FadeIn;
        MoveComponent = MoveUp;
        moveDistance = 50;
      }

      const topItems = [];
      const bottomItems = [];

      actions.forEach((action, index) => {
        if (index < selectionIndex) {
          topItems.push(
            <MoveComponent
              className='bold-on-hover'
              key={`listPrompt-${index}`}
              style={{ paddingBottom: 4 }}
              distance={`${moveDistance}%`} duration={duration}
              onClick={() => handleClick(action)}
            >
              {action.name}
            </MoveComponent>,
          );
        }
        else if (index > selectionIndex) {
          bottomItems.push(
            <MoveComponent
              className='bold-on-hover'
              key={`listPrompt-${index}`}
              style={{ paddingTop: 4 }}
              distance={`${moveDistance}%`} duration={duration}
              onClick={() => handleClick(action)}
            >
              {action.name}
            </MoveComponent>,
          );
        }
      });

      const result = (
        <div style={{
          position: 'fixed',
          top: 0, bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.30)',
          overflow: 'auto',
          zIndex: 25,
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            textAlign: 'center',
            width: '100%',
          }}>
            {/*
              * TODO: if / when we invent alien numbers, place them left of
              *  each option, example: n | Option
              */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
                {topItems}
              </div>
            </div>

            <div
              onClick={() => handleClick(action)}
              style={{
                position: 'relative',
                paddingTop: 4,
                paddingBottom: 24,
              }}
            >
              <div style={{
                position: 'absolute',
                width: '100%',
                fontSize: 18,
                fontWeight: 700,
              }}>
                <div style={{
                  display: 'inline-block',
                  transform: 'translateY(-1px)',
                  paddingRight: 16,
                }}>
                  [&nbsp;
                </div>
                <FadeComponent
                  key={Math.random()}
                  duration={duration * 1.25}
                  style={{ display: 'inline-block' }}
                >
                  <MoveComponent
                    key={Math.random()}
                    distance={`${moveDistance * 2}%`}
                    style={{ display: 'inline-block' }}
                    duration={duration}
                  >
                    <div
                      style={{ display: 'inline-block' }}
                    >
                        <ScrollIntoView>{activeItem.name}</ScrollIntoView>
                    </div>
                  </MoveComponent>
                </FadeComponent>
                <div style={{
                  display: 'inline-block',
                  transform: 'translateY(-1px)',
                  paddingLeft: 16,
                }}>
                  &nbsp;]
                </div>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, width: '100%' }}>
                {bottomItems}
              </div>
            </div>

          </div>
        </div>
      );

      lastIndex = selectionIndex;
      return result;
    };

    options.onForceClose = callback;
    this.buildModal(options);
  };

  /**
   * Changes the contents of the modal currently visible.
   * @param modalOptions
   */
  modifyModal = (modalOptions) => {
    if (!this._modalQueue.length) {
      return;
    }
    this._modalQueue[0] = modalOptions;
    this.forceUpdate();
  };

  /**
   * Captures input based on what the user decides they want captured.
   * @param {function|Array|null} [filterOrCallback] - Optional filter.
   * Defaults to all possible actions. If you do not wish to apply a filter,
   * make this your callback function instead.
   * @param {function} [optionalCallback] - Function to be called after capture
   * complete.
   */
  autoInputCapture = (filterOrCallback, optionalCallback) => {
    const keyboardButton = InputType.keyboardButton;
    const gamepadButton = InputType.gamepadButton;
    const gamepadAnalog = InputType.gamepadAxisStandard;
    const mouseAxis = InputType.mouseAxisStandard;
    const mouseButton = InputType.mouseButton;
    const scrollWheel = InputType.scrollWheel;

    const defaultFilter = [
      keyboardButton, gamepadButton, gamepadAnalog, mouseButton, mouseAxis,
      scrollWheel,
    ];

    let filter = null;
    let callback = optionalCallback;
    if (typeof filterOrCallback === 'function' && typeof optionalCallback === 'undefined') {
      callback = filterOrCallback;
      filter = defaultFilter;
    }
    else {
      filter = filterOrCallback;
    }

    if (typeof callback !== 'function') {
      callback = () => console.warn('No callback passed to autoInputCapture');
    }

    if (!Array.isArray(filter)) {
      return console.error('The autoInputCapture filter must be an array.');
    }

    if (!filter.length) {
      filter = defaultFilter;
    }

    const allowScroller = filter.includes(scrollWheel);

    const actions = [];

    filter.includes(keyboardButton) && actions.push(
      {
        name: <><Icon name={keyTypeIcons[keyboardButton]}/> Keyboard Button</>,
        value: keyboardButton,
      }
    );

    filter.includes(gamepadButton) && actions.push(
      {
        name: <><Icon name={keyTypeIcons[gamepadButton]}/> Controller Button</>,
        value: gamepadButton,
      }
    );

    filter.includes(gamepadAnalog) && actions.push(
      {
        name: <><Icon name={keyTypeIcons[gamepadAnalog]}/> Controller Axis</>,
        value: gamepadAnalog,
      }
    );

    filter.includes(mouseAxis) && actions.push(
      {
        name: <><Icon name={keyTypeIcons[mouseAxis]}/> Mouse Axis</>,
        value: mouseAxis,
      }
    );

    filter.includes(mouseButton) && actions.push(
      {
        name: <>
          <Icon name={keyTypeIcons[mouseButton]}/>&nbsp;
          Mouse Button{allowScroller ? ' / Scroll Wheel' : ''}
        </>,
        value: mouseButton,
      }
    );

    $modal.buttonPrompt({
      header: 'Input Capture',
      body: 'Please choose your input type:',
      actions,
    }, (userSelection) => {
      if (userSelection === null) {
        // User pressed Escape. Report as cancellation.
        return callback(null, InputType.none);
      }
      this.deactivateModal(() => {
        const answer = userSelection.value;
        switch (answer) {
          case keyboardButton:
            return this.captureKeyboardKey(callback);
          case gamepadButton:
            return this.captureGamepadButton(callback);
          case gamepadAnalog:
            return this.captureGamepadAxis(callback);
          case mouseAxis:
            return this.captureMouseAxis(callback);
          case mouseButton:
            return this.captureMouseButton({ allowScroller }, callback);
          default:
            console.error('[Modal] Bug detected: unknown value', answer);
        }
      });
    });
  };

  /**
   * Captures a keyboard key, and calls back the result.
   * @param callback
   */
  captureKeyboardKey = (callback) => {
    if (typeof callback !== 'function') {
      callback = () => console.warn('No callback passed to captureKeyboardKey.');
    }

    Modal.keyboardCaptureMode = true;
    this.alert({
      header: 'Grabbing key...',
      body: 'Please press a key on your keyboard.',
      actions: [],
    });

    const captureKey = (event) => {
      event.preventDefault();
      event.stopPropagation();
      document.removeEventListener('keydown', captureKey, true);
      Modal.keyboardCaptureMode = false;
      Modal.allowExternalListeners = true;
      let code = event.code;
      // Never report Escape as a capture; treat it as a cancellation.
      code === 'Escape' && (code = null);
      this.deactivateModal(() => callback(code, InputType.keyboardButton));
    };
    document.addEventListener('keydown', captureKey, true);
  };

  /**
   * Captures a mouse click, and calls back the result.
   * @param optionsOrCallback
   * @param optionsOrCallback.allowScroller {boolean}
   * @param [callback]
   */
  captureMouseButton = (optionsOrCallback, callback) => {
    let options;
    let defaultOptions = { allowScroller: false };
    let defaultCallback = () => console.warn('No callback passed to captureMouseButton.');

    if (typeof optionsOrCallback === 'function') {
      callback = optionsOrCallback;
      options = defaultOptions;
    } else {
      options = optionsOrCallback || defaultOptions;
    }
    callback = callback || defaultCallback;
    const allowScroller = options.allowScroller;

    let scrollSetupComplete = false;
    let type = InputType.mouseButton;
    const mousetrap = React.createRef();

    let header = allowScroller ?
      'Click or Scroll...' :
      'Click the desired mouse button...';

    let bodyText = allowScroller ?
      'Click or scroll in this box:' :
      'Click in this box:';

    const handleClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const button = event.button;
      this.deactivateModal(() => callback(MouseButtonName[button], type));
    };

    const handleScroll = (event) => {
      event.preventDefault();
      event.stopPropagation();
      let code = Modal.scrollDetector(event);
      this.deactivateModal(() => callback(code, type));
    };

    const handleMove = (event) => {
      if (mousetrap.current) {
        const x = event.nativeEvent.offsetX;
        const y = event.nativeEvent.offsetY;
        mousetrap.current.style.backgroundColor =
          `hsl(${133 - x}deg ${15 + y * 0.0001}% ${49 - y * 0.125}%)`;
      }
    };

    const setupScroll = () => {
      if (!allowScroller) {
        return;
      }
      if (!scrollSetupComplete && mousetrap.current) {
        scrollSetupComplete = true;
        mousetrap.current.addEventListener('wheel', handleScroll, {
          passive: false,
        });
      }
    };

    Modal.keyboardCaptureMode = true;
    this.alert({
      header,
      body: (
        <div style={{ textAlign: 'center' }}>
          {bodyText}
          <br/>
          <div
            ref={mousetrap}
            onMouseDown={handleClick}
            onMouseEnter={setupScroll}
            onMouseMove={handleMove}
            style={{
              display: 'inline-block',
              marginTop: 8,
              width: 150,
              height: 150,
              borderRadius: 3,
              border: 'thin solid #3a3a3a',
              backgroundColor: 'grey',
            }}
          />
        </div>
      ),
      actions: [],
    }, () => {
      // If this calls back, then it means the user pressed Escape as that's
      // the only key we should currently be listening for. Send cancellation.
      this.deactivateModal(() => callback(null, InputType.none));
    });
  };

  captureMouseAxis = (callback) => {
    const iconContainer = {
      display: 'inline-block',
      width: 48,
    };

    const axisText = {
      minWidth: 256,
      display: 'inline-block',
      textAlign: 'left',
    };

    const extraInfo = {
      opacity: 0.7,
      paddingLeft: 10,
    };

    this.buttonPrompt({
      body: 'Please select the mouse movement direction:',
      actions: [
        {
          name: (
            <>
              <div style={iconContainer}>
                <Icon name='arrows alternate horizontal'/>
              </div>
              <code style={axisText}>
                Mouse X <i style={extraInfo}>Left-Right; Yaw</i>
              </code>
            </>
          ),
          value: 'spEastWest'
        },
        {
          name: (
            <>
              <div
                style={iconContainer}>
                <Icon name="arrows alternate vertical"/>
              </div>
              <code style={axisText}>
                Mouse Y <i style={extraInfo}>Up-Down; Pitch</i>
              </code>
            </>
          ),
          value: 'spNorthSouth',
        },
      ]
    }, (result) => {
      if (result === null) {
        callback(result, InputType.mouseAxisStandard);
      }
      else {
        callback(result.value, InputType.mouseAxisStandard);
      }
    });
  };

  captureGamepadButton = (callback) => {
    if (typeof callback !== 'function') {
      callback = () => console.warn('No callbacks passed to captureGamepadButton.');
    }

    let keysPressed = [];
    let waitingForButton = true;
    // Used to check for controller-connected spam.
    const modelOpenTime = Date.now();

    this.alert({
      header: 'Grabbing button...',
      body: 'Please press a button on your controller.',
      actions: [],
    }, () => {
      // The only possible code we can receive at this point is Escape. Treat
      // as cancellation.
      waitingForButton = false;
      callback(null, InputType.none);
    });

    const receiveKey = _.debounce(() => {
      if (keysPressed.length === 1) {
        waitingForButton = false;
        this.deactivateModal(() => callback(keysPressed[0], InputType.gamepadButton));
      }
      else if (keysPressed.length > 1) {
        const currentModal = this.getActiveModal();
        currentModal.body = (
          <div>
            <b>Multiple buttons pressed at once. Please try again.</b>
            <br/>
            <br/>
            <i>
              Note that this can happen if your controller was sleeping, and
              does <b>not</b> mean your controller has problems. On H.O.T.A.S.
              devices in particular multiple buttons can be triggered when the
              device is used for the first time since game boot.
            </i>
          </div>
        );
        this.modifyModal(currentModal);
        keysPressed = [];
      }
    }, 150);

    const handler = ({ key, value }) => {
      if (value !== 0) {
        keysPressed.push(key);
        receiveKey();
      }
    };

    const driver = new GamepadDriver({
      onButtonChange: (data) => {
        if (Date.now() - modelOpenTime <= Modal.gamepadSpamTimeMs) {
          // console.log(`[ignoring press; Date.now() - modelOpenTime = ${Date.now() - modelOpenTime}]`);
          // Reset; we received spam due to controller init.
          return keysPressed = [];
        }
        else {
          handler(data);
        }
      },
    });

    const waitForButton = () => {
      if (waitingForButton) {
        requestAnimationFrame(waitForButton);
        driver.step();
      }
    };

    waitForButton();
  };

  captureGamepadAxis = (callback) => {
    if (typeof callback !== 'function') {
      callback = () => console.warn('No callbacks passed to captureGamepadButton.');
    }

    let axesMoved = {};
    let waitingForAxis = true;
    // Used to check for controller-connected spam.
    const modelOpenTime = Date.now();

    this.alert({
      header: 'Grabbing axis...',
      body: 'Please move a stick, rudder, or peddle on your controller.',
      actions: [],
    }, () => {
      // The only possible code we can receive at this point is Escape. Treat
      // as cancellation.
      waitingForAxis = false;
      this.deactivateModal(() => callback(null, InputType.none));
    });

    const handler = ({ key, value }) => {
      if (typeof axesMoved[key] === 'undefined') {
        axesMoved[key] = value;
      }

      const originalValue = axesMoved[key];
      const lower = (Math.min(originalValue, value) + 1) * 0.5;
      let upper = (Math.max(originalValue, value) + 1) * 0.5;
      if (upper === 0) {
        upper = Number.EPSILON;
      }
      const percentage = 1 - Math.abs(lower / upper);
      // console.log(key, { lower, upper, percentage });
      if (percentage > Modal.axisDeadzone) {
        waitingForAxis = false;
        this.deactivateModal(() => callback(key, InputType.gamepadAxisStandard));
      }
    };

    const driver = new GamepadDriver({
      onAxisChange: (data) => {
        if (Date.now() - modelOpenTime <= Modal.gamepadSpamTimeMs) {
          // console.log(`[ignoring axis; Date.now() - modelOpenTime = ${Date.now() - modelOpenTime}]`);
          // Reset; we received spam due to controller init.
          return axesMoved = {};
        }
        else {
          handler(data);
        }
      },
    });

    const waitForButton = () => {
      if (waitingForAxis) {
        requestAnimationFrame(waitForButton);
        driver.step();
      }
    };

    waitForButton();
  };

  render() {
    const activeModal = this.getActiveModal() || {};
    const { inline, renderCustomDialog } = activeModal;

    if (renderCustomDialog) {
      return renderCustomDialog();
    }

    const selected = this.state.selectionIndex || 0;
    const modalCountText = this._getModalCountText();

    return (
      <SemanticModal
        className={`kosm-modal`}
        open={!!this._modalQueue.length}
      >
        <SemanticModal.Header>
          {modalCountText}
          {activeModal.header}
        </SemanticModal.Header>
        <SemanticModal.Content>
            {activeModal.body}
        </SemanticModal.Content>
        <div
          {...this.props}
        >
          <div className='kosm-modal-actions'>
            {activeModal?.actions?.map((menuEntry, index) => {
              return (
                <Button
                  key={`ModalButton-${index}`}
                  isActive={selected === index}
                  halfWide={!inline}
                  wide={inline}
                  block={inline}
                  onClick={() => {
                    this.setState({ selectionIndex: index }, () => {
                      this._select(index);
                    });
                  }}
                >
                  {menuEntry.name}
                </Button>
              )
            })}
            {activeModal?.actions?.length === 0 ? (<><br/><br/></>) : null}
          </div>
        </div>
      </SemanticModal>
    );
  }
}
