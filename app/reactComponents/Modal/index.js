import React from 'react';
import { Input, Modal as SemanticModal } from 'semantic-ui-react';

import Button from '../elements/KosmButton';
import MenuNavigation from '../elements/MenuNavigation';
import { defaultMenuProps, defaultMenuPropTypes } from '../Menu/defaults';
import { getStartupEmitter, startupEvent } from '../../emitters';
import contextualInput from '../../local/contextualInput';

const startupEmitter = getStartupEmitter();

// Unique name used to identify modals.
const thisMenu = 'modal';

export const icons = {
  text: 'pencil alternate',
  number: 'numbered list',
};

// Postpones execution of a message (ex. alert, confirm, prompt, etc.) until
// the react root has mounted.
function queueMessage({ type, args }) {
  startupEmitter.on(startupEvent.menuLoaded, () => {
    $modal[type](...args);
  });
}

// Store modal requests until Modal has mounted.
export const preBootPlaceholder = {
  show: function() { queueMessage({ type: 'show', args: arguments }) },
  alert: function() { queueMessage({ type: 'alert', args: arguments }) },
  confirm: function() { queueMessage({ type: 'confirm', args: arguments }) },
  prompt:  function() { queueMessage({ type: 'prompt', args: arguments }) },
  listPrompt:  function() { queueMessage({ type: 'listPrompt', args: arguments }) },
  buttonPrompt:  function() { queueMessage({ type: 'buttonPrompt', args: arguments }) },
  deactivateByTag:  function() { queueMessage({ type: 'deactivateByTag', args: arguments }) },
};

/* == Duck punching =====  ====================== */

const windowAlert = alert;
const windowConfirm = confirm;
const windowPrompt = prompt;

window.alert = function alert() {
  console.warn('** Please consider using $modal.alert() instead of alert() **');
  return windowAlert(...arguments);
};

window.confirm = function confirm() {
  console.warn('** Please consider using $modal.confirm() instead of confirm() **');
  return windowConfirm(...arguments);
};

window.prompt = function prompt() {
  console.warn('** Please consider using $modal.prompt() instead of prompt() **');
  return windowPrompt(...arguments);
};

/* ======================  ====================== */

let totalInstances = 0;

export default class Modal extends React.Component {

  static propTypes = defaultMenuPropTypes;
  static defaultProps = defaultMenuProps;

  static defaultState = {
    isVisible: false,
    modalCount: 0,
    currentClosedCount: 0,
    highestRecentCount: 0,
  };

  constructor(props) {
    super(props);
    this.state = Modal.defaultState;
    this.currentMenu = null;
    this.modalQueue = [];
  }

  componentDidMount() {
    if (++totalInstances > 1) {
      console.warn(
        'More than one modal component has been mounted. This will likely ' +
        'cause bugs. Please investigate.'
      );
    }

    this.props.registerMenuChangeListener({
      onChange: this.handleMenuChange,
    });

    // Replace all window.$modal placeholder boot functions with the real, now
    // loaded ones.
    window.$modal = {};
    const modalFnNames = Object.keys(preBootPlaceholder);
    for (let i = 0, len = modalFnNames.length; i < len; i++) {
      const fnName = modalFnNames[i];
      window.$modal[fnName] = this[fnName];
    }
  }

  componentWillUnmount() {
    totalInstances--;
    console.warn('Modal component unmounted. This is probably a bug.');
    delete window.$modal;

    this.props.deregisterMenuChangeListener({
      onChange: this.handleMenuChange,
    });
  }

  handleMenuChange = ({ next }) => {
    this.currentMenu = next;
  };

  reprocessQueue = () => {
    const modalQueue = this.modalQueue;
    if (!modalQueue.length) {
      // Reset modal to initial state.
      this.setState({
        isVisible: false,
        currentClosedCount: 0,
        highestRecentCount: 0,
      });
      // Give input control back to open menu.
      this.props.changeMenu({
        next: this.currentMenu,
        suppressNotify: true,
      });
    }
    else {
      if (modalQueue[modalQueue.length - 1].deactivated) {
        // This happens if the user requested deactivation by name. Close that
        // modal and move on.
        return this.deactivateModal();
      }

      this.setState({
        modalCount: modalQueue.length,
        currentClosedCount: this.state.currentClosedCount + 1,
      });
    }
  };

  activateModal = () => {
    this.setState({
      isVisible: true,
    });
    // This allows us to receive input without closing existing menus.
    this.props.changeMenu({ next: thisMenu, suppressNotify: true });
  };

