export function setupInput(scene, camera, gameState, hud) {
  const pressed = new Set();
  const baseSpeed = 0.6;
  const sprintSpeed = 1.15;
  camera.speed = baseSpeed;
  camera.keysUp.push(87);
  camera.keysDown.push(83);
  camera.keysLeft.push(65);
  camera.keysRight.push(68);
  camera.checkCollisions = true;
  camera.applyGravity = true;
  camera.ellipsoid = new BABYLON.Vector3(1.2, 1.8, 1.2);
  camera.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0);

  const tryJump = () => {
    const origin = camera.position.add(new BABYLON.Vector3(0, -camera.ellipsoid.y, 0));
    const ray = new BABYLON.Ray(origin, BABYLON.Vector3.Down(), 1.6);
    const pick = scene.pickWithRay(ray, mesh => !!mesh.checkCollisions);
    if (pick?.hit) {
      camera.cameraDirection.y += 0.8;
    }
  };

  const toggleMap = () => {
    const mapActive = document.body.classList.toggle('map-visible');
    if (mapActive) {
      hud.pushNotification('A holographic minimap fades in, showing key landmarks.', 'info', 2600);
    } else {
      hud.pushNotification('Minimap hidden.', 'info', 1600);
    }
  };

  window.addEventListener('keydown', ev => {
    if (ev.target && ['INPUT', 'TEXTAREA'].includes(ev.target.tagName)) return;
    pressed.add(ev.code);
    gameState.registerKeyPress(ev.code);

    if (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') {
      camera.speed = sprintSpeed;
    }
    if (ev.code === 'Space') {
      tryJump();
    }
    if (ev.code === 'KeyM') {
      ev.preventDefault();
      toggleMap();
    }
    if (ev.code === 'Tab') {
      ev.preventDefault();
      const inventory = gameState.getInventoryList();
      const summary = inventory.length
        ? inventory.map(item => `${item.name} ×${item.quantity}`).join('\n')
        : 'Inventory empty. Visit shops or quests to collect gear.';
      hud.pushNotification(summary, 'info', 4200);
    }
  });

  window.addEventListener('keyup', ev => {
    pressed.delete(ev.code);
    if (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') {
      camera.speed = baseSpeed;
    }
  });

  gameState.addEventListener('key-press', e => {
    const history = e.detail.history;
    if (history.length < 5) return;
    const recent = history.slice(-5);
    const allA = recent.every(entry => entry.code === 'KeyA');
    if (!allA) return;
    const withinWindow = recent[recent.length - 1].time - recent[0].time < 1800;
    if (withinWindow) {
      gameState.emit('secret-sequence', {});
    }
  });

  return { pressed };
}
