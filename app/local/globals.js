const actions = {};

function registerGlobalAction({ action, item }) {
  actions[action] = item;
}

function deregisterGlobalAction({ action }) {
  actions[action] = {};
}

const exports = {
  actions,
  registerGlobalAction,
  deregisterGlobalAction,
}

/**
 * Used for easy console debugging. Please do not use this line in actual code.
 */
window.gameGlobals = exports;

module.exports = exports;
