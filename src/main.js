import { GameState } from './core/gameState.js';
import { createHUD } from './ui/hud.js';
import { setupPointerLock } from './ui/pointerLock.js';
import { createGameWorld } from './world/world.js';

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

const gameState = new GameState();
const hud = createHUD(gameState);
setupPointerLock(canvas, hud);

const world = createGameWorld(engine, canvas, gameState, hud);

engine.runRenderLoop(() => {
  world.scene.render();
});

window.addEventListener('resize', () => {
  engine.resize();
});
