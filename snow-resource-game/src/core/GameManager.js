import { AssetFactory } from '../entities/AssetFactory.js';
import { InventoryStack } from '../inventory/InventoryStack.js';
import { CampfireProcessor } from '../interaction/CampfireProcessor.js';
import { SellingZone } from '../interaction/SellingZone.js';
import { PlayerController } from '../controllers/PlayerController.js';
import { ResourceManager } from '../world/ResourceManager.js';
import { MapManager } from '../world/MapManager.js';
import { UIManager } from '../ui/UIManager.js';
import { Tweens } from '../utils/Tween.js';
import { GameState } from './GameState.js';
import { SceneSetup } from './SceneSetup.js';

const MAX_DELTA_SECONDS = 0.05;

/**
 * Wires the generated gameplay systems together and owns the main loop.
 * The archive referenced this module from src/main.js but did not include it.
 */
export class GameManager {
  constructor(container) {
    if (!container) throw new Error('GameManager requires a container element.');

    this.container = container;
    this.gameState = new GameState();
    this.sceneSetup = new SceneSetup(container);
    this.ui = new UIManager({ gameState: this.gameState });

    this.map = new MapManager({
      scene: this.sceneSetup.scene,
      gameState: this.gameState,
      onBuyFailed: () => this.ui.flashBuyLabel(),
    });

    this.player = AssetFactory.createPlayer();
    this.player.position.set(0, 0, 0);
    this.sceneSetup.scene.add(this.player);

    this.inventory = new InventoryStack(this.player.userData.inventoryMount);
    this.resources = new ResourceManager({
      scene: this.sceneSetup.scene,
      inventory: this.inventory,
      exclusions: this.map.getSpawnExclusions(),
    });
    this.resources.spawnInitial(this.map.getStartArea());

    this.campfire = new CampfireProcessor({
      scene: this.sceneSetup.scene,
      position: this.map.campfirePosition,
      inventory: this.inventory,
    });

    this.market = new SellingZone({
      scene: this.sceneSetup.scene,
      position: this.map.marketPosition,
      inventory: this.inventory,
      gameState: this.gameState,
    });

    this.controller = new PlayerController({
      object: this.player,
      camera: this.sceneSetup.camera,
      domElement: this.sceneSetup.renderer.domElement,
      bounds: this.map.worldBounds,
    });

    const expansion = this.map.expansions[0];
    if (expansion) this.ui.setBuyLabel(this.map.buyLabelAnchor, expansion.cost);

    this.map.onExpansionUnlocked = () => {
      this.resources.spawnExpansionResources(this.map.getExpansionArea());
      this.ui.hideBuyLabel();
    };

    this.sceneSetup.snapCameraTo(this.player.position);

    this._running = false;
    this._frameId = 0;
    this._lastTime = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._frameId = requestAnimationFrame(this._tick);
  }

  stop() {
    if (!this._running) return;
    this._running = false;
    cancelAnimationFrame(this._frameId);
    this._frameId = 0;
  }

  _tick(now) {
    if (!this._running) return;

    const dt = Math.min((now - this._lastTime) / 1000, MAX_DELTA_SECONDS);
    this._lastTime = now;

    this.controller.update(dt);
    this.map.applyObstacles(this.player.position);
    this.map.update(dt, this.player.position, this.controller.halfExtents);
    this.resources.update(dt, this.player.position);
    this.campfire.update(dt, this.player.position, this.controller.halfExtents);
    this.market.update(dt, this.player.position, this.controller.halfExtents);
    Tweens.update(dt);

    this.sceneSetup.followPlayer(this.player.position, dt);
    this.ui.updateWorldOverlays(this.sceneSetup.camera);
    this.sceneSetup.renderer.render(this.sceneSetup.scene, this.sceneSetup.camera);

    this._frameId = requestAnimationFrame(this._tick);
  }

  dispose() {
    this.stop();
    this.controller.dispose();
    this.ui.dispose();
    this.sceneSetup.dispose();
    Tweens.clear();
  }
}
