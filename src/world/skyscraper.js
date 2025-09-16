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

  const tower = BABYLON.MeshBuilder.CreateBox('skyscraperTower', { width: 14, depth: 14, height: 36 }, scene);
  tower.position.y = 18;
  tower.material = materials.brick.clone('skyscraperSkin');
  tower.material.albedoColor = new BABYLON.Color3(0.6, 0.7, 0.85);
  tower.checkCollisions = true;
  tower.receiveShadows = true;
  tower.parent = root;
  shadowGenerator?.addShadowCaster(tower);

  const glassStrip = BABYLON.MeshBuilder.CreateBox('skyscraperGlass', { width: 13.6, depth: 13.6, height: 1 }, scene);
  glassStrip.position.y = 19;
  glassStrip.parent = root;
  glassStrip.material = materials.glass;

  const lobby = BABYLON.MeshBuilder.CreateBox('skyscraperLobby', { width: 12, depth: 12, height: 0.6 }, scene);
  lobby.position.y = 0.3;
  lobby.material = materials.plaza.clone('skyscraperLobby');
  lobby.parent = root;

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

  return { root, elevator, panel, rideToLevel };
}
