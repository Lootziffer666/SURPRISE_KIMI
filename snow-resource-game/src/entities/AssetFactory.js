import * as THREE from 'three';

const shared = {
  materials: {},
  geometries: {}
};

function material(name, color, options = {}) {
  if (!shared.materials[name]) {
    shared.materials[name] = new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.82,
      metalness: options.metalness ?? 0,
      flatShading: options.flatShading ?? true,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      emissive: options.emissive,
      emissiveIntensity: options.emissiveIntensity
    });
  }

  return shared.materials[name];
}

function geometry(name, factory) {
  if (!shared.geometries[name]) {
    shared.geometries[name] = factory();
  }

  return shared.geometries[name];
}

function createMesh(geometryInstance, materialInstance, {
  castShadow = true,
  receiveShadow = true,
  name = ''
} = {}) {
  const mesh = new THREE.Mesh(
    geometryInstance,
    materialInstance
  );

  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  mesh.name = name;

  return mesh;
}

function configureGroup(group, type) {
  group.name = type;
  group.userData.assetType = type;
  return group;
}

export class AssetFactory {
  static createPlayer() {
    const player = configureGroup(
      new THREE.Group(),
      'player'
    );

    const body = createMesh(
      geometry('playerBody', () =>
        new THREE.CapsuleGeometry(0.58, 1.35, 5, 10)
      ),
      material('playerBlue', 0x2574bd),
      { name: 'PlayerBody' }
    );

    body.position.y = 1.25;
    player.add(body);

    const head = createMesh(
      geometry('playerHead', () =>
        new THREE.SphereGeometry(0.48, 10, 8)
      ),
      material('playerSkin', 0xffc7a1),
      { name: 'PlayerHead' }
    );

    head.position.set(0, 2.35, 0);
    player.add(head);

    const hair = createMesh(
      geometry('playerHair', () =>
        new THREE.SphereGeometry(0.51, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55)
      ),
      material('playerHair', 0x4d3026),
      { name: 'PlayerHair' }
    );

    hair.position.set(0, 2.46, 0);
    player.add(hair);

    const armGeometry = geometry(
      'playerArm',
      () => new THREE.CapsuleGeometry(0.14, 0.58, 4, 8)
    );

    const leftArm = createMesh(
      armGeometry,
      material('playerBlue'),
      { name: 'LeftArm' }
    );

    leftArm.position.set(-0.68, 1.35, 0);
    leftArm.rotation.z = -0.16;
    player.add(leftArm);

    const rightArm = createMesh(
      armGeometry,
      material('playerBlue'),
      { name: 'RightArm' }
    );

    rightArm.position.set(0.68, 1.35, 0);
    rightArm.rotation.z = 0.16;
    player.add(rightArm);

    const legGeometry = geometry(
      'playerLeg',
      () => new THREE.CapsuleGeometry(0.17, 0.58, 4, 8)
    );

    const leftLeg = createMesh(
      legGeometry,
      material('playerPants', 0x183b68),
      { name: 'LeftLeg' }
    );

    leftLeg.position.set(-0.27, 0.42, 0);
    player.add(leftLeg);

    const rightLeg = createMesh(
      legGeometry,
      material('playerPants'),
      { name: 'RightLeg' }
    );

    rightLeg.position.set(0.27, 0.42, 0);
    player.add(rightLeg);

    const backpack = createMesh(
      geometry('backpack', () =>
        new THREE.BoxGeometry(0.9, 1.05, 0.42)
      ),
      material('backpack', 0x6b3e2b),
      { name: 'Backpack' }
    );

    backpack.position.set(0, 1.35, 0.43);
    player.add(backpack);

    const stackGroup = new THREE.Group();
    stackGroup.name = 'InventoryStackGroup';
    stackGroup.position.set(0, 1.9, 0.58);
    player.add(stackGroup);

    player.userData.inventoryStackGroup = stackGroup;
    player.userData.backpack = backpack;

    return player;
  }

