import * as THREE from "three";

const enums = {
  display: {
    displayMode: {
      windowed: 0,
      borderlessFullscreen: 1,
    },
    toneMapping: {
      none: THREE.NoToneMapping,
      filmic: THREE.ACESFilmicToneMapping,
      colourful: THREE.ReinhardToneMapping,
    },
  },
  graphics: {
    skyboxResolution: {
      native: 1,
      custom: 2,
      '1k': 1024,
      '2k': 2048,
      '4k': 4096,
    },
    shadowType: {
      basicShadows: THREE.BasicShadowMap,
      softShadows: THREE.PCFShadowMap,
      softAndFilteredShadows: THREE.PCFSoftShadowMap,
    },
    resolutionScale: {
      '20%': 0.2,
      '50%': 0.50,
      '75%': 0.75,
      matchNative: 1,
      '150%': 1.5,
      '200%': 2,
      '400%': 4,
      '800%': 8,
      '1600%': 16,
    },
  }
};

const userOptions = {
  info: {
    name: 'userOptions',
    fileName: 'userOptions.json',
  },
  enums,
  fileContent: {
    debug: {
      autoOpenDevTools: false,
      // Note: saving of position not yet implemented.
      // Once implemented, will prevent player ship location from being saved
      // to the user's profile.
      discardShipPosition: true,
      disableSkybox: false, // rename to disableStars?
      debugSkyboxSides: false,
      debugSkyboxCorners: false,
      logDistanceToInteractables: false,
      // If true, draws a box which indicates where shadows are actually
      // calculated.
      drawShadowCameraBounds: false,
      // If true, the game engine will lock shadows to the center of the scene
      // instead of following the camera like it's supposed to. This is useful
      // for checking how shadows are calculated relative to sun position.
      debugLockShadowMidpoint: false,
      // Creates a platform that follows the player ship.
      createDebugFloor: {
        enabled: false,
        receiveShadow: true,
        size: 15,
        divisions: 20,
        yOffset: 0,
        gridOpacity: 0.5,
        floorColor: 0xffffff,
        axisColor: 0x000000,
        gridColor: 0x000000,
      },
      // This absolutely wrecks visuals, and is here for testing purposes only.
      // If any bloom requirements arise, please use selective bloom instead.
      debugEnableFullscreenBloom: false,
    },
    display: {
      displayMode: enums.display.displayMode.borderlessFullscreen,
      fieldOfView: 55,
      // Descriptions:
      // * none: nothing weird or special.
      // * filmic: makes the scene more realistic at the expense of colour loss.
      // * colourful: in case you're in short supply of mushrooms.
      toneMapping: enums.display.toneMapping.none,
    },
    graphics: {
      antialias: true,
      // Warning1: going higher than native res may cause some stars to not
      // show.
      // Warning2: only 2k is properly supported at the moment; other
      // resolutions mess with star size.
      skyboxResolution: enums.graphics.skyboxResolution['2k'],
      skyboxAntialias: true,
      enableShadows: true,
      shadowType: enums.graphics.shadowType.softAndFilteredShadows,
      shadowDistanceMeters: 5,
      // Controls shadow resolution. Display in user interface as a 0%-1000%
      // value (maps from 0.0 to 100.0, where 10.0 is 100%). Notify user that
      // higher shadow quality gets less performant the the higher
      // shadowDistanceMeters is.
      shadowQuality: 0.5,
      // Known as 3D Resolution in graphics menu.
      resolutionScale: enums.graphics.resolutionScale.matchNative,
    },
    customisation: {
      // Show the controls item window in the top right.
      showControlsHelp: true,
    }
  },
};

export default userOptions;
