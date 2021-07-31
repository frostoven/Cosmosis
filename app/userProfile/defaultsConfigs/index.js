import allProfiles from './allProfiles';
import controls from './controls';

function getAllDefaults({ asArray=false }={}) {
  const all = {
    allProfiles,
    controls,
  };

  if (asArray) return Object.values(all);
  else return all;
}

export {
  getAllDefaults,
}
