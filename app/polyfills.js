if (!window.requestPostAnimationFrame) {
  /**
   * Within this application, requestPostAnimationFrame is used to render
   * time-sensitive offscreen canvases more consistently (specifically,
   * prevents out-of-order [corrupted] face texture generation).
   *
   * From MDN:
   * While it's well-known that apps should use requestAnimationFrame ("RAF")
   * instead of setTimeout (et al) to redraw on-demand, what's less well-known
   * is that non-trivial WebGL apps should often not render within a RAF
   * callback. RAF callbacks (and their microtasks/promises) are the last JS
   * run at the end of each Browser content frame. [On the other hand],
   * requestPostAnimationFrame ("RPAF") is the first JS run at the beginning of
   * each Browser content frame. That is, it's the first JS run after RAF
   * callbacks and the Browser content (transaction) presentation step.
   * See: https://github.com/WICG/request-post-animation-frame/blob/main/explainer.md
   * @param task
   */
  window.requestPostAnimationFrame = function(task) {
    requestAnimationFrame(() => {
      setTimeout(task, 0);
    });
  }
}
