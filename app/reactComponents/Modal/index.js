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
  alert: function() { queueMessage({ type: 'alert', args: arguments }) },
  confirm: function() { queueMessage({ type: 'confirm', args: arguments }) },
  prompt:  function() { queueMessage({ type: 'prompt', args: arguments }) },
};

/* == Duck punching =====  ====================== */

const windowAlert = alert;
const windowConfirm = confirm;
const windowPrompt = prompt;

window.alert = function alert() {
  console.warn('** Please consider using $modal.alert() instead of alert() **');
  return windowAlert(...arguments);
}

window.confirm = function confirm() {
  console.warn('** Please consider using $modal.confirm() instead of confirm() **');
  return windowConfirm(...arguments);
}

window.prompt = function prompt() {
  console.warn('** Please consider using $modal.prompt() instead of prompt() **');
  return windowPrompt(...arguments);
}

/* ======================  ====================== */

export default class Modal extends React.Component {

  static propTypes = defaultMenuPropTypes;
  static defaultProps = defaultMenuProps

  static defaultState = {
    isVisible: false,
    header: '',
    content: '',
    action: '',
  };

  constructor(props) {
    super(props);
    this.state = Modal.defaultState;
    this.currentMenu = null;
  }

  componentDidMount() {
    this.props.registerMenuChangeListener({
      onChange: this.handleMenuChange,
    });

    window.$modal = {
      alert: this.alert,
      confirm: this.confirm,
      prompt: this.prompt,
    }
  }

  componentWillUnmount() {
    console.warn('Modal component unmounted. This is probably a bug.');
    delete window.$modal;

    this.props.deregisterMenuChangeListener({
      onChange: this.handleMenuChange,
    });
  }

  handleMenuChange = ({ next }) => {
    this.currentMenu = next;
  }

  activateModal = () => {
    this.setState({
      isVisible: true,
    });
    // This allows us to receive input without closing existing menus.
    this.props.changeMenu({ next: thisMenu, suppressNotify: true });
  }

  deactivateModal = () => {
    // Reset modal to initial state.
    this.setState(Modal.defaultState);
    // Give input control back to open menu.
    this.props.changeMenu({
      next: this.currentMenu,
      suppressNotify: true,
    });
  }

  /**
   * Creates a modal based on the specified options.
   * @param {string|object} options
   * @param {string|JSX.Element} options.header
   * @param {string|JSX.Element} options.body
   * @param {undefined|JSX.Element} options.actions
   * @param {undefined|function} options.callback
   * @returns {Modal}
   */
  show = ({ header='Message', body='', actions, callback=()=>{} }) => {
    if (!actions) {
      actions = (
        <Button selectable onClick={() => this.deactivateModal()}>
          OK
        </Button>
      );
    }

    this.activateModal();
    this.setState({
      header: <SemanticModal.Header>{header}</SemanticModal.Header>,
      content: <SemanticModal.Content>{body}</SemanticModal.Content>,
      actions: <div className='kosm-modal-actions'>{actions}</div>,
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
          Yes
        </Button>
        <Button selectable onClick={() => {
          this.deactivateModal();
          options.callback(false);
        }}>
          No
        </Button>
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

    contextualInput.ContextualInput.takeFullExclusivity({ mode: 'menuViewer' });
    contextualInput.ContextualInput.blockAction({ action: 'back' });
    if (!options.actions) {
      const onClick = (text) => {
        this.deactivateModal();
        contextualInput.ContextualInput.relinquishFullExclusivity({ mode: 'menuViewer' });
        contextualInput.ContextualInput.unblockAction({ action: 'back' });
        options.callback(text);
      }
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

  render() {
    const animation = this.getAnimation();
    return (
      <SemanticModal
        className={`kosm-modal ${animation}`}
        open={!!this.state.content}
      >
        {this.state.header}
        {/*<MenuNavigation {...this.props}>*/}
          {this.state.content}
        {/*</MenuNavigation>*/}
        <MenuNavigation {...this.props} identifier={thisMenu} onUnhandledInput={this.handleInput} direction={MenuNavigation.direction.LeftRight}>
          {this.state.actions}
        </MenuNavigation>
      </SemanticModal>
    );
  }
}
