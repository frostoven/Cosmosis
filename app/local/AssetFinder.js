// Project resource loader. Figures out file extensions on your behalf, which
// for example means you're allowed to use jpg for one image and png for
// another (useful for dev builds where the size needs to be kept to a
// minimum).
//
// First looks for assets in the production assets directory. If the requested
// asset does not exist, looks for the requested assets in the dev path
// instead. It's recommended the implemented run bootTest() when the
// application starts to look for obvious problems such as no production
// directory existing at all, indicating the user did a clone without obtaining
// the high quality assets.

import { fuzzyFindFile, forEachFn } from "./utils";

const devPath = 'potatoLqAssets';
const prodPath = 'prodHqAssets';

const cachedPaths = {};

const assetDefaults = {
  icons: {
    dir: 'icons',
    extensions: [ 'jpg', 'png', 'gif' ],
  },
  models: {
    dir: 'models',
    extensions: [ 'gltf' ],
  },
  music: {
    dir: 'music',
    extensions: [ 'mp3', 'ogg' ],
  },
  planetImg: {
    dir: 'planetImg',
    extensions: [ 'jpg', 'png', 'gif' ],
  },
  sfx: {
    dir: 'sfx',
    extensions: [ 'mp3', 'ogg' ],
  },
  // skyboxes: {
  //   dir: 'skyboxes',
  //   extensions: [ 'jpg', 'png', 'gif' ],
  // },
  spaceships: {
    dir: 'spaceships',
    extensions: [ 'gltf', 'glb' ],
    // Helps to make things 'just work' in dev builds, although doing this
    // should always generate an error indicating that assets are missing.
    placeholder: 'DS69F',
  },
  starCatalogs: {
    dir: 'starCatalogs',
    extensions: [ 'json' ],
  },
  voicePacks: {
    dir: 'voicePacks',
    extensions: [ 'mp3', 'ogg' ],
  },
};

function getCache(dir, name) {
  if (cachedPaths[dir] && cachedPaths[dir][name]) {
    return cachedPaths[dir][name];
  }
}

function AssetFinder() {}

AssetFinder.prototype.getRes = function getRes(name, options={}, callback) {
  const { dir, extensions, placeholder, silenceNotFoundErrors } = options;

  const cache = getCache(dir, name);
  if (cache) {
    console.log('--> [AssetFinder.getRes] cached hit:', cache);
    return cache;
  }

  const dev = `${devPath}/${dir}`;
  const prod = `${prodPath}/${dir}`;
  let totalChecks = 0;

  // Look for resource in HQ dir. If not found, look in potato.
  forEachFn([
    (cb) => fuzzyFindFile({ name, extensions, path: prod, onFind: cb }),
    (cb) => fuzzyFindFile({ name, extensions, path: dev, onFind: cb }),
  ], (error, fileName, parentDir) => {
    totalChecks++;
    if (!error) {
      // Return first file name found: this will be prod if exists, else dev.
      callback(error, fileName, parentDir);
      // Signal that we can stop looking.
      return false;
    }
    else if (totalChecks === 2) {
      // We only do two checks: prod, and dev. If we're at count 2 and it's an
      // error, then nothing was found.
      callback({ error: 'ENOENT' });
    }
  }, (error) => {
    if (error) {
      console.error('forEachFn onReachEnd error:', error);
    }
    else {
      let errorMessage = `No '${dir}' files found matching name: '${name}'.`;
      if (placeholder) {
        if (!silenceNotFoundErrors) {
          errorMessage += ` Will instead try default placeholder '${placeholder}'.`;
          console.error(errorMessage);
        }
        // Try once more with the default placeholder. Null it out to prevent
        // further attempts if it fails.
        const retryOpts = { ...options, placeholder: null };
        this.getRes(placeholder, retryOpts, callback);
      }
      else if (!silenceNotFoundErrors) {
        console.error(errorMessage);
      }
    }
  });
};

AssetFinder.prototype.getIcon = function getIcon({ name, options={}, callback=()=>{} }) {
  this.getRes(name, { ...assetDefaults.icons, ...options }, callback);
};

AssetFinder.prototype.getModel = function getModel({ name, options={}, callback=()=>{} }) {
  this.getRes(name, { ...assetDefaults.models, ...options }, callback);
};

AssetFinder.prototype.getMusic = function getMusic({ name, options={}, callback=()=>{} }) {
  this.getRes(name, { ...assetDefaults.music, ...options }, callback);
};

AssetFinder.prototype.getPlanetImg = function getPlanetImg({ name, options={}, callback=()=>{} }) {
  this.getRes(name, { ...assetDefaults.planetImg, ...options }, callback);
};

AssetFinder.prototype.getSfx = function getSfx({ name, options={}, callback=()=>{} }) {
  this.getRes(name, { ...assetDefaults.sfx, ...options }, callback);
};

// AssetFinder.prototype.getSkybox = function getSkybox({ name, options={}, callback=()=>{} }) {
//   this.getRes(name, { ...assetDefaults.skyboxes, ...options }, callback);
// };

AssetFinder.prototype.getSpaceship = function getSpaceship({ name, options={}, callback=()=>{} }) {
  this.getRes(name, { ...assetDefaults.spaceships, ...options }, callback);
};

AssetFinder.prototype.getStarCatalog = function getStarCatalog({ name, options={}, callback=()=>{} }) {
  this.getRes(name, { ...assetDefaults.starCatalogs, ...options }, callback);
};

AssetFinder.prototype.getStarCatalogWFallback = function getStarCatalog({ name, fallbackName, options={}, callback=()=>{} }) {
  this.getRes(
    name, {
      ...assetDefaults.starCatalogs,
      silenceNotFoundErrors: true,
      ...options
    },
    (error, fileName, parentDir) => {
      if (error) {
        this.getStarCatalog({
          name: fallbackName,
          callback,
        });
      }
      else {
        callback(error, fileName, parentDir);
      }
    }
  );
};

AssetFinder.prototype.getVoiceFile = function getVoiceFile({ name, options={}, callback=()=>{} }) {
  this.getRes(name, { ...assetDefaults.voicePacks, ...options }, callback);
};

const finder = new AssetFinder();
export default finder;

// TODO: tests should ensure that some obvious results are sane. For example,
//  an image over 500kb is obviously a mistake, whereas a 500kb spaceship is
//  normal. Tests should also check if the prod folder contains stuff that dev
//  doesn't; this indicates the user forgot to make a low quality version.
