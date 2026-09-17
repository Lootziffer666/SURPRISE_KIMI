import * as THREE from 'three';

export class UIManager {
  constructor({
    gameState,
    camera,
    buyOverlay,
    statusElement
  }) {
    this.gameState = gameState;
    this.camera = camera;
    this.buyOverlay = buyOverlay;
    this.statusElement = statusElement;

    this.overlayWorldPosition = new THREE.Vector3();
    this.overlayScreenPosition = new THREE.Vector3();

    this.unsubscribe = this.gameState.subscribe(
      ({ cash }) => this.updateCash(cash)
    );

    this.updateCash(this.gameState.cash);

    this.statusTimeout = null;
    this.buyOverlayTarget = null;
    this.buyOverlayVisible = false;
  }

  updateCash(cash) {
    const value = document.querySelector('#cash-value');

    if (value) {
      value.textContent = `$${Math.floor(cash)}`;
    }
  }

  setBuyOverlayTarget(target, price = 200) {
    this.buyOverlayTarget = target;

    if (this.buyOverlay) {
      this.buyOverlay.querySelector(
        '.overlay-price'
      ).textContent = `$${price}`;
    }
  }

  setBuyOverlayVisible(visible) {
    this.buyOverlayVisible = visible;

    if (!this.buyOverlay) {
      return;
    }

    this.buyOverlay.classList.toggle(
      'hidden',
      !visible
    );
  }

  updateWorldOverlay(viewportWidth, viewportHeight) {
    if (
      !this.buyOverlay ||
      !this.buyOverlayTarget ||
      !this.buyOverlayVisible
    ) {
      return;
    }

    this.buyOverlayTarget.getWorldPosition(
      this.overlayWorldPosition
    );

    this.overlayScreenPosition
      .copy(this.overlayWorldPosition)
      .project(this.camera);

    const behindCamera =
      this.overlayScreenPosition.z < -1 ||
      this.overlayScreenPosition.z > 1;

    const outsideViewport =
      this.overlayScreenPosition.x < -1.15 ||
      this.overlayScreenPosition.x > 1.15 ||
      this.overlayScreenPosition.y < -1.15 ||
      this.overlayScreenPosition.y > 1.15;

    if (behindCamera || outsideViewport) {
      this.buyOverlay.classList.add('hidden');
      return;
    }

    this.buyOverlay.classList.remove('hidden');

    const x =
      (this.overlayScreenPosition.x * 0.5 + 0.5) *
      viewportWidth;

    const y =
      (-this.overlayScreenPosition.y * 0.5 + 0.5) *
      viewportHeight;

    this.buyOverlay.style.left = `${x}px`;
    this.buyOverlay.style.top = `${y}px`;
  }

  showStatus(message, duration = 1800) {
    if (!this.statusElement) {
      return;
    }

    this.statusElement.textContent = message;
    this.statusElement.classList.add('visible');

    window.clearTimeout(this.statusTimeout);

    this.statusTimeout = window.setTimeout(() => {
      this.statusElement.classList.remove('visible');
    }, duration);
  }

  dispose() {
    this.unsubscribe?.();
    window.clearTimeout(this.statusTimeout);
  }
}
