// Dev note: not all these were tested, as I don't own all these devices.
// Confirmed accurate:
// * Xbox 360 Controller (XInput STANDARD GAMEPAD)
// * Sony devices 0268 and 09cc.
const knownGamepadNames = {
  'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0268)': 'Sony Dualshock 3 Controller',
  'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 05c4)': 'Sony Dualshock 4 Controller',
  'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)': 'Sony Dualshock 4 Controller (2nd Gen)',
  'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)': 'Sony DualSense Controller',
  'Xbox 360 Controller (XInput STANDARD GAMEPAD)': 'Xbox 360 Controller',
  'Throttle - HOTAS Warthog (Vendor: 044f Product: 0404)': 'HOTAS Warthog Throttle',
  'Joystick - HOTAS Warthog (Vendor: 044f Product: 0402)': 'HOTAS Warthog Flight Stick',
};

function guessGamepadName(string) {
  if (knownGamepadNames[string]) {
    return knownGamepadNames[string];
  }
  else if (string.includes('Vendor: 054c')) {
    return `[Sony] ${string}`;
  }
  else if (string.includes('Vendor: 045e')) {
    return `[Xbox] ${string}`;
  }
  else {
    return string;
  }
}

// ----------------------------------------------------------------------------

const friendlyButtonNames = {};

// TODO: When showing in the controls menu, add mechanism to surround Xbox
//  buttons in a rounded green box, Sony in blue (or dark grey?), and all other
//  brands in orange.

friendlyButtonNames['Xbox 360 Controller'] = {
  ax0: 'LS Vertical',
  ax1: 'LS Horizontal',
  ax3: 'RS Vertical',
  ax4: 'RS Horizontal',
  //
  bt0: 'A',
  bt1: 'B',
  bt2: 'X',
  bt3: 'Y',
  bt4: 'Left Bumper',
  bt5: 'Right Bumper',
  bt6: 'Left Trigger',
  bt7: 'Right Trigger',
  bt8: 'Back',
  bt9: 'Start',
  bt10: 'Left Stick Button',
  bt11: 'Right Stick Button',
  bt12: 'D-Pad Up',
  bt13: 'D-Pad Down',
  bt14: 'D-Pad Left',
  bt15: 'D-Pad Right',
  bt16: 'Xbox Bt 16',
  bt17: 'Xbox Bt 17',
  bt18: 'Xbox Bt 18',
};
friendlyButtonNames['default'] = friendlyButtonNames['Xbox 360 Controller'];

friendlyButtonNames['Sony Dualshock 3 Controller'] = {
  ax0: 'LS Vertical',
  ax1: 'LS Horizontal',
  ax3: 'RS Vertical',
  ax4: 'RS Horizontal',
  //
  bt0: '✖', // ✖ X ╳
  bt1: '●', // ● O ◯
  bt2: '■', // ■ □ □
  bt3: '▲', // ▲ ∆ △
  bt4: 'L1',
  bt5: 'R1',
  bt6: 'L2',
  bt7: 'R2',
  bt8: 'Select',
  bt9: 'Start',
  bt10: 'L3',
  bt11: 'R3',
  bt12: 'D-Up',
  bt13: 'D-Down',
  bt14: 'D-Left',
  bt15: 'D-Right',
  bt16: 'PlayStation Button',
  bt17: 'DS3 Bt 17',
  bt18: 'DS3 Bt 18',
};

friendlyButtonNames['Sony Dualshock 4 Controller'] = { ...friendlyButtonNames['Sony Dualshock 3 Controller'] };
const ds4 = friendlyButtonNames['Sony Dualshock 4 Controller'];
friendlyButtonNames['Sony Dualshock 4 Controller (2nd Gen)'] = ds4;
ds4.bt8 = 'Share';
ds4.bt9 = 'Options';
ds4.bt17 = 'Touchpad Click';
ds4.bt18 = 'DS4 Bt 18';

friendlyButtonNames['Sony DualSense Controller'] = { ...friendlyButtonNames['Sony Dualshock 3 Controller'] };
const ds5 = friendlyButtonNames['Sony DualSense Controller'];
ds5.bt8 = 'Create';
ds5.bt9 = 'Options';
ds5.bt17 = 'Touchpad Click';
ds5.bt18 = 'DS5 Bt 18';

// Dev note: the manual counts from 1 instead of 0.
friendlyButtonNames['HOTAS Warthog Throttle'] = {
  ha0: 'Slew Control Axis [0]',
  ha1: 'Slew Control Axis [1]',
  ha2: 'Throttle [Right Half]',
  ha5: 'Throttle [Left Half]',
  ha6: 'Throttle [Friction control]',
  ha9: 'Coolie Switch',
  //
  hb0: 'Slew Button',
  //
  hb1: 'MIC Switch [Push]',
  hb2: 'MIC Switch [Up]',
  hb3: 'MIC Switch [Far]',
  hb4: 'MIC Switch [Down]',
  hb5: 'MIC Switch [Near]',
  //
  hb6: 'Speedbrake [Far]',
  hb7: 'Speedbrake [Near]',
  hb8: 'Boat Switch [Far]',
  hb9: 'Boat Switch [Near]',
  hb10: 'China Hat [Far]',
  hb11: 'China Hat [Near]',
  //
  hb12: 'Pinky Switch [Far]',
  hb13: 'Pinky Switch [Near]',
  hb14: 'Red Throttle Button',
  //
  hb15: 'Fuel Flow [Left]',
  hb16: 'Fuel Flow [Right]',
  hb17: 'Engine [Left]',
  hb18: 'Engine [Right]',
  hb19: 'APU Start',
  hb20: 'Landing Gear | WRN',
  //
  hb21: 'Flaps [Up]',
  hb22: 'Flaps [Down]',
  //
  hb23: 'EAC Arm',
  hb24: 'RDR ALTM',
  hb25: 'Autopilot [On/Off]',
  hb26: 'Path [Autopilot]',
  hb27: 'Alt [Autopilot]',
  hb28: 'Park [Right]',
  hb29: 'Park [Left]',
  hb30: 'Ignition [Left]',
  hb31: 'Ignition [Right]',
};

// Dev note: the manual counts from 1 instead of 0.
friendlyButtonNames['HOTAS Warthog Flight Stick'] = {
  fa0: 'Stick [Roll]',
  fa1: 'Stick [Pitch]',
  fa9: 'Trim Switch',
  //
  fb0: 'Gun Trigger (Stage 1)',
  fb1: 'Weapons Release',
  fb2: 'Nosewheel Button',
  fb3: 'Paddle Switch',
  fb4: 'Master Mode Control',
  fb5: 'Gun Trigger (Fire)',
  //
  fb6: 'Target [Up]',
  fb7: 'Target [Right]',
  fb8: 'Target [Down]',
  fb9: 'Target [Left]',
  //
  fb10: 'Data Management [Up]',
  fb11: 'Data Management [Right]',
  fb12: 'Data Management [Down]',
  fb13: 'Data Management [Left]',
  //
  fb14: 'Countermeasures [Far]',
  fb15: 'Countermeasures [Right]',
  fb16: 'Countermeasures [Near]',
  fb17: 'Countermeasures [Left]',
  fb18: 'Countermeasures [Push]',
};

// ----------------------------------------------------------------------------

export {
  knownGamepadNames,
  guessGamepadName,
};
