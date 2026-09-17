import * as THREE from 'three';
import { AssetFactory } from '../entities/AssetFactory.js';
import { TriggerZone } from '../interaction/TriggerZone.js';
import { Tween } from '../utils/Tween.js';
import { randomRange } from '../utils/MathUtils.js';

const DEFAULT_EXPANSION_COST = 200;

export class MapManager {
  constructor({
    scene,
    gameState,
    player,
    tweenManager,
    debugZones = false,
    expansionCost = DEFAULT_EXPANSION_COST,
    onExpansionUnlocked = null
  }) {
    this.scene = scene;
    this.gameState = gameState;
    this.player = player;
    this.tweenManager = tweenManager;
    this.debugZones = debugZones;
    this.expansionCost = expansionCost;
    this.onExpansionUnlocked = onExpansionUnlocked;

    this.worldGroup = new THREE.Group();
    this.worldGroup.name = 'World';
    this.scene.add(this.worldGroup);

    this.startingArea = new THREE.Group();
    this.startingArea.name = 'StartingArea';
    this.worldGroup.add(this.startingArea);

    this.expansionArea = new THREE.Group();
    this.expansionArea.name = 'FishingExpansion';
    this.expansionArea.visible = false;
    this.worldGroup.add(this.expansionArea);

    this.fenceGroups = {
      north: new THREE.Group(),
      south: new THREE.Group(),
      east: new THREE.Group(),
      west: new THREE.Group(),
      lockedExpansion: new THREE.Group()
    };

    this.buyZone = null;
    this.expansionUnlocked = false;
    this.unlockInProgress = false;

    this.startingBounds = {
      minX: -17,
      maxX: 17,
      minZ: -17,
      maxZ: 17
    };

    this.expandedBounds = {
      minX: -17,
      maxX: 32,
      minZ: -17,
      maxZ: 17
    };

    this.buildStartingArea();
    this.buildExpansionArea();
    this.buildFences();
    this.createBuyZone();

    this.player.add(
      this.createPlayerMarker()
    );
  }

  createPlayerMarker() {
    const marker = new THREE.Group();
    marker.name = 'PlayerGroundMarker';

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.82, 32),
      new THREE.MeshBasicMaterial({
        color: 0x8be8ff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
    );

    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.02;
    marker.add(ring);

    return marker;
  }

  buildStartingArea() {
    const terrain = new THREE.Mesh(
      new THREE.BoxGeometry(38, 0.55, 38),
      new THREE.MeshStandardMaterial({
        color: 0xe9f7fb,
        roughness: 0.95,
        metalness: 0
      })
    );

    terrain.position.set(0, -0.28, 0);
    terrain.receiveShadow = true;
    terrain.name = 'StartingSnowTerrain';
    this.startingArea.add(terrain);

    this.scatterTrees();
    this.scatterBears();
  }

