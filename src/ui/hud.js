const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createHUD(gameState) {
  const coinsEl = document.getElementById('coinsValue');
  const inventoryEl = document.getElementById('inventoryValue');
  const objectiveStatusEl = document.getElementById('statusObjective');
  const objectiveListEl = document.getElementById('objectiveList');
  const notificationsEl = document.getElementById('notifications');
  const promptEl = document.getElementById('interactionPrompt');
  const reticleEl = document.getElementById('reticle');
  const pointerOverlayEl = document.getElementById('pointerLockOverlay');
  const questToastEl = document.getElementById('questToast');
  const questToastTitleEl = document.getElementById('questToastTitle');
  const questToastBodyEl = document.getElementById('questToastBody');
  const tooltipEl = document.getElementById('tooltip');

  const hud = {
    showPrompt(text) {
      promptEl.textContent = text;
      promptEl.style.display = 'block';
    },
    hidePrompt() {
      promptEl.style.display = 'none';
    },
    setReticleVisible(visible) {
      reticleEl.style.display = visible ? 'block' : 'none';
    },
    setPointerOverlayVisible(visible) {
      pointerOverlayEl.classList.toggle('hidden', !visible);
    },
    showQuestToast(title, body) {
      questToastTitleEl.textContent = title;
      questToastBodyEl.textContent = body;
      questToastEl.style.display = 'block';
      clearTimeout(questToastEl._hideTimeout);
      questToastEl._hideTimeout = setTimeout(() => {
        questToastEl.style.display = 'none';
      }, 4200);
    },
    hideQuestToast() {
      questToastEl.style.display = 'none';
    },
    showTooltip(text, x, y) {
      tooltipEl.innerHTML = text;
      tooltipEl.style.display = 'block';
      const offsetX = 16;
      const offsetY = 12;
      const rect = tooltipEl.getBoundingClientRect();
      const clampedX = clamp(x + offsetX, 12, window.innerWidth - rect.width - 12);
      const clampedY = clamp(y + offsetY, 12, window.innerHeight - rect.height - 12);
      tooltipEl.style.left = `${clampedX}px`;
      tooltipEl.style.top = `${clampedY}px`;
    },
    hideTooltip() {
      tooltipEl.style.display = 'none';
    },
    updateObjectiveList(objectives = []) {
      objectiveListEl.innerHTML = '';
      if (!objectives.length) {
        const empty = document.createElement('li');
        empty.textContent = 'Explore freely or talk to townsfolk for guidance.';
        objectiveListEl.append(empty);
        return;
      }
      objectives.forEach(obj => {
        const li = document.createElement('li');
        li.textContent = obj.label;
        if (obj.active) li.classList.add('active');
        if (obj.completed) li.style.textDecoration = 'line-through';
        objectiveListEl.append(li);
      });
    },
    updateInventorySummary(list) {
      if (!list.length) {
        inventoryEl.textContent = 'Empty';
        return;
      }
      const summary = list.map(item => `${item.name} ×${item.quantity}`).join(', ');
      inventoryEl.textContent = summary;
    },
    setStatusLine(text) {
      objectiveStatusEl.textContent = text;
    },
    pushNotification(text, tone = 'info', duration = 3500) {
      const el = document.createElement('div');
      el.className = `notification ${tone}`;
      el.textContent = text;
      notificationsEl.append(el);
      clearTimeout(el._hideTimeout);
      el._hideTimeout = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-12px)';
        setTimeout(() => el.remove(), 220);
      }, duration);
    }
  };

  const initialInventory = gameState.getInventoryList();
  hud.updateInventorySummary(initialInventory);
  coinsEl.textContent = `${gameState.coins}`;
  hud.setStatusLine(gameState.lastStatusLine);

  gameState.addEventListener('coins', e => {
    coinsEl.textContent = `${e.detail.coins}`;
    const tone = e.detail.delta >= 0 ? 'success' : 'warning';
    const delta = e.detail.delta >= 0 ? `+${e.detail.delta}` : `${e.detail.delta}`;
    hud.pushNotification(`${delta} coins (${e.detail.context})`, tone, 2200);
  });

  gameState.addEventListener('insufficient-coins', e => {
    hud.pushNotification(`You need ${e.detail.required} coins for this (${e.detail.context}).`, 'danger', 3200);
  });

  gameState.addEventListener('inventory', e => {
    hud.updateInventorySummary(e.detail.inventory);
    if (e.detail.change?.mode === 'add') {
      hud.pushNotification(`Received ${e.detail.change.name} ×${e.detail.change.quantity}`, 'success', 2600);
    } else if (e.detail.change?.mode === 'remove') {
      hud.pushNotification(`Used ${e.detail.change.id}`, 'warning', 2200);
    }
  });

  gameState.addEventListener('notification', e => {
    hud.pushNotification(e.detail.text, e.detail.tone, e.detail.duration);
  });

  gameState.addEventListener('objectives', e => {
    hud.updateObjectiveList(e.detail.objectives);
  });

  gameState.addEventListener('status', e => {
    hud.setStatusLine(e.detail.text);
  });

  gameState.addEventListener('quest-started', e => {
    const quest = e.detail.quest;
    hud.showQuestToast(`Quest started: ${quest.title}`, quest.description || '');
    hud.updateObjectiveList(quest.objectives || []);
  });

  gameState.addEventListener('quest-completed', e => {
    const quest = e.detail.quest;
    hud.showQuestToast(`Quest complete: ${quest.title}`, quest.completionText || 'Great job!');
    hud.pushNotification(`${quest.rewardText || 'Quest complete'}!`, 'success', 3200);
  });

  gameState.addEventListener('quest-progress', e => {
    const quest = e.detail.quest;
    hud.updateObjectiveList(quest.objectives || []);
  });

  return hud;
}
