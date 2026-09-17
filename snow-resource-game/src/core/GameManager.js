import * as THREE from 'three';
import { SceneSetup } from './SceneSetup.js';
import { GameState } from './GameState.js';
import { AssetFactory } from '../entities/AssetFactory.js';
import { PlayerController } from '../controllers/PlayerController.js';
import { InventoryStack } from '../inventory/InventoryStack.js';
import { TriggerZone } from '../interaction/TriggerZone.js';
import { CampfireProcessor } from '../interaction/CampfireProcessor.js';
import { SellingZone } from '../interaction/SellingZone.js';
import { ResourceManager } from '../world/ResourceManager.js';
import { MapManager } from '../world/MapManager.js';
import { UIManager } from '../ui/UIManager.js';
import { TweenManager } from '../utils/Tween.js';
import { dampVector3 } from '../utils/MathUtils.js';

export class GameManager {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.sceneSetup = new SceneSetup(canvas);
    this.scene = this.sceneSetup.scene;
    this.camera = this.sceneSetup.camera;
    this.renderer = this.sceneSetup.renderer;

    this.gameState = new GameState();
    this.tweenManager = new TweenManager();

    this.player = AssetFactory.createPlayer();
    this.player.position.set(0, 0, 5);
    this.scene.add(this.player);

    this.inventory = new InventoryStack({
      parent: this.player,
      gap: 0.1
    });

    this.mapManager = new MapManager({
      scene: this.scene,
      gameState: this.gameState,
      player: this.player,
      tweenManager: this.tweenManager,
      onExpansionUnlocked: ({ bounds }) => {
        this.playerController.setBounds(bounds);
        this.uiManager.showStatus(
          'Fischteich freigeschaltet!'
        );
      }
    });

    this.playerController = new PlayerController({
      player: this.player,
      camera: this.camera,
      canvas: this.canvas,
      bounds: this.mapManager.getWorldBounds()
    });

    this.resourceManager = new ResourceManager({
      scene: this.scene,
      player: this.player,
      inventory: this.inventory,
      onCollected: ({ resource }) => {
        this.uiManager.showStatus(
          this.getCollectionMessage(resource.type)
        );
      }
    });

    this.spawnResources();

    this.campfire = AssetFactory.createCampfire();
    this.campfire.position.set(-6, 0, 2);
    this.scene.add(this.campfire);

    this.campfireProcessor = new CampfireProcessor({
      inventory: this.inventory,
      processDuration: 1,
      onProcessed: () => {
        this.uiManager.showStatus(
          'Fleisch gegart!'
        );
      }
    });

    this.campfireZone = new TriggerZone({
      scene: this.scene,
      center: new THREE.Vector3(-6, 1, 2),
      size: new THREE.Vector3(4, 3, 4),
      name: 'CampfireZone',
      debug: false,
      onEnter: () => this.campfireProcessor.enter(),
      onStay: () => this.campfireProcessor.stay(),
      onExit: () => this.campfireProcessor.exit()
    });

    this.crowd = this.createCrowd();
    this.scene.add(this.crowd);

    this.sellingZone = new SellingZone({
      inventory: this.inventory,
      gameState: this.gameState,
      prices: {
        wood: 5,
        cookedMeat: 10
      },
      onSold: ({ type, price }) => {
        this.uiManager.showStatus(
          `${this.getResourceLabel(type)} verkauft: +$${price}`,
          700
        );
      }
    });

    this.crowdZone = new TriggerZone({
      scene: this.scene,
      center: new THREE.Vector3(8, 1, 7),
      size: new THREE.Vector3(5, 3, 5),
      name: 'SellingZone',
      debug: false,
      onEnter: () => this.sellingZone.enter(),
      onStay: () => this.sellingZone.stay(),
      onExit: () => this.sellingZone.exit()
    });

    this.uiManager = new UIManager({
      gameState: this.gameState,
      camera: this.camera,
      buyOverlay: document.querySelector('#buy-overlay'),
      statusElement: document.querySelector('#status-message')
    });

    this.uiManager.setBuyOverlayTarget(
      this.mapManager.buyZone,
      this.mapManager.expansionCost
    );
    this.uiManager.setBuyOverlayVisible(true);

    this.cameraTarget = new THREE.Vector3();
    this.cameraDesiredPosition = new THREE.Vector3();
    this.cameraOffset = new THREE.Vector3(28, 30, 28);

    this.clock = new THREE.Clock();
    this.animationFrame = null;
    this.resizeObserver = null;
    this.isRunning = false;

