import { createMaterials } from './materials.js';
import { setupLighting } from './lighting.js';
import { createTerrain } from './terrain.js';
import { createTown } from './town.js';
import { createSkyscraper } from './skyscraper.js';
import { createSpyIsland } from './spyIsland.js';
import { createIslaNublar } from './islaNublar.js';
import { createHarborBridge } from './bridge.js';
import { createQuestManager } from '../quests/questManager.js';
import { createInteractionManager } from '../core/interaction.js';
import { setupInput } from '../core/input.js';
import { createLifeBotStadium } from '../../stadium.js';
import { createDinosaurManager } from './dinosaurs.js';
import { createPlayerAvatar } from './playerAvatar.js';
import { createCentralLondon } from './london.js';
import { createFuturisticResort } from './resort.js';
import { createGuidanceSystem } from './guidance.js';

const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);

function spawnTreasureChest(scene, materials, interactionManager, gameState, hud, position) {
  const chest = BABYLON.MeshBuilder.CreateBox('secretChest', { width: 1.6, height: 1.2, depth: 1.2 }, scene);
  chest.position.copyFrom(position);
  chest.material = materials.wood.clone('secretChestMat');
  chest.material.albedoColor = new BABYLON.Color3(0.6, 0.4, 0.2);
  chest.checkCollisions = true;
  const lid = BABYLON.MeshBuilder.CreateBox('secretChestLid', { width: 1.6, height: 0.2, depth: 1.2 }, scene);
  lid.position = new BABYLON.Vector3(0, 0.6, 0);
  lid.material = materials.metal.clone('secretChestLidMat');
  lid.material.albedoColor = new BABYLON.Color3(0.8, 0.7, 0.3);
  lid.parent = chest;

  interactionManager.register(chest, {
    prompt: 'Press E to open the hidden cache',
    tooltip: '<strong>Hidden Cache</strong><br/>Secret reward for curious players.',
    action: () => {
      BABYLON.Animation.CreateAndStartAnimation('chestOpen', lid, 'rotation.x', 60, 60, lid.rotation.x, -Math.PI / 2.4, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      gameState.addCoins(30, 'Secret cache');
      gameState.pushNotification('You discovered FlameBot\'s emergency fund.', 'success', 3600);
      interactionManager.unregister(chest);
      chest.isPickable = false;
    }
  });
  return chest;
}

export function createGameWorld(engine, canvas, gameState, hud) {
  const scene = new BABYLON.Scene(engine);
  scene.enablePhysics = false;
  scene.collisionsEnabled = true;
  scene.gravity = new BABYLON.Vector3(0, -0.9, 0);

  const camera = new BABYLON.UniversalCamera('playerCamera', new BABYLON.Vector3(0, 4, -30), scene);
  camera.minZ = 0.1;
  camera.maxZ = 2000;
  camera.attachControl(canvas);

  const playerProxy = new BABYLON.TransformNode('playerProxy', scene);
  playerProxy.position.copyFrom(camera.position);

  const followCamera = new BABYLON.FollowCamera('thirdPersonCamera', camera.position.clone(), scene);
  followCamera.lockedTarget = playerProxy;
  followCamera.radius = 7.2;
  followCamera.heightOffset = 2.6;
  followCamera.rotationOffset = 180;
  followCamera.cameraAcceleration = 0.08;
  followCamera.maxCameraSpeed = 6.5;
  followCamera.lowerRadiusLimit = 4.5;
  followCamera.upperRadiusLimit = 9.5;
  followCamera.detachControl();

  const avatar = createPlayerAvatar(scene);
  avatar.root.parent = playerProxy;
  avatar.root.position = new BABYLON.Vector3(0, 0, 0);
  avatar.setEnabled(false);

  const forwardVec = new BABYLON.Vector3();
  const proxyPos = new BABYLON.Vector3();
  const playerForwardOffset = 0.9;
  let playerVerticalOffset = (camera.ellipsoid?.y || 1.8) + (camera.ellipsoidOffset?.y || 0);

  const { shadowGenerator } = setupLighting(scene);
  const materials = createMaterials(scene);

  const interactionManager = createInteractionManager(scene, camera, hud);

  const terrain = createTerrain(scene, materials, shadowGenerator);
  const town = createTown(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrain);
  const bridge = createHarborBridge(scene, materials, interactionManager, gameState, hud, terrain);
  const skyscraper = createSkyscraper(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrain);
  const spyIsland = createSpyIsland(scene, materials, shadowGenerator, interactionManager, gameState, hud, camera);
  const islaNublar = createIslaNublar(scene, materials, shadowGenerator, interactionManager, gameState, hud);
  const london = createCentralLondon(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrain, camera);
  const resort = createFuturisticResort(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrain);
  const dinosaurManager = createDinosaurManager(scene, terrain);
  const inputState = setupInput(scene, camera, gameState, hud);

  const setInitialSpawn = () => {
    const spawnPosition = new BABYLON.Vector3(0, 0, -8);
    const groundHeight = terrain.ground?.getHeightAtCoordinates(spawnPosition.x, spawnPosition.z) || 0;
    spawnPosition.y = groundHeight + playerVerticalOffset;
    camera.position.copyFrom(spawnPosition);
    const lookTarget = new BABYLON.Vector3(0, groundHeight + 1.6, -13);
    camera.setTarget(lookTarget);
    playerProxy.position.copyFrom(spawnPosition);
    playerProxy.position.y -= playerVerticalOffset;
    const forward = camera.getForwardRay().direction;
    playerProxy.rotation.y = Math.atan2(forward.x, forward.z);
    followCamera.position = spawnPosition.add(new BABYLON.Vector3(0, followCamera.heightOffset, followCamera.radius));
  };

  setInitialSpawn();

  const guidance = createGuidanceSystem(scene, materials, interactionManager, gameState, hud, {
    ground: terrain.ground
  });

  const stadiumRoot = createLifeBotStadium(scene, {
    parent: null,
    npcFillRatio: 0.14,
    onSit: seat => {
      const seatPos = seat.getAbsolutePosition();
      camera.position = seatPos.add(new BABYLON.Vector3(0, 0.6, 0.2));
      if (scene.activeCamera === camera) {
        camera.setTarget(seatPos.add(new BABYLON.Vector3(0, 0.3, -0.2)));
      }
      gameState.addCoins(1, 'Fan participation');
      gameState.emit('stadium-cheer', {});
      gameState.setFlag('stadium-fan', true);
    }
  });
  stadiumRoot.root.position = new BABYLON.Vector3(-70, terrain.ground.getHeightAtCoordinates(-70, 80) + 0.1, 80);

  const questManager = createQuestManager({ gameState, hud, interactionManager });

  const setViewMode = (mode) => {
    if (mode === 'third-person-back') {
      if (scene.activeCamera !== followCamera) {
        scene.activeCamera = followCamera;
      }
      avatar.setEnabled(true);
    } else {
      if (scene.activeCamera !== camera) {
        scene.activeCamera = camera;
      }
      avatar.setEnabled(false);
    }
  };

  const applyGameplaySettings = (settings) => {
    setViewMode(settings.viewMode);
    dinosaurManager.setEnabled(settings.dinosaursEnabled);
  };

  const applyAvatarSettings = (avatarSettings) => {
    avatar.updateAppearance(avatarSettings);
  };

  const initialSettings = gameState.getSettings();
  applyGameplaySettings(initialSettings.gameplay);
  applyAvatarSettings(initialSettings.avatar);

  gameState.addEventListener('settings-change', e => {
    const { category, changes, settings } = e.detail;
    if (category === 'gameplay') {
      if (Object.prototype.hasOwnProperty.call(changes, 'viewMode')) {
        setViewMode(settings.gameplay.viewMode);
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'dinosaursEnabled')) {
        dinosaurManager.setEnabled(settings.gameplay.dinosaursEnabled);
      }
    } else if (category === 'avatar') {
      applyAvatarSettings(settings.avatar);
    }
  });

  gameState.addEventListener('secret-sequence', () => {
    if (scene.getMeshByName('secretChest')) return;
    const pos = camera.position.add(new BABYLON.Vector3(4, -1, 4));
    spawnTreasureChest(scene, materials, interactionManager, gameState, hud, pos);
    hud.pushNotification('A hidden chest materializes nearby!', 'success', 3600);
    avatar.playShoot();
  });

  gameState.addEventListener('bridge-deployed', () => {
    hud.pushNotification('Follow the bridge toward the distant island to reach the spy portal.', 'info', 3600);
  });

  scene.onBeforeRenderObservable.add(() => {
    const forward = camera.getForwardRay().direction;
    forwardVec.copyFrom(forward).normalize();
    const yaw = Math.atan2(forwardVec.x, forwardVec.z);
    proxyPos.copyFrom(camera.position);
    proxyPos.addInPlace(forwardVec.scale(playerForwardOffset));
    proxyPos.y -= playerVerticalOffset;
    playerProxy.position.copyFrom(proxyPos);
    playerProxy.rotation.y = yaw;
    followCamera.rotationOffset = 180 - BABYLON.Tools.ToDegrees(playerProxy.rotation.y);

    const isMoving = Array.from(inputState.pressed).some(code => MOVEMENT_KEYS.has(code));
    avatar.setMovementState({
      isMoving,
      isSprinting: inputState.isSprinting
    });

    const { focused } = interactionManager;
    if (!focused) hud.hideTooltip();
  });

  return {
    scene,
    camera,
    followCamera,
    playerProxy,
    avatar,
    interactionManager,
    questManager,
    dinosaurManager,
    guidance
  };
}
