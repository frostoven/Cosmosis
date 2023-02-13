enum WarpEngineType {
  // Same top speed as exponentialAcceleration, but acceleration is constant.
  // Reaches 0.1c at 2% power with the strongest engine (4c max).
  linearAcceleration,

  // Same top speed as linearAcceleration, but acceleration is very slow below
  // 90% engine power. Acceleration blows up very quickly past 95%.
  // Reaches 0.1c at 80% power with the strongest engine (4c max).
  exponentialAcceleration,
}

export {
  WarpEngineType,
}
