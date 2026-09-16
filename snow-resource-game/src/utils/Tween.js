export const Easing = Object.freeze({
  linear: (t) => t,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
});

/**
 * Minimal dependency-free tween runner. Tweens tick on delta time,
 * so they are frame-rate independent and respect an optional delay.
 */
class TweenManager {
  constructor() {
    this._tweens = new Set();
    this._iterationBuffer = [];
  }

  /**
   * @param {Object} config
   * @param {number} config.duration seconds
   * @param {number} [config.delay] seconds before the tween starts
   * @param {(t:number)=>number} [config.ease] easing function
   * @param {(t:number)=>void} config.onUpdate called with eased 0..1
   * @param {()=>void} [config.onComplete]
   */
  add({ duration, delay = 0, ease = Easing.linear, onUpdate, onComplete = null }) {
    const tween = {
      elapsed: -delay,
      duration: Math.max(duration, 0.0001),
      ease,
      onUpdate,
      onComplete,
    };
    this._tweens.add(tween);
    return tween;
  }

  cancel(tween) {
    this._tweens.delete(tween);
  }

  update(dt) {
    if (this._tweens.size === 0) return;
    this._iterationBuffer.length = 0;
    for (const tween of this._tweens) this._iterationBuffer.push(tween);

    for (const tween of this._iterationBuffer) {
      if (!this._tweens.has(tween)) continue;
      tween.elapsed += dt;
      if (tween.elapsed < 0) continue;

      const raw = Math.min(tween.elapsed / tween.duration, 1);
      tween.onUpdate(tween.ease(raw));

      if (raw >= 1) {
        this._tweens.delete(tween);
        if (tween.onComplete) tween.onComplete();
      }
    }
  }

  clear() {
    this._tweens.clear();
  }
}

export const Tweens = new TweenManager();
