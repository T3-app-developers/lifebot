export function createHarborBridge(scene, materials, interactionManager, gameState, hud, terrainRefs) {
  const root = new BABYLON.TransformNode('harborBridgeRoot', scene);
  const ground = terrainRefs?.ground;
  const start = new BABYLON.Vector3(20, ground ? ground.getHeightAtCoordinates(20, 20) : 0, 20);
  root.position = start;

  const segmentCount = 8;
  const segmentLength = 12;
  const segments = [];
  let accumulatedZ = 0;

  for (let i = 0; i < segmentCount; i++) {
    const segment = BABYLON.MeshBuilder.CreateBox(`bridgeSegment_${i}`, { width: 4, depth: segmentLength, height: 0.6 }, scene);
    segment.material = materials.metal.clone(`bridgeSegmentMat_${i}`);
    segment.material.albedoColor = new BABYLON.Color3(0.25, 0.32, 0.42);
    segment.position = new BABYLON.Vector3(0, 6 + i * 2, accumulatedZ + segmentLength / 2);
    segment.parent = root;
    segment.checkCollisions = true;
    segment.receiveShadows = true;
    segments.push(segment);
    accumulatedZ += segmentLength;
  }

  const endPosition = start.add(new BABYLON.Vector3(0, -2, accumulatedZ));

  const controlPedestal = BABYLON.MeshBuilder.CreateCylinder('bridgeControl', { diameter: 2, height: 2.4 }, scene);
  controlPedestal.material = materials.plaza.clone('bridgeControlMat');
  controlPedestal.position = start.add(new BABYLON.Vector3(-4, 1.2, -4));

  const controlPanel = BABYLON.MeshBuilder.CreatePlane('bridgePanel', { width: 2, height: 1.2 }, scene);
  controlPanel.position = controlPedestal.position.add(new BABYLON.Vector3(0, 1.2, 1.2));
  controlPanel.rotation.x = Math.PI / 4;
  controlPanel.material = materials.neon;

  let deployed = false;

  const deployBridge = () => {
    if (deployed) {
      hud.pushNotification('Bridge already extended.', 'info', 1800);
      return;
    }
    if (!gameState.hasFlag('bridge-authorized')) {
      hud.pushNotification('FlameBot requires confirmation before deploying the bridge.', 'warning', 3200);
      return;
    }
    deployed = true;
    segments.forEach((segment, idx) => {
      const easing = new BABYLON.CubicEase();
      easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
      BABYLON.Animation.CreateAndStartAnimation(
        `bridgeDrop_${idx}`,
        segment,
        'position',
        60,
        120,
        segment.position,
        new BABYLON.Vector3(0, 0, idx * segmentLength + segmentLength / 2),
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        easing
      );
      BABYLON.Animation.CreateAndStartAnimation(
        `bridgeRotate_${idx}`,
        segment,
        'rotation.x',
        60,
        120,
        segment.rotation.x,
        0,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        easing
      );
    });
    hud.pushNotification('Harbor bridge unfurls across the bay.', 'success', 3200);
    gameState.emit('bridge-deployed', { endPosition });
    gameState.setFlag('harbor-bridge-online', true);

    // Create arrival marker on the far side after bridge deploys
    setTimeout(() => {
      const arrivalSign = BABYLON.MeshBuilder.CreateBox('bridgeArrivalSign', { width: 3.2, depth: 0.12, height: 1.8 }, scene);
      arrivalSign.position = endPosition.add(new BABYLON.Vector3(0, 1.6, 4));
      const arrivalTex = new BABYLON.DynamicTexture('bridgeArrivalTex', { width: 512, height: 256 }, scene, true);
      const actx = arrivalTex.getContext();
      actx.fillStyle = '#0d1a2e';
      actx.fillRect(0, 0, 512, 256);
      actx.fillStyle = '#ff4444';
      actx.font = 'bold 32px Inter';
      actx.textAlign = 'center';
      actx.fillText('⚠  RESTRICTED ZONE  ⚠', 256, 72);
      actx.fillStyle = '#c8dcf8';
      actx.font = '26px Inter';
      actx.fillText('SPY FACILITY — AUTHORIZED PERSONNEL ONLY', 256, 130);
      actx.fillStyle = '#9ab5d8';
      actx.font = '22px Inter';
      actx.fillText('Clearance badge required beyond this point', 256, 175);
      arrivalTex.update(false);
      const arrivalMat = new BABYLON.StandardMaterial('bridgeArrivalMat', scene);
      arrivalMat.diffuseTexture = arrivalTex;
      arrivalMat.emissiveColor = new BABYLON.Color3(0.12, 0.22, 0.4);
      arrivalSign.material = arrivalMat;

      interactionManager.register(arrivalSign, {
        prompt: 'Press E to read the warning sign',
        tooltip: '<strong>Restricted Zone</strong><br/>You\'ve crossed the harbor into restricted territory.',
        range: 6,
        action: () => {
          if (!gameState.hasFlag('bridge-crossed')) {
            gameState.addCoins(2, 'discovery');
            gameState.setFlag('bridge-crossed', true);
            hud.pushNotification('You\'ve crossed into the restricted harbor zone. The spy facility looms ahead — this is where the FlameBot series was first deployed after the Year 7 incident.', 'warning', 7000);
          } else {
            hud.pushNotification('Spy Facility — Authorized Personnel Only. Your clearance badge grants access.', 'info', 3000);
          }
        }
      });
    }, 2500); // Slight delay so bridge animation completes first
  };

  interactionManager.register(controlPanel, {
    prompt: 'Press E to deploy the harbor bridge',
    tooltip: '<strong>Harbor Bridge Controls</strong><br/>Requires FlameBot authorization.',
    action: deployBridge
  });

  return { root, controlPanel, deployBridge, endPosition };
}
