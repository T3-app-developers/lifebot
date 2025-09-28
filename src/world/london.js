function computeOffsetPaths(points, halfWidth) {
  const left = [];
  const right = [];
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const prev = points[i - 1] || current;
    const next = points[i + 1] || current;
    let tangent = next.subtract(prev);
    if (tangent.lengthSquared() < 0.0001) {
      tangent = new BABYLON.Vector3(1, 0, 0);
    } else {
      tangent.normalize();
    }
    const normal = new BABYLON.Vector3(-tangent.z, 0, tangent.x);
    if (normal.lengthSquared() < 0.0001) {
      normal.set(0, 0, 1);
    } else {
      normal.normalize();
    }
    const offset = normal.scale(halfWidth);
    left.push(current.add(offset));
    right.push(current.subtract(offset));
  }
  return { left, right };
}

function createBankRibbon(scene, name, points, width, material, elevation = 0) {
  const { left, right } = computeOffsetPaths(points, width / 2);
  const elevatedLeft = left.map(p => p.add(new BABYLON.Vector3(0, elevation, 0)));
  const elevatedRight = right.map(p => p.add(new BABYLON.Vector3(0, elevation, 0)));
  const ribbon = BABYLON.MeshBuilder.CreateRibbon(name, {
    pathArray: [elevatedLeft, elevatedRight],
    closeArray: false,
    closePath: false,
    updatable: false,
    sideOrientation: BABYLON.Mesh.DOUBLESIDE
  }, scene);
  ribbon.material = material;
  ribbon.checkCollisions = true;
  ribbon.receiveShadows = true;
  return { ribbon, leftPath: left, rightPath: right };
}

function resamplePath(points, samples) {
  if (points.length <= 1) return points.map(p => p.clone());
  const resampled = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const scaled = t * (points.length - 1);
    const idx = Math.floor(scaled);
    const frac = scaled - idx;
    const start = points[idx];
    const end = points[Math.min(idx + 1, points.length - 1)];
    resampled.push(BABYLON.Vector3.Lerp(start, end, frac));
  }
  return resampled;
}

