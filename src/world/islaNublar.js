const ISLAND_WIDTH = 220;
const ISLAND_HEIGHT = 260;

function computeIslaHeight(nx, nz) {
  const northBulge = Math.exp(-((nx * nx) * 2.4 + Math.pow((nz - 0.55) * 2.6, 2)));
  const eastBulge = Math.exp(-((nx - 0.55) * (nx - 0.55) * 3.4 - (nz + 0.1) * 2.4));
  const westBulge = Math.exp(-((nx + 0.6) * (nx + 0.6) * 3.0 - (nz + 0.15) * 2.0));
  const southBulge = Math.exp(-((nx * nx) * 3.4 + Math.pow((nz + 0.75) * 4.1, 2)));
  const centralMass = Math.exp(-((nx * nx) * 2.2 + (nz * nz) * 3.1));

  const ridge = Math.max(0, centralMass * 9.5 + northBulge * 12.6);
  const easternSpine = Math.max(0, eastBulge * 7.4);
  const westernSpine = Math.max(0, westBulge * 7.8);
  const southernShelf = Math.max(0, southBulge * 5.2);

  let land = ridge + easternSpine + westernSpine + southernShelf;
  land += Math.sin(nx * 6.0) * 0.8 + Math.cos(nz * 7.0) * 0.8;
  land = Math.max(land - 2.2, 0);

  const crater = Math.exp(-((nx * nx) * 2.1 + Math.pow((nz - 0.5) * 4.5, 2))) * 6.4;
  const lagoonBasin = Math.exp(-((nx - 0.35) * (nx - 0.35) * 8.5 + Math.pow((nz + 0.3) * 7.2, 2))) * 5.5;

  const height = land - crater - lagoonBasin;
  const coastFalloff = Math.max(0, 1 - Math.pow(Math.abs(nx) * 0.9 + Math.abs(nz) * 0.8, 3));
  return -2.6 + coastFalloff * height;
}

function shapeIslaNublar(mesh) {
  const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  let normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
  if (!normals) {
    normals = new Float32Array(positions.length);
  }
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    const nx = x / (ISLAND_WIDTH * 0.5);
    const nz = z / (ISLAND_HEIGHT * 0.5);

    const finalHeight = computeIslaHeight(nx, nz);

    positions[i + 1] = finalHeight;
    if (normals) {
      normals[i] = 0;
      normals[i + 1] = 1;
      normals[i + 2] = 0;
    }
  }
  mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, true, false);
  BABYLON.VertexData.ComputeNormals(mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind), mesh.getIndices(), normals);
  mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, true, false);
  mesh.refreshBoundingInfo();
}

function shapeBeach(mesh) {
  const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    const nx = x / (ISLAND_WIDTH * 0.5);
    const nz = z / (ISLAND_HEIGHT * 0.5);
    const baseHeight = computeIslaHeight(nx, nz);
    const coastMask = BABYLON.Scalar.Clamp(1 - Math.abs(baseHeight + 1.6) / 2.6, 0, 1);
    const elevated = baseHeight + coastMask * 0.8 - 0.3;
    positions[i + 1] = elevated;
  }
  mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, true, false);
  mesh.refreshBoundingInfo();
}

function createLabel(scene, text, size, color, height) {
  const plane = BABYLON.MeshBuilder.CreatePlane(`${text.replace(/\s+/g, '')}Label`, { width: size, height: size * 0.4 }, scene);
  const texture = new BABYLON.DynamicTexture(`${text}Texture`, { width: 1024, height: 256 }, scene, true);
  texture.hasAlpha = true;
  texture.drawText(text, null, 180, `bold 150px \"Rajdhani\"`, color, 'transparent', true);
  const mat = new BABYLON.StandardMaterial(`${text}LabelMat`, scene);
  mat.diffuseTexture = texture;
  mat.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9);
  mat.backFaceCulling = false;
  plane.material = mat;
  plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
  plane.position.y = height;
  plane.isPickable = false;
  return plane;
}

