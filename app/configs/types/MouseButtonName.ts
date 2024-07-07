const baseMousePairs = {
  0: 'spMouseLeft',
  1: 'spMouseMiddle',
  2: 'spMouseRight',
};

for (let i = 3; i < 32; i++) {
  // If we call the 4th button spMouse3, people will almost certainly confuse
  // that with middle click. We therefore add +1 to prevent confusion. FPS
  // games tend to count this way as well.
  // Example end results:
  //  * MouseButtonName[0] = 'spMouseLeft';
  //  * MouseButtonName[1] = 'spMouseMiddle';
  //  * MouseButtonName[2] = 'spMouseRight';
  //  * MouseButtonName[3] = 'spMouse4';
  //  * MouseButtonName[31] = 'spMouse32';
  baseMousePairs[i] = `spMouse${i + 1}`;
}

enum MouseButtonName {}

for (let [ prop, val ] of Object.entries(baseMousePairs)) {
  MouseButtonName[prop] = val;
}

enum ScrollName {
  // Negative delta.
  spScrollUp = 'spScrollUp',
  // Positive delta.
  spScrollDown = 'spScrollDown',
  // Negative delta. TODO: test me, didn't have a vertical scroll on-hand.
  spScrollLeft = 'spScrollLeft',
  // Positive delta. TODO: test me, didn't have a vertical scroll on-hand.
  spScrollRight = 'spScrollRight',
}

// Note: Normal mice cannot do this. You'll usually want to use
// scrollDeltaToEnum instead.
function scrollHorizontalDeltaToEnum({ deltaX }: WheelEvent) {
  return deltaX < 0 ? ScrollName.spScrollLeft : ScrollName.spScrollRight;
}

// Mouse scroller wheel drivers usually return a magnitude rather than a simple
// up or down. This converts that magnitude into a simple up/down value.
function scrollDeltaToEnum({ deltaY }: WheelEvent) {
  return deltaY < 0 ? ScrollName.spScrollUp : ScrollName.spScrollDown;
}

// Mouse scroller wheel drivers usually return a magnitude rather than a simple
// up or down. This converts that magnitude into a simple up/down value. If the
// user scrolls in two different directions, this will ignore the direction
// that scrolled the least.
function scrollTouchpadDeltaToEnum(event: WheelEvent) {
  const { deltaX, deltaY } = event;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return scrollHorizontalDeltaToEnum(event);
  }
  else {
    return scrollDeltaToEnum(event);
  }
}

export {
  MouseButtonName,
  ScrollName,
  scrollDeltaToEnum,
  scrollTouchpadDeltaToEnum,
};
