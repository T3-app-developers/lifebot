export function setupPointerLock(canvas, hud) {
  const overlay = document.getElementById('pointerLockOverlay');

  const requestLock = () => {
    canvas.focus({ preventScroll: true });
    if (canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
  };

  overlay.addEventListener('click', requestLock);
  canvas.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas) {
      requestLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    hud.setPointerOverlayVisible(!locked);
    hud.setReticleVisible(locked);
    if (!locked) {
      hud.showPrompt('Click to regain control');
    } else {
      hud.hidePrompt();
    }
  });

  document.addEventListener('pointerlockerror', () => {
    hud.pushNotification('Could not lock pointer. Check browser permissions.', 'danger', 4200);
  });
}
