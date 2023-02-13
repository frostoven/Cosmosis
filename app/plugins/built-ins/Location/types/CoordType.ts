enum CoordType {
  // Players get to float around freely in whatever they're parented to.
  ghostCentric = 0,
  // When moving, galaxy moves around the player.
  playerCentric = 1,
  // When moving, player moves within the galaxy.
  galaxyCentric = 2,
}

export {
  CoordType,
}
