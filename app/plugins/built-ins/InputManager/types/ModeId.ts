/**
 * This contains all possible game control modes. The order of this enum is
 * used to determine priority. The first mode to grab a key, gets to decide
 * what to do with it (and whether or not to end propagation).
 */
enum ModeId {
  // Do not use this.
  invalid = 0,
  // Used for things like full-screen, dev tools, and any other controls that
  // don't work with game logic.
  appControl = 1,
  // Includes ship control and free-flying as a ghost.
  playerControl = 2,
  // The in-game menu that is launched when Escape is pressed.
  menuControl = 3,
  // Tiny in-game menus that activate when interacting with in-game tech.
  virtualMenuControl = 4,
}

export {
  ModeId,
}
