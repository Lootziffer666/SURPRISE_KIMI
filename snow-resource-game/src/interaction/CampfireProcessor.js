export class CampfireProcessor {
  constructor({
    inventory,
    zone,
    processDuration = 1,
    onProcessed = null,
    onStateChanged = null
  }) {
    this.inventory = inventory;
    this.zone = zone;
    this.processDuration = processDuration;

    this.onProcessed = onProcessed;
    this.onStateChanged = onStateChanged;

    this.playerInside = false;
    this.remainingTime = 0;
    this.isProcessing = false;
    this.processedCount = 0;
  }

  enter() {
    this.playerInside = true;

    if (!this.isProcessing) {
      this.startNext();
    }
  }

  stay() {
    this.playerInside = true;
  }

  exit() {
    this.playerInside = false;
  }

  startNext() {
    if (
      this.isProcessing ||
      !this.playerInside ||
      !this.inventory.has('rawMeat')
    ) {
      return false;
    }

    const item = this.inventory.remove('rawMeat');

    if (!item) {
      return false;
    }

    this.isProcessing = true;
    this.remainingTime = this.processDuration;

    this.onStateChanged?.({
      type: 'started',
      item,
      remainingTime: this.remainingTime
    });

    return true;
  }

  update(deltaTime) {
    if (!this.isProcessing) {
      if (this.playerInside) {
        this.startNext();
      }

      return;
    }

    this.remainingTime -= deltaTime;

    this.onStateChanged?.({
      type: 'processing',
      remainingTime: Math.max(0, this.remainingTime)
    });

    if (this.remainingTime > 0) {
      return;
    }

    this.isProcessing = false;
    this.processedCount += 1;

    const item = this.inventory.add('cookedMeat');

    this.onProcessed?.({
      item,
      count: this.processedCount
    });

    this.onStateChanged?.({
      type: 'completed',
      item
    });

    if (this.playerInside) {
      this.startNext();
    }
  }

  dispose() {
    this.onProcessed = null;
    this.onStateChanged = null;
  }
}
