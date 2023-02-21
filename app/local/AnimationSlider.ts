/**
 * ----------------------------------------------------------------------------
 * This file is licensed under the MIT license.
 * ----------------------------------------------------------------------------
 *
 * Copyright 2023 Frostoven [https://github.com/frostoven]
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import * as THREE from 'three';

/**
 * Offers a means of controlling an animation by percentage (0-1). The exact
 * purpose of this class is for meshes that have animations not meant for
 * traditional animations, but as rather direct response to game state (for
 * example, getting in-game throttle position to match a gamepad's analog
 * stick).
 */
export default class AnimationSlider {
  private _fakeDelta: number;
  private readonly _mesh: any;
  private readonly _mixer: THREE.AnimationMixer;
  private readonly _clips: any;
  private readonly anims: any[];
  private _percentage: number;

  constructor(mesh) {
    this._fakeDelta = 0;
    this._mesh = mesh;
    this._mixer = new THREE.AnimationMixer(mesh.scene);
    this._clips = mesh.animations;
    this._percentage = 0;

    this.anims = [];
    for (let i = 0, len = this._clips.length; i < len; i++) {
      const clip = this._clips[i];
      const action = this._mixer.clipAction(clip);
      action.play();
      action.paused = true;
      //
      this.anims.push({ clip, action });
    }
  }

  seek(percentage: number = 0) {
    if (this._percentage === percentage) {
      return;
    }

    for (let i = 0, len = this.anims.length; i < len; i++) {
      const { clip, action } = this.anims[i];
      action.time = percentage * clip.duration;
      this._mixer.update(++this._fakeDelta);
    }

    this._percentage = percentage;
  }
}