function createLandmark(scene, options) {
  const { name, position, meshFactory, labelSize = 16, labelColor = '#f3f6ff', labelHeight = 6 } = options;
  const node = new BABYLON.TransformNode(`${name.replace(/\s+/g, '')}Root`, scene);
  node.position = position;
  const mesh = meshFactory(scene, name);
  mesh.parent = node;
  const label = createLabel(scene, name, labelSize, labelColor, labelHeight);
  label.parent = node;
  return { node, mesh, label };
}

function registerLandmark(interactionManager, hud, gameState, mesh, info) {
  interactionManager.register(mesh, {
    prompt: 'Press E to read the park placard',
    tooltip: `<strong>${info.title}</strong><br/>${info.description}`,
    action: () => {
      hud.pushNotification(`${info.title}: ${info.actionMessage}`, 'info', 3200);
      gameState.emit('isla-nublar-landmark', { id: info.id });
    }
  });
}

function createLagoon(scene) {
  const basin = BABYLON.MeshBuilder.CreateDisc('mosasaurusLagoon', { radius: 24, tessellation: 64 }, scene);
  basin.rotation.x = Math.PI / 2;
  const waterMat = new BABYLON.StandardMaterial('lagoonWater', scene);
  waterMat.diffuseColor = new BABYLON.Color3(0.1, 0.42, 0.72);
  waterMat.specularColor = new BABYLON.Color3(0.4, 0.5, 0.6);
  waterMat.alpha = 0.86;
  waterMat.backFaceCulling = false;
  basin.material = waterMat;
  basin.position.y = 0.2;
  return basin;
}

function createMound(scene, name, radius, height) {
  const mound = BABYLON.MeshBuilder.CreateCylinder(name, {
    diameterTop: radius * 1.1,
    diameterBottom: radius * 1.6,
    height,
    tessellation: 18
  }, scene);
  mound.position.y = height * 0.5;
  return mound;
}

function createPaddockFence(scene, name, points, height) {
  const elevated = points.map(p => p.add(new BABYLON.Vector3(0, height, 0)));
  const ribbon = BABYLON.MeshBuilder.CreateRibbon(name, {
    pathArray: [points, elevated],
    updatable: false,
    closeArray: false,
    closePath: true
  }, scene);
  return ribbon;
}

