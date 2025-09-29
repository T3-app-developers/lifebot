function sculptTerrain(mesh) {
  const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    const d = Math.sqrt(x * x + z * z);
    const ridge = Math.sin(x * 0.03) * Math.cos(z * 0.04);
    const swell = Math.sin(d * 0.02);
    let height = ridge * 1.1 + swell * 0.6;
    const flatten = Math.max(0, 1 - Math.min(1, Math.pow(d / 90, 2)));
    height *= 0.35 + 0.65 * (1 - flatten);
    if (Math.abs(x) < 45 && Math.abs(z) < 45) {
      height *= 0.15;
    }
    if (z < -70) {
      const falloff = BABYLON.Scalar.Clamp((-70 - z) / 60, 0, 1);
      height -= falloff * 2;
    }
    positions[i + 1] = height;
  }
  mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, true, false);
  mesh.refreshBoundingInfo();
}

function createTree(scene, materials) {
  const treeRoot = new BABYLON.TransformNode('treeRoot', scene);

  const bark = materials.wood.clone('treeBarkMat');
  bark.albedoTexture = null;
  bark.albedoColor = new BABYLON.Color3(0.34, 0.23, 0.17);
  bark.roughness = 0.85;

  const trunk = BABYLON.MeshBuilder.CreateCylinder('treeTrunk', {
    height: 6.6,
    diameterTop: 0.65,
    diameterBottom: 1.1,
    tessellation: 16
  }, scene);
  trunk.material = bark;
  trunk.parent = treeRoot;

  const roots = BABYLON.MeshBuilder.CreateCylinder('treeRoots', { height: 0.4, diameterTop: 1.4, diameterBottom: 1.8, tessellation: 16 }, scene);
  roots.position.y = 0.2;
  roots.material = bark;
  roots.parent = treeRoot;

  const leafMaterial = new BABYLON.PBRMaterial('treeLeafMat', scene);
  leafMaterial.albedoColor = new BABYLON.Color3(0.18, 0.42, 0.21);
  leafMaterial.roughness = 0.6;
  leafMaterial.metallic = 0;
  leafMaterial.subSurface.isTranslucencyEnabled = true;
  leafMaterial.subSurface.translucencyIntensity = 0.8;
  leafMaterial.subSurface.minimumThickness = 0.2;
  leafMaterial.subSurface.maximumThickness = 1.2;

  const canopyBlueprint = [
    { y: 4.4, radius: 3.4, scaleY: 0.75 },
    { y: 6.2, radius: 2.7, scaleY: 0.7 },
    { y: 7.4, radius: 1.9, scaleY: 0.65 }
  ];

  canopyBlueprint.forEach((layer, index) => {
    const canopy = BABYLON.MeshBuilder.CreateIcoSphere(`treeCanopy_${index}`, { radius: layer.radius, subdivisions: 2 }, scene);
    canopy.parent = treeRoot;
    canopy.position.y = layer.y;
    canopy.scaling.y = layer.scaleY;
    canopy.material = leafMaterial;
  });

  treeRoot.getChildMeshes().forEach((mesh) => {
    mesh.receiveShadows = true;
    mesh.checkCollisions = false;
  });

  return treeRoot;
}

function scatterTrees(scene, materials, shadowGenerator, ground) {
  const treePrototype = createTree(scene, materials);
  treePrototype.setEnabled(false);
  const instances = [];
  const rng = () => Math.random() * 2 - 1;
  for (let i = 0; i < 45; i++) {
    const clone = treePrototype.clone(`tree_${i}`, null);
    const x = rng() * 180;
    const z = rng() * 180;
    if (Math.abs(x) < 30 && Math.abs(z) < 30) {
      clone.dispose();
      continue;
    }
    const height = ground.getHeightAtCoordinates(x, z) || 0;
    clone.position.set(x, height, z);
    clone.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.9 + Math.random() * 0.7;
    clone.scaling = new BABYLON.Vector3(scale, 0.95 + Math.random() * 0.4, scale);

    const canopyMeshes = clone.getChildMeshes(false).filter(mesh => mesh.name.startsWith('treeCanopy_'));
    if (canopyMeshes.length > 0) {
      const baseLeafMaterial = canopyMeshes[0].material;
      if (baseLeafMaterial) {
        const leafClone = baseLeafMaterial.clone(`${clone.name}_leafMat`);
        const tintOffset = (Math.random() - 0.5) * 0.08;
        leafClone.albedoColor = leafClone.albedoColor.add(new BABYLON.Color3(tintOffset * 0.4, tintOffset, tintOffset * 0.3));
        canopyMeshes.forEach(mesh => {
          mesh.material = leafClone;
        });
      }
    }

    clone.getChildMeshes().forEach((mesh) => {
      mesh.receiveShadows = true;
      if (shadowGenerator) {
        shadowGenerator.addShadowCaster(mesh);
      }
    });

    clone.setEnabled(true);
    instances.push(clone);
  }
  return instances;
}

