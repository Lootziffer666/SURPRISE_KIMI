import * as THREE from 'three';
import { dampValue } from '../utils/MathUtils.js';

const FRUSTUM_HEIGHT = 12;
const CAMERA_OFFSET = new THREE.Vector3(9, 11, 9);
const CAMERA_DAMPING = 6;
const LIGHT_OFFSET = new THREE.Vector3(12, 18, 6);
const SHADOW_AREA = 24;
const MAX_PIXEL_RATIO = 2;

/**
 * Owns renderer, orthographic isometric camera, lights and the
 * resize handling. The camera smoothly damp-follows a world target
 * and the sun light follows along so shadows stay in range.
 */
export class SceneSetup {
  constructor(container) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcfe0f2);
    this.scene.fog = new THREE.Fog(0xcfe0f2, 34, 78);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      (-FRUSTUM_HEIGHT * aspect) / 2,
      (FRUSTUM_HEIGHT * aspect) / 2,
      FRUSTUM_HEIGHT / 2,
      -FRUSTUM_HEIGHT / 2,
      0.1,
      120
    );
    this.camera.zoom = 1;

    this._focus = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(CAMERA_OFFSET);
    this.camera.lookAt(this._focus);

    const hemi = new THREE.HemisphereLight(0xdcecff, 0xf4f8ff, 0.85);
    this.scene.add(hemi);

    this.sun = new THREE.DirectionalLight(0xfff1dd, 2.4);
    this.sun.position.copy(LIGHT_OFFSET);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const shadowCam = this.sun.shadow.camera;
    shadowCam.left = -SHADOW_AREA;
    shadowCam.right = SHADOW_AREA;
    shadowCam.top = SHADOW_AREA;
    shadowCam.bottom = -SHADOW_AREA;
    shadowCam.near = 1;
    shadowCam.far = 70;
    shadowCam.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun);

    this.lightTarget = new THREE.Object3D();
    this.scene.add(this.lightTarget);
    this.sun.target = this.lightTarget;

    this._onResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  /** Delta-aware smooth follow of the world focus point towards the target. */
  followPlayer(target, dt) {
    this._focus.x = dampValue(this._focus.x, target.x, CAMERA_DAMPING, dt);
    this._focus.y = dampValue(this._focus.y, target.y, CAMERA_DAMPING, dt);
    this._focus.z = dampValue(this._focus.z, target.z, CAMERA_DAMPING, dt);

    this.camera.position.copy(this._focus).add(CAMERA_OFFSET);
    this.camera.lookAt(this._focus);
    this.camera.updateMatrixWorld();

    this.sun.position.copy(this._focus).add(LIGHT_OFFSET);
    this.lightTarget.position.copy(this._focus);
    this.lightTarget.position.y = 0;
  }

  /** Instant camera placement, used once at spawn to avoid an initial lerp. */
  snapCameraTo(position) {
    this._focus.set(position.x, position.y, position.z);
    this.camera.position.copy(this._focus).add(CAMERA_OFFSET);
    this.camera.lookAt(this._focus);
    this.camera.updateMatrixWorld();
    this.sun.position.copy(this._focus).add(LIGHT_OFFSET);
    this.lightTarget.position.copy(this._focus);
    this.lightTarget.position.y = 0;
  }

  _handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.renderer.setSize(width, height);

    const aspect = width / height;
    this.camera.left = (-FRUSTUM_HEIGHT * aspect) / 2;
    this.camera.right = (FRUSTUM_HEIGHT * aspect) / 2;
    this.camera.top = FRUSTUM_HEIGHT / 2;
    this.camera.bottom = -FRUSTUM_HEIGHT / 2;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}
