import { easeInOutCubic } from './MathUtils.js';

export class Tween {
  constructor({
    duration = 1,
    delay = 0,
    easing = easeInOutCubic,
    onUpdate = () => {},
    onComplete = () => {}
  } = {}) {
    this.duration = Math.max(0.0001, duration);
    this.delay = Math.max(0, delay);
    this.easing = easing;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;

    this.elapsed = 0;
    this.finished = false;
    this.started = false;
  }

  update(deltaTime) {
    if (this.finished) {
      return true;
    }

    this.elapsed += Math.max(0, deltaTime);

    if (this.elapsed < this.delay) {
      return false;
    }

    if (!this.started) {
      this.started = true;
      this.onUpdate(0);
    }

    const progress = Math.min(
      1,
      (this.elapsed - this.delay) / this.duration
    );

    this.onUpdate(this.easing(progress));

    if (progress >= 1) {
      this.finished = true;
      this.onComplete();
    }

    return this.finished;
  }

  cancel() {
    this.finished = true;
  }
}

export class TweenManager {
  constructor() {
    this.tweens = [];
  }

  add(tween) {
    this.tweens.push(tween);
    return tween;
  }

  update(deltaTime) {
    for (let index = this.tweens.length - 1; index >= 0; index -= 1) {
      const tween = this.tweens[index];

      if (tween.update(deltaTime)) {
        this.tweens.splice(index, 1);
      }
    }
  }

  clear() {
    for (const tween of this.tweens) {
      tween.cancel();
    }

    this.tweens.length = 0;
  }
}
