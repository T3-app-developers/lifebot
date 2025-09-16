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

function createTree(scene, materials, shadowGenerator) {
  const trunk = BABYLON.MeshBuilder.CreateCylinder('treeTrunk', { height: 6, diameterTop: 0.8, diameterBottom: 1 }, scene);
  const bark = new BABYLON.PBRMaterial('treeBark', scene);
  bark.albedoColor = new BABYLON.Color3(0.36, 0.24, 0.18);
  bark.roughness = 0.8;
  bark.metallic = 0.0;
  trunk.material = bark;

  const foliage = BABYLON.MeshBuilder.CreateSphere('treeTop', { diameter: 8, segments: 8 }, scene);
  foliage.position.y = 5;
  const leafMat = new BABYLON.StandardMaterial('leafMat', scene);
  leafMat.diffuseColor = new BABYLON.Color3(0.14, 0.48, 0.24);
  leafMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  foliage.material = leafMat;

  const tree = BABYLON.Mesh.MergeMeshes([trunk, foliage], true, true, undefined, false, true);
  tree.receiveShadows = true;
  tree.checkCollisions = false;
  if (shadowGenerator) shadowGenerator.addShadowCaster(tree);
  return tree;
}

function scatterTrees(scene, materials, shadowGenerator, ground) {
  const treePrototype = createTree(scene, materials, shadowGenerator);
  treePrototype.setEnabled(false);
  const instances = [];
  const rng = () => Math.random() * 2 - 1;
  for (let i = 0; i < 45; i++) {
    const clone = treePrototype.clone(`tree_${i}`);
    const x = rng() * 180;
    const z = rng() * 180;
    if (Math.abs(x) < 30 && Math.abs(z) < 30) { clone.dispose(); continue; }
    const height = ground.getHeightAtCoordinates(x, z) || 0;
    clone.position.set(x, height + 3, z);
    clone.rotation.y = Math.random() * Math.PI * 2;
    clone.scaling.scaleInPlace(0.8 + Math.random() * 0.6);
    clone.setEnabled(true);
    instances.push(clone);
  }
  return instances;
}

function createLamppost(scene, materials) {
  const pole = BABYLON.MeshBuilder.CreateCylinder('lampPole', { height: 6, diameter: 0.25 }, scene);
  pole.material = materials.metal;
  const head = BABYLON.MeshBuilder.CreateBox('lampHead', { size: 0.8 }, scene);
  head.position.y = 3;
  head.material = materials.metal;
  head.parent = pole;
  const bulb = BABYLON.MeshBuilder.CreateSphere('lampBulb', { diameter: 0.6 }, scene);
  bulb.position.y = 3;
  bulb.material = materials.emissive;
  bulb.parent = pole;
  const light = new BABYLON.PointLight('lampLight', new BABYLON.Vector3(0, 3.2, 0), scene);
  light.diffuse = new BABYLON.Color3(0.8, 0.9, 1);
  light.intensity = 0.6;
  light.parent = pole;
  return pole;
}

export function createTerrain(scene, materials, shadowGenerator) {
  const ground = BABYLON.MeshBuilder.CreateGround('mainGround', { width: 260, height: 260, subdivisions: 120 }, scene);
  ground.material = materials.ground;
  ground.receiveShadows = true;
  ground.checkCollisions = true;

  sculptTerrain(ground);

  const water = BABYLON.MeshBuilder.CreateGround('waterPlane', { width: 600, height: 600, subdivisions: 16 }, scene);
  water.position.y = -1.8;
  const waterMaterial = new BABYLON.WaterMaterial('waterMaterial', scene);
  waterMaterial.bumpTexture = new BABYLON.Texture('https://assets.babylonjs.com/textures/waterbump.png', scene);
  waterMaterial.windForce = -8;
  waterMaterial.waveHeight = 0.45;
  waterMaterial.bumpHeight = 0.08;
  waterMaterial.waveLength = 0.2;
  waterMaterial.colorBlendFactor = 0.4;
  waterMaterial.waterColor = new BABYLON.Color3(0.1, 0.35, 0.6);
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

  const farmland = BABYLON.MeshBuilder.CreateGround('farmland', { width: 18, height: 24, subdivisions: 4 }, scene);
  farmland.material = materials.wood.clone('farmlandMat');
  farmland.material.albedoColor = new BABYLON.Color3(0.32, 0.22, 0.18);
  const farmPos = new BABYLON.Vector3(36, ground.getHeightAtCoordinates(36, 28) + 0.02, 28);
  farmland.position.copyFrom(farmPos);
  farmland.receiveShadows = true;

  const cropRows = [];
  for (let i = 0; i < 4; i++) {
    const row = BABYLON.MeshBuilder.CreateBox(`cropRow_${i}`, { width: 16, depth: 1.6, height: 0.3 }, scene);
    row.material = materials.wood.clone(`cropRowMat_${i}`);
    row.material.albedoColor = new BABYLON.Color3(0.1, 0.4 + 0.1 * Math.random(), 0.2);
    row.position = farmPos.add(new BABYLON.Vector3(0, 0.7, -8 + i * 4));
    row.receiveShadows = true;
    cropRows.push(row);
  }

  return { ground, water, waterMaterial, plaza, pier, lampposts, trees, farmland, cropRows };
}