function createThamesLamppost(scene, materials, name = 'thamesLamp') {
  const root = new BABYLON.TransformNode(name, scene);

  const pole = BABYLON.MeshBuilder.CreateCylinder(`${name}_pole`, { height: 6.4, diameter: 0.22 }, scene);
  pole.parent = root;
  pole.position.y = 3.2;
  pole.material = materials.metal;

  const crown = BABYLON.MeshBuilder.CreateCylinder(`${name}_crown`, { height: 0.6, diameterTop: 0.6, diameterBottom: 0.9 }, scene);
  crown.parent = root;
  crown.position.y = 6.1;
  crown.material = materials.metal;

  const lanternGlass = BABYLON.MeshBuilder.CreateSphere(`${name}_glass`, { diameter: 0.9, segments: 8 }, scene);
  lanternGlass.parent = root;
  lanternGlass.position.y = 5.4;
  const lanternMat = materials.glass.clone(`${name}_glassMat`);
  lanternMat.albedoColor = new BABYLON.Color3(0.6, 0.8, 0.95);
  lanternMat.metallic = 0.1;
  lanternMat.roughness = 0.2;
  lanternMat.alpha = 0.75;
  lanternGlass.material = lanternMat;

  const framePath = [
    new BABYLON.Vector3(0, 4.9, 0),
    new BABYLON.Vector3(0.25, 5.3, 0.15),
    new BABYLON.Vector3(0, 5.8, 0.3)
  ];
  const arm = BABYLON.MeshBuilder.CreateTube(`${name}_arm`, { path: framePath, radius: 0.06, tessellation: 16 }, scene);
  arm.parent = root;
  arm.material = materials.metal;

  const lampLight = new BABYLON.SpotLight(`${name}_light`, new BABYLON.Vector3(0, 5.4, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 8, scene);
  lampLight.intensity = 0.7;
  lampLight.diffuse = new BABYLON.Color3(0.9, 0.95, 1);
  lampLight.specular = new BABYLON.Color3(0.8, 0.9, 1);
  lampLight.parent = root;

  return root;
}

function createBench(scene, materials, name = 'thamesBench') {
  const root = new BABYLON.TransformNode(name, scene);

  const seat = BABYLON.MeshBuilder.CreateBox(`${name}_seat`, { width: 2.6, depth: 0.7, height: 0.18 }, scene);
  seat.parent = root;
  seat.position = new BABYLON.Vector3(0, 0.55, 0);
  const seatMat = materials.wood.clone(`${name}_seatMat`);
  seatMat.albedoColor = new BABYLON.Color3(0.34, 0.21, 0.12);
  seat.material = seatMat;

  const backrest = BABYLON.MeshBuilder.CreateBox(`${name}_back`, { width: 2.6, depth: 0.16, height: 0.9 }, scene);
  backrest.parent = root;
  backrest.position = new BABYLON.Vector3(0, 1.05, -0.2);
  backrest.material = seatMat;

  const legPositions = [-1.1, 1.1];
  legPositions.forEach((x, idx) => {
    const leg = BABYLON.MeshBuilder.CreateBox(`${name}_leg_${idx}`, { width: 0.2, depth: 0.7, height: 0.6 }, scene);
    leg.parent = root;
    leg.position = new BABYLON.Vector3(x, 0.3, 0);
    leg.material = materials.metal;
  });

  return root;
}

function createLondonEye(scene, materials, shadowGenerator) {
  const eyeRoot = new BABYLON.TransformNode('londonEye', scene);

  const baseMat = materials.metal.clone('londonEyeBaseMat');
  baseMat.albedoColor = new BABYLON.Color3(0.85, 0.85, 0.9);

  const supportLeft = BABYLON.MeshBuilder.CreateCylinder('londonEyeSupportL', { diameterTop: 0.6, diameterBottom: 1.2, height: 18 }, scene);
  supportLeft.parent = eyeRoot;
  supportLeft.rotation.z = Math.PI / 2.8;
  supportLeft.position = new BABYLON.Vector3(-5.6, -3.6, -1.2);
  supportLeft.material = baseMat;
  const supportRight = supportLeft.clone('londonEyeSupportR');
  supportRight.rotation.z = -Math.PI / 2.8;
  supportRight.position = new BABYLON.Vector3(5.6, -3.6, -1.2);
  supportRight.parent = eyeRoot;

  const hub = BABYLON.MeshBuilder.CreateCylinder('londonEyeHub', { diameter: 3.2, height: 2.6 }, scene);
  hub.parent = eyeRoot;
  hub.material = baseMat;

  const axle = BABYLON.MeshBuilder.CreateCylinder('londonEyeAxle', { diameter: 1.2, height: 12 }, scene);
  axle.parent = eyeRoot;
  axle.rotation.z = Math.PI / 2;
  axle.material = baseMat;

  const wheel = BABYLON.MeshBuilder.CreateTorus('londonEyeWheel', { diameter: 30, thickness: 0.7, tessellation: 64 }, scene);
  wheel.parent = eyeRoot;
  wheel.rotation.x = Math.PI / 2;
  wheel.material = baseMat;

  const spokeMaterial = baseMat.clone('londonEyeSpokeMat');
  const spokeCount = 24;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (2 * Math.PI * i) / spokeCount;
    const path = [
      new BABYLON.Vector3(0, 0, 0),
      new BABYLON.Vector3(Math.cos(angle) * 14, Math.sin(angle) * 14, 0)
    ];
    const spoke = BABYLON.MeshBuilder.CreateTube(`londonEyeSpoke_${i}`, { path, radius: 0.12, tessellation: 12 }, scene);
    spoke.parent = eyeRoot;
    spoke.rotation.x = Math.PI / 2;
    spoke.material = spokeMaterial;
    shadowGenerator?.addShadowCaster(spoke);
  }

  const podMaterial = materials.glass.clone('londonEyePodMat');
  podMaterial.albedoColor = new BABYLON.Color3(0.75, 0.88, 0.95);
  podMaterial.metallic = 0.2;
  podMaterial.roughness = 0.2;
  const pods = [];
  const podCount = 16;
  for (let i = 0; i < podCount; i++) {
    const angle = (2 * Math.PI * i) / podCount;
    const pod = BABYLON.MeshBuilder.CreateSphere(`londonEyePod_${i}`, { diameter: 2.2, segments: 10 }, scene);
    pod.parent = wheel;
    pod.position = new BABYLON.Vector3(Math.cos(angle) * 14.9, 0, Math.sin(angle) * 14.9);
    pod.rotation.x = Math.PI / 2;
    pod.material = podMaterial;
    pods.push(pod);
  }

  const podium = BABYLON.MeshBuilder.CreateBox('londonEyePodium', { width: 16, depth: 10, height: 1.6 }, scene);
  podium.parent = eyeRoot;
  podium.position = new BABYLON.Vector3(0, -8.4, -3.6);
  podium.material = baseMat;

  shadowGenerator?.addShadowCaster(wheel);
  shadowGenerator?.addShadowCaster(podium);

  const rotationSpeed = 0.00035;
  scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime();
    wheel.rotation.z += dt * rotationSpeed;
    pods.forEach(pod => {
      pod.rotation.y = -wheel.rotation.z;
    });
  });

  return { root: eyeRoot, wheel, pods, podium };
}

