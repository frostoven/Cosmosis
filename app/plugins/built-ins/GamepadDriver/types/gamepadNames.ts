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

export {
  knownGamepadNames,
  guessGamepadName,
}
