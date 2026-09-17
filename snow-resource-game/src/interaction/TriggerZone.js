import * as THREE from 'three';

export class TriggerZone {
  constructor({
    scene,
    center = new THREE.Vector3(),
    size = new THREE.Vector3(3, 2, 3),
    name = 'TriggerZone',
    debug = false,
    onEnter = null,
    onStay = null,
    onExit = null
  }) {
    this.scene = scene;
    this.name = name;
    this.debug = debug;

    this.center = center.clone();
    this.size = size.clone();

    this.box = new THREE.Box3();
    this.playerBox = new THREE.Box3();

    this.isInside = false;
    this.enabled = true;

    this.onEnter = onEnter;
    this.onStay = onStay;
    this.onExit = onExit;

    this.debugHelper = null;

    if (this.debug && this.scene) {
      this.debugHelper = new THREE.Box3Helper(
        this.getBox(),
        0xff00ff
      );

      this.debugHelper.name = `${name}DebugHelper`;
      this.scene.add(this.debugHelper);
    }

    this.updateBounds();
  }

  getBox() {
    return this.box;
  }

  updateBounds() {
    this.box.setFromCenterAndSize(
      this.center,
      this.size
    );

    if (this.debugHelper) {
      this.debugHelper.box.copy(this.box);
    }
  }

  setCenter(center) {
    this.center.copy(center);
    this.updateBounds();
  }

  setSize(size) {
    this.size.copy(size);
    this.updateBounds();
  }

  setEnabled(enabled) {
    if (!enabled && this.isInside) {
      this.isInside = false;

      if (this.onExit) {
        this.onExit({
          zone: this,
          reason: 'disabled'
        });
      }
    }

    this.enabled = enabled;
  }

  update(player) {
    if (!this.enabled || !player) {
      return;
    }

    this.updateBounds();

    this.playerBox.setFromObject(player);

    const currentlyInside =
      this.playerBox.intersectsBox(this.box);

    if (currentlyInside && !this.isInside) {
      this.isInside = true;

      if (this.onEnter) {
        this.onEnter({
          zone: this,
          player
        });
      }
    }

    if (currentlyInside) {
      if (this.onStay) {
        this.onStay({
          zone: this,
          player
        });
      }
    } else if (this.isInside) {
      this.isInside = false;

      if (this.onExit) {
        this.onExit({
          zone: this,
          player
        });
      }
    }
  }

  dispose() {
    if (this.debugHelper && this.scene) {
      this.scene.remove(this.debugHelper);
    }

    this.debugHelper = null;
    this.onEnter = null;
    this.onStay = null;
    this.onExit = null;
  }
}
