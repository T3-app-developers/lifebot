function animatePlatform(platform, targetY) {
  const ease = new BABYLON.CubicEase();
  ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  BABYLON.Animation.CreateAndStartAnimation('spyElevatorMove', platform, 'position.y', 60, 120, platform.position.y, targetY, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
}

export function createSpyIsland(scene, materials, shadowGenerator, interactionManager, gameState, hud, camera) {
  const root = new BABYLON.TransformNode('spyIslandRoot', scene);
  root.position = new BABYLON.Vector3(120, -2, 140);

  const rock = BABYLON.MeshBuilder.CreateCylinder('spyRockBase', { diameterTop: 18, diameterBottom: 34, height: 18, tessellation: 12 }, scene);
  rock.position.y = 9;
  const rockMat = materials.wood.clone('spyRockMat');
  rockMat.albedoColor = new BABYLON.Color3(0.25, 0.22, 0.28);
  rock.material = rockMat;
  rock.parent = root;
  rock.receiveShadows = true;

  const grass = BABYLON.MeshBuilder.CreateDisc('spyGrassTop', { radius: 16, tessellation: 48 }, scene);
  grass.rotation.x = Math.PI / 2;
  grass.position.y = 18;
  grass.material = materials.ground;
  grass.parent = root;

  const portalRing = BABYLON.MeshBuilder.CreateTorus('spyPortalRing', { diameter: 10, thickness: 1 }, scene);
  portalRing.position = new BABYLON.Vector3(0, 19, 0);
  portalRing.material = materials.neon;
  portalRing.parent = root;

  const portal = BABYLON.MeshBuilder.CreateDisc('spyPortal', { radius: 4.2, tessellation: 48 }, scene);
  portal.rotation.x = Math.PI / 2;
  portal.position.y = 18.5;
  portal.material = materials.emissive;
  portal.material.emissiveColor = new BABYLON.Color3(0.3, 0.8, 1);
  portal.parent = root;

  const beacon = BABYLON.MeshBuilder.CreateCylinder('spyBeacon', { diameter: 2, height: 6 }, scene);
  beacon.position.y = 21.5;
  beacon.material = materials.metal.clone('spyBeaconMat');
  beacon.material.albedoColor = new BABYLON.Color3(0.15, 0.2, 0.4);
  beacon.parent = root;

  const beaconLight = new BABYLON.SpotLight('spyBeaconLight', beacon.position.add(new BABYLON.Vector3(0, 2, 0)), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
  beaconLight.intensity = 0.6;

  const platform = BABYLON.MeshBuilder.CreateDisc('spyElevatorPlatform', { radius: 3.2, tessellation: 24 }, scene);
  platform.rotation.x = Math.PI / 2;
  platform.position.y = 18.4;
  platform.material = materials.metal.clone('spyPlatform');
  platform.material.albedoColor = new BABYLON.Color3(0.4, 0.5, 0.7);
  platform.parent = root;

  const innerBase = new BABYLON.TransformNode('spyInnerBase', scene);
  innerBase.parent = root;
  innerBase.position = new BABYLON.Vector3(0, 0, 0);

  const floorHeights = [0, 8, 16];
  const rooms = [];
  floorHeights.forEach((height, idx) => {
    const level = new BABYLON.TransformNode(`spyLevel_${idx}`, scene);
    level.position = new BABYLON.Vector3(0, height, 0);
    level.parent = innerBase;

    const deck = BABYLON.MeshBuilder.CreateDisc(`spyDeck_${idx}`, { radius: 8, tessellation: 32 }, scene);
    deck.rotation.x = Math.PI / 2;
    deck.material = materials.metal.clone(`spyDeckMat_${idx}`);
    deck.material.albedoColor = new BABYLON.Color3(0.2 + idx * 0.1, 0.2, 0.35 + idx * 0.1);
    deck.parent = level;
    deck.receiveShadows = true;

    const railing = BABYLON.MeshBuilder.CreateTorus(`spyRailing_${idx}`, { diameter: 14, thickness: 0.3 }, scene);
    railing.rotation.x = Math.PI / 2;
    railing.position.y = 1.2;
    railing.material = materials.metal;
    railing.parent = level;

    rooms.push(level);
  });

  const exitDisc = BABYLON.MeshBuilder.CreateDisc('spyExitDisc', { radius: 2.5 }, scene);
  exitDisc.rotation.x = Math.PI / 2;
  exitDisc.position = new BABYLON.Vector3(0, 0.1, -6);
  exitDisc.material = materials.plaza.clone('spyExitMat');
  exitDisc.material.albedoColor = new BABYLON.Color3(0.3, 0.28, 0.35);
  exitDisc.parent = rooms[0];

  const exitDoor = BABYLON.MeshBuilder.CreateBox('spyExitDoor', { width: 2.4, height: 3, depth: 0.2 }, scene);
  exitDoor.position = new BABYLON.Vector3(0, 1.5, -6.1);
  exitDoor.material = materials.metal;
  exitDoor.parent = rooms[0];

  const controlConsole = BABYLON.MeshBuilder.CreateBox('spyConsole', { width: 3, height: 1, depth: 1.2 }, scene);
  controlConsole.position = new BABYLON.Vector3(2, 1, 2);
  controlConsole.material = materials.metal.clone('spyConsoleMat');
  controlConsole.material.albedoColor = new BABYLON.Color3(0.12, 0.2, 0.4);
  controlConsole.parent = rooms[1];

  const holoScreen = BABYLON.MeshBuilder.CreatePlane('spyHolo', { width: 2.8, height: 1.6 }, scene);
  holoScreen.position = new BABYLON.Vector3(2, 2.2, 2);
  holoScreen.rotation.y = Math.PI / 2;
  holoScreen.parent = rooms[1];
  holoScreen.material = materials.neon;

  const weaponsRack = BABYLON.MeshBuilder.CreateBox('spyRack', { width: 3, height: 2, depth: 0.6 }, scene);
  weaponsRack.position = new BABYLON.Vector3(-2, 1, 2);
  weaponsRack.material = materials.metal.clone('spyRackMat');
  weaponsRack.material.albedoColor = new BABYLON.Color3(0.18, 0.2, 0.3);
  weaponsRack.parent = rooms[2];

  let insideBase = false;
  let elevatorLevel = 0;

  const moveInside = () => {
    insideBase = true;
    camera.parent = platform;
    camera.position = new BABYLON.Vector3(0, 1.6, -2);
    hud.pushNotification('You descend into the spy facility.', 'info', 3200);
    gameState.emit('entered-spy-base', {});
  };

  const exitBase = () => {
    insideBase = false;
    camera.parent = null;
    camera.position = root.position.add(new BABYLON.Vector3(0, 22, 12));
    hud.pushNotification('You step back into the island breeze.', 'info', 2400);
  };

  const goToLevel = (idx) => {
    elevatorLevel = idx;
    const target = floorHeights[idx] + 18.4;
    animatePlatform(platform, target);
    hud.pushNotification(`Spy platform aligned to Level ${idx + 1}.`, 'info', 2400);
  };

  interactionManager.register(portal, {
    prompt: 'Press E to sync with the spy portal',
    tooltip: '<strong>Spy Portal</strong><br/>Requires clearance and FlameBot authorization.',
    action: () => {
      if (!gameState.hasFlag('spy-clearance')) {
        hud.pushNotification('A hidden scanner rejects you. Acquire a clearance badge from the shop.', 'danger', 3600);
        return;
      }
      if (!gameState.hasFlag('spy-briefing')) {
        hud.pushNotification('FlameBot has not authorized entry yet. Complete the harbor briefing.', 'warning', 3200);
        return;
      }
      moveInside();
    }
  });

  interactionManager.register(exitDoor, {
    prompt: 'Press E to exit to the island',
    tooltip: '<strong>Surface Exit</strong><br/>Return to the portal.',
    action: exitBase
  });

  interactionManager.register(controlConsole, {
    prompt: 'Press E to decrypt harbor intel',
    tooltip: '<strong>Harbor Console</strong><br/>Upload FlameBot logs to earn coins.',
    action: () => {
      gameState.addCoins(8, 'Spy console data upload');
      gameState.pushNotification('Harbor intel decrypted. Funds wired to your account.', 'success', 3200);
      gameState.setFlag('spy-intel', true);
    }
  });

  interactionManager.register(weaponsRack, {
    prompt: 'Press E to collect prototype gadget',
    tooltip: '<strong>Prototype Gadget</strong><br/>Limited-use distraction drone.',
    action: () => {
      if (gameState.hasItem('drone-decoy')) {
        hud.pushNotification('You already carry the prototype drone.', 'warning', 2200);
        return;
      }
      gameState.addItem('drone-decoy', {
        id: 'drone-decoy',
        name: 'Decoy Drone',
        quantity: 1,
        type: 'gadget',
        description: 'Deploy to distract enemies and unlock shortcuts.'
      });
      gameState.pushNotification('Prototype drone secured.', 'success', 2600);
    }
  });

  interactionManager.register(platform, {
    prompt: 'Press E to cycle spy levels',
    tooltip: '<strong>Spy Platform</strong><br/>Align with deeper levels.',
    action: () => {
      const next = (elevatorLevel + 1) % floorHeights.length;
      goToLevel(next);
    }
  });

  scene.onBeforeRenderObservable.add(() => {
    portalRing.rotation.y += 0.01;
  });

  return { root, portal, platform, goToLevel, exitBase };
}
