function animateElevator(elevator, targetY) {
  const easing = new BABYLON.CubicEase();
  easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  BABYLON.Animation.CreateAndStartAnimation(
    'elevatorMove',
    elevator,
    'position.y',
    60,
    120,
    elevator.position.y,
    targetY,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    easing
  );
}

export function createSkyscraper(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrainRefs) {
  const root = new BABYLON.TransformNode('skyscraperRoot', scene);
  const ground = terrainRefs?.ground;
  const baseY = ground ? ground.getHeightAtCoordinates(0, 52) : 0;
  root.position = new BABYLON.Vector3(0, baseY, 52);

  const doorOpeningWidth = 3.8;
  const doorOpeningHeight = 4.2;
  const doorDepth = 0.25;

  let tower = BABYLON.MeshBuilder.CreateBox('skyscraperTower', { width: 14, depth: 14, height: 36 }, scene);
  tower.position.y = 18;
  tower.material = materials.brick.clone('skyscraperSkin');
  tower.material.albedoColor = new BABYLON.Color3(0.6, 0.7, 0.85);
  tower.parent = root;

  const lobbyDoorCut = BABYLON.MeshBuilder.CreateBox('skyscraperDoorCut', {
    width: doorOpeningWidth + 0.4,
    height: doorOpeningHeight + 0.4,
    depth: doorDepth + 1.6
  }, scene);
  lobbyDoorCut.parent = root;
  lobbyDoorCut.position = new BABYLON.Vector3(0, doorOpeningHeight / 2, 6.9);
  lobbyDoorCut.isVisible = false;

  const towerCSG = BABYLON.CSG.FromMesh(tower);
  const doorCSG = BABYLON.CSG.FromMesh(lobbyDoorCut);
  const carvedTower = towerCSG.subtract(doorCSG).toMesh(tower.name, tower.material, scene);
  carvedTower.position = tower.position.clone();
  carvedTower.rotation = tower.rotation.clone();
  carvedTower.scaling = tower.scaling.clone();
  carvedTower.parent = root;
  carvedTower.checkCollisions = true;
  carvedTower.receiveShadows = true;
  shadowGenerator?.addShadowCaster(carvedTower);

  tower.dispose();
  lobbyDoorCut.dispose();
  tower = carvedTower;

  const glassStrip = BABYLON.MeshBuilder.CreateBox('skyscraperGlass', { width: 13.6, depth: 13.6, height: 1 }, scene);
  glassStrip.position.y = 19;
  glassStrip.parent = root;
  glassStrip.material = materials.glass;

  const lobby = BABYLON.MeshBuilder.CreateBox('skyscraperLobby', { width: 12, depth: 12, height: 0.6 }, scene);
  lobby.position.y = 0.3;
  lobby.material = materials.plaza.clone('skyscraperLobby');
  lobby.parent = root;

  const lobbyDoorRoot = new BABYLON.TransformNode('skyscraperLobbyDoorRoot', scene);
  lobbyDoorRoot.parent = root;
  lobbyDoorRoot.position = new BABYLON.Vector3(0, doorOpeningHeight / 2, 7 + doorDepth / 2);

  const lobbyDoorMaterial = materials.glass.clone('skyscraperLobbyDoorMat');
  lobbyDoorMaterial.alpha = 0.9;

  const lobbyDoorPanelWidth = doorOpeningWidth / 2;
  const lobbyDoorSlide = lobbyDoorPanelWidth + 0.6;

  const lobbyDoorLeft = BABYLON.MeshBuilder.CreateBox('skyscraperLobbyDoorLeft', {
    width: lobbyDoorPanelWidth,
    height: doorOpeningHeight,
    depth: doorDepth
  }, scene);
  lobbyDoorLeft.material = lobbyDoorMaterial;
  lobbyDoorLeft.parent = lobbyDoorRoot;
  lobbyDoorLeft.position = new BABYLON.Vector3(-lobbyDoorPanelWidth / 2, 0, 0);
  lobbyDoorLeft.checkCollisions = true;
  shadowGenerator?.addShadowCaster(lobbyDoorLeft);

  const lobbyDoorRight = lobbyDoorLeft.clone('skyscraperLobbyDoorRight');
  lobbyDoorRight.position.x = lobbyDoorPanelWidth / 2;
  lobbyDoorRight.checkCollisions = true;
  shadowGenerator?.addShadowCaster(lobbyDoorRight);

  const lobbyDoorLeftAnim = new BABYLON.Animation('skyscraperLobbyDoorLeftAnim', 'position.x', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  lobbyDoorLeftAnim.setKeys([
    { frame: 0, value: -lobbyDoorPanelWidth / 2 },
    { frame: 30, value: -lobbyDoorPanelWidth / 2 - lobbyDoorSlide }
  ]);
  lobbyDoorLeft.animations = [lobbyDoorLeftAnim];

  const lobbyDoorRightAnim = new BABYLON.Animation('skyscraperLobbyDoorRightAnim', 'position.x', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  lobbyDoorRightAnim.setKeys([
    { frame: 0, value: lobbyDoorPanelWidth / 2 },
    { frame: 30, value: lobbyDoorPanelWidth / 2 + lobbyDoorSlide }
  ]);
  lobbyDoorRight.animations = [lobbyDoorRightAnim];

  const lobbyDoorPanels = [lobbyDoorLeft, lobbyDoorRight];
  const lobbyDoorState = { open: false, animating: false };

  const animateLobbyDoor = (from, to, onEnd) => {
    let completed = 0;
    const total = lobbyDoorPanels.length;
    const handleDone = () => {
      completed += 1;
      if (completed === total) onEnd?.();
    };
    const results = [];
    const leftAnim = scene.beginDirectAnimation(lobbyDoorLeft, [lobbyDoorLeftAnim], from, to, false);
    leftAnim.onAnimationEndObservable.addOnce(handleDone);
    results.push(leftAnim);
    const rightAnim = scene.beginDirectAnimation(lobbyDoorRight, [lobbyDoorRightAnim], from, to, false);
    rightAnim.onAnimationEndObservable.addOnce(handleDone);
    results.push(rightAnim);
    return results;
  };

  const openLobbyDoor = () => {
    if (lobbyDoorState.open || lobbyDoorState.animating) return null;
    lobbyDoorState.animating = true;
    lobbyDoorPanels.forEach(panel => (panel.checkCollisions = false));
    return animateLobbyDoor(0, 30, () => {
      lobbyDoorState.open = true;
      lobbyDoorState.animating = false;
    });
  };

  const closeLobbyDoor = () => {
    if (!lobbyDoorState.open || lobbyDoorState.animating) return null;
    lobbyDoorState.animating = true;
    return animateLobbyDoor(30, 0, () => {
      lobbyDoorState.open = false;
      lobbyDoorState.animating = false;
      lobbyDoorPanels.forEach(panel => (panel.checkCollisions = true));
    });
  };

  const toggleLobbyDoor = () => (lobbyDoorState.open ? closeLobbyDoor() : openLobbyDoor());

  const lobbyDoor = {
    panels: lobbyDoorPanels,
    root: lobbyDoorRoot,
    open: openLobbyDoor,
    close: closeLobbyDoor,
    toggle: toggleLobbyDoor,
    state: lobbyDoorState
  };

  lobbyDoor.panels.forEach(panel => {
    interactionManager.register(panel, {
      prompt: 'Press E to enter',
      tooltip: '<strong>Skyscraper Lobby</strong><br/>Slide the glass entry doors to reach the elevator.',
      action: () => lobbyDoor.toggle()
    });
  });

  const elevator = BABYLON.MeshBuilder.CreateBox('skyscraperElevator', { width: 3, depth: 3, height: 2.2 }, scene);
  elevator.position = new BABYLON.Vector3(0, 1.4, 4);
  elevator.material = materials.metal.clone('elevatorMat');
  elevator.material.albedoColor = new BABYLON.Color3(0.4, 0.45, 0.5);
  elevator.parent = root;
  elevator.checkCollisions = true;
  elevator.receiveShadows = true;

  const elevatorDoor = BABYLON.MeshBuilder.CreatePlane('elevatorDoor', { width: 2.6, height: 2.2 }, scene);
  elevatorDoor.position = new BABYLON.Vector3(0, 1.1, 5.51);
  elevatorDoor.material = materials.metal.clone('elevatorDoorMat');
  elevatorDoor.material.albedoColor = new BABYLON.Color3(0.3, 0.32, 0.36);
  elevatorDoor.parent = root;
  const elevatorDoorBaseMaterial = elevatorDoor.material;
  const elevatorDoorHighlight = materials.doorHighlight;

  if (interactionManager && elevatorDoorHighlight) {
    interactionManager.register(elevatorDoor, {
      prompt: null,
      range: 4,
      highlightColor: elevatorDoorHighlight.emissiveColor,
      onFocus: () => {
        elevatorDoor.material = elevatorDoorHighlight;
      },
      onBlur: () => {
        elevatorDoor.material = elevatorDoorBaseMaterial;
      }
    });
  }

  const levelOffsets = [1.4, 13.4, 25.4];
  const floorLabels = ['Innovation Lab', 'Sky Lounge', 'Observation Deck'];
  const floorRoots = [];

  levelOffsets.forEach((y, index) => {
    const floor = new BABYLON.TransformNode(`floor_${index}`, scene);
    floor.position = new BABYLON.Vector3(0, y, 0);
    floor.parent = root;
    floorRoots.push(floor);

    const pad = BABYLON.MeshBuilder.CreateBox(`floorPad_${index}`, { width: 11, depth: 11, height: 0.3 }, scene);
    pad.position = new BABYLON.Vector3(0, -0.15, 0);
    pad.material = materials.plaza.clone(`floorPadMat_${index}`);
    pad.material.albedoColor = new BABYLON.Color3(0.35 + index * 0.15, 0.35, 0.5);
    pad.parent = floor;
    pad.receiveShadows = true;

    const nameSign = BABYLON.MeshBuilder.CreatePlane(`floorLabel_${index}`, { width: 6, height: 1.5 }, scene);
    nameSign.position = new BABYLON.Vector3(0, 2, -5.5);
    nameSign.rotation.x = -Math.PI / 16;
    nameSign.parent = floor;
    const signTex = new BABYLON.DynamicTexture(`floorLabelTex_${index}`, { width: 512, height: 256 }, scene, true);
    const ctx = signTex.getContext();
    ctx.fillStyle = '#0b101c';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#6ad6ff';
    ctx.font = 'bold 64px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(floorLabels[index], 256, 120);
    signTex.update(false);
    const signMat = new BABYLON.StandardMaterial(`floorLabelMat_${index}`, scene);
    signMat.diffuseTexture = signTex;
    signMat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1);
    nameSign.material = signMat;
  });

  // ─── Floor Content ────────────────────────────────────────────────────────────

  // Helper: create a small lore screen on a floor
  const makeLoreTerminal = (name, floorRoot, localPos, title, body, flag, coins) => {
    const terminal = BABYLON.MeshBuilder.CreateBox(`${name}_body`, { width: 1.4, depth: 0.2, height: 1.8 }, scene);
    terminal.material = materials.metal.clone(`${name}_mat`);
    terminal.material.albedoColor = new BABYLON.Color3(0.15, 0.18, 0.25);
    terminal.position.copyFrom(localPos);
    terminal.parent = floorRoot;
    terminal.checkCollisions = true;
    shadowGenerator?.addShadowCaster(terminal);

    const screen = BABYLON.MeshBuilder.CreatePlane(`${name}_screen`, { width: 1.1, height: 1.1 }, scene);
    screen.position = new BABYLON.Vector3(localPos.x, localPos.y + 0.1, localPos.z + 0.11);
    screen.parent = floorRoot;
    const tex = new BABYLON.DynamicTexture(`${name}_tex`, { width: 512, height: 512 }, scene, true);
    const ctx = tex.getContext();
    ctx.fillStyle = '#060e1c';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#6ad6ff';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 72);
    ctx.fillStyle = '#c8dcf8';
    ctx.font = '24px Inter';
    const words = body.split(' ');
    let line = '';
    let y = 130;
    words.forEach(word => {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > 440 && line.length > 0) {
        ctx.fillText(line.trim(), 256, y);
        line = word + ' ';
        y += 36;
      } else {
        line = test;
      }
    });
    ctx.fillText(line.trim(), 256, y);
    tex.update(false);
    const screenMat = new BABYLON.StandardMaterial(`${name}_screenMat`, scene);
    screenMat.diffuseTexture = tex;
    screenMat.emissiveColor = new BABYLON.Color3(0.15, 0.5, 0.85);
    screen.material = screenMat;

    interactionManager.register(screen, {
      prompt: `Press E to read: ${title}`,
      tooltip: `<strong>${title}</strong><br/>A research terminal on the Innovation Lab floor.`,
      range: 4,
      action: () => {
        if (!gameState.hasFlag(flag)) {
          gameState.addCoins(coins, 'discovery');
          gameState.setFlag(flag, true);
        }
        hud.pushNotification(body, 'info', 6000);
      }
    });

    return terminal;
  };

  // Innovation Lab (floor 0, levelOffset 1.4) — 3 lore terminals
  const labRoot = floorRoots[0];
  makeLoreTerminal(
    'labTerm1', labRoot,
    new BABYLON.Vector3(-4, 1.2, -4),
    'City Origins',
    'Lifebot Town was founded as a coastal research outpost in the early settlement era. The original twelve families built the plaza using reclaimed harbour materials.',
    'lab-terminal-1', 1
  );
  makeLoreTerminal(
    'labTerm2', labRoot,
    new BABYLON.Vector3(0, 1.2, -4),
    'The Incident',
    'In Year 7, a containment breach at the waterfront desalination plant contaminated the harbour. The FlameBot series was deployed to manage remediation — and never left.',
    'lab-terminal-2', 1
  );
  makeLoreTerminal(
    'labTerm3', labRoot,
    new BABYLON.Vector3(4, 1.2, -4),
    'Bunker Coordinates',
    'Maintenance logs reference a sub-stadium emergency bunker at grid ref 0°N, 42°E. Access reportedly requires a clearance badge and a second agent. Investigate the stadium tunnel.',
    'lab-terminal-3', 1
  );

  // Sky Lounge (floor 1, levelOffset 13.4) — furniture + telescope
  const loungeRoot = floorRoots[1];

  // Sofa clusters
  const sofaPositions = [
    new BABYLON.Vector3(-3.5, 0.3, -2),
    new BABYLON.Vector3(3.5, 0.3, -2),
    new BABYLON.Vector3(0, 0.3, 3),
  ];
  sofaPositions.forEach((pos, idx) => {
    const seat = BABYLON.MeshBuilder.CreateBox(`loungeSofa_${idx}`, { width: 2.2, depth: 0.9, height: 0.5 }, scene);
    seat.position.copyFrom(pos);
    seat.parent = loungeRoot;
    seat.material = materials.brick.clone(`sofaMat_${idx}`);
    seat.material.albedoColor = new BABYLON.Color3(0.28, 0.22, 0.38);
    seat.receiveShadows = true;
    shadowGenerator?.addShadowCaster(seat);
    const back = BABYLON.MeshBuilder.CreateBox(`loungeSofaBack_${idx}`, { width: 2.2, depth: 0.2, height: 0.8 }, scene);
    back.position = new BABYLON.Vector3(pos.x, pos.y + 0.55, pos.z - 0.4);
    back.parent = loungeRoot;
    back.material = seat.material;
    shadowGenerator?.addShadowCaster(back);
  });

  // Coffee table
  const table = BABYLON.MeshBuilder.CreateBox('loungeTable', { width: 1.4, depth: 0.9, height: 0.08 }, scene);
  table.position = new BABYLON.Vector3(0, 0.42, 0);
  table.parent = loungeRoot;
  table.material = materials.glass.clone('loungeTableMat');
  table.material.alpha = 0.7;

  // Telescope near the window wall (north face, z ~ +5)
  const telescopeBase = BABYLON.MeshBuilder.CreateCylinder('telescope_base', { diameter: 0.5, height: 1.2 }, scene);
  telescopeBase.position = new BABYLON.Vector3(4, 0.6, 4.5);
  telescopeBase.parent = loungeRoot;
  telescopeBase.material = materials.metal.clone('telescopeMat');
  telescopeBase.material.albedoColor = new BABYLON.Color3(0.4, 0.4, 0.45);
  shadowGenerator?.addShadowCaster(telescopeBase);

  const telescopeTube = BABYLON.MeshBuilder.CreateCylinder('telescope_tube', { diameterTop: 0.18, diameterBottom: 0.24, height: 1.0 }, scene);
  telescopeTube.rotation.x = Math.PI / 3;
  telescopeTube.position = new BABYLON.Vector3(4, 1.6, 4.2);
  telescopeTube.parent = loungeRoot;
  telescopeTube.material = telescopeBase.material;
  shadowGenerator?.addShadowCaster(telescopeTube);

  interactionManager.register(telescopeTube, {
    prompt: 'Press E to look through the telescope',
    tooltip: '<strong>Sky Lounge Telescope</strong><br/>Peer across the city towards the waterfront.',
    range: 3.5,
    action: () => {
      if (!gameState.hasFlag('telescope-used')) {
        gameState.addCoins(3, 'discovery');
        gameState.setFlag('telescope-used', true);
      }
      // Pan the camera briefly toward London (world offset roughly +120, 0, -28 from origin)
      const cam = scene.activeCamera;
      if (cam) {
        const savedPos = cam.position.clone();
        const savedTarget = cam.target ? cam.target.clone() : null;
        const loungeWorldPos = loungeRoot.getAbsolutePosition();
        cam.position = new BABYLON.Vector3(loungeWorldPos.x + 4, loungeWorldPos.y + 14 + 1.8, loungeWorldPos.z + 4.5);
        if (cam.setTarget) cam.setTarget(new BABYLON.Vector3(118, 6, -28));
        hud.pushNotification('Through the lens: a blinking light pulses inside a London Eye gondola, far across the bay.', 'info', 5500);
        setTimeout(() => {
          cam.position.copyFrom(savedPos);
          if (savedTarget && cam.setTarget) cam.setTarget(savedTarget);
        }, 4000);
      } else {
        hud.pushNotification('You peer through the telescope and spot a blinking light in the London Eye gondola far away.', 'info', 5500);
      }
    }
  });

  // Observation Deck (floor 2, levelOffset 25.4) — compass rose + plaque
  const deckRoot = floorRoots[2];

  // Compass rose painted on the floor with DynamicTexture decal
  const compass = BABYLON.MeshBuilder.CreatePlane('deckCompass', { width: 7, height: 7 }, scene);
  compass.rotation.x = Math.PI / 2;
  compass.position = new BABYLON.Vector3(0, 0.2, 0);
  compass.parent = deckRoot;
  const compassTex = new BABYLON.DynamicTexture('deckCompassTex', { width: 512, height: 512 }, scene, true);
  const compassCtx = compassTex.getContext();
  compassCtx.clearRect(0, 0, 512, 512);
  compassCtx.strokeStyle = '#6ad6ff';
  compassCtx.lineWidth = 3;
  compassCtx.beginPath();
  compassCtx.arc(256, 256, 200, 0, Math.PI * 2);
  compassCtx.stroke();
  const dirs = [['N', 256, 60], ['S', 256, 460], ['E', 460, 264], ['W', 58, 264]];
  dirs.forEach(([label, x, y]) => {
    compassCtx.fillStyle = '#6ad6ff';
    compassCtx.font = 'bold 48px Inter';
    compassCtx.textAlign = 'center';
    compassCtx.textBaseline = 'middle';
    compassCtx.fillText(label, x, y);
  });
  compassCtx.strokeStyle = '#6ad6ff';
  compassCtx.lineWidth = 2;
  [[256, 72, 256, 440], [72, 256, 440, 256]].forEach(([x1, y1, x2, y2]) => {
    compassCtx.beginPath(); compassCtx.moveTo(x1, y1); compassCtx.lineTo(x2, y2); compassCtx.stroke();
  });
  compassTex.update(false);
  const compassMat = new BABYLON.StandardMaterial('deckCompassMat', scene);
  compassMat.diffuseTexture = compassTex;
  compassMat.emissiveColor = new BABYLON.Color3(0.1, 0.35, 0.55);
  compass.material = compassMat;

  // Inscription plaque on the wall
  const plaque = BABYLON.MeshBuilder.CreateBox('deckPlaque', { width: 4, height: 1.2, depth: 0.1 }, scene);
  plaque.position = new BABYLON.Vector3(0, 2.5, -5);
  plaque.parent = deckRoot;
  const plaqueTex = new BABYLON.DynamicTexture('deckPlaqueTex', { width: 512, height: 192 }, scene, true);
  const plaqueCtx = plaqueTex.getContext();
  plaqueCtx.fillStyle = '#0b1528';
  plaqueCtx.fillRect(0, 0, 512, 192);
  plaqueCtx.fillStyle = '#d4c89a';
  plaqueCtx.font = 'bold 32px Inter';
  plaqueCtx.textAlign = 'center';
  plaqueCtx.fillText('OBSERVATION DECK — EST. YEAR 1', 256, 56);
  plaqueCtx.font = '22px Inter';
  plaqueCtx.fillStyle = '#c8c0a0';
  plaqueCtx.fillText('Originally a meteorological monitoring station.', 256, 100);
  plaqueCtx.fillText('Converted to civic tower after the harbor incident.', 256, 130);
  plaqueCtx.fillText('Spy facility construction began Year 4.', 256, 160);
  plaqueTex.update(false);
  const plaqueMat = new BABYLON.StandardMaterial('deckPlaqueMat', scene);
  plaqueMat.diffuseTexture = plaqueTex;
  plaqueMat.emissiveColor = new BABYLON.Color3(0.3, 0.25, 0.1);
  plaque.material = plaqueMat;

  interactionManager.register(plaque, {
    prompt: 'Press E to read the dedication plaque',
    tooltip: '<strong>Observation Deck Plaque</strong><br/>A founding inscription on the tower wall.',
    range: 4,
    action: () => {
      if (!gameState.hasFlag('observation-plaque')) {
        gameState.addCoins(2, 'discovery');
        gameState.setFlag('observation-plaque', true);
      }
      hud.pushNotification('Originally a weather station, this tower witnessed the harbor incident and now serves as the town\'s civic centrepiece. The spy facility below was quietly commissioned in Year 4.', 'info', 7000);
    }
  });

  // Night-only star map: replaces compass texture when time is night
  // We hook into scene render to swap the compass texture based on lighting cycle time.
  // The lighting module stores cycle position on scene metadata; we check once per 5 seconds.
  let lastNightCheck = 0;
  let nightObserverGranted = false;
  scene.onBeforeRenderObservable.add(() => {
    if (nightObserverGranted) return;
    const now = performance.now();
    if (now - lastNightCheck < 5000) return;
    lastNightCheck = now;
    const meta = scene.metadata;
    const isNight = meta && typeof meta.cycleT === 'number' && (meta.cycleT < 0.2 || meta.cycleT > 0.8);
    if (!isNight) return;
    // Redraw compass as star map
    compassCtx.clearRect(0, 0, 512, 512);
    compassCtx.fillStyle = '#04080f';
    compassCtx.fillRect(0, 0, 512, 512);
    for (let s = 0; s < 120; s++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      const sr = Math.random() * 1.8 + 0.5;
      compassCtx.beginPath();
      compassCtx.arc(sx, sy, sr, 0, Math.PI * 2);
      compassCtx.fillStyle = `rgba(200,220,255,${0.4 + Math.random() * 0.6})`;
      compassCtx.fill();
    }
    compassCtx.fillStyle = '#6ad6ff';
    compassCtx.font = 'bold 28px Inter';
    compassCtx.textAlign = 'center';
    compassCtx.fillText('GRID 0°N 42°E', 256, 460);
    compassCtx.font = '20px Inter';
    compassCtx.fillStyle = '#a8ccff';
    compassCtx.fillText('The stars confirm the bunker coordinates.', 256, 492);
    compassTex.update(false);
    if (!gameState.hasFlag('night-observer')) {
      gameState.addCoins(5, 'discovery');
      gameState.setFlag('night-observer', true);
      hud.pushNotification('The star map appears on the floor — the constellations align with coordinates from Lab Terminal 3. Grid 0°N, 42°E confirmed.', 'success', 7000);
    }
  });

  const panel = BABYLON.MeshBuilder.CreateBox('elevatorPanel', { width: 0.6, height: 1.6, depth: 0.2 }, scene);
  panel.position = new BABYLON.Vector3(2.2, 1.4, 3.9);
  panel.material = materials.metal.clone('panelMat');
  panel.material.albedoColor = new BABYLON.Color3(0.25, 0.32, 0.5);
  panel.parent = root;

  const panelButtons = [];
  levelOffsets.forEach((_, index) => {
    const button = BABYLON.MeshBuilder.CreateCylinder(`panelButton_${index}`, { diameter: 0.2, height: 0.1 }, scene);
    button.rotation.x = Math.PI / 2;
    button.position = new BABYLON.Vector3(0, 0.6 - index * 0.6, 0.2);
    button.material = materials.neon.clone(`panelButtonMat_${index}`);
    button.parent = panel;
    panelButtons.push(button);
  });

  const infoDisplay = BABYLON.MeshBuilder.CreatePlane('elevatorDisplay', { width: 1.2, height: 0.5 }, scene);
  infoDisplay.position = new BABYLON.Vector3(0, 2.1, 4.9);
  infoDisplay.parent = root;
  const displayTex = new BABYLON.DynamicTexture('elevatorDisplayTex', { width: 256, height: 128 }, scene, true);
  const displayMat = new BABYLON.StandardMaterial('elevatorDisplayMat', scene);
  displayMat.diffuseTexture = displayTex;
  displayMat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 0.9);
  infoDisplay.material = displayMat;

  const updateDisplay = (label) => {
    const ctx = displayTex.getContext();
    ctx.clearRect(0, 0, 256, 128);
    ctx.fillStyle = '#0b101c';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#6ad6ff';
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 64);
    displayTex.update(false);
  };

  let currentLevel = 0;
  updateDisplay('Lobby');

  const rideToLevel = (index) => {
    if (index === currentLevel) return;
    if (index === 2 && !gameState.hasFlag('spy-briefing')) {
      hud.pushNotification('Observation Deck locked. Assist FlameBot first.', 'warning', 2800);
      return;
    }
    currentLevel = index;
    updateDisplay(`Level ${index + 1}`);
    const target = levelOffsets[index];
    animateElevator(elevator, target);
    hud.pushNotification(`Elevator rising to ${floorLabels[index]}.`, 'info', 2600);
  };

  interactionManager.register(panel, {
    prompt: 'Press E to choose a floor',
    tooltip: '<strong>Elevator Controls</strong><br/>Cycle floors to visit labs, lounges, and the observation deck.',
    action: () => {
      const next = (currentLevel + 1) % levelOffsets.length;
      rideToLevel(next);
    }
  });

  panelButtons.forEach((button, index) => {
    interactionManager.register(button, {
      prompt: `Press E to travel to ${floorLabels[index]}`,
      tooltip: `<strong>${floorLabels[index]}</strong><br/>${['Prototype demos', 'VIP lounge & cafe', 'Panoramic city view'][index]}`,
      action: () => rideToLevel(index)
    });
  });

  return { root, elevator, panel, rideToLevel, lobbyDoor };
}
