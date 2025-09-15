import { createMaterials } from './materials.js';
import { setupLighting } from './lighting.js';
import { createTerrain } from './terrain.js';
import { createTown } from './town.js';
import { createSkyscraper } from './skyscraper.js';
import { createSpyIsland } from './spyIsland.js';
import { createHarborBridge } from './bridge.js';
import { createQuestManager } from '../quests/questManager.js';
import { createInteractionManager } from '../core/interaction.js';
import { setupInput } from '../core/input.js';
import { createLifeBotStadium } from '../../stadium.js';

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

  const { shadowGenerator } = setupLighting(scene);
  const materials = createMaterials(scene);

  const interactionManager = createInteractionManager(scene, camera, hud);
  setupInput(scene, camera, gameState, hud);

  const terrain = createTerrain(scene, materials, shadowGenerator);
  const town = createTown(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrain);
  const bridge = createHarborBridge(scene, materials, interactionManager, gameState, hud, terrain);
  const skyscraper = createSkyscraper(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrain);
  const spyIsland = createSpyIsland(scene, materials, shadowGenerator, interactionManager, gameState, hud, camera);

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
    }
  });
  stadiumRoot.root.position = new BABYLON.Vector3(-70, terrain.ground.getHeightAtCoordinates(-70, 80) + 0.1, 80);

  const questManager = createQuestManager({ gameState, hud, interactionManager });

  gameState.addEventListener('secret-sequence', () => {
    if (scene.getMeshByName('secretChest')) return;
    const pos = camera.position.add(new BABYLON.Vector3(4, -1, 4));
    spawnTreasureChest(scene, materials, interactionManager, gameState, hud, pos);
    hud.pushNotification('A hidden chest materializes nearby!', 'success', 3600);
  });

  gameState.addEventListener('bridge-deployed', () => {
    hud.pushNotification('Follow the bridge toward the distant island to reach the spy portal.', 'info', 3600);
  });

  scene.onBeforeRenderObservable.add(() => {
    const { focused } = interactionManager;
    if (!focused) hud.hideTooltip();
  });

  camera.position = new BABYLON.Vector3(-6, 4, -24);
  camera.setTarget(new BABYLON.Vector3(0, 2, 0));

  return { scene, camera, interactionManager, materials, questManager, terrain, town, bridge, skyscraper, spyIsland, stadiumRoot };
}
