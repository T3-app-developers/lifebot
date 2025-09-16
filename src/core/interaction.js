const DEFAULT_RANGE = 5.5;

function findInteractable(mesh) {
  let current = mesh;
  while (current) {
    if (current.metadata && current.metadata.interactable) {
      return { mesh: current, config: current.metadata.interactable };
    }
    current = current.parent;
  }
  return null;
}

export function createInteractionManager(scene, camera, hud) {
  const interactables = new Set();
  const highlightLayer = new BABYLON.HighlightLayer('interactionHighlight', scene);
  highlightLayer.innerGlow = false;
  highlightLayer.outerGlow = true;
  highlightLayer.blurHorizontalSize = 1;
  highlightLayer.blurVerticalSize = 1;

  let focused = null;

  function focusTarget(target) {
    if (focused?.mesh === target?.mesh) return;
    if (focused) {
      highlightLayer.removeMesh(focused.mesh);
      focused.config?.onBlur?.();
    }
    focused = target;
    if (focused) {
      highlightLayer.addMesh(focused.mesh, focused.config?.highlightColor || BABYLON.Color3.FromHexString('#6ad6ff'));
      focused.config?.onFocus?.();
    }
  }

  function clearFocus() {
    if (focused) {
      highlightLayer.removeMesh(focused.mesh);
      focused.config?.onBlur?.();
      focused = null;
    }
    hud.hidePrompt();
    hud.hideTooltip();
  }

  const manager = {
    register(mesh, config = {}) {
      mesh.metadata = mesh.metadata || {};
      mesh.metadata.interactable = { ...config };
      interactables.add(mesh);
      return mesh;
    },
    unregister(mesh) {
      if (mesh.metadata) delete mesh.metadata.interactable;
      interactables.delete(mesh);
      if (focused?.mesh === mesh) clearFocus();
    },
    get focused() {
      return focused;
    }
  };

  scene.onBeforeRenderObservable.add(() => {
    const ray = camera.getForwardRay(DEFAULT_RANGE);
    const pick = scene.pickWithRay(ray, mesh => {
      if (!mesh) return false;
      return interactables.has(mesh) || !!findInteractable(mesh)?.config;
    });

    if (pick && pick.hit) {
      const data = findInteractable(pick.pickedMesh);
      if (data) {
        const cfg = data.config;
        const range = cfg.range || DEFAULT_RANGE;
        if (pick.distance <= range) {
          focusTarget(data);
          const prompt = cfg.prompt ?? 'Press E to interact';
          if (prompt) {
            hud.showPrompt(prompt);
          } else {
            hud.hidePrompt();
          }
          if (cfg.tooltip) {
            hud.showTooltip(cfg.tooltip, window.innerWidth / 2, window.innerHeight / 2);
          } else {
            hud.hideTooltip();
          }
          return;
        }
      }
    }
    focusTarget(null);
    clearFocus();
  });

  window.addEventListener('keydown', ev => {
    if (ev.repeat) return;
    if (ev.code === 'KeyE' && focused) {
      focused.config?.action?.(focused.mesh, focused.config);
    }
  });

  return manager;
}
