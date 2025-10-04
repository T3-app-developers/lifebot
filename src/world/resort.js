const TAU = Math.PI * 2;

function createWaterMaterial(scene) {
  const waterMat = new BABYLON.PBRMaterial('resortWaterMat', scene);
  waterMat.albedoColor = new BABYLON.Color3(0.1, 0.35, 0.5);
  waterMat.metallic = 0.0;
  waterMat.roughness = 0.15;
  waterMat.alpha = 0.92;
  waterMat.subSurface.isRefractionEnabled = true;
  waterMat.subSurface.refractionIntensity = 0.6;
  waterMat.subSurface.indexOfRefraction = 1.33;
  waterMat.backFaceCulling = false;
  return waterMat;
}

function createLeafMaterial(scene) {
  const mat = new BABYLON.PBRMaterial('resortLeafMat', scene);
  mat.albedoColor = new BABYLON.Color3(0.18, 0.45, 0.18);
  mat.metallic = 0.1;
  mat.roughness = 0.65;
  mat.subSurface.isTranslucencyEnabled = true;
  mat.subSurface.tintColor = new BABYLON.Color3(0.32, 0.6, 0.32);
  return mat;
}

function createPalm(scene, materials, shadowGenerator, position, leafMaterial) {
  const palm = new BABYLON.TransformNode('resortPalm', scene);
  palm.position.copyFrom(position);

  const trunk = BABYLON.MeshBuilder.CreateCylinder('resortPalmTrunk', {
    diameterTop: 0.55,
    diameterBottom: 0.9,
    height: 9,
    tessellation: 12
  }, scene);
  trunk.material = materials.wood.clone('resortPalmTrunkMat');
  trunk.material.albedoColor = new BABYLON.Color3(0.45, 0.3, 0.18);
  trunk.position.y = 4.5;
  trunk.parent = palm;
  trunk.checkCollisions = true;
  trunk.receiveShadows = true;
  shadowGenerator?.addShadowCaster(trunk);

  const frondCount = 8;
  for (let i = 0; i < frondCount; i++) {
    const frond = BABYLON.MeshBuilder.CreateGround('resortPalmFrond', {
      width: 4.6,
      height: 1.2,
      subdivisions: 8
    }, scene);
    frond.material = leafMaterial;
    frond.parent = palm;
    frond.position = new BABYLON.Vector3(0, 9, 0);
    frond.rotation = new BABYLON.Vector3(BABYLON.Tools.ToRadians(45), (i / frondCount) * TAU, 0);
    frond.convertToFlatShadedMesh();
  }

  return palm;
}

function createVisitorCenter(scene, materials, shadowGenerator, parent) {
  const visitorCenter = new BABYLON.TransformNode('resortVisitorCenter', scene);
  visitorCenter.parent = parent;

  const base = BABYLON.MeshBuilder.CreateCylinder('resortVisitorBase', {
    diameterTop: 36,
    diameterBottom: 42,
    height: 8,
    tessellation: 32
  }, scene);
  base.position.y = 4;
  base.material = materials.plaza.clone('resortVisitorBaseMat');
  base.material.albedoColor = new BABYLON.Color3(0.78, 0.72, 0.68);
  base.parent = visitorCenter;
  base.checkCollisions = true;
  base.receiveShadows = true;
  shadowGenerator?.addShadowCaster(base);

  const dome = BABYLON.MeshBuilder.CreateSphere('resortVisitorDome', {
    diameter: 32,
    segments: 32
  }, scene);
  dome.material = materials.glass.clone('resortVisitorDomeMat');
  dome.material.alpha = 0.55;
  dome.material.subSurface.tintColor = new BABYLON.Color3(0.65, 0.85, 0.95);
  dome.position.y = 14;
  dome.parent = visitorCenter;

  const spine = BABYLON.MeshBuilder.CreateCylinder('resortVisitorSpine', {
    height: 16,
    diameter: 2,
    tessellation: 12
  }, scene);
  spine.position.y = 8;
  spine.material = materials.metal.clone('resortVisitorSpineMat');
  spine.material.albedoColor = new BABYLON.Color3(0.5, 0.55, 0.6);
  spine.parent = visitorCenter;
  shadowGenerator?.addShadowCaster(spine);

  const halo = BABYLON.MeshBuilder.CreateTorus('resortVisitorHalo', {
    diameter: 20,
    thickness: 1.2,
    tessellation: 48
  }, scene);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 16;
  halo.material = materials.neon.clone('resortVisitorHaloMat');
  halo.material.emissiveColor = new BABYLON.Color3(0.45, 0.85, 1.0);
  halo.parent = visitorCenter;

  const terraces = 3;
  for (let i = 0; i < terraces; i++) {
    const ring = BABYLON.MeshBuilder.CreateTorus(`resortVisitorRing_${i}`, {
      diameter: 28 + i * 3,
      thickness: 0.6,
      tessellation: 32
    }, scene);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 6 + i * 1.4;
    ring.material = materials.metal.clone(`resortVisitorRingMat_${i}`);
    ring.material.albedoColor = new BABYLON.Color3(0.65 - i * 0.05, 0.7 - i * 0.05, 0.74 - i * 0.04);
    ring.parent = visitorCenter;
    shadowGenerator?.addShadowCaster(ring);
  }

  return { node: visitorCenter, base, dome };
}