  deactivateModal = () => {
    this.modalQueue.shift();
    this.reprocessQueue();
  };

  deactivateByTag = ({ tag }) => {
    if (!tag) {
      return console.error('deactivateByTag requires a tag.');
    }

    const queue = this.modalQueue;
    for (let i = 0, len = queue.length; i < len; i++) {
      const modal = queue[i];
      if (modal.tag === tag) {
        modal.deactivated = true;
        break;
      }
    }
    this.reprocessQueue();
  };

  /**
   * Creates a modal based on the specified options.
   * @param {string|object} options
   * @param {string|JSX.Element} options.header - Title at top of dialog.
   * @param {string|JSX.Element} options.body - The core content.
   * @param {undefined|JSX.Element} options.actions - Div containing buttons or status info.
   * @param {boolean} [options.unskippable] - If true, dialog cannot be skipped. Avoid where possible.
   * @param {boolean} [options.prioritise] - If true, pushes the dialog to the front. Avoid where possible.
   * @param {undefined|function} options.callback
   * @returns {Modal}
   */
  show = (
    {
      header='Message', body='', actions,
      unskippable=false, prioritise=false,
      tag, callback=()=>{}
    }
  ) => {
    if (!actions) {
      actions = (
        <Button selectable onClick={() => this.deactivateModal()}>
          OK
        </Button>
      );
    }

    this.activateModal();

    const options = {
      header, body, actions, unskippable, prioritise, tag,
      deactivated: false,
    };

    if (prioritise) {
      this.modalQueue.unshift(options);
    }
    else {
      this.modalQueue.push(options);
    }

    this.setState({
      modalCount: this.modalQueue.length - 1,
      highestRecentCount: this.state.highestRecentCount + 1,
    });

    return this;
  };

  /**
   * Backwards compatible with window.alert.
   * @param {string|object} options
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   * @param {undefined|function} options.callback
   */
  alert = (options) => {
    if (typeof options === 'string') {
      options = {
        body: options,
      }
    }
    this.show(options);
  };

  /**
   * @param {string|object} options
   * @param {undefined|function} [callback] - Optional. Omit if using options.
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   * @param {undefined|string} options.yesText - Text to use for positive button.
   * @param {undefined|string} options.noText - Text to use for negative button.
   * @param {undefined|function} options.callback
   */
  confirm = (options, callback) => {
    if (typeof options === 'string') {
      options = {
        body: options,
      }
    }

    if (callback) {
      options.callback = callback;
    }

    if (!options.callback) {
      options.callback = () => console.warn('No callbacks passed to confirm.');
    }

    if (!options.actions) options.actions = (
      <>
        <Button selectable onClick={() => {
          this.deactivateModal();
          options.callback(true);
        }}>
          {options.yesText ? options.yesText : 'Yes'}
        </Button>
        <Button selectable onClick={() => {
          this.deactivateModal();
          options.callback(false);
        }}>
          {options.noText ? options.noText : 'No'}
        </Button>
      </>
    );

    this.show(options);
  };

  /**
   * Asks a question and offers the user with a list of options to select from.
   * Intended to be used in place of dropdowns, which in their standard form
   * are somewhat difficult to get right in a video game context if not using
   * the mouse.
   * @param {object} options
   * @param {string|JSX.Element} options.header
   * @param {[{text: string, value: any}]} options.list
   * @param {undefined|JSX.Element} options.actions
   * @param {undefined|Array} options.buttons - Additional buttons. Simply pass a string array.
   * @param {undefined|function} options.callback
   */
  listPrompt = (options={}) => {
    if (!options.callback) {
      options.callback = () => console.warn('No callbacks passed to listPrompt.');
    }

    if (!options.actions) {
      options.actions = <div>&nbsp;</div>;
    }

    if (!options.list) {
      options.list = [{ text: 'Default', value: 0 }];
    }

    const btnProps = {
      selectable: true,
      block: true,
      wide: true,
      autoScroll: true,
    };

    options.body = (
      <>
        <MenuNavigation
          {...this.props}
          identifier={thisMenu}
          onUnhandledInput={this.handleInput}
        >
          {
            options.list.map(item =>
              <Button key={`listPrompt-${item.text}`} {...btnProps} selectable onClick={() => {
                this.deactivateModal();
                options.callback(item);
              }}
              >
                {item.text}
              </Button>
            )
          }
        </MenuNavigation>
      </>
    );

    this.show(options);
  };

