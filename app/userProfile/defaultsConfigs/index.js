import allProfiles from './allProfiles';
import controls from './controls';
import debugTools from './debugTools';

const all = {
  allProfiles,
  controls,
  debugTools,
};

function getAllDefaults({ asArray=false }={}) {
  if (asArray) return Object.values(all);
  else return all;
}

function getConfigInfo({ identifier }) {
  return all[identifier] && all[identifier].info;
}

function getDefaultContent({ identifier }) {
  return all[identifier] && all[identifier].fileContent;
}

function getDefaultAltContent({ identifier }) {
  return all[identifier] && all[identifier].alternativeContent;
}

export {
  getAllDefaults,
  getConfigInfo,
  getDefaultContent,
  getDefaultAltContent,
}
