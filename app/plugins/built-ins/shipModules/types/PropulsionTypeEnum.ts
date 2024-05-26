enum PropulsionTypeEnum {
  // We're sitting ducks, Jim.
  none,
  // Propels via ejected particle jets.
  impulse,
  // Warp drives distort spacetime for faster-than-light movement.
  warp,
  // Creates weak wormholes to produce short-range jumps rarely exceeding 50ly.
  hyper,
  // Creates rigid wormholes to produce galaxy-wide jumps. Rarely part of
  // spaceships as they're generally huge and require ridiculous amounts of
  // energy. Cascade drives require massive objects (such as stars) along their
  // paths to keep the wormhole stable, and thus cannot exit galaxies.
  cascade,
  // Modal-shift drives exist only in theory. If built, one could use them to
  // hop between galaxies.
  modalShift,
}

export {
  PropulsionTypeEnum,
}