export function createIslaNublar(scene, materials, shadowGenerator, interactionManager, gameState, hud) {
  const root = new BABYLON.TransformNode('islaNublarRoot', scene);
  root.position = new BABYLON.Vector3(240, -1.8, -160);

  const ground = BABYLON.MeshBuilder.CreateGround('islaNublarGround', { width: ISLAND_WIDTH, height: ISLAND_HEIGHT, subdivisions: 180 }, scene);
  ground.parent = root;
  ground.material = materials.ground.clone('islaNublarGroundMat');
  ground.material.albedoColor = new BABYLON.Color3(0.18, 0.3, 0.16);
  ground.receiveShadows = true;
  ground.checkCollisions = true;

  shapeIslaNublar(ground);

  const beach = BABYLON.MeshBuilder.CreateGround('islaNublarBeach', { width: ISLAND_WIDTH, height: ISLAND_HEIGHT, subdivisions: 120 }, scene);
  beach.parent = root;
  beach.material = materials.ground.clone('islaNublarBeachMat');
  beach.material.albedoColor = new BABYLON.Color3(0.72, 0.62, 0.4);
  beach.material.alpha = 0.65;
  beach.material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
  beach.position.y = -0.4;
  beach.isPickable = false;
  shapeBeach(beach);

  const mountSibo = BABYLON.MeshBuilder.CreateCylinder('mountSibo', { diameterTop: 24, diameterBottom: 48, height: 38, tessellation: 32 }, scene);
  mountSibo.position = new BABYLON.Vector3(0, 18, 80);
  mountSibo.material = materials.wood.clone('mountSiboMat');
  mountSibo.material.albedoColor = new BABYLON.Color3(0.28, 0.18, 0.14);
  mountSibo.receiveShadows = true;
  mountSibo.parent = root;
  if (shadowGenerator) shadowGenerator.addShadowCaster(mountSibo);

  const crater = BABYLON.MeshBuilder.CreateCylinder('mountSiboCrater', { diameterTop: 16, diameterBottom: 18, height: 8, tessellation: 32 }, scene);
  crater.position = new BABYLON.Vector3(0, 27, 80);
  crater.material = materials.metal.clone('mountSiboCraterMat');
  crater.material.albedoColor = new BABYLON.Color3(0.12, 0.09, 0.08);
  crater.parent = mountSibo;

  const steam = BABYLON.MeshBuilder.CreateDisc('mountSiboSteam', { radius: 7 }, scene);
  steam.rotation.x = Math.PI / 2;
  steam.position.y = 4;
  steam.material = materials.emissive.clone('mountSiboSteamMat');
  steam.material.emissiveColor = new BABYLON.Color3(0.8, 0.5, 0.3);
  steam.parent = crater;
  steam.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  const lagoon = createLagoon(scene);
  lagoon.parent = root;
  lagoon.position = new BABYLON.Vector3(40, -1.1, -28);

  const lagoonStands = BABYLON.MeshBuilder.CreateTorus('lagoonStands', { diameter: 46, thickness: 1.8, tessellation: 48 }, scene);
  lagoonStands.position = new BABYLON.Vector3(40, 1.4, -28);
  lagoonStands.rotation.x = Math.PI / 2;
  lagoonStands.material = materials.metal.clone('lagoonStandsMat');
  lagoonStands.material.albedoColor = new BABYLON.Color3(0.6, 0.6, 0.65);
  lagoonStands.parent = root;
  if (shadowGenerator) shadowGenerator.addShadowCaster(lagoonStands);

  const mainStreet = BABYLON.MeshBuilder.CreateGround('mainStreet', { width: 30, height: 80 }, scene);
  mainStreet.parent = root;
  mainStreet.material = materials.plaza.clone('mainStreetMat');
  mainStreet.material.albedoColor = new BABYLON.Color3(0.28, 0.28, 0.32);
  mainStreet.position = new BABYLON.Vector3(0, -1.2, -20);
  mainStreet.rotation.y = Math.PI / 12;
  mainStreet.checkCollisions = true;

  const innovationCenter = BABYLON.MeshBuilder.CreateCylinder('innovationCenter', { diameterTop: 12, diameterBottom: 16, height: 14, tessellation: 16 }, scene);
  innovationCenter.position = new BABYLON.Vector3(-2, 6, -10);
  innovationCenter.material = materials.glass.clone('innovationCenterMat');
  innovationCenter.material.albedoColor = new BABYLON.Color3(0.5, 0.76, 0.84);
  innovationCenter.parent = root;
  if (shadowGenerator) shadowGenerator.addShadowCaster(innovationCenter);

  const innovationRing = BABYLON.MeshBuilder.CreateTorus('innovationRing', { diameter: 18, thickness: 0.6, tessellation: 24 }, scene);
  innovationRing.position = new BABYLON.Vector3(-2, 13, -10);
  innovationRing.material = materials.neon.clone('innovationRingMat');
  innovationRing.material.emissiveColor = new BABYLON.Color3(0.3, 0.8, 1);
  innovationRing.parent = root;

  const ferry = BABYLON.MeshBuilder.CreateBox('ferryLanding', { width: 18, depth: 32, height: 2 }, scene);
  ferry.position = new BABYLON.Vector3(0, -1, -120);
  ferry.material = materials.wood.clone('ferryMat');
  ferry.material.albedoColor = new BABYLON.Color3(0.45, 0.36, 0.24);
  ferry.parent = root;
  ferry.checkCollisions = true;

  const monorailPath = [
    new BABYLON.Vector3(0, 10, -120),
    new BABYLON.Vector3(-6, 12, -60),
    new BABYLON.Vector3(-2, 14, -18),
    new BABYLON.Vector3(12, 12, 24),
    new BABYLON.Vector3(-4, 12, 60),
    new BABYLON.Vector3(2, 14, 96)
  ];
  const monorail = BABYLON.MeshBuilder.CreateTube('islaMonorail', { path: monorailPath, radius: 1, tessellation: 32 }, scene);
  monorail.material = materials.metal.clone('monorailMat');
  monorail.material.albedoColor = new BABYLON.Color3(0.5, 0.6, 0.7);
  monorail.parent = root;
  if (shadowGenerator) shadowGenerator.addShadowCaster(monorail);

  const monorailSupports = monorailPath.map((point, idx) => {
    if (idx === 0) return null;
    const support = BABYLON.MeshBuilder.CreateBox(`monorailSupport_${idx}`, { width: 1.6, depth: 1.6, height: point.y + 1.8 }, scene);
    support.position = new BABYLON.Vector3(point.x, support.height / 2 - 1.8, point.z);
    support.material = materials.metal.clone(`monorailSupportMat_${idx}`);
    support.material.albedoColor = new BABYLON.Color3(0.42, 0.46, 0.52);
    support.parent = root;
    support.checkCollisions = true;
    if (shadowGenerator) shadowGenerator.addShadowCaster(support);
    return support;
  }).filter(Boolean);

  const landmarkInfos = [
    {
      name: 'Innovation Center',
      position: new BABYLON.Vector3(-2, 0, -10),
      meshFactory: (scene, name) => {
        const spire = BABYLON.MeshBuilder.CreateCylinder(`${name}Spire`, { diameter: 4.2, height: 12, tessellation: 12 }, scene);
        spire.position.y = 6;
        return spire;
      },
      labelSize: 18,
      labelHeight: 10,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.glass.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.5, 0.76, 0.84);
        mat.metallic = 0.2;
        mat.roughness = 0.25;
        return mat;
      },
      description: 'Glass pyramid hub where guests arrive on Main Street.',
      actionMessage: 'Holographic displays spin up inside the rotunda.',
      id: 'innovation-center'
    },
    {
      name: 'Main Street',
      position: new BABYLON.Vector3(-4, -1, -20),
      meshFactory: (scene, name) => {
        const promenade = BABYLON.MeshBuilder.CreateBox(`${name}Promenade`, { width: 6, depth: 24, height: 0.8 }, scene);
        promenade.position.y = 0.4;
        return promenade;
      },
      labelSize: 22,
      labelHeight: 7,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.plaza.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.32, 0.32, 0.38);
        return mat;
      },
      description: 'Shops, restaurants, and shows line the central promenade.',
      actionMessage: 'Street performers draw a crowd of excited visitors.',
      id: 'main-street'
    },
    {
      name: 'Mosasaurus Lagoon',
      position: new BABYLON.Vector3(40, -1.2, -28),
      meshFactory: () => {
        const deck = BABYLON.MeshBuilder.CreateDisc('mosasaurSign', { radius: 7, tessellation: 48 }, scene);
        deck.rotation.x = Math.PI / 2;
        deck.position.y = 0.2;
        return deck;
      },
      labelSize: 20,
      labelHeight: 9,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.metal.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.26, 0.45, 0.62);
        return mat;
      },
      description: 'Aquatic stadium with a deep viewing pool and splash zone.',
      actionMessage: 'A Mosasaurus breaches to snatch a dangling shark.',
      id: 'mosasaurus-lagoon'
    },
    {
      name: 'T-Rex Kingdom',
      position: new BABYLON.Vector3(-50, -0.8, -16),
      meshFactory: () => {
        const paddock = BABYLON.MeshBuilder.CreateBox('trexEnclosure', { width: 32, depth: 26, height: 5 }, scene);
        paddock.position.y = 2.5;
        return paddock;
      },
      labelSize: 20,
      labelHeight: 9,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.wood.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.32, 0.28, 0.22);
        mat.roughness = 0.7;
        return mat;
      },
      description: 'Massive paddock fortified with towers and electric fencing.',
      actionMessage: 'Feeding time draws gasps from behind the glass.',
      id: 'trex-kingdom'
    },
    {
      name: 'Raptor Paddock',
      position: new BABYLON.Vector3(48, 0, 36),
      meshFactory: () => {
        const pen = BABYLON.MeshBuilder.CreateBox('raptorPen', { width: 18, depth: 18, height: 6 }, scene);
        pen.position.y = 3;
        return pen;
      },
      labelSize: 18,
      labelHeight: 8,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.metal.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.35, 0.4, 0.46);
        return mat;
      },
      description: 'Restricted facility where Velociraptors train with handlers.',
      actionMessage: 'Security turrets pivot to track your motion.',
      id: 'raptor-paddock'
    },
    {
      name: 'Gyrosphere Valley',
      position: new BABYLON.Vector3(16, 0, 68),
      meshFactory: () => {
        const mound = createMound(scene, 'gyrosphereMound', 18, 12);
        mound.rotation.x = 0;
        return mound;
      },
      labelSize: 20,
      labelHeight: 11,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.ground.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.18, 0.34, 0.16);
        return mat;
      },
      description: 'Rolling meadows filled with gentle giants and roaming gyrospheres.',
      actionMessage: 'Gyrosphere pods launch from their glass garage.',
      id: 'gyrosphere-valley'
    },
    {
      name: 'Gallimimus Valley',
      position: new BABYLON.Vector3(-34, 0, 46),
      meshFactory: () => {
        const mound = createMound(scene, 'gallimimusMound', 20, 10);
        mound.rotation.x = 0;
        return mound;
      },
      labelSize: 20,
      labelHeight: 10,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.ground.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.2, 0.36, 0.18);
        return mat;
      },
      description: 'Sweeping prairie where Gallimimus herds sprint in formation.',
      actionMessage: 'Dust plumes spiral behind the sprinting herd.',
      id: 'gallimimus-valley'
    },
    {
      name: 'Aviary',
      position: new BABYLON.Vector3(52, 4, 80),
      meshFactory: () => {
        const dome = BABYLON.MeshBuilder.CreateSphere('aviaryDome', { diameter: 28, segments: 12 }, scene);
        dome.position.y = 14;
        return dome;
      },
      labelSize: 18,
      labelHeight: 16,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.metal.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.58, 0.6, 0.64);
        mat.roughness = 0.4;
        return mat;
      },
      description: 'Steel-framed dome containing Pteranodons and Dimorphodons.',
      actionMessage: 'Pteranodons glide between the trusses overhead.',
      id: 'aviary'
    },
    {
      name: 'Gentle Giants',
      position: new BABYLON.Vector3(-26, -0.5, -44),
      meshFactory: () => {
        const barn = BABYLON.MeshBuilder.CreateCylinder('gentleGiantsBarn', { diameter: 18, height: 7 }, scene);
        barn.position.y = 3.5;
        return barn;
      },
      labelSize: 16,
      labelHeight: 8,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.wood.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.4, 0.28, 0.18);
        return mat;
      },
      description: 'Petting zoo pavilion offering hands-on encounters.',
      actionMessage: 'A baby Apatosaurus nuzzles your outstretched hand.',
      id: 'gentle-giants'
    },
    {
      name: 'Camp Cretaceous',
      position: new BABYLON.Vector3(70, 0, -12),
      meshFactory: () => {
        const cabin = BABYLON.MeshBuilder.CreateBox('campCretaceousCabin', { width: 16, depth: 14, height: 6 }, scene);
        cabin.position.y = 3;
        return cabin;
      },
      labelSize: 18,
      labelHeight: 9,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.wood.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.36, 0.24, 0.18);
        mat.roughness = 0.6;
        return mat;
      },
      description: 'Tree-top adventure camp hidden within the jungle canopy.',
      actionMessage: 'Rope bridges sway as the campers cheer from above.',
      id: 'camp-cretaceous'
    },
    {
      name: 'Ferry Landing',
      position: new BABYLON.Vector3(0, -1, -118),
      meshFactory: () => {
        const dock = BABYLON.MeshBuilder.CreateBox('ferryDock', { width: 10, depth: 20, height: 1.5 }, scene);
        dock.position.y = 0.75;
        return dock;
      },
      labelSize: 16,
      labelHeight: 7,
      materialFactory: (materials, _scene, materialName) => {
        const mat = materials.wood.clone(materialName);
        mat.albedoColor = new BABYLON.Color3(0.46, 0.36, 0.24);
        return mat;
      },
      description: 'Arrival docks connecting Isla Nublar to the mainland.',
      actionMessage: 'The ferry horn echoes across the harbor bay.',
      id: 'ferry-landing'
    }
  ];

  const landmarks = landmarkInfos.map(info => {
    const { node, mesh, label } = createLandmark(scene, info);
    node.parent = root;
    const materialName = `${info.name.replace(/\s+/g, '')}Mat`;
    const material = info.materialFactory
      ? info.materialFactory(materials, scene, materialName)
      : materials.metal.clone(materialName);
    if (!info.materialFactory) {
      material.albedoColor = new BABYLON.Color3(0.4, 0.45, 0.5);
    }
    mesh.material = material;
    mesh.receiveShadows = true;
    mesh.checkCollisions = true;
    if (shadowGenerator) shadowGenerator.addShadowCaster(mesh);
    registerLandmark(interactionManager, hud, gameState, mesh, {
      title: info.name,
      description: info.description,
      actionMessage: info.actionMessage,
      id: info.id
    });
    return { node, mesh, label, info };
  });

  const paddockLayouts = [
    {
      name: 'trexFence',
      points: [
        new BABYLON.Vector3(-64, -0.8, -4),
        new BABYLON.Vector3(-40, -0.8, -4),
        new BABYLON.Vector3(-32, -0.8, -26),
        new BABYLON.Vector3(-58, -0.8, -34)
      ],
      height: 8
    },
    {
      name: 'raptorFence',
      points: [
        new BABYLON.Vector3(40, 0, 22),
        new BABYLON.Vector3(58, 0, 22),
        new BABYLON.Vector3(62, 0, 40),
        new BABYLON.Vector3(44, 0, 44)
      ],
      height: 6
    }
  ];

  paddockLayouts.forEach(layout => {
    const fence = createPaddockFence(scene, layout.name, layout.points, layout.height);
    fence.parent = root;
    const fenceMat = materials.metal.clone(`${layout.name}Mat`);
    fenceMat.albedoColor = new BABYLON.Color3(0.38, 0.38, 0.42);
    fence.material = fenceMat;
  });

  const jungleCanopy = BABYLON.MeshBuilder.CreateGround('islaJungleCanopy', { width: 220, height: 220, subdivisions: 32 }, scene);
  jungleCanopy.parent = root;
  jungleCanopy.position = new BABYLON.Vector3(-6, 18, 16);
  jungleCanopy.material = materials.ground.clone('jungleCanopyMat');
  jungleCanopy.material.albedoColor = new BABYLON.Color3(0.14, 0.22, 0.12);
  jungleCanopy.material.alpha = 0.2;
  jungleCanopy.isPickable = false;

  return { root, ground, beach, lagoon, monorail, landmarks, mountSibo, ferry, monorailSupports };
}