  static createTree({
    scale = 1,
    rotation = Math.random() * Math.PI * 2
  } = {}) {
    const tree = configureGroup(
      new THREE.Group(),
      'tree'
    );

    const trunk = createMesh(
      geometry('treeTrunk', () =>
        new THREE.CylinderGeometry(0.22, 0.3, 1.55, 7)
      ),
      material('treeTrunk', 0x70432c),
      { name: 'TreeTrunk' }
    );

    trunk.position.y = 0.78;
    tree.add(trunk);

    const foliageMaterial = material('treeFoliage', 0x2f7659);
    const snowMaterial = material('treeSnow', 0xf5fbff);

    const foliageData = [
      { radius: 1.05, height: 1.75, y: 1.65 },
      { radius: 0.84, height: 1.55, y: 2.65 },
      { radius: 0.58, height: 1.35, y: 3.5 }
    ];

    foliageData.forEach((data, index) => {
      const foliage = createMesh(
        geometry(`treeFoliage${index}`, () =>
          new THREE.ConeGeometry(
            data.radius,
            data.height,
            8
          )
        ),
        foliageMaterial,
        { name: `Foliage${index}` }
      );

      foliage.position.y = data.y;
      tree.add(foliage);

      if (index < 2) {
        const snowCap = createMesh(
          geometry(`treeSnowCap${index}`, () =>
            new THREE.ConeGeometry(
              data.radius * 0.78,
              0.24,
              8
            )
          ),
          snowMaterial,
          { name: `SnowCap${index}` }
        );

        snowCap.position.y = data.y + data.height * 0.27;
        tree.add(snowCap);
      }
    });

    tree.scale.setScalar(scale);
    tree.rotation.y = rotation;

    return tree;
  }

  static createBear() {
    const bear = configureGroup(
      new THREE.Group(),
      'bear'
    );

    const white = material('bearWhite', 0xf7fbff);
    const dark = material('bearDark', 0x273746);

    const body = createMesh(
      geometry('bearBody', () =>
        new THREE.BoxGeometry(1.6, 1.05, 0.9)
      ),
      white,
      { name: 'BearBody' }
    );

    body.position.y = 1.05;
    bear.add(body);

    const head = createMesh(
      geometry('bearHead', () =>
        new THREE.SphereGeometry(0.58, 10, 8)
      ),
      white,
      { name: 'BearHead' }
    );

    head.position.set(0, 1.8, -0.18);
    bear.add(head);

    const earGeometry = geometry(
      'bearEar',
      () => new THREE.SphereGeometry(0.18, 8, 6)
    );

    for (const x of [-0.38, 0.38]) {
      const ear = createMesh(
        earGeometry,
        white,
        { name: 'BearEar' }
      );

      ear.position.set(x, 2.18, -0.18);
      bear.add(ear);
    }

    const nose = createMesh(
      geometry('bearNose', () =>
        new THREE.SphereGeometry(0.12, 8, 6)
      ),
      dark,
      { name: 'BearNose' }
    );

    nose.position.set(0, 1.78, -0.68);
    bear.add(nose);

    const eyeGeometry = geometry(
      'bearEye',
      () => new THREE.SphereGeometry(0.055, 6, 5)
    );

    for (const x of [-0.2, 0.2]) {
      const eye = createMesh(
        eyeGeometry,
        dark,
        { name: 'BearEye' }
      );

      eye.position.set(x, 1.95, -0.62);
      bear.add(eye);
    }

    const legGeometry = geometry(
      'bearLeg',
      () => new THREE.CylinderGeometry(0.17, 0.2, 0.72, 7)
    );

    for (const x of [-0.55, 0.55]) {
      for (const z of [-0.28, 0.28]) {
        const leg = createMesh(
          legGeometry,
          white,
          { name: 'BearLeg' }
        );

        leg.position.set(x, 0.38, z);
        bear.add(leg);
      }
    }

    return bear;
  }

  static createWood() {
    const wood = configureGroup(
      new THREE.Group(),
      'wood'
    );

    const log = createMesh(
      geometry('woodLog', () =>
        new THREE.CylinderGeometry(0.28, 0.28, 0.9, 8)
      ),
      material('wood', 0x9a592f),
      { name: 'WoodLog' }
    );

    log.rotation.z = Math.PI / 2;
    log.position.y = 0.3;
    wood.add(log);

    return wood;
  }

