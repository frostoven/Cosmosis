// Convenient loading methods for basic and fallback assets (such as generic
// UI crosshairs) are hardcoded here. These resources can be CSS- or
// Three.js-based, and will handle as much of the loading process as possible.
// Dynamic assets are not handled here.

import { opacity as aimOpacity } from "./crosshairs";

function AssetLoader(){}

// CSS.
AssetLoader.prototype.enableCrosshairs = function enableCrosshairs() {
  aimOpacity('aimCenter', 0.25);
};

// CSS.
AssetLoader.prototype.disableCrosshairs = function disableCrosshairs() {
  aimOpacity('aimCenter', 0);
};

const loader = new AssetLoader();
export default loader;