function createTowerBridge(scene, materials, shadowGenerator) {
  const bridgeRoot = new BABYLON.TransformNode('towerBridge', scene);
  const stoneMat = materials.brick.clone('towerBridgeStone');
  stoneMat.albedoColor = new BABYLON.Color3(0.68, 0.68, 0.7);
  stoneMat.roughness = 0.5;
  stoneMat.metallic = 0.05;

  const towerNorth = BABYLON.MeshBuilder.CreateBox('towerBridgeNorth', { width: 9, depth: 9, height: 22 }, scene);
  towerNorth.parent = bridgeRoot;
  towerNorth.position = new BABYLON.Vector3(-5, 11, -14);
  towerNorth.material = stoneMat;
  towerNorth.checkCollisions = true;

  const towerSouth = towerNorth.clone('towerBridgeSouth');
  towerSouth.position.z = 14;
  towerSouth.parent = bridgeRoot;

  const towerCaps = [];
  [towerNorth, towerSouth].forEach((tower, idx) => {
    const cap = BABYLON.MeshBuilder.CreateCylinder(`towerBridgeCap_${idx}`, { diameterTop: 0, diameterBottom: 5, height: 5, tessellation: 6 }, scene);
    cap.parent = tower;
    cap.position.y = 11.5;
    cap.material = stoneMat;
    towerCaps.push(cap);
  });

  const deck = BABYLON.MeshBuilder.CreateBox('towerBridgeDeck', { width: 26, depth: 26, height: 1.6 }, scene);
  deck.parent = bridgeRoot;
  deck.position = new BABYLON.Vector3(-5, 6.2, 0);
  const deckMat = materials.plaza.clone('towerBridgeDeckMat');
  deckMat.albedoColor = new BABYLON.Color3(0.45, 0.56, 0.68);
  deck.material = deckMat;
  deck.checkCollisions = true;

  const bascule = BABYLON.MeshBuilder.CreateBox('towerBridgeBascule', { width: 26, depth: 4, height: 0.6 }, scene);
  bascule.parent = bridgeRoot;
  bascule.position = new BABYLON.Vector3(-5, 6.6, 0);
  bascule.material = materials.metal.clone('towerBridgeBasculeMat');

  const upperWalk = BABYLON.MeshBuilder.CreateBox('towerBridgeUpperWalk', { width: 20, depth: 6, height: 1.2 }, scene);
  upperWalk.parent = bridgeRoot;
  upperWalk.position = new BABYLON.Vector3(-5, 16.8, 0);
  upperWalk.material = deckMat;

  const cableMat = materials.metal.clone('towerBridgeCableMat');
  cableMat.albedoColor = new BABYLON.Color3(0.35, 0.54, 0.82);
  const anchorNorth = new BABYLON.Vector3(-17, 4.8, -16);
  const anchorSouth = new BABYLON.Vector3(-17, 4.8, 16);
  const apexNorth = new BABYLON.Vector3(-5, 14, -14);
  const apexSouth = new BABYLON.Vector3(-5, 14, 14);
  const cableNorth = BABYLON.Curve3.CreateQuadraticBezier(anchorNorth, apexNorth, new BABYLON.Vector3(7, 4.8, -16));
  const cableSouth = BABYLON.Curve3.CreateQuadraticBezier(anchorSouth, apexSouth, new BABYLON.Vector3(7, 4.8, 16));
  const northTube = BABYLON.MeshBuilder.CreateTube('towerBridgeCableNorth', { path: cableNorth.getPoints(), radius: 0.3, tessellation: 20 }, scene);
  northTube.parent = bridgeRoot;
  northTube.material = cableMat;
  const southTube = BABYLON.MeshBuilder.CreateTube('towerBridgeCableSouth', { path: cableSouth.getPoints(), radius: 0.3, tessellation: 20 }, scene);
  southTube.parent = bridgeRoot;
  southTube.material = cableMat;

  shadowGenerator?.addShadowCaster(towerNorth);
  shadowGenerator?.addShadowCaster(towerSouth);
  shadowGenerator?.addShadowCaster(deck);
  towerCaps.forEach(cap => shadowGenerator?.addShadowCaster(cap));

  return { root: bridgeRoot, towers: [towerNorth, towerSouth], deck };
}

