/**
 * Central runtime gameplay state. Rendering/UI never mutate state
 * directly; they subscribe to events emitted here.
 */
export class GameState {
  constructor() {
    this.cash = 0;
    this._listeners = new Map();
  }

  on(event, listener) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    const set = this._listeners.get(event);
    if (set) set.delete(listener);
  }

  _emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set) return;
    for (const listener of set) listener(payload);
  }

  addCash(amount) {
    this.cash += amount;
    this._emit('cashChanged', this.cash);
  }

  spendCash(amount) {
    if (!this.canAfford(amount)) return false;
    this.cash -= amount;
    this._emit('cashChanged', this.cash);
    return true;
  }

  canAfford(amount) {
    return this.cash >= amount;
  }

  getCash() {
    return this.cash;
  }
}
