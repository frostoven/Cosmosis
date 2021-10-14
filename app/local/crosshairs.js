import AssetFinder from "./AssetFinder";

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
function createImgTag(name, callback) {
  // const id = image.split('.')[0];
  const img = document.createElement('img');
  img.id = name;
  // img.src = `potatoLqAssets/icons/${name}.png`;
  AssetFinder.getIcon({
    name,
    callback: (error, fileName, dir) => {
      if (error) {
        return console.error(error);
      }
      img.src = `${dir}/${fileName}`;
      callback(null, img);
    }
  });
}

/**
 * @param {HTMLDivElement} element
 */
function loadAllCrosshairImages(element) {
  const keys = Object.keys(tags);
  for (let i = 0, len = keys.length; i < len; i++) {
    const name = keys[i];
    createImgTag(name, (error, tag) => {
      tags[name] = tag;
      element.appendChild(tag);
    });
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
