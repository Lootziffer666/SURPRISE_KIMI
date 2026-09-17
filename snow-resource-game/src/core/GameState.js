export class GameState {
  constructor() {
    this.cash = 0;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(change) {
    for (const listener of this.listeners) {
      listener({
        ...change,
        cash: this.cash
      });
    }
  }

  addCash(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    this.cash += amount;

    this.notify({
      type: 'cash-added',
      amount
    });

    return true;
  }

  canAfford(amount) {
    return Number.isFinite(amount) &&
      amount >= 0 &&
      this.cash >= amount;
  }

  spendCash(amount) {
    if (!this.canAfford(amount) || amount <= 0) {
      return false;
    }

    this.cash -= amount;

    this.notify({
      type: 'cash-spent',
      amount
    });

    return true;
  }

  reset() {
    this.cash = 0;

    this.notify({
      type: 'reset',
      amount: 0
    });
  }
}