function createSkyline(scene, materials, shadowGenerator) {
  const skylineRoot = new BABYLON.TransformNode('londonSkyline', scene);
  const shard = BABYLON.MeshBuilder.CreateCylinder('theShard', { diameterTop: 1.4, diameterBottom: 8, height: 42, tessellation: 6 }, scene);
  shard.parent = skylineRoot;
  shard.position = new BABYLON.Vector3(26, 21, -18);
  const shardMat = materials.glass.clone('theShardMat');
  shardMat.albedoColor = new BABYLON.Color3(0.55, 0.68, 0.85);
  shardMat.metallic = 0.3;
  shardMat.roughness = 0.18;
  shard.material = shardMat;

  const gherkin = BABYLON.MeshBuilder.CreateSphere('gherkin', { diameterX: 12, diameterY: 18, diameterZ: 12, segments: 16 }, scene);
  gherkin.parent = skylineRoot;
  gherkin.position = new BABYLON.Vector3(6, 9, -42);
  const gherkinMat = materials.glass.clone('gherkinMat');
  gherkinMat.albedoColor = new BABYLON.Color3(0.25, 0.42, 0.5);
  gherkinMat.metallic = 0.4;
  gherkinMat.roughness = 0.25;
  gherkin.material = gherkinMat;

  const walkieTalkie = BABYLON.MeshBuilder.CreateBox('walkieTalkie', { width: 10, depth: 8, height: 28 }, scene);
  walkieTalkie.parent = skylineRoot;
  walkieTalkie.position = new BABYLON.Vector3(14, 14, -58);
  const walkieMat = materials.metal.clone('walkieTalkieMat');
  walkieMat.albedoColor = new BABYLON.Color3(0.7, 0.7, 0.72);
  walkieTalkie.material = walkieMat;

  const walkieTop = BABYLON.MeshBuilder.CreateBox('walkieTalkieTop', { width: 12, depth: 6, height: 4 }, scene);
  walkieTop.parent = skylineRoot;
  walkieTop.position = new BABYLON.Vector3(14, 29, -58);
  walkieTop.material = walkieMat;

  const cityHall = BABYLON.MeshBuilder.CreateSphere('cityHall', { diameterX: 12, diameterY: 6, diameterZ: 12, segments: 12 }, scene);
  cityHall.parent = skylineRoot;
  cityHall.position = new BABYLON.Vector3(-18, 3, -12);
  const hallMat = materials.glass.clone('cityHallMat');
  hallMat.albedoColor = new BABYLON.Color3(0.42, 0.66, 0.74);
  hallMat.roughness = 0.3;
  hallMat.alpha = 0.92;
  cityHall.material = hallMat;

  const skylineBlocks = [];
  for (let i = 0; i < 12; i++) {
    const width = 6 + Math.random() * 6;
    const depth = 6 + Math.random() * 4;
    const height = 10 + Math.random() * 18;
    const block = BABYLON.MeshBuilder.CreateBox(`skylineBlock_${i}`, { width, depth, height }, scene);
    block.parent = skylineRoot;
    block.position = new BABYLON.Vector3(-24 + Math.random() * 60, height / 2, -60 - Math.random() * 20);
    const blockMat = materials.metal.clone(`skylineBlockMat_${i}`);
    blockMat.albedoColor = new BABYLON.Color3(0.45 + Math.random() * 0.2, 0.45 + Math.random() * 0.2, 0.48 + Math.random() * 0.2);
    blockMat.roughness = 0.4;
    block.material = blockMat;
    skylineBlocks.push(block);
  }

  [shard, gherkin, walkieTalkie, walkieTop, cityHall, ...skylineBlocks].forEach(mesh => {
    mesh.checkCollisions = true;
    mesh.receiveShadows = true;
    shadowGenerator?.addShadowCaster(mesh);
  });

  return { root: skylineRoot };
}

