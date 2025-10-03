const DEG2RAD = Math.PI / 180;

function sampleHeightAt(ground, x, z, fallback = 0) {
  if (!ground || typeof ground.getHeightAtCoordinates !== 'function') {
    return fallback;
  }
  const height = ground.getHeightAtCoordinates(x, z);
  return (typeof height === 'number' ? height : fallback);
}

function createPathSegment(scene, material, ground, start, end, width, name) {
  const startHeight = sampleHeightAt(ground, start.x, start.z, start.y || 0);
  const endHeight = sampleHeightAt(ground, end.x, end.z, end.y || 0);
  const avgHeight = (startHeight + endHeight) / 2;
  const length = BABYLON.Vector3.Distance(start, end);
  const center = start.add(end).scale(0.5);
  const yaw = Math.atan2(end.x - start.x, end.z - start.z);
  const segment = BABYLON.MeshBuilder.CreateBox(name, {
    width,
    height: 0.3,
    depth: length + 0.01
  }, scene);
  segment.position = new BABYLON.Vector3(center.x, avgHeight + 0.15, center.z);
  segment.rotation.y = yaw;
  segment.material = material;
  segment.checkCollisions = true;
  segment.receiveShadows = true;
  return segment;
}

function createPathNetwork(scene, materials, ground, routes) {
  const pathMaterial = materials.plaza.clone('wayfinderPathMat');
  pathMaterial.albedoColor = new BABYLON.Color3(0.7, 0.72, 0.78);
  pathMaterial.metallic = 0.1;
  pathMaterial.roughness = 0.75;
  pathMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2);
  pathMaterial.backFaceCulling = true;

  const glowMaterial = materials.neon.clone('wayfinderEdgeMat');
  glowMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.7, 1);
  glowMaterial.alpha = 0.75;

  const segments = [];
  const beacons = [];

  routes.forEach(route => {
    const { points, width = 4.8, id } = route;
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const segment = createPathSegment(scene, pathMaterial, ground, start, end, width, `${id}_segment_${i}`);
      segments.push(segment);

      const mid = start.add(end).scale(0.5);
      const beacon = BABYLON.MeshBuilder.CreateCylinder(`${id}_beacon_${i}`, {
        height: 1.2,
        diameter: 0.4
      }, scene);
      const beaconHeight = sampleHeightAt(ground, mid.x, mid.z, mid.y || segment.position.y);
      beacon.position = new BABYLON.Vector3(mid.x, beaconHeight + 0.6, mid.z);
      beacon.material = glowMaterial;
      beacon.isPickable = false;
      beacons.push(beacon);
    }
  });

  return { segments, beacons };
}

