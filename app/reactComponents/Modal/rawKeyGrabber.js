import React from 'react';
import MenuNavigation from '../elements/MenuNavigation';
import Button from '../elements/KosmButton';
import { controls, getInverseSchema, invalidateInverseSchemaCache } from '../../local/controls';
import { ContextualInput } from '../../local/contextualInput';

// How the grabber is identified.
const thisMenu = 'modal';

/**
 * Instance to Modal component.
 * @type {null|Modal}
 */
let modalInstance = null;

// Triggered when the grabber is closed.
let onGrabberClose = null;

// Default MenuNavigation props.
const navProps = {
  onUnhandledInput: disclaimInput,
  identifier: thisMenu,
};

// TODO: Remove this once all input types are implemented.
function notYetSupported() {
  $modal.alert({ body: 'Not yet supported', prioritise: true });
}

function disclaimInput(inputInfo) {
  modalInstance.handleInput(inputInfo);
  if (inputInfo.action === 'back' && onGrabberClose) {
    onGrabberClose();
    onGrabberClose = null;
  }
}

// Close the grabber modal.
function closeRawKeyGrabber() {
  ContextualInput.clearRawInputListener();
  disclaimInput({ action: 'back', isDown: true });
}

// Check if requested key/action pair has already been assigned.
function getBindConflict({ newKey, action, sectionName }) {
  const existingMapping = controls[sectionName][newKey];
  if (existingMapping && existingMapping !== action) {
    return existingMapping;
  }
  return '';
}

// Sets a key binding. If the binding already exists, it's replaced. Note that
// uniqueness / replacement exists only within the same modes. For example,
// controls defined in shipPilot mode do not effect controls set in freeCam
// mode.
function setBindingAndClose({ newKey, action, sectionName }) {
  // TODO: replace with profile->file saving mechanism.
  controls[sectionName][newKey] = action;
  // console.log('==> no conflict. save tba. dump:', controls);
  console.log('[setBindingAndClose] saving:', { newKey, action, sectionName });
  invalidateInverseSchemaCache();
  closeRawKeyGrabber();
}

// Show modal that grabs keyboard input.
// TODO: consider renaming this as it's become a bit of a misnomer (grabs mouse, too).
function showKbModal({ control: existingControl, action, sectionName, isExisting }) {
  ContextualInput.setRawInputListener(({ key: newKey, isDown, analogData }) => {
    if (!isDown) {
      return;
    }

    // TODO: cache reverse map and use that to figure out what the 'Escape' button is.
    if (newKey === 'Escape') {
      closeRawKeyGrabber();
      return;
    }

    // Return control back to normal menu flow.
    ContextualInput.clearRawInputListener();

    const conflict = getBindConflict({ newKey, action, sectionName });
    if (conflict) {
      console.log('==> conflicts with:', conflict);
      showKbConflictModal({ newKey, action, conflict, sectionName });
    }
    else {
      // TODO: replace with profile->file saving mechanism.
      setBindingAndClose({ newKey, action, sectionName });
    }
  });

  showKbGrabberModal({ action, isExisting, existingControl });
}

// Show modal that describes key/action conflict.
function showKbConflictModal({ newKey, action, conflict, sectionName }) {
  modalInstance.modifyModal({
    header: <div className='terminal-font'>Conflict</div>,
    body: (
      <div className='terminal-font'>
        |<br/>
        | [{newKey}] is already assigned to another {sectionName} control:<br/>
        > {conflict}<br/>
        |
      </div>
    ),
    actions: (
      <>
        <div className='kosm-wide kosm-inline-block kosm-statusbar-sub'>
          Note: you can use macros if you need to to trigger two or more actions simultaneously.
        </div>
        {/**/}
        <Button selectable onClick={() => setBindingAndClose({
          newKey, action, sectionName,
        })}>
          Remove &lt;{conflict}&gt;
        </Button>
        <Button selectable onClick={closeRawKeyGrabber}>
          Cancel
        </Button>
      </>
    ),
    callback: () => {
      //
    }
  });
}

// Show modal that says "Press key to bind."
function showKbGrabberModal({ action, isExisting, existingControl }) {
  modalInstance.modifyModal({
    header: <div className='terminal-font'>Grabbing keyboard / mouse input...</div>,
    body: (
      <div className='terminal-font'>
        |<br/>
        | Press the key you wish to use for action &lt;{action}&gt;<br/>
        {isExisting ? <>| This will replace: [{existingControl}]<br/></> : ''}
        |
      </div>
    ),
    actions: (
      <div className='kosm-statusbar terminal-font'>
        Press [Escape] to cancel
      </div>
    ),
    callback: () => {
      //
    }
  });
}

// Shows all available input grabbing mechanisms.
export function showRawKeyGrabber(props) {
  const { control, action, sectionName, isExisting, onClose } = props;
  onGrabberClose = onClose;

  // noinspection JSVoidFunctionReturnValueUsed
  modalInstance = $modal.show({
    header: 'Choose input type',
    body: (
      <MenuNavigation {...props} {...navProps}>
        <Button
          selectable wide block
          onClick={e => showKbModal({ control, action, sectionName, isExisting })}
        >Keyboard or mouse button</Button>
        <Button invalid selectable wide block onClick={notYetSupported}>Mouse movement</Button>
        <Button invalid selectable wide block onClick={notYetSupported}>Controller</Button>
      </MenuNavigation>
    ),
    actions: (
      <div className='kosm-statusbar'>
        {isExisting ? `Modifying binding of <${action}>` : `Adding new binding`}<br/>
      </div>
    ),
    callback: () => {
      //
    }
  });
}
