import React from 'react';
import { Input, Modal as SemanticModal } from 'semantic-ui-react';
import Button from '../reactExtra/components/KosmButton';

// Unique name used to identify modals.
const thisMenu = 'modal';

export const icons = {
  text: 'pencil alternate',
  number: 'numbered list',
};

let totalInstances = 0;

export default class Modal extends React.Component {
  static captureMode = false;
  static allowExternalListeners = true;

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
  }

  componentWillUnmount() {
    totalInstances--;
    console.warn('Modal component unmounted. This is probably a bug.');
    delete window.$modal;
  }

  _reprocessQueue = () => {
    const modalQueue = this._modalQueue;
    if (!modalQueue.length) {
      // Reset modal to initial state.
      this._hide();
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

  _activateModal = () => {
    this.setState({
      isVisible: true,
    });
  };

  deactivateModal = () => {
    this._modalQueue.shift();
    this._reprocessQueue();
  };

  deactivateByTag = ({ tag }) => {
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
    this._reprocessQueue();
  };

  /**
   * Creates a modal based on the specified options.
   * @param {string|object} options
   * @param {string|JSX.Element} options.header - Title at top of dialog.
   * @param {string|JSX.Element} options.body - The core content.
   * @param {undefined|Object[]} options.actions - Div containing buttons or status info.
   * @param {boolean} [options.unskippable] - If true, dialog cannot be skipped. Avoid where possible.
   * @param {boolean} [options.prioritise] - If true, pushes the dialog to the front. Avoid where possible.
   * @param {undefined|function} options.callback
   * @returns {Modal}
   */
  _show = (
    {
      header='Message', body='', actions,
      unskippable=false, prioritise=false,
      tag, callback=()=>{}
    }
  ) => {
    Modal.allowExternalListeners = false;
    this._registerKeyListeners();
    if (!actions) {
      actions = [
        { name: 'OK', onSelect: () => this.deactivateModal() },
      ];
    }

    this._activateModal();

    const options = {
      header, body, actions, unskippable, prioritise, tag,
      deactivated: false,
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

    return this;
  };

  _hide = () => {
    this._removeKeyListeners();
    Modal.allowExternalListeners = true;
    this.setState({
      isVisible: false,
      currentClosedCount: 0,
      highestRecentCount: 0,
    });
  };

  _registerKeyListeners = () => {
    document.addEventListener('keydown', this.receiveKeyEvent, true);
  };

  _removeKeyListeners = () => {
    document.removeEventListener('keydown', this.receiveKeyEvent, true);
  };

  receiveKeyEvent = (event) => {
    const { code } = event;
    if (!Modal.captureMode) {
      // Capture mode is used by features such as setting key bindings to
      // detect which controls the user wants to map. Unless we're capturing
      // keys, we have no need for special keys, and can allow external
      // listeners such as the input manager plugin to process keys.
      if (code === 'F11' || code === 'F12') {
        Modal.allowExternalListeners = true;
        return;
      }
    }
    Modal.allowExternalListeners = false;

    event.preventDefault();
    if (code === 'Enter') {
      return this._select();
    }

    let selected = this.state.selectionIndex || 0;

    if (code === 'ArrowDown' || code === 'ArrowRight') {
      selected++;
      let length = this._modalQueue[0]?.actions?.length;
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
    const activeModal = this._modalQueue[0] || {};
    if (!activeModal.actions?.length) {
      return;
    }
    const action = activeModal.actions[selected];

    const callback = action.onSelect;
    if (typeof callback === 'function') {
      callback({ selected, ...action });
    }
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
      };
    }
    this._show(options);
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
      };
    }

    if (callback) {
      options.callback = callback;
    }

    if (!options.callback) {
      options.callback = () => console.warn('No callbacks passed to confirm.');
    }

    if (!options.actions) {
      options.actions = [
        {
          name: options.yesText ? options.yesText : 'Yes',
          onSelect: () => {
            this.deactivateModal();
            options.callback(true);
          }
        },
        {
          name: options.noText ? options.noText : 'No',
          onSelect: () => {
            this.deactivateModal();
            options.callback(false);
          }
        },
      ];
    }

    this._show(options);
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
        <div
          {...this.props}
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
        </div>
      </>
    );

    this._show(options);
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
      };
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

    this._show(options);
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
      };
    }

    if (callback) {
      options.callback = callback;
    }

    if (!options.callback) {
      options.callback = () => console.warn('No callbacks passed to confirm.');
    }

    if (!options.actions) {
      const onClick = (text) => {
        this.deactivateModal();
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

    this._show(options);
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

  render() {
    const activeModal = this._modalQueue[0] || {};
    const selected = this.state.selectionIndex || 0;

    const modalCount = this._modalQueue.length;
    let modalCountText = '';
    const { currentClosedCount, highestRecentCount } = this.state;
    if (modalCount > 1 || currentClosedCount > 0) {
      modalCountText = `(${currentClosedCount + 1}/${highestRecentCount}) `;
    }

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
                  halfWide={true}
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
          </div>
        </div>
      </SemanticModal>
    );
  }
}
