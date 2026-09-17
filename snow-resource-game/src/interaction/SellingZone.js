export class SellingZone {
  constructor({
    inventory,
    gameState,
    prices = {
      wood: 5,
      cookedMeat: 10
    },
    saleInterval = 0.18,
    onSold = null,
    onStateChanged = null
  }) {
    this.inventory = inventory;
    this.gameState = gameState;
    this.prices = { ...prices };
    this.saleInterval = saleInterval;

    this.onSold = onSold;
    this.onStateChanged = onStateChanged;

    this.playerInside = false;
    this.remainingTime = 0;
    this.isSelling = false;
    this.totalSold = 0;
  }

  enter() {
    this.playerInside = true;
    this.remainingTime = 0;
  }

  stay() {
    this.playerInside = true;
  }

  exit() {
    this.playerInside = false;
  }

  findSellableType() {
    return this.inventory.getFirstType([
      'cookedMeat',
      'wood'
    ]);
  }

  sellNext() {
    if (!this.playerInside) {
      return false;
    }

    const type = this.findSellableType();

    if (!type) {
      this.isSelling = false;
      return false;
    }

    const item = this.inventory.remove(type);
    const price = this.prices[type] ?? 0;

    if (!item || price <= 0) {
      return false;
    }

    this.gameState.addCash(price);
    this.totalSold += 1;
    this.isSelling = true;
    this.remainingTime = this.saleInterval;

    this.onSold?.({
      item,
      type,
      price,
      totalSold: this.totalSold
    });

    this.onStateChanged?.({
      type: 'sold',
      item,
      price
    });

    return true;
  }

  update(deltaTime) {
    if (!this.playerInside) {
      this.isSelling = false;
      return;
    }

    if (!this.isSelling) {
      this.sellNext();
      return;
    }

    this.remainingTime -= deltaTime;

    if (this.remainingTime <= 0) {
      this.isSelling = false;
      this.sellNext();
    }
  }

  dispose() {
    this.onSold = null;
    this.onStateChanged = null;
  }
}