    this.onResize = this.onResize.bind(this);
    this.loop = this.loop.bind(this);
  }

  spawnResources() {
    this.resourceManager.spawnRandom('wood', {
      count: 16,
      minX: -13,
      maxX: 13,
      minZ: -11,
      maxZ: 12,
      scale: 0.8
    });

    this.resourceManager.spawnRandom('rawMeat', {
      count: 10,
      minX: -12,
      maxX: 12,
      minZ: -10,
      maxZ: 11,
      scale: 0.95
    });
  }

  createCrowd() {
    const crowd = new THREE.Group();
    crowd.name = 'MarketplaceCrowd';
    crowd.position.set(8, 0, 7);

    const colors = [
      0xd85c65,
      0xe2a33a,
      0x735bc7,
      0x3ca58b
    ];

    for (let index = 0; index < 4; index += 1) {
      const person = AssetFactory.createPlayer();
      person.scale.setScalar(0.55);
      person.rotation.y = Math.PI;
      person.position.set(
        (index - 1.5) * 1.2,
        0,
        Math.sin(index) * 0.5
      );

      person.traverse((object) => {
        if (
          object.isMesh &&
          object.name === 'PlayerBody'
        ) {
          object.material = object.material.clone();
          object.material.color.setHex(
            colors[index]
          );
        }
      });

      crowd.add(person);
    }

    return crowd;
  }

  getCollectionMessage(type) {
    return `+1 ${this.getResourceLabel(type)}`;
  }

  getResourceLabel(type) {
    const labels = {
      wood: 'Holz',
      rawMeat: 'rohes Fleisch',
      cookedMeat: 'gekochtes Fleisch',
      cash: 'Bargeld'
    };

    return labels[type] ?? type;
  }

  updateCamera(deltaTime) {
    this.player.getWorldPosition(this.cameraTarget);

    this.cameraDesiredPosition.copy(this.cameraTarget)
      .add(this.cameraOffset);

    dampVector3(
      this.camera.position,
      this.cameraDesiredPosition,
      4.5,
      deltaTime,
      this.camera.position
    );

    this.camera.lookAt(this.cameraTarget);
  }

  animateCampfire(elapsedTime) {
    const flame = this.campfire.userData.flame;
    const light = this.campfire.userData.light;

    const pulse = 1 + Math.sin(elapsedTime * 8) * 0.12;

    flame.scale.set(
      0.9 + Math.sin(elapsedTime * 7) * 0.08,
      pulse,
      0.9 + Math.cos(elapsedTime * 6) * 0.08
    );

    light.intensity =
      2.2 + Math.sin(elapsedTime * 9) * 0.35;
  }

  update(deltaTime, elapsedTime) {
    this.playerController.update(deltaTime);
    this.resourceManager.update();

    this.campfireZone.update(this.player);
    this.crowdZone.update(this.player);

    this.campfireProcessor.update(deltaTime);
    this.sellingZone.update(deltaTime);

    this.mapManager.update(
      this.player,
      deltaTime
    );

    this.tweenManager.update(deltaTime);
    this.updateCamera(deltaTime);
    this.animateCampfire(elapsedTime);

    this.uiManager.updateWorldOverlay(
      window.innerWidth,
      window.innerHeight
    );
  }

  loop() {
    if (!this.isRunning) {
      return;
    }

    this.animationFrame = window.requestAnimationFrame(
      this.loop
    );

    const deltaTime = Math.min(
      this.clock.getDelta(),
      0.05
    );

    const elapsedTime = this.clock.elapsedTime;

    this.update(deltaTime, elapsedTime);
    this.sceneSetup.render();
  }

  onResize() {
    this.sceneSetup.resize(
      window.innerWidth,
      window.innerHeight
    );
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    window.addEventListener(
      'resize',
      this.onResize,
      { passive: true }
    );

    this.onResize();
    this.clock.start();
    this.loop();
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.animationFrame) {
      window.cancelAnimationFrame(
        this.animationFrame
      );
    }

    window.removeEventListener(
      'resize',
      this.onResize
    );
  }

  dispose() {
    this.stop();

    this.playerController.dispose();
    this.resourceManager.dispose();
    this.campfireProcessor.dispose();
    this.sellingZone.dispose();
    this.campfireZone.dispose();
    this.crowdZone.dispose();
    this.mapManager.dispose();
    this.uiManager.dispose();
    this.tweenManager.clear();
    this.sceneSetup.dispose();
  }
}