function createLamppost(scene, materials) {
  const pole = BABYLON.MeshBuilder.CreateCylinder('lampPole', { height: 6.4, diameter: 0.22, tessellation: 20 }, scene);
  pole.material = materials.metal;
  pole.isPickable = false;
  pole.checkCollisions = false;

  const base = BABYLON.MeshBuilder.CreateCylinder('lampBase', { height: 0.4, diameterTop: 0.5, diameterBottom: 0.7 }, scene);
  base.parent = pole;
  base.position.y = -3;
  base.material = materials.metal;
  base.isPickable = false;

  const head = BABYLON.MeshBuilder.CreateBox('lampHead', { width: 0.9, height: 0.5, depth: 0.9 }, scene);
  head.position.y = 2.9;
  head.parent = pole;
  head.material = materials.metal;
  head.isPickable = false;

  const glass = materials.glass.clone('lampGlass');
  glass.alpha = 0.55;
  const bulb = BABYLON.MeshBuilder.CreateSphere('lampBulb', { diameter: 0.55, segments: 16 }, scene);
  bulb.position.y = 2.9;
  bulb.parent = pole;
  bulb.material = glass;
  bulb.isPickable = false;

  const glowDisc = BABYLON.MeshBuilder.CreateDisc('lampGlow', { radius: 1.1, tessellation: 24 }, scene);
  glowDisc.rotation.x = Math.PI / 2;
  glowDisc.position.y = 2.65;
  glowDisc.material = materials.emissive;
  glowDisc.parent = pole;
  glowDisc.isPickable = false;

  const light = new BABYLON.SpotLight('lampLight', new BABYLON.Vector3(0, 3.2, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 3.2, 12, scene);
  light.diffuse = new BABYLON.Color3(0.95, 0.98, 1);
  light.specular = new BABYLON.Color3(0.8, 0.85, 0.95);
  light.intensity = 0.75;
  light.range = 22;
  light.parent = pole;

  return pole;
}

export function createTerrain(scene, materials, shadowGenerator) {
  const ground = BABYLON.MeshBuilder.CreateGround('mainGround', { width: 260, height: 260, subdivisions: 160 }, scene);
  ground.material = materials.ground;
  ground.receiveShadows = true;
  ground.checkCollisions = true;

  sculptTerrain(ground);

  const water = BABYLON.MeshBuilder.CreateGround('waterPlane', { width: 600, height: 600, subdivisions: 16 }, scene);
  water.position.y = -1.8;
  const waterMaterial = new BABYLON.WaterMaterial('waterMaterial', scene);
  waterMaterial.bumpTexture = new BABYLON.Texture('https://assets.babylonjs.com/textures/waterbump.png', scene);
  waterMaterial.windForce = -10;
  waterMaterial.waveHeight = 0.36;
  waterMaterial.bumpHeight = 0.06;
  waterMaterial.waveLength = 0.18;
  waterMaterial.colorBlendFactor = 0.35;
  waterMaterial.waterColor = new BABYLON.Color3(0.08, 0.32, 0.54);
  waterMaterial.addToRenderList(ground);
  water.material = waterMaterial;
  water.isPickable = false;

  const plaza = BABYLON.MeshBuilder.CreateGround('plaza', { width: 42, height: 42, subdivisions: 2 }, scene);
  plaza.material = materials.plaza;
  plaza.position.y = ground.getHeightAtCoordinates(0, 0) + 0.01;
  plaza.receiveShadows = true;
  plaza.checkCollisions = true;

  const pier = BABYLON.MeshBuilder.CreateBox('harborPier', { width: 20, depth: 60, height: 1.6 }, scene);
  pier.material = materials.wood;
  pier.position = new BABYLON.Vector3(-60, ground.getHeightAtCoordinates(-60, -60) + 0.8, -60);
  pier.checkCollisions = true;
  pier.receiveShadows = true;

  const lamppost = createLamppost(scene, materials);
  lamppost.setEnabled(false);
  const lampposts = [];
  const lamppostPositions = [
    new BABYLON.Vector3(-10, ground.getHeightAtCoordinates(-10, 18), 18),
    new BABYLON.Vector3(12, ground.getHeightAtCoordinates(12, -14), -14),
    new BABYLON.Vector3(-34, ground.getHeightAtCoordinates(-34, 6), 6),
    new BABYLON.Vector3(18, ground.getHeightAtCoordinates(18, 32), 32)
  ];
  lamppostPositions.forEach((pos, idx) => {
    const clone = lamppost.clone(`lamp_${idx}`);
    clone.setEnabled(true);
    clone.position = pos.add(new BABYLON.Vector3(0, 3, 0));
    lampposts.push(clone);
  });
  lamppost.dispose();

  const trees = scatterTrees(scene, materials, shadowGenerator, ground);

  const farmland = BABYLON.MeshBuilder.CreateGround('farmland', { width: 18, height: 24, subdivisionsX: 24, subdivisionsY: 32 }, scene);
  const farmPos = new BABYLON.Vector3(36, ground.getHeightAtCoordinates(36, 28) + 0.02, 28);
  farmland.position.copyFrom(farmPos);
  farmland.rotation.y = Math.PI / 18;
  const farmPositions = farmland.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  for (let i = 0; i < farmPositions.length; i += 3) {
    const x = farmPositions[i];
    const z = farmPositions[i + 2];
    const rowWave = Math.sin(z * 1.1) * 0.18;
    const subtleNoise = Math.sin(x * 1.4 + z * 0.5) * 0.05;
    farmPositions[i + 1] = rowWave + subtleNoise;
  }
  farmland.updateVerticesData(BABYLON.VertexBuffer.PositionKind, farmPositions, true, false);

  const soilMaterial = materials.ground.clone('farmlandSoilMat');
  soilMaterial.albedoTexture = null;
  soilMaterial.bumpTexture = null;
  soilMaterial.albedoColor = new BABYLON.Color3(0.22, 0.15, 0.1);
  soilMaterial.roughness = 0.95;
  soilMaterial.metallic = 0;
  farmland.material = soilMaterial;
  farmland.receiveShadows = true;

  const cropRows = [];
  const sproutMaterial = new BABYLON.PBRMaterial('sproutStemMat', scene);
  sproutMaterial.albedoColor = new BABYLON.Color3(0.08, 0.32, 0.18);
  sproutMaterial.roughness = 0.5;
  sproutMaterial.metallic = 0;

  const leafMaterial = new BABYLON.PBRMaterial('sproutLeafMat', scene);
  leafMaterial.albedoColor = new BABYLON.Color3(0.15, 0.55, 0.26);
  leafMaterial.roughness = 0.4;
  leafMaterial.subSurface.isTranslucencyEnabled = true;
  leafMaterial.subSurface.translucencyIntensity = 0.7;

  const createSprout = (name) => {
    const root = new BABYLON.TransformNode(name, scene);
    const stem = BABYLON.MeshBuilder.CreateCylinder(`${name}_stem`, { height: 0.9, diameter: 0.12, tessellation: 6 }, scene);
    stem.material = sproutMaterial;
    stem.parent = root;
    stem.position.y = 0.45;

    const leaf = BABYLON.MeshBuilder.CreateDisc(`${name}_leaf`, { radius: 0.35, tessellation: 12 }, scene);
    leaf.parent = stem;
    leaf.material = leafMaterial;
    leaf.rotation.x = Math.PI / 2;
    leaf.position.y = 0.45;
    leaf.position.z = 0.15;
    leaf.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_Y;

    const leaf2 = leaf.clone(`${name}_leafB`);
    leaf2.rotation.y = Math.PI / 2.5;
    leaf2.position.z = -0.15;

    return root;
  };

  const sproutPrototype = createSprout('sprout');
  sproutPrototype.setEnabled(false);

  const rows = 4;
  const columns = 8;
  const spacingX = 1.9;
  const spacingZ = 2.6;
  const farmlandRotation = BABYLON.Quaternion.FromEulerAngles(0, farmland.rotation.y, 0);
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      const sprout = sproutPrototype.clone(`sprout_${rowIndex}_${columnIndex}`);
      const offsetLocal = new BABYLON.Vector3(
        (columnIndex - (columns - 1) / 2) * spacingX,
        0,
        (rowIndex - (rows - 1) / 2) * spacingZ
      );
      const offsetWorld = offsetLocal.clone();
      offsetWorld.rotateByQuaternionToRef(farmlandRotation, offsetWorld);
      const worldX = farmland.position.x + offsetWorld.x;
      const worldZ = farmland.position.z + offsetWorld.z;
      const surfaceHeight = farmland.getHeightAtCoordinates(worldX, worldZ) ?? farmland.position.y;
      sprout.position = new BABYLON.Vector3(worldX, surfaceHeight + 0.45, worldZ);
      sprout.rotation.y = Math.random() * Math.PI;
      const randomScale = 0.9 + Math.random() * 0.2;
      sprout.scaling = new BABYLON.Vector3(randomScale, 0.85 + Math.random() * 0.25, randomScale);
      sprout.setEnabled(true);
      sprout.getChildMeshes().forEach(mesh => {
        mesh.receiveShadows = true;
      });
      cropRows.push(sprout);
    }
  }

  sproutPrototype.dispose();

  return { ground, water, waterMaterial, plaza, pier, lampposts, trees, farmland, cropRows };
}
