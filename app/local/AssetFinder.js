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

function getCache(dir, name) {
  if (cachedPaths[dir] && cachedPaths[dir][name]) {
    return cachedPaths[dir][name];
  }
}

function AssetFinder() {}

AssetFinder.prototype.getRes = function getRes(dir, name, extensions, callback) {
  const cache = getCache(dir, name);
  if (cache) {
    console.log('--> [AssetFinder.getRes] cached hit:', cache);
    return cache;
  }

  const dev = `${devPath}/${dir}`;
  const prod = `${prodPath}/${dir}`;

  // Look for resource in HQ dir. If not found, look in potato.
  forEachFn([
    (cb) => fuzzyFindFile({ name, extensions, path: prod, onFind: cb }),
    (cb) => fuzzyFindFile({ name, extensions, path: dev, onFind: cb }),
  ], (error, fileName, parentDir) => {
    if (!error) {
      // Return first file name found: this will be prod if exists, else dev.
      callback(error, fileName, parentDir);
      // Signal that we can stop looking.
      return false;
    }
  }, (error) => {
    if (error) {
      console.error('forEachFn onReachEnd error:', error)
    }
    else {
      console.error('No files found matching:', name)
    }
  });
};

AssetFinder.prototype.getIcon = function getIcon(name, callback=()=>{}) {
  this.getRes('icons', name, [ 'jpg', 'png', 'gif' ], callback);
};

AssetFinder.prototype.getModel = function getModel(name, callback=()=>{}) {
  this.getRes('models', name, [ 'gltf' ], callback);
};

AssetFinder.prototype.getMusic = function getMusic(name, callback=()=>{}) {
  this.getRes('music', name, [ 'mp3', 'ogg' ], callback);
};

AssetFinder.prototype.getPlanetImg = function getPlanetImg(name, callback=()=>{}) {
  this.getRes('planetImg', name, [ 'jpg', 'png', 'gif' ], callback);
};

AssetFinder.prototype.getSfx = function getSfx(name, callback=()=>{}) {
  this.getRes('sfx', name, [ 'mp3', 'ogg' ], callback);
};

AssetFinder.prototype.getSkybox = function getSkybox(name, callback=()=>{}) {
  this.getRes('skyboxes', name, [ 'jpg', 'png', 'gif' ], callback);
};

AssetFinder.prototype.getSpaceShip = function getSpaceShip(name, callback=()=>{}) {
  this.getRes('spaceShips', name, [ 'gltf', 'glb' ], callback);
};

AssetFinder.prototype.getVoiceFile = function getVoiceFile(name, callback=()=>{}) {
  this.getRes('voicePacks', name, [ 'mp3', 'ogg' ], callback);
};

const finder = new AssetFinder();
export default finder;

// TODO: tests should ensure that some obvious results are sane. For example,
//  an image over 50kb is obviously a mistake, whereas a 500kb space ship is
//  normal. Tests should also check if the prod folder contains stuff that dev
//  doesn't; this indicates the user forgot to make a low quality version.