function createInfoBoard(scene, materials, interactionManager, gameState, hud) {
  const board = BABYLON.MeshBuilder.CreatePlane('londonInfoBoard', { width: 6, height: 3.4 }, scene);
  board.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
  board.rotation.y = Math.PI / 6;
  board.position = new BABYLON.Vector3(-14, 4.2, -18);
  const boardMat = new BABYLON.StandardMaterial('londonInfoBoardMat', scene);
  const texture = new BABYLON.DynamicTexture('londonInfoBoardTex', { width: 1024, height: 512 }, scene, true);
  texture.hasAlpha = true;
  texture.drawText('Central London Vista', 60, 160, 'bold 72px "Arial"', '#ffffff', '#143155', true, true);
  texture.drawText('Take in the Thames, Tower Bridge, and the London Eye.', 60, 260, '32px "Arial"', '#d2e4ff', null, true);
  texture.drawText('Interact to collect a souvenir and learn trivia.', 60, 340, '28px "Arial"', '#a4cff8', null, true);
  boardMat.diffuseTexture = texture;
  boardMat.specularColor = BABYLON.Color3.Black();
  board.material = boardMat;

  if (interactionManager) {
    interactionManager.register(board, {
      prompt: 'Press E to collect London trivia',
      tooltip: '<strong>Central London</strong><br/>Admire landmarks for a small reward.',
      range: 6,
      action: () => {
        if (!gameState.hasFlag('london-trivia')) {
          gameState.addCoins(12, 'London discovery');
          gameState.setFlag('london-trivia', true);
        }
        hud.pushNotification('Tower Bridge opened in 1894 after eight years of construction.', 'info', 5200);
        hud.pushNotification('The London Eye stands 135 metres tall with 32 capsules.', 'success', 5200);
        gameState.setStatusLine('You collected London trivia!');
      }
    });
  }

  return board;
}

function createPhotoSpot(scene, materials, interactionManager, camera, root, hud) {
  const spot = BABYLON.MeshBuilder.CreateDisc('londonPhotoSpot', { radius: 1.6, tessellation: 32 }, scene);
  spot.position = new BABYLON.Vector3(-8, 0.02, -6);
  spot.rotation.x = Math.PI / 2;
  const mat = materials.plaza.clone('londonPhotoSpotMat');
  mat.albedoColor = new BABYLON.Color3(0.75, 0.62, 0.82);
  mat.roughness = 0.4;
  spot.material = mat;
  spot.parent = root;
  spot.isPickable = true;

  if (interactionManager) {
    interactionManager.register(spot, {
      prompt: 'Press E to snap a skyline photo',
      range: 4.5,
      action: () => {
        const worldPos = spot.getAbsolutePosition();
        camera.position = worldPos.add(new BABYLON.Vector3(0, 1.6, 0));
        camera.setTarget(root.getAbsolutePosition().add(new BABYLON.Vector3(0, 8, -20)));
        hud?.pushNotification('You frame the skyline perfectly for a postcard shot.', 'success', 3000);
      }
    });
  }

  return spot;
}

function createBoat(scene, materials, shadowGenerator) {
  const boatRoot = new BABYLON.TransformNode('thamesClipper', scene);
  const hull = BABYLON.MeshBuilder.CreateBox('thamesClipperHull', { width: 5, depth: 14, height: 1.6 }, scene);
  hull.parent = boatRoot;
  hull.position.y = -0.8;
  const hullMat = materials.metal.clone('thamesClipperHullMat');
  hullMat.albedoColor = new BABYLON.Color3(0.25, 0.3, 0.45);
  hull.material = hullMat;

  const cabin = BABYLON.MeshBuilder.CreateBox('thamesClipperCabin', { width: 3.6, depth: 6, height: 1.8 }, scene);
  cabin.parent = boatRoot;
  cabin.position = new BABYLON.Vector3(0, 0.2, -1);
  cabin.material = materials.glass.clone('thamesClipperCabinMat');

  const prow = BABYLON.MeshBuilder.CreateCylinder('thamesClipperProw', { diameterTop: 0, diameterBottom: 5, height: 3 }, scene);
  prow.parent = boatRoot;
  prow.rotation.x = Math.PI / 2;
  prow.position = new BABYLON.Vector3(0, -0.8, 7);
  prow.material = hullMat;

  shadowGenerator?.addShadowCaster(hull);
  shadowGenerator?.addShadowCaster(cabin);

  return { root: boatRoot };
}