function drawParagraph(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let offsetY = y;
  words.forEach(word => {
    const testLine = line ? `${line} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, offsetY);
      line = word;
      offsetY += lineHeight;
    } else {
      line = testLine;
    }
  });
  if (line) {
    ctx.fillText(line, x, offsetY);
  }
  return offsetY;
}

function createWorldDirectory(scene, materials, interactionManager, gameState, hud, ground) {
  const baseHeight = sampleHeightAt(ground, 4, -4, 0);

  const plinth = BABYLON.MeshBuilder.CreateCylinder('worldDirectoryPlinth', {
    height: 1.2,
    diameter: 2.6
  }, scene);
  plinth.position = new BABYLON.Vector3(4, baseHeight + 0.6, -4);
  plinth.material = materials.plaza.clone('worldDirectoryPlinthMat');
  plinth.material.albedoColor = new BABYLON.Color3(0.45, 0.48, 0.55);

  const pillar = BABYLON.MeshBuilder.CreateCylinder('worldDirectoryPillar', {
    height: 2.6,
    diameter: 1.2
  }, scene);
  pillar.position = plinth.position.add(new BABYLON.Vector3(0, 1.4, 0));
  pillar.material = materials.metal.clone('worldDirectoryPillarMat');
  pillar.material.albedoColor = new BABYLON.Color3(0.3, 0.34, 0.42);

  const panel = BABYLON.MeshBuilder.CreatePlane('worldDirectoryPanel', {
    width: 4.2,
    height: 5.6
  }, scene);
  panel.parent = pillar;
  panel.position = new BABYLON.Vector3(0, 1.8, 0.75);
  panel.rotation = new BABYLON.Vector3(0, Math.PI, 0);

  const texture = new BABYLON.DynamicTexture('worldDirectoryTexture', { width: 1024, height: 1536 }, scene, true);
  const ctx = texture.getContext();
  const material = materials.glass.clone('worldDirectoryPanelMat');
  material.alpha = 0.9;
  material.diffuseTexture = texture;
  material.emissiveColor = new BABYLON.Color3(0.4, 0.7, 1.0);
  panel.material = material;

  const computeStatuses = () => {
    const statuses = [];
    const flamebotSpoke = gameState.hasFlag('flamebot-spoke');
    const bridgeAuthorized = gameState.hasFlag('bridge-authorized');
    const bridgeOnline = gameState.hasFlag('harbor-bridge-online');
    const spyBriefing = gameState.hasFlag('spy-briefing');
    const spyClearance = gameState.hasFlag('spy-clearance');
    const spyPortalVisited = gameState.hasFlag('spy-portal-visited');
    const spyIntel = gameState.hasFlag('spy-intel');
    const resortTour = gameState.hasFlag('resort-tour');
    const farmHarvested = gameState.hasFlag('farm-harvested');
    const stadiumFan = gameState.hasFlag('stadium-fan');

    statuses.push({
      label: 'Town Square',
      detail: !flamebotSpoke
        ? 'Meet FlameBot near the plaza fountain to start the harbor calibration.'
        : !bridgeAuthorized
          ? (gameState.hasItem('water-sample')
            ? 'Return the purifier bottle to FlameBot so the bridge console can unlock.'
            : 'Collect a purifier sample inside the residential homes for FlameBot.')
          : spyBriefing
            ? 'Town defenses calibrated. Daily contracts available at the job board.'
            : 'Report to the harbor controls to extend the bridge across the bay.'
    });

    statuses.push({
      label: 'Harbor Bridge',
      detail: !bridgeAuthorized
        ? 'Awaiting FlameBot authorization before deployment.'
        : !bridgeOnline
          ? 'Bridge console ready. Activate it by the pier to reach the offshore island.'
          : 'Bridge deployed. Follow the illuminated span toward the spy portal.'
    });

    statuses.push({
      label: 'Spy Initiative',
      detail: !spyClearance
        ? 'Purchase a spy clearance badge from Lifebot Supply in town.'
        : !spyPortalVisited
          ? 'Cross the deployed bridge and synchronize with the spy island portal.'
          : spyIntel
            ? 'Intel decrypted. Awaiting next assignment from FlameBot.'
            : 'Cycle the spy elevator levels and decrypt harbor intel on Level 2.'
    });

    statuses.push({
      label: 'Research Ridge',
      detail: !farmHarvested
        ? 'Harvest glow berries beside the farmland to supply local vendors.'
        : resortTour
          ? 'Lagoon gondola tours active. Relax as you glide above the biodome.'
          : 'Visit the futuristic resort and toggle the lagoon gondola control panel.'
    });

    statuses.push({
      label: 'LifeBot Stadium',
      detail: stadiumFan
        ? 'Fans recognize your energy. Return for new community events soon.'
        : 'Take a seat in the grandstands to trigger a stadium cheer and earn coins.'
    });

    return statuses;
  };

  const render = () => {
    ctx.fillStyle = '#061222';
    ctx.fillRect(0, 0, texture.getSize().width, texture.getSize().height);
    ctx.fillStyle = '#64b1ff';
    ctx.font = 'bold 96px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('World Directory', 512, 120);

    const statuses = computeStatuses();
    ctx.textAlign = 'left';
    ctx.font = 'bold 54px Inter';
    let y = 220;
    const paddingX = 120;
    statuses.forEach(status => {
      ctx.fillStyle = '#9ed4ff';
      ctx.fillText(status.label, paddingX, y);
      ctx.fillStyle = '#d6e7ff';
      ctx.font = '36px Inter';
      const lastY = drawParagraph(ctx, status.detail, paddingX, y + 48, 780, 48);
      ctx.font = 'bold 54px Inter';
      y = lastY + 96;
    });

    texture.update(false);
  };

  render();

  const refresh = () => render();

  const events = [
    'flags',
    'inventory',
    'quest-started',
    'quest-progress',
    'quest-completed',
    'notification',
    'bridge-deployed',
    'stadium-cheer'
  ];
  events.forEach(evt => gameState.addEventListener(evt, refresh));

  interactionManager.register(panel, {
    prompt: 'Press E to review the world directory',
    tooltip: '<strong>World Directory</strong><br/>Summarizes major destinations and quest progress.',
    action: () => {
      render();
      if (!gameState.hasFlag('world-directory-viewed')) {
        gameState.setFlag('world-directory-viewed', true);
        gameState.addCoins(2, 'World briefing');
        hud.pushNotification('World directory synchronized. +2 coins for reconnaissance.', 'success', 3000);
      } else {
        hud.pushNotification('Directory refreshed with the latest intel.', 'info', 2200);
      }
    }
  });

  return { plinth, pillar, panel, refresh };
}

function createDirectionalSign(scene, materials, interactionManager, gameState, hud, ground, config) {
  const { id, position, targetLabel, description, headingDegrees } = config;
  const baseHeight = sampleHeightAt(ground, position.x, position.z, position.y || 0);

  const post = BABYLON.MeshBuilder.CreateCylinder(`${id}_post`, {
    height: 2.4,
    diameter: 0.35
  }, scene);
  post.position = new BABYLON.Vector3(position.x, baseHeight + 1.2, position.z);
  post.material = materials.metal.clone(`${id}_postMat`);
  post.material.albedoColor = new BABYLON.Color3(0.32, 0.36, 0.44);

  const bracket = BABYLON.MeshBuilder.CreateBox(`${id}_bracket`, {
    width: 0.5,
    height: 0.2,
    depth: 0.5
  }, scene);
  bracket.parent = post;
  bracket.position = new BABYLON.Vector3(0, 1.1, 0);
  bracket.material = post.material;

  const panel = BABYLON.MeshBuilder.CreatePlane(`${id}_panel`, {
    width: 2.6,
    height: 1.6
  }, scene);
  panel.parent = bracket;
  panel.position = new BABYLON.Vector3(0, 0.9, 0.65);
  panel.rotation = new BABYLON.Vector3(0, headingDegrees * DEG2RAD, 0);

  const texture = new BABYLON.DynamicTexture(`${id}_texture`, { width: 512, height: 256 }, scene, true);
  const ctx = texture.getContext();
  ctx.fillStyle = '#13233a';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#6fe7ff';
  ctx.font = 'bold 72px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(targetLabel, 256, 110);
  ctx.font = '32px Inter';
  ctx.fillStyle = '#d9f4ff';
  ctx.fillText(description, 256, 170);
  texture.update(false);

  const panelMat = materials.glass.clone(`${id}_panelMat`);
  panelMat.alpha = 0.85;
  panelMat.diffuseTexture = texture;
  panelMat.emissiveColor = new BABYLON.Color3(0.35, 0.7, 0.95);
  panel.material = panelMat;

  interactionManager.register(panel, {
    prompt: `Press E to orient toward ${targetLabel}`,
    tooltip: `<strong>${targetLabel}</strong><br/>${description}`,
    action: () => {
      const flagId = `signpost-${id}`;
      if (!gameState.hasFlag(flagId)) {
        gameState.setFlag(flagId, true);
        gameState.addCoins(1, 'Navigator bonus');
        hud.pushNotification(`${targetLabel} route logged. +1 coin for navigation.`, 'success', 2600);
      } else {
        hud.pushNotification(`${targetLabel} heading confirmed.`, 'info', 2000);
      }
    }
  });

  return { post, panel };
}

export function createGuidanceSystem(scene, materials, interactionManager, gameState, hud, options = {}) {
  const ground = options.ground ?? null;
  const routes = [
    {
      id: 'path-town',
      points: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(-8, 0, 8),
        new BABYLON.Vector3(-18, 0, 14)
      ]
    },
    {
      id: 'path-harbor',
      points: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(-12, 0, -12),
        new BABYLON.Vector3(-30, 0, -30),
        new BABYLON.Vector3(-52, 0, -48)
      ]
    },
    {
      id: 'path-stadium',
      points: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(-16, 0, 18),
        new BABYLON.Vector3(-36, 0, 46),
        new BABYLON.Vector3(-58, 0, 72)
      ]
    },
    {
      id: 'path-resort',
      points: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(16, 0, 10),
        new BABYLON.Vector3(38, 0, 28),
        new BABYLON.Vector3(64, 0, 40)
      ]
    }
  ];

  const paths = createPathNetwork(scene, materials, ground, routes);

  const directory = createWorldDirectory(scene, materials, interactionManager, gameState, hud, ground);

  const signs = [
    createDirectionalSign(scene, materials, interactionManager, gameState, hud, ground, {
      id: 'town',
      position: new BABYLON.Vector3(-6, 0, 6),
      targetLabel: 'Town & Housing',
      description: 'FlameBot, jobs and residences',
      headingDegrees: -40
    }),
    createDirectionalSign(scene, materials, interactionManager, gameState, hud, ground, {
      id: 'harbor',
      position: new BABYLON.Vector3(-10, 0, -10),
      targetLabel: 'Harbor Route',
      description: 'Bridge controls & spy access',
      headingDegrees: -135
    }),
    createDirectionalSign(scene, materials, interactionManager, gameState, hud, ground, {
      id: 'resort',
      position: new BABYLON.Vector3(10, 0, 8),
      targetLabel: 'Research Ridge',
      description: 'Farmland & resort labs',
      headingDegrees: 35
    }),
    createDirectionalSign(scene, materials, interactionManager, gameState, hud, ground, {
      id: 'stadium',
      position: new BABYLON.Vector3(-14, 0, 18),
      targetLabel: 'LifeBot Stadium',
      description: 'Grandstands & commentary',
      headingDegrees: 70
    })
  ];

  return {
    paths,
    directory,
    signs
  };
}
