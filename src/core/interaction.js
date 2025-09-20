const DEFAULT_RANGE = 5.5;

function findInteractable(mesh) {
  let current = mesh;
  while (current) {
    const config = current.metadata?.interactable;
    if (config) {
      const owner = config.ownerMesh ?? current;
      return {
        mesh,
        owner,
        config
      };
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

  function applyHighlight(target) {
    const highlightMesh =
      target.config?.highlightMesh ||
      (target.mesh instanceof BABYLON.AbstractMesh ? target.mesh : null) ||
      (target.owner instanceof BABYLON.AbstractMesh ? target.owner : null);
    target.highlightMesh = highlightMesh;
    if (highlightMesh) {
      highlightLayer.addMesh(
        highlightMesh,
        target.config?.highlightColor || BABYLON.Color3.FromHexString('#6ad6ff')
      );
    }
  }

  function removeHighlight(target) {
    if (target?.highlightMesh) {
      highlightLayer.removeMesh(target.highlightMesh);
      target.highlightMesh = null;
    }
  }

  function focusTarget(target) {
    if (focused?.mesh === target?.mesh && focused?.owner === target?.owner) return;
    if (focused) {
      removeHighlight(focused);
      focused.config?.onBlur?.(focused);
    }
    focused = target;
    if (focused) {
      applyHighlight(focused);
      focused.config?.onFocus?.(focused);
    }
  }

  function clearFocus() {
    if (focused) {
      removeHighlight(focused);
      focused.config?.onBlur?.(focused);
      focused = null;
    }
    hud.hidePrompt();
    hud.hideTooltip();
  }

  const manager = {
    register(mesh, config = {}) {
      mesh.metadata = mesh.metadata || {};
      const existing = mesh.metadata.interactable || {};
      const combined = { ...existing, ...config };
      combined.ownerMesh = mesh;
      mesh.metadata.interactable = combined;
      interactables.add(mesh);
      return mesh;
    },
    unregister(mesh) {
      if (mesh.metadata) delete mesh.metadata.interactable;
      interactables.delete(mesh);
      if (focused && (focused.owner === mesh || focused.mesh === mesh)) {
        clearFocus();
      }
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
          const target = { ...data };
          focusTarget(target);
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
      const actionTarget = focused.owner ?? focused.mesh;
      focused.config?.action?.(actionTarget, focused.config, focused);
    }
  });

  return manager;
}