export function createCentralLondon(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrain, camera) {
  const centralLondonRoot = new BABYLON.TransformNode('centralLondonRoot', scene);
  const anchor = new BABYLON.Vector3(118, terrain.ground.getHeightAtCoordinates(118, -28) || 0, -28);
  centralLondonRoot.position.copyFrom(anchor);

  const northPoints = [
    new BABYLON.Vector3(-34, 0, -78),
    new BABYLON.Vector3(-24, 0, -52),
    new BABYLON.Vector3(-14, 0, -28),
    new BABYLON.Vector3(-2, 0, -4),
    new BABYLON.Vector3(12, 0, 24),
    new BABYLON.Vector3(18, 0, 48),
    new BABYLON.Vector3(12, 0, 74)
  ];
  const southPoints = [
    new BABYLON.Vector3(-38, 0, -70),
    new BABYLON.Vector3(-28, 0, -44),
    new BABYLON.Vector3(-18, 0, -18),
    new BABYLON.Vector3(-6, 0, 8),
    new BABYLON.Vector3(8, 0, 32),
    new BABYLON.Vector3(14, 0, 56),
    new BABYLON.Vector3(6, 0, 82)
  ];

  const promenadeMat = materials.plaza.clone('londonPromenadeMat');
  promenadeMat.albedoColor = new BABYLON.Color3(0.82, 0.82, 0.86);
  promenadeMat.roughness = 0.5;

  const northBank = createBankRibbon(scene, 'thamesNorthBank', northPoints, 16, promenadeMat, 0.12);
  const southBank = createBankRibbon(scene, 'thamesSouthBank', southPoints, 13, promenadeMat, 0.12);
  northBank.ribbon.parent = centralLondonRoot;
  southBank.ribbon.parent = centralLondonRoot;

  const waterLeft = northBank.rightPath.map(p => p.add(new BABYLON.Vector3(0, -0.9, 0)));
  const waterRight = southBank.leftPath.map(p => p.add(new BABYLON.Vector3(0, -0.9, 0)));
  const thamesSurface = BABYLON.MeshBuilder.CreateRibbon('thamesSurface', {
    pathArray: [waterLeft, waterRight],
    closeArray: false,
    updatable: false,
    sideOrientation: BABYLON.Mesh.DOUBLESIDE
  }, scene);
  thamesSurface.parent = centralLondonRoot;
  const thamesMat = new BABYLON.PBRMaterial('thamesMaterial', scene);
  thamesMat.metallic = 0.1;
  thamesMat.roughness = 0.25;
  thamesMat.albedoColor = new BABYLON.Color3(0.12, 0.25, 0.42);
  thamesMat.alpha = 0.85;
  thamesSurface.material = thamesMat;

  const railingMat = materials.metal.clone('thamesRailingMat');
  railingMat.albedoColor = new BABYLON.Color3(0.22, 0.34, 0.48);

  const northRailPath = resamplePath(northBank.leftPath, 18).map(p => p.add(new BABYLON.Vector3(0, 1.15, 0)));
  const southRailPath = resamplePath(southBank.rightPath, 18).map(p => p.add(new BABYLON.Vector3(0, 1.15, 0)));
  const northRail = BABYLON.MeshBuilder.CreateTube('thamesNorthRail', { path: northRailPath, radius: 0.22, tessellation: 24 }, scene);
  northRail.material = railingMat;
  northRail.parent = centralLondonRoot;
  const southRail = BABYLON.MeshBuilder.CreateTube('thamesSouthRail', { path: southRailPath, radius: 0.22, tessellation: 24 }, scene);
  southRail.material = railingMat;
  southRail.parent = centralLondonRoot;

  const lampOffsets = [0.08, 0.24, 0.4, 0.56, 0.72, 0.88];
  lampOffsets.forEach((t, idx) => {
    const scaled = t * (northPoints.length - 1);
    const baseIndex = Math.floor(scaled);
    const frac = scaled - baseIndex;
    const p0 = northPoints[baseIndex];
    const p1 = northPoints[Math.min(baseIndex + 1, northPoints.length - 1)];
    const pos = BABYLON.Vector3.Lerp(p0, p1, frac);
    const lamp = createThamesLamppost(scene, materials, `northLamp_${idx}`);
    lamp.parent = centralLondonRoot;
    lamp.position = pos.add(new BABYLON.Vector3(0, 0, -3.6));
    lamp.getChildMeshes(false).forEach(mesh => shadowGenerator?.addShadowCaster(mesh));
  });

  const southLampOffsets = [0.12, 0.32, 0.52, 0.72, 0.9];
  southLampOffsets.forEach((t, idx) => {
    const scaled = t * (southPoints.length - 1);
    const baseIndex = Math.floor(scaled);
    const frac = scaled - baseIndex;
    const p0 = southPoints[baseIndex];
    const p1 = southPoints[Math.min(baseIndex + 1, southPoints.length - 1)];
    const pos = BABYLON.Vector3.Lerp(p0, p1, frac);
    const lamp = createThamesLamppost(scene, materials, `southLamp_${idx}`);
    lamp.parent = centralLondonRoot;
    lamp.position = pos.add(new BABYLON.Vector3(0, 0, 3.2));
    lamp.getChildMeshes(false).forEach(mesh => shadowGenerator?.addShadowCaster(mesh));
  });

  const benchTemplate = createBench(scene, materials, 'promenadeBench');
  benchTemplate.parent = centralLondonRoot;
  benchTemplate.position = new BABYLON.Vector3(-10, 0, -6);
  benchTemplate.rotation.y = Math.PI / 6;
  benchTemplate.getChildMeshes(false).forEach(mesh => shadowGenerator?.addShadowCaster(mesh));
  const bench2 = benchTemplate.clone('promenadeBench_2');
  bench2.position = new BABYLON.Vector3(4, 0, 12);
  bench2.getChildMeshes(false).forEach(mesh => shadowGenerator?.addShadowCaster(mesh));
  const bench3 = benchTemplate.clone('promenadeBench_3');
  bench3.position = new BABYLON.Vector3(10, 0, 34);
  bench3.rotation.y = Math.PI / 4;
  bench3.getChildMeshes(false).forEach(mesh => shadowGenerator?.addShadowCaster(mesh));

  const towerBridge = createTowerBridge(scene, materials, shadowGenerator);
  towerBridge.root.parent = centralLondonRoot;
  towerBridge.root.position = new BABYLON.Vector3(-5, 0.6, -8);

  const londonEye = createLondonEye(scene, materials, shadowGenerator);
  londonEye.root.parent = centralLondonRoot;
  londonEye.root.position = new BABYLON.Vector3(-18, 4.6, 26);

  const skyline = createSkyline(scene, materials, shadowGenerator);
  skyline.root.parent = centralLondonRoot;
  skyline.root.position = new BABYLON.Vector3(30, 0, -10);

  const infoBoard = createInfoBoard(scene, materials, interactionManager, gameState, hud);
  infoBoard.parent = centralLondonRoot;

  const photoSpot = createPhotoSpot(scene, materials, interactionManager, camera, centralLondonRoot, hud);

  const boat = createBoat(scene, materials, shadowGenerator);
  boat.root.parent = centralLondonRoot;
  boat.root.position = new BABYLON.Vector3(-20, -0.4, -24);

  const boatPath = BABYLON.Curve3.CreateCatmullRomSpline([
    new BABYLON.Vector3(-32, -0.4, -60),
    new BABYLON.Vector3(-24, -0.4, -28),
    new BABYLON.Vector3(-10, -0.4, 2),
    new BABYLON.Vector3(4, -0.4, 32),
    new BABYLON.Vector3(-8, -0.4, 66),
    new BABYLON.Vector3(-28, -0.4, 94)
  ], 60, false);
  const boatPoints = boatPath.getPoints();
  let boatIndex = 0;
  scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime();
    boatIndex = (boatIndex + dt * 0.015) % boatPoints.length;
    const current = boatPoints[Math.floor(boatIndex)];
    const next = boatPoints[(Math.floor(boatIndex) + 1) % boatPoints.length];
    boat.root.position.copyFrom(current);
    const forward = next.subtract(current);
    boat.root.rotation.y = Math.atan2(forward.x, forward.z);
  });

  return {
    root: centralLondonRoot,
    banks: { north: northBank.ribbon, south: southBank.ribbon },
    bridge: towerBridge,
    londonEye,
    skyline,
    infoBoard,
    boat
  };
}
