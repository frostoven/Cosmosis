/**
 * If passed as a ref to an element, causes the browser to scroll to that
 * element. See KosmButton for example usage.
 * @param ref
 */
const scrollIntoView = (ref) => {
  if (ref) {
    // Note: please do not use `behavior: 'smooth'` as it's buggy and sometimes
    // doesn't scroll at all.
    ref.scrollIntoView({ block: 'center', inline: 'center' });
  }
};

export default scrollIntoView;