  /**
   * Asks a question and offers the user a bunch of buttons to click at the
   * bottom of the modal.
   * @param {string|object} options
   * @param {undefined|function} [callback] - Optional. Omit if using options.
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   * @param {undefined|Array} options.buttons - Additional buttons. Simply pass a string array.
   * @param {undefined|function} options.callback
   */
  buttonPrompt = (options, callback) => {
    if (typeof options === 'string') {
      options = {
        body: options,
      }
    }

    if (callback) {
      options.callback = callback;
    }

    if (!options.callback) {
      options.callback = () => console.warn('No callbacks passed to buttonPrompt.');
    }

    if (!options.actions) options.actions = (
      <>
        {
          options.buttons ? (
            options.buttons.map(text =>
              <Button key={`buttonPrompt-${text}`} selectable onClick={() => {
                this.deactivateModal();
                options.callback(text);
              }}
              >
                {text}
              </Button>
            )
          ) : null
        }
      </>
    );

    this.show(options);
  };

  /**
   * @param {string|object} options
   * @param {undefined|function} [callback] - Optional. Omit if using options.
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   * @param {undefined|function} options.callback
   */
  prompt = (options, callback) => {
    let recordedText = '';
    if (typeof options === 'string') {
      options = {
        body: (
          <div>
            {options}<br /><br />
            {/* auto focus: */}
            <Input fluid icon={icons.text} focus autoFocus onChange={
              event => { recordedText = event.target.value; }
            }/>
          </div>
        ),
      }
    }

    if (callback) {
      options.callback = callback;
    }

    if (!options.callback) {
      options.callback = () => console.warn('No callbacks passed to confirm.');
    }

    // Block input for everything else.
    contextualInput.ContextualInput.takeFullExclusivity({ mode: 'menuViewer' });
    // Allow browser to respond to events - means we don't have to worry about
    // how text gets into the input.
    contextualInput.ContextualInput.enableBubbling();
    // Prevent backspace from exiting our dialog.
    contextualInput.ContextualInput.blockAction({ action: 'back' });
    if (!options.actions) {
      const onClick = (text) => {
        this.deactivateModal();
        contextualInput.ContextualInput.relinquishFullExclusivity({ mode: 'menuViewer' });
        contextualInput.ContextualInput.unblockAction({ action: 'back' });
        contextualInput.ContextualInput.disableBubbling();
        options.callback(text);
      };
      options.actions = (
        <>
          <Button selectable onClick={() => onClick(recordedText)}>
            Submit
          </Button>
          <Button selectable onClick={() => onClick(null)}>
            Cancel
          </Button>
        </>
      );
    }

    this.show(options);
  };

  getAnimation = (reverse = false) => {
    if (this.state.isVisible) {
      return 'fadeIn'
    } else {
      return 'fadeOut';
    }
  };

  handleInput = ({ action }) => {
    switch (action) {
      case 'back':
        return this.deactivateModal();
    }
  };

  /**
   * Changes the contents of the modal currently visible.
   * @param modalOptions
   */
  modifyModal = (modalOptions) => {
    if (!this.modalQueue.length) {
      return;
    }
    this.modalQueue[0] = modalOptions;
    this.forceUpdate();
  };

  render() {
    const activeModal = this.modalQueue[0] || {};

    const modalCount = this.modalQueue.length;
    let modalCountText = '';
    const { currentClosedCount, highestRecentCount } = this.state;
    if (modalCount > 1 || currentClosedCount > 0) {
      modalCountText = `(${currentClosedCount + 1}/${highestRecentCount}) `;
    }

    const animation = this.getAnimation();
    return (
      <SemanticModal
        className={`kosm-modal ${animation}`}
        open={!!this.modalQueue.length}
      >
        <SemanticModal.Header>
          {modalCountText}
          {activeModal.header}
        </SemanticModal.Header>
        <SemanticModal.Content>
          {/*<MenuNavigation {...this.props}>*/}
            {activeModal.body}
          {/*</MenuNavigation>*/}
        </SemanticModal.Content>
        <MenuNavigation
          {...this.props}
          identifier={thisMenu}
          onUnhandledInput={this.handleInput}
          direction={MenuNavigation.direction.LeftRight}
        >
          <div className='kosm-modal-actions'>
            {activeModal.actions}
          </div>
        </MenuNavigation>
      </SemanticModal>
    );
  }
}
