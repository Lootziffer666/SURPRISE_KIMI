import * as THREE from 'three';
import { AssetFactory } from '../entities/AssetFactory.js';
import { createId } from '../utils/MathUtils.js';

const RESOURCE_TYPES = new Set([
  'wood',
  'rawMeat',
  'cookedMeat',
  'cash'
]);

export class InventoryStack {
  constructor({
    parent,
    gap = 0.08,
    maxItems = Infinity
  }) {
    if (!parent) {
      throw new Error('InventoryStack benötigt ein parent Object3D.');
    }

    this.parent = parent;
    this.group = new THREE.Group();
    this.group.name = 'InventoryStackGroup';

    this.parent.add(this.group);

    this.gap = gap;
    this.maxItems = maxItems;
    this.items = [];
    this.bounds = new THREE.Box3();
    this.size = new THREE.Vector3();
  }

  add(type) {
    if (!RESOURCE_TYPES.has(type)) {
      throw new Error(`Unbekannter Inventartyp: ${type}`);
    }

    if (this.items.length >= this.maxItems) {
      return null;
    }

    const mesh = this.createVisual(type);
    const height = this.calculateHeight(mesh);

    const item = {
      id: createId(type),
      type,
      mesh,
      height
    };

    this.items.push(item);
    this.group.add(mesh);
    this.reflow();

    return item;
  }

  createVisual(type) {
    switch (type) {
      case 'wood':
        return AssetFactory.createWood();

      case 'rawMeat':
        return AssetFactory.createRawMeat();

      case 'cookedMeat':
        return AssetFactory.createCookedMeat();

      case 'cash':
        return AssetFactory.createCash();

      default:
        throw new Error(`Keine Visualisierung für ${type}`);
    }
  }

  calculateHeight(object) {
    object.updateMatrixWorld(true);
    this.bounds.setFromObject(object);
    this.bounds.getSize(this.size);

    return Math.max(0.05, this.size.y);
  }

  reflow() {
    let currentHeight = 0;

    for (const item of this.items) {
      item.mesh.position.set(
        0,
        currentHeight + item.height / 2,
        0
      );

      currentHeight += item.height + this.gap;
    }

    this.group.userData.stackHeight = currentHeight;
  }

  remove(type) {
    const index = this.items.findIndex(
      (item) => item.type === type
    );

    if (index < 0) {
      return null;
    }

    return this.removeAt(index);
  }

  removeAt(index) {
    if (index < 0 || index >= this.items.length) {
      return null;
    }

    const [item] = this.items.splice(index, 1);

    this.group.remove(item.mesh);
    this.disposeObject(item.mesh);
    this.reflow();

    return item;
  }

  removeTop() {
    return this.removeAt(this.items.length - 1);
  }

  has(type) {
    return this.items.some((item) => item.type === type);
  }

  count(type) {
    return this.items.reduce(
      (total, item) =>
        total + (item.type === type ? 1 : 0),
      0
    );
  }

  countSellable() {
    return this.items.filter(
      (item) =>
        item.type === 'wood' ||
        item.type === 'cookedMeat'
    ).length;
  }

  getItems() {
    return this.items.map((item) => ({
      id: item.id,
      type: item.type,
      mesh: item.mesh,
      height: item.height
    }));
  }

  getFirstType(types) {
    return this.items.find((item) =>
      types.includes(item.type)
    )?.type ?? null;
  }

  clear() {
    while (this.items.length > 0) {
      this.removeAt(this.items.length - 1);
    }
  }

  disposeObject(object) {
    object.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.geometry = null;
      child.material = null;
    });
  }
}
