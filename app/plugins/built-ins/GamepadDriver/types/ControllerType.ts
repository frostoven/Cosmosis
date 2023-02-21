enum ControllerType {
  unknown,
  gamepad,
  hotas,
  flightStick,
  racingWheel,
}

function guessControllerType(id) {
  // Useful lookup links:
  // https://devicehunt.com/search/type/usb/vendor/044F/device/any
  // https://devicehunt.com/view/type/usb/vendor/046D

  if (typeof id !== 'string') {
    console.warn(`Received controller with weird id (${id}). Assuming gamepad.`);
    return ControllerType.gamepad;
  }

  id = id.toLowerCase();

  if (id.includes('stick')) {
    // Note: Always check for flight sticks because checking for hotas, because
    // some flight sticks include 'HOTAS; in their name. Note that this will
    // also detect 'joystick' - unsure if this is an issue, I'm assuming that
    // behaviour is advantageous.
    return ControllerType.flightStick;
  }

  if (id.includes('hotas' || 'h.o.t.a.s')) {
    // Some devices, such as the Thrustmaster Warthog, literally just calls
    // itself a HOTAS. Very convenient.
    return ControllerType.hotas;
  }

  if (id.includes('wheel')) {
    // I do not have a steering wheel to test, but this site indicates it
    // should catch at least some cases:
    // https://devicehunt.com/view/type/usb/vendor/044F/device/0404
    return ControllerType.racingWheel;
  }

  // For all other cases, just assume it's a gamepad. This will work for Xbox
  // and PlayStation controllers. If it falsely makes more advanced systems
  // gamepads, hopefully users raise an issue about it.
  return ControllerType.gamepad;
}

export {
  ControllerType,
  guessControllerType,
}
