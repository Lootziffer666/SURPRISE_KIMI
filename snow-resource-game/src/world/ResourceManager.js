import * as THREE from 'three';
import { AssetFactory } from '../entities/AssetFactory.js';
import { randomRange } from '../utils/MathUtils.js';

const RESOURCE_FACTORY = {
  wood: () => AssetFactory.createWood(),
  rawMeat: () => AssetFactory.createRawMeat(),
  cookedMeat: () => AssetFactory.createCookedMeat(),
  cash: () => AssetFactory.createCash()
};

export class ResourceManager {
  constructor({
    scene,
    player,
    inventory,
    collectionRadius = 1.25,
    onCollected = null
  }) {
    this.scene = scene;
    this.player = player;
    this.inventory = inventory;
    this.collectionRadius = collectionRadius;
    this.onCollected = onCollected;

    this.resources = [];
    this.playerPosition = new THREE.Vector3();
    this.resourcePosition = new THREE.Vector3();
  }

  spawn(type, position, options = {}) {
    const factory = RESOURCE_FACTORY[type];

    if (!factory) {
      throw new Error(`Unbekannter Ressourcentyp: ${type}`);
    }

    const object = factory();

    object.position.copy(position);
    object.position.y = options.y ?? 0;
    object.rotation.y = options.rotation ??
      Math.random() * Math.PI * 2;
    object.scale.setScalar(options.scale ?? 1);

    object.userData.resourceType = type;
    object.userData.collected = false;

    this.scene.add(object);

    const resource = {
      object,
      type,
      active: true
    };

    this.resources.push(resource);
    return resource;
  }

  spawnMany(type, positions, options = {}) {
    return positions.map((position) =>
      this.spawn(type, position, options)
    );
  }

  spawnRandom(type, {
    count,
    minX,
    maxX,
    minZ,
    maxZ,
    y = 0,
    scale = 1
  }) {
    const spawned = [];

    for (let index = 0; index < count; index += 1) {
      spawned.push(
        this.spawn(
          type,
          new THREE.Vector3(
            randomRange(minX, maxX),
            y,
            randomRange(minZ, maxZ)
          ),
          { scale }
        )
      );
    }

    return spawned;
  }

  update() {
    this.player.getWorldPosition(this.playerPosition);

    for (const resource of this.resources) {
      if (!resource.active) {
        continue;
      }

      resource.object.getWorldPosition(
        this.resourcePosition
      );

      const distance = this.playerPosition.distanceTo(
        this.resourcePosition
      );

      if (distance <= this.collectionRadius) {
        this.collect(resource);
      }
    }
  }

  collect(resource) {
    if (!resource.active || resource.object.userData.collected) {
      return false;
    }

    resource.object.userData.collected = true;
    resource.active = false;

    this.scene.remove(resource.object);

    const item = this.inventory.add(resource.type);

    if (!item) {
      resource.active = true;
      resource.object.userData.collected = false;
      this.scene.add(resource.object);
      return false;
    }

    this.onCollected?.({
      resource,
      item
    });

    return true;
  }

  removeInactive() {
    this.resources = this.resources.filter(
      (resource) => resource.active
    );
  }

  dispose() {
    for (const resource of this.resources) {
      this.scene.remove(resource.object);
    }

    this.resources.length = 0;
    this.onCollected = null;
  }
}