  buildExpansionArea() {
    const terrain = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.55, 38),
      new THREE.MeshStandardMaterial({
        color: 0xe6f5fa,
        roughness: 0.95
      })
    );

    terrain.position.set(30, -0.28, 0);
    terrain.receiveShadow = true;
    terrain.name = 'ExpansionSnowTerrain';
    this.expansionArea.add(terrain);

    const pond = AssetFactory.createPond(14, 9);
    pond.position.set(30, 0.05, 0);
    this.expansionArea.add(pond);

    for (const position of [
      [22, 0, -12],
      [37, 0, -12],
      [22, 0, 12],
      [37, 0, 12],
      [40, 0, 5]
    ]) {
      const tree = AssetFactory.createTree({
        scale: randomRange(0.8, 1.15)
      });

      tree.position.set(...position);
      this.expansionArea.add(tree);
    }
  }

  scatterTrees() {
    const positions = [
      [-13, 0, -12],
      [-7, 0, -14],
      [2, 0, -14],
      [12, 0, -12],
      [-14, 0, -3],
      [14, 0, -4],
      [-14, 0, 8],
      [14, 0, 8],
      [-11, 0, 14],
      [0, 0, 14],
      [11, 0, 13]
    ];

    for (const position of positions) {
      const tree = AssetFactory.createTree({
        scale: randomRange(0.8, 1.18)
      });

      tree.position.set(...position);
      this.startingArea.add(tree);
    }
  }

  scatterBears() {
    const positions = [
      [-8, 0, -5],
      [8, 0, 7]
    ];

    for (const position of positions) {
      const bear = AssetFactory.createBear();
      bear.position.set(...position);
      bear.rotation.y = randomRange(0, Math.PI * 2);
      this.startingArea.add(bear);
    }
  }

  buildFences() {
    this.addFenceSection(
      this.fenceGroups.north,
      'NorthFence',
      -18,
      18,
      'horizontal'
    );

    this.addFenceSection(
      this.fenceGroups.south,
      'SouthFence',
      -18,
      -18,
      'horizontal'
    );

    this.addFenceSection(
      this.fenceGroups.west,
      'WestFence',
      -18,
      0,
      'vertical'
    );

    this.addFenceSection(
      this.fenceGroups.east,
      'EastFence',
      18,
      0,
      'vertical'
    );

    this.addFenceSection(
      this.fenceGroups.lockedExpansion,
      'LockedExpansionFence',
      18,
      0,
      'vertical',
      8
    );

    this.fenceGroups.east.visible = false;

    for (const group of Object.values(this.fenceGroups)) {
      this.startingArea.add(group);
    }
  }

  addFenceSection(
    group,
    name,
    fixedCoordinate,
    varyingCenter,
    orientation,
    postCount = 11
  ) {
    group.name = name;

    const spacing = 3.6;
    const start = varyingCenter - ((postCount - 1) * spacing) / 2;

    for (let index = 0; index < postCount; index += 1) {
      const post = AssetFactory.createFencePost();

      if (orientation === 'horizontal') {
        post.position.set(
          start + index * spacing,
          0,
          fixedCoordinate
        );
      } else {
        post.position.set(
          fixedCoordinate,
          0,
          start + index * spacing
        );
      }

      group.add(post);

      if (index < postCount - 1) {
        const rail = AssetFactory.createFenceRail(spacing);

        if (orientation === 'horizontal') {
          rail.position.set(
            start + index * spacing + spacing / 2,
            0,
            fixedCoordinate
          );
        } else {
          rail.rotation.y = Math.PI / 2;
          rail.position.set(
            fixedCoordinate,
            0,
            start + index * spacing + spacing / 2
          );
        }

        group.add(rail);
      }
    }
  }

  createBuyZone() {
    const marker = new THREE.Group();
    marker.name = 'BuyZoneMarker';
    marker.position.set(18, 0, 0);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.3, 0.12, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffd24d,
        emissive: 0x553b00,
        emissiveIntensity: 0.4
      })
    );

    base.position.y = 0.08;
    base.receiveShadow = true;
    marker.add(base);

    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 0.9, 4),
      new THREE.MeshStandardMaterial({
        color: 0xfff0a3,
        emissive: 0x8c6500,
        emissiveIntensity: 0.45
      })
    );

    arrow.position.y = 0.58;
    marker.add(arrow);

    this.startingArea.add(marker);
    this.buyZone = marker;

    this.buyTrigger = new TriggerZone({
      scene: this.scene,
      center: new THREE.Vector3(17, 1, 0),
      size: new THREE.Vector3(3, 3, 4),
      name: 'ExpansionBuyZone',
      debug: this.debugZones,
      onEnter: () => this.tryUnlockExpansion()
    });
  }

  tryUnlockExpansion() {
    if (
      this.expansionUnlocked ||
      this.unlockInProgress ||
      !this.gameState.canAfford(this.expansionCost)
    ) {
      return false;
    }

    if (!this.gameState.spendCash(this.expansionCost)) {
      return false;
    }

    this.unlockInProgress = true;

    this.tweenManager.add(
      new Tween({
        duration: 0.8,
        onUpdate: (progress) => {
          const lockedGroup = this.fenceGroups.lockedExpansion;

          lockedGroup.children.forEach((object, index) => {
            const delay = index * 0.035;
            const localProgress = Math.max(
              0,
              Math.min(
                1,
                (progress - delay) / (1 - delay)
              )
            );

            object.position.y = -3.2 * localProgress;
          });
        },
        onComplete: () => {
          this.completeExpansionUnlock();
        }
      })
    );

    return true;
  }

  completeExpansionUnlock() {
    this.expansionUnlocked = true;
    this.unlockInProgress = false;

    this.fenceGroups.lockedExpansion.visible = false;
    this.fenceGroups.east.visible = true;
    this.expansionArea.visible = true;

    this.onExpansionUnlocked?.({
      bounds: this.expandedBounds
    });
  }

  update(player, deltaTime) {
    this.buyTrigger.update(player);

    if (this.buyZone && !this.expansionUnlocked) {
      this.buyZone.rotation.y += deltaTime * 0.8;
    }
  }

  getWorldBounds() {
    return this.expansionUnlocked
      ? { ...this.expandedBounds }
      : { ...this.startingBounds };
  }

  dispose() {
    this.buyTrigger?.dispose();
    this.onExpansionUnlocked = null;
  }
}
