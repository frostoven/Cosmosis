enum ActionType {
  /**
   * Should not be used outside of debugging contexts. Does all key processing
   * up the very last step, but then isn't handed over to the final processing
   * functions.
   */
  ignored = 0,
  /**
   * This triggers a single callback per key press. Can also be thought of as a
   * toggleable in some instances (e.g. press for roof lights, press again for
   * no lights).
   * This value should not change at runtime, and should be thought of as a
   * defining factor of the action it's tied to.
   */
  pulse = 1,
  /**
   * If an action is continuous, it means its state is rechecked every frame.
   * This value should not change at runtime, and should be thought of as a
   * defining factor of the action it's tied to.
   */
  continuous = 2,
  /**
   * For bindings that support both continuous and pulse. This is useful for
   * keys that cannot be held, such as the scrolling a mouse wheel, but that
   * still makes sense as both pulse and continuous, such as flight speed
   * increase or decrease. Note that the application will assume continuous as
   * the default; it's still up to the receiving mode function to support both
   * pulse and continuous.
   */
  hybrid = 3,
}

export {
  ActionType,
}
