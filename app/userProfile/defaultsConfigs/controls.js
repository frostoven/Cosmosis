const config = {
  info: {
    name: 'controls',
    fileName: 'controls.json',
  },
  fileContent: {
    // Use `event.code`. Easy reference: https://keycode.info/
    //
    // Technical terms inside this object:
    // const controls = {
    //   modeName: {
    //     buttonName: 'actionName',
    //   },
    // };
    controls: {
      allModes: {
        // F1: 'showKeyBindings',
      },
      general: {
        _description: 'Controls that may be activated from almost everywhere.',
        F8: '_devChangeCamMode',
        F7: '_devChangeCamMode',
        ControlLeft: 'toggleMousePointer', // a.k.a. PointerLockControls.
        F11: 'toggleFullScreen',
        F12: 'showDevConsole',
      },
      menuViewer: {
        _description: 'The in-game menu.',
        // Note: pressing Escape kills pointer lock. This is a browser security
        // thing and (as far as I know) can't be overridden. May as well run with
        // it and design the UI accordingly.
        Escape: 'back',
        Backspace: 'back',
        Enter: 'select',
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        /* Controls menu */
        Delete: 'delete',
        F2: 'manageMacros',
        F3: 'advanced',
        F10: 'saveChanges',
        Slash: 'search',
      },
      shipPilot: {
        _description: 'Mode used when user is locked to seat.',
        KeyW: 'thrustInc',
        KeyS: 'thrustDec',
        spMouseMiddle: 'toggleMouseSteering',
        Numpad5: 'toggleMouseSteering',
        spScrollUp: 'thrustUp10',
        spScrollDown: 'thrustReset',
        ScrollLock: 'debugFullWarpSpeed',
        KeyA: 'rollLeft',
        KeyD: 'rollRight',
        KeyJ: 'engageHyperdrive',
        KeyG: '_debugGravity',
        spNorth: 'pitchUp',
        spSouth: 'pitchDown',
        spWest: 'yawLeft',
        spEast: 'yawRight',
        KeyZ: 'toggleFlightAssist',
        KeyL: 'cycleInternalLights',
        Numpad0: 'cycleExternalLights',
      },
      freeCam: {
        _description: 'Free flying camera (press F8 to activate).',
        KeyW: 'moveForward',
        ArrowUp: 'moveForward',
        KeyS: 'moveBackward',
        ArrowDown: 'moveBackward',
        Numpad7: 'rollLeft',
        ArrowLeft: 'moveLeft',
        Numpad9: 'rollRight',
        ArrowRight: 'moveRight',
        KeyR: 'moveUp',
        Space: 'moveUp',
        KeyF: 'moveDown',
        KeyA: 'moveLeft',
        KeyD: 'moveRight',
        NumpadAdd: 'speedUp',
        NumpadSubtract: 'speedDown',
        ShiftLeft: 'doubleSpeed',
        ShiftRight: 'doubleSpeed',
        KeyE: 'interact',
        Numpad4: 'turnLeft',
        Numpad6: 'turnRight',
        Numpad8: 'lookUp',
        Numpad2: 'lookDown',
        spNorth: 'pitchUp',
        spSouth: 'pitchDown',
        spWest: 'yawLeft',
        spEast: 'yawRight',
      },
      godCam: {
        _description: 'Celestial god cam.',
        spNorth: 'pitchUp',
        spSouth: 'pitchDown',
        spWest: 'yawLeft',
        spEast: 'yawRight',
        spScrollUp: 'zoomIn',
        spScrollDown: 'zoomOut',
      }
    },

    // Setting that allows the user to force assigning the same key to multiple
    // actions within the same mode.
    // It's niche, but I aim to please, baby.
    // TODO: implement me. #47
    doublePresses: {
      freeCam: [
        'tba', 'tba',
      ]
    },
  },
  alternativeContent: {
    elite: {
      // tba
    },
    'the citizen': {
      // tba
    },
    'flight sim': {
      // tba
    },
    'sky of no man': {
      // so much work ffs.
    },
  },
};

export default config;
