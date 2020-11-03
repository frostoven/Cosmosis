const tags = {
  aimCenter: null,
  aimDown: null,
  aimFull: null,
  aimLeft: null,
  aimRight: null,
  aimUp: null,
}

/**
 * @param {string} name
 * @returns {HTMLImageElement}
 */
function createImgTag(name) {
  // const id = image.split('.')[0];
  const img = document.createElement('img');
  img.id = name;
  img.src = `potatoLqAssets/icons/${name}.png`;
  return img;
}

/**
 * @param {HTMLDivElement} element
 */
function loadAllCrosshairImages(element) {
  const keys = Object.keys(tags);
  for (let i = 0, len = keys.length; i < len; i++) {
    const name = keys[i];
    const tag = createImgTag(name);
    tags[name] = tag;
    element.appendChild(tag);
  }
}

/**
 * @param {string} id
 * @param {number} opacity
 */
function opacity(id, opacity) {
  /** @type HTMLImageElement */
  const tag = tags[id];
  if (!tag) {
    return console.error(`[crosshairs:opacity] element not cached: [#${id}].`);
  }

  tag.style.opacity = `${opacity}`;
}

export {
  loadAllCrosshairImages,
  opacity,
}
