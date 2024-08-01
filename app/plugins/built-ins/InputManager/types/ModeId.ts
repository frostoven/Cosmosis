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
  // The in-game menu that is launched when Escape is pressed.
  primaryGameMenu = 2,
  // Small in-game menus that activate when interacting with in-game tech.
  virtualMenuControl = 3,
  // Used for restricted movement such as looking around while in the pilot
  // seat.
  buckledPassenger = 4,
  // Includes ship helm control and free-flying as a ghost.
  flightControl = 5,
  // Intended for walking around ships.
  playerControl,
}

export {
  ModeId,
}
