import * as THREE from 'three';

export class SceneSetup {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbfe0ef);
    this.scene.fog = new THREE.Fog(0xbfe0ef, 80, 180);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.camera = new THREE.OrthographicCamera(
      -10,
      10,
      10,
      -10,
      0.1,
      300
    );

    this.camera.position.set(28, 30, 28);
    this.camera.lookAt(0, 0, 0);

    this.ambientLight = new THREE.HemisphereLight(
      0xddefff,
      0x7193a7,
      2.2
    );

    this.sunLight = new THREE.DirectionalLight(0xfff4da, 3.2);
    this.sunLight.position.set(-35, 50, 20);
    this.sunLight.castShadow = true;

    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -70;
    this.sunLight.shadow.camera.right = 70;
    this.sunLight.shadow.camera.top = 70;
    this.sunLight.shadow.camera.bottom = -70;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.bias = -0.0002;
    this.sunLight.shadow.normalBias = 0.02;

    this.scene.add(this.ambientLight);
    this.scene.add(this.sunLight);
  }

  resize(width, height) {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const aspect = safeWidth / safeHeight;
    const viewHeight = 22;
    const viewWidth = viewHeight * aspect;

    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.setSize(safeWidth, safeHeight, false);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
