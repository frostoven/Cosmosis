// Once you've made your file look something like this, add it to
// userProfile/defaultsConfigs/index.js for the game to recognise it.

const config = {
  // Contains info that tells the engine how to load / handle the file.
  info: {
    // Name as identified by the game engine.
    name: 'example',
    // Note: only json format is supported.
    fileName: 'example.json',
    // Optional; not needed for almost all cases. This is for configs that are
    // not tied to the user's profile. Changes save dir. Defaults to false.
    profileAgnostic: false,
  },

  // The contents of the 'fileContent' object will be be placed inside the the
  // config file (example.json in this case). Note that it's serialised as
  // json, which means comments will be lost.
  fileContent: {
    // Some data that will be stored in your config file.
    yourSectionName1: {
      optionA: 'Alpha',
      optionB: 'Bravo',
    },

    // You can have as many sections as you want.
    yourSectionName2: {
      optionC: 'Charlie',
      optionD: 'Delta',
      // Items can be nested.
      moreJuice: {
        optionE: 4356576,
        optionF: 'Foxtrot',
        moreMango: {
          honestTruth: 'this example file is too detailed.',
        },
      },
    },
  },

  // Completely optional. Provides alternatives for fileContent. This is
  // generally where the user may have many starting presets, such as with
  // control bindings. Probably not so useful for most cases.
  alternativeContent: {
    'different option': {
      yourSectionName1: 'etc',
      yourSectionName2: 'etc',
    },
  },
};

export default config;