function createLagoon(scene, parent, waterMaterial) {
  const lagoon = BABYLON.MeshBuilder.CreateDisc('resortLagoon', {
    radius: 42,
    tessellation: 80
  }, scene);
  lagoon.rotation.x = Math.PI / 2;
  lagoon.material = waterMaterial;
  lagoon.parent = parent;
  lagoon.receiveShadows = true;

  const rippleAnim = new BABYLON.Animation('resortLagoonRipple', 'scaling.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  rippleAnim.setKeys([
    { frame: 0, value: 1 },
    { frame: 30, value: 1.02 },
    { frame: 60, value: 1 }
  ]);
  lagoon.animations = [rippleAnim];
  scene.beginAnimation(lagoon, 0, 60, true);

  return lagoon;
}

function createBoardwalk(scene, materials, parent) {
  const boardwalk = BABYLON.MeshBuilder.CreateTorus('resortBoardwalk', {
    diameter: 60,
    thickness: 3.8,
    tessellation: 64
  }, scene);
  boardwalk.rotation.x = Math.PI / 2;
  boardwalk.material = materials.wood.clone('resortBoardwalkMat');
  boardwalk.material.albedoColor = new BABYLON.Color3(0.58, 0.44, 0.3);
  boardwalk.parent = parent;
  boardwalk.checkCollisions = true;
  return boardwalk;
}

function createAviary(scene, materials, shadowGenerator, parent) {
  const aviary = new BABYLON.TransformNode('resortAviary', scene);
  aviary.parent = parent;
  aviary.position = new BABYLON.Vector3(70, 0, -30);

  const base = BABYLON.MeshBuilder.CreateCylinder('resortAviaryBase', {
    height: 6,
    diameter: 26,
    tessellation: 32
  }, scene);
  base.position.y = 3;
  base.material = materials.plaza.clone('resortAviaryBaseMat');
  base.material.albedoColor = new BABYLON.Color3(0.7, 0.68, 0.62);
  base.parent = aviary;
  base.checkCollisions = true;
  base.receiveShadows = true;
  shadowGenerator?.addShadowCaster(base);

  const lattice = BABYLON.MeshBuilder.CreateSphere('resortAviaryLattice', {
    diameter: 32,
    segments: 12
  }, scene);
  lattice.parent = aviary;
  lattice.position.y = 18;
  lattice.material = materials.metal.clone('resortAviaryLatticeMat');
  lattice.material.albedoColor = new BABYLON.Color3(0.65, 0.7, 0.74);
  lattice.material.alpha = 0.3;

  const innerSphere = BABYLON.MeshBuilder.CreateSphere('resortAviaryInner', {
    diameter: 24,
    segments: 24
  }, scene);
  innerSphere.position.y = 16;
  innerSphere.material = materials.glass.clone('resortAviaryInnerMat');
  innerSphere.material.alpha = 0.35;
  innerSphere.parent = aviary;

  const perch = BABYLON.MeshBuilder.CreateCylinder('resortAviaryPerch', {
    height: 12,
    diameter: 1.2
  }, scene);
  perch.position = new BABYLON.Vector3(0, 12, 0);
  perch.material = materials.wood.clone('resortAviaryPerchMat');
  perch.parent = aviary;
  shadowGenerator?.addShadowCaster(perch);

  return aviary;
}