  static createRawMeat() {
    const meat = configureGroup(
      new THREE.Group(),
      'rawMeat'
    );

    const slab = createMesh(
      geometry('rawMeatSlab', () =>
        new THREE.BoxGeometry(0.66, 0.22, 0.52)
      ),
      material('rawMeat', 0xb9404d),
      { name: 'RawMeatSlab' }
    );

    slab.position.y = 0.11;
    meat.add(slab);

    return meat;
  }

  static createCookedMeat() {
    const meat = configureGroup(
      new THREE.Group(),
      'cookedMeat'
    );

    const slab = createMesh(
      geometry('cookedMeatSlab', () =>
        new THREE.BoxGeometry(0.66, 0.22, 0.52)
      ),
      material('cookedMeat', 0x9a4d26),
      { name: 'CookedMeatSlab' }
    );

    slab.position.y = 0.11;
    meat.add(slab);

    return meat;
  }

  static createCash() {
    const cash = configureGroup(
      new THREE.Group(),
      'cash'
    );

    const bundle = createMesh(
      geometry('cashBundle', () =>
        new THREE.BoxGeometry(0.48, 0.18, 0.32)
      ),
      material('cash', 0x42c96d),
      { name: 'CashBundle' }
    );

    bundle.position.y = 0.09;
    cash.add(bundle);

    return cash;
  }

  static createFencePost() {
    const post = createMesh(
      geometry('fencePost', () =>
        new THREE.CylinderGeometry(0.16, 0.2, 1.8, 6)
      ),
      material('fenceWood', 0x795039),
      { name: 'FencePost' }
    );

    post.position.y = 0.9;
    post.userData.assetType = 'fencePost';

    return post;
  }

  static createFenceRail(length = 2) {
    const rail = createMesh(
      geometry(`fenceRail${length}`, () =>
        new THREE.BoxGeometry(length, 0.16, 0.16)
      ),
      material('fenceRail', 0x95613e),
      { name: 'FenceRail' }
    );

    rail.position.y = 1.12;
    rail.userData.assetType = 'fenceRail';

    return rail;
  }

  static createCampfire() {
    const campfire = configureGroup(
      new THREE.Group(),
      'campfire'
    );

    const logMaterial = material('campfireLogs', 0x6c3827);
    const fireMaterial = material(
      'campfireGlow',
      0xff6b16,
      {
        emissive: 0xff3d00,
        emissiveIntensity: 2.7,
        transparent: true,
        opacity: 0.95
      }
    );

    const logGeometry = geometry(
      'campfireLog',
      () => new THREE.CylinderGeometry(0.16, 0.19, 1.5, 7)
    );

    for (let index = 0; index < 3; index += 1) {
      const log = createMesh(
        logGeometry,
        logMaterial,
        { name: 'CampfireLog' }
      );

      log.rotation.z = Math.PI / 2;
      log.rotation.y = index * Math.PI / 3;
      log.position.y = 0.18;
      campfire.add(log);
    }

    const flame = createMesh(
      geometry('campfireFlame', () =>
        new THREE.ConeGeometry(0.48, 1.25, 7)
      ),
      fireMaterial,
      {
        name: 'CampfireFlame',
        castShadow: false,
        receiveShadow: false
      }
    );

    flame.position.y = 0.9;
    campfire.add(flame);

    const light = new THREE.PointLight(
      0xff7a26,
      2.4,
      8,
      2
    );

    light.position.y = 1.1;
    campfire.add(light);

    campfire.userData.flame = flame;
    campfire.userData.light = light;

    return campfire;
  }

  static createPond(width = 14, depth = 9) {
    const pond = createMesh(
      geometry(`pond${width}x${depth}`, () =>
        new THREE.BoxGeometry(width, 0.08, depth)
      ),
      material(
        `pondMaterial${width}x${depth}`,
        0x59b5d1,
        {
          roughness: 0.35,
          metalness: 0.05,
          transparent: true,
          opacity: 0.92
        }
      ),
      {
        name: 'FishingPond',
        castShadow: false,
        receiveShadow: true
      }
    );

    pond.userData.assetType = 'pond';
    return pond;
  }
}
