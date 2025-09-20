export function setupPointerLock(canvas, hud) {
  const overlay = document.getElementById('pointerLockOverlay');
  const overlayMenuButton = document.getElementById('overlayMenuButton');

  const requestLock = () => {
    canvas.focus({ preventScroll: true });
    if (canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
  };

  overlay?.addEventListener('click', event => {
    if (event.target.closest('[data-prevent-lock]')) {
      return;
    }
    requestLock();
  });
  canvas.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas) {
      requestLock();
    }
  });

  overlayMenuButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    hud.setPointerOverlayVisible(false);
    hud.openMenu('settings');
  });

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    const menuOpen = document.body.classList.contains('menu-open');
    hud.setPointerOverlayVisible(!locked && !menuOpen);
    hud.setReticleVisible(locked);
    if (!locked) {
      if (menuOpen) {
        return;
      }
      hud.showPrompt('Click to regain control');
    } else {
      hud.hidePrompt();
    }
  });

  document.addEventListener('pointerlockerror', () => {
    hud.pushNotification('Could not lock pointer. Check browser permissions.', 'danger', 4200);
  });
}