function createLagoonGondola(scene, materials, parent, interactionManager, hud, gameState) {
  const gondola = new BABYLON.TransformNode('resortGondola', scene);
  gondola.parent = parent;
  gondola.position = new BABYLON.Vector3(0, 2.8, -28);

  const hull = BABYLON.MeshBuilder.CreateBox('resortGondolaHull', { width: 5, height: 1.2, depth: 2.4 }, scene);
  hull.parent = gondola;
  hull.material = materials.metal.clone('resortGondolaHullMat');
  hull.material.albedoColor = new BABYLON.Color3(0.22, 0.35, 0.48);
  hull.position.y = 0.6;

  const canopy = BABYLON.MeshBuilder.CreateCylinder('resortGondolaCanopy', { diameterTop: 2.4, diameterBottom: 2.8, height: 2.4 }, scene);
  canopy.parent = gondola;
  canopy.position.y = 2;
  canopy.material = materials.glass.clone('resortGondolaCanopyMat');
  canopy.material.alpha = 0.5;

  const rail = BABYLON.MeshBuilder.CreateTube('resortGondolaRail', {
    path: [
      new BABYLON.Vector3(0, 6, -28),
      new BABYLON.Vector3(10, 8, -10),
      new BABYLON.Vector3(0, 8, 18),
      new BABYLON.Vector3(-12, 9, 6),
      new BABYLON.Vector3(0, 6, -28)
    ],
    radius: 0.4,
    tessellation: 32,
    updatable: true
  }, scene);
  rail.material = materials.metal.clone('resortGondolaRailMat');
  rail.material.albedoColor = new BABYLON.Color3(0.62, 0.7, 0.78);
  rail.parent = parent;

  const animation = new BABYLON.Animation('resortGondolaAnim', 'position', 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  animation.setKeys([
    { frame: 0, value: new BABYLON.Vector3(0, 2.8, -28) },
    { frame: 90, value: new BABYLON.Vector3(10, 4.2, -10) },
    { frame: 180, value: new BABYLON.Vector3(0, 4.5, 18) },
    { frame: 240, value: new BABYLON.Vector3(-12, 3.9, 6) },
    { frame: 300, value: new BABYLON.Vector3(0, 2.8, -28) }
  ]);
  gondola.animations = [animation];

  let running = true;
  scene.beginAnimation(gondola, 0, 300, true);

  const controlPanel = BABYLON.MeshBuilder.CreatePlane('resortGondolaPanel', { width: 2, height: 1.2 }, scene);
  controlPanel.position = new BABYLON.Vector3(-6, 1.2, -20);
  controlPanel.rotation.y = BABYLON.Tools.ToRadians(40);
  controlPanel.material = materials.neon.clone('resortGondolaPanelMat');
  controlPanel.material.emissiveColor = new BABYLON.Color3(0.4, 0.9, 0.8);
  controlPanel.parent = parent;

  interactionManager.register(controlPanel, {
    prompt: 'Press E to toggle the lagoon gondola',
    tooltip: '<strong>Lagoon Transit</strong><br/>Enjoy a panoramic glide across the biodome lagoon.',
    action: () => {
      running = !running;
      if (running) {
        scene.beginAnimation(gondola, 0, 300, true);
        hud.pushNotification('Gondola resumes its tour.', 'info', 2400);
      } else {
        scene.stopAnimation(gondola);
        hud.pushNotification('Gondola paused for boarding.', 'success', 2400);
      }
      gameState.addCoins(2, 'Lagoon excursion');
      gameState.setFlag('resort-tour', true);
    }
  });

  return { gondola, rail, controlPanel };
}

function createResearchHabitats(scene, materials, shadowGenerator, parent, interactionManager, hud) {
  const habitats = new BABYLON.TransformNode('resortHabitats', scene);
  habitats.parent = parent;
  habitats.position = new BABYLON.Vector3(-64, 0, 32);

  const enclosureCount = 3;
  const enclosureRadius = 16;

  const infoPanel = BABYLON.MeshBuilder.CreatePlane('resortHabitatPanel', { width: 3, height: 2 }, scene);
  infoPanel.parent = habitats;
  infoPanel.position = new BABYLON.Vector3(0, 3, -12);
  infoPanel.rotation.y = BABYLON.Tools.ToRadians(-20);
  infoPanel.material = materials.neon.clone('resortHabitatPanelMat');
  infoPanel.material.emissiveColor = new BABYLON.Color3(0.8, 0.6, 1.0);

  interactionManager.register(infoPanel, {
    prompt: 'Press E to review habitat logs',
    tooltip: '<strong>Genetic Sanctuaries</strong><br/>Read about our latest rewilding efforts.',
    action: () => {
      hud.pushNotification('Holographic panels detail herbivore migration patterns.', 'info', 3600);
    }
  });

  for (let i = 0; i < enclosureCount; i++) {
    const angle = (i / enclosureCount) * TAU;
    const enclosure = BABYLON.MeshBuilder.CreateCylinder(`resortHabitat_${i}`, {
      height: 6,
      diameter: enclosureRadius,
      tessellation: 32
    }, scene);
    enclosure.position = new BABYLON.Vector3(Math.cos(angle) * 28, 3, Math.sin(angle) * 28);
    enclosure.material = materials.metal.clone(`resortHabitatMat_${i}`);
    enclosure.material.albedoColor = new BABYLON.Color3(0.55, 0.6, 0.65);
    enclosure.material.alpha = 0.35;
    enclosure.parent = habitats;

    const foliage = BABYLON.MeshBuilder.CreateSphere(`resortHabitatFoliage_${i}`, {
      diameter: 12,
      segments: 16
    }, scene);
    foliage.position = enclosure.position.add(new BABYLON.Vector3(0, 6, 0));
    foliage.material = materials.emissive.clone(`resortHabitatFoliageMat_${i}`);
    foliage.material.emissiveColor = new BABYLON.Color3(0.2, 0.5, 0.2);
    foliage.parent = habitats;

    shadowGenerator?.addShadowCaster(foliage);
  }

  return habitats;
}

export function createFuturisticResort(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrainRefs) {
  const root = new BABYLON.TransformNode('futuristicResortRoot', scene);

  const ground = terrainRefs?.ground;
  const baseHeight = ground ? ground.getHeightAtCoordinates(120, 60) : 0;
  root.position = new BABYLON.Vector3(120, baseHeight, 60);

  const plaza = BABYLON.MeshBuilder.CreateGround('resortPlaza', {
    width: 160,
    height: 140,
    subdivisions: 4
  }, scene);
  plaza.material = materials.plaza.clone('resortPlazaMat');
  plaza.material.albedoColor = new BABYLON.Color3(0.82, 0.8, 0.75);
  plaza.checkCollisions = true;
  plaza.receiveShadows = true;
  plaza.parent = root;

  const waterMaterial = createWaterMaterial(scene);
  const leafMaterial = createLeafMaterial(scene);

  const lagoon = createLagoon(scene, root, waterMaterial);
  const boardwalk = createBoardwalk(scene, materials, root);
  const visitorCenter = createVisitorCenter(scene, materials, shadowGenerator, root);
  const aviary = createAviary(scene, materials, shadowGenerator, root);
  const habitats = createResearchHabitats(scene, materials, shadowGenerator, root, interactionManager, hud);
  const gondola = createLagoonGondola(scene, materials, root, interactionManager, hud, gameState);

  const palmPositions = [
    new BABYLON.Vector3(20, 0, 40),
    new BABYLON.Vector3(-24, 0, 36),
    new BABYLON.Vector3(-36, 0, -8),
    new BABYLON.Vector3(34, 0, -18),
    new BABYLON.Vector3(12, 0, -46),
    new BABYLON.Vector3(-18, 0, -44)
  ];
  palmPositions.forEach((pos, idx) => {
    const palm = createPalm(scene, materials, shadowGenerator, pos, leafMaterial);
    palm.name = `resortPalm_${idx}`;
    palm.parent = root;
  });

  const ambientSound = new BABYLON.Sound('resortAmbience', 'https://assets.babylonjs.com/sounds/ambienceBirds.wav', scene, null, {
    autoplay: true,
    loop: true,
    volume: 0.35
  });
  ambientSound.attachToMesh(root);

  const spotlight = new BABYLON.SpotLight('resortSpotlight', new BABYLON.Vector3(0, 40, -10), new BABYLON.Vector3(0, -1, 0.2), Math.PI / 2.6, 10, scene);
  spotlight.intensity = 0.8;
  spotlight.diffuse = new BABYLON.Color3(0.9, 0.95, 1);
  spotlight.specular = new BABYLON.Color3(1, 1, 1);
  spotlight.parent = root;
  shadowGenerator?.addShadowCaster(visitorCenter.base);

  const pathLightCount = 10;
  for (let i = 0; i < pathLightCount; i++) {
    const angle = (i / pathLightCount) * TAU;
    const lightPost = BABYLON.MeshBuilder.CreateCylinder(`resortLightPost_${i}`, {
      height: 4.2,
      diameter: 0.4
    }, scene);
    lightPost.position = new BABYLON.Vector3(Math.cos(angle) * 28, 2.1, Math.sin(angle) * 28);
    lightPost.material = materials.metal.clone(`resortLightPostMat_${i}`);
    lightPost.material.albedoColor = new BABYLON.Color3(0.5, 0.55, 0.6);
    lightPost.parent = root;
    shadowGenerator?.addShadowCaster(lightPost);

    const bulb = BABYLON.MeshBuilder.CreateSphere(`resortLightBulb_${i}`, { diameter: 0.9 }, scene);
    bulb.position = lightPost.position.add(new BABYLON.Vector3(0, 2.4, 0));
    bulb.material = materials.neon.clone(`resortLightBulbMat_${i}`);
    bulb.material.emissiveColor = new BABYLON.Color3(0.9, 0.95, 1.0);
    bulb.parent = root;

    const omni = new BABYLON.PointLight(`resortPathLight_${i}`, bulb.position.clone(), scene);
    omni.intensity = 0.4;
    omni.parent = root;
  }

  return {
    root,
    plaza,
    lagoon,
    boardwalk,
    visitorCenter,
    aviary,
    habitats,
    gondola
  };
}
