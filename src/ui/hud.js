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
  const menuButtonEl = document.getElementById('menuButton');
  const menuEl = document.getElementById('gameMenu');
  const menuCloseEl = document.getElementById('menuClose');
  const menuViews = Array.from(menuEl?.querySelectorAll('.menu-view') || []);
  const viewModeButtonEls = Array.from(document.querySelectorAll('#viewModeButtons .option-chip'));
  const dinosaursSwitchEl = document.getElementById('dinosaursSwitch');
  const avatarPreviewEl = document.getElementById('avatarPreview');
  const avatarOptionGroups = Array.from(menuEl?.querySelectorAll('.option-group[data-setting]') || []);

  const avatarLabels = {
    baseBody: {
      'bot-girl': 'Girl base body',
      'bot-boy': 'Boy base body'
    },
    hairstyle: {
      twists: 'Twists',
      spiky: 'Spiky spikes',
      pony: 'Hero ponytail',
      buzz: 'Buzz cut'
    },
    top: {
      'sci-jacket': 'Science jacket',
      'retro-tee': 'Retro tee',
      sporty: 'Sporty hoodie'
    },
    bottom: {
      adventure: 'Adventure trousers',
      shorts: 'Explorer shorts',
      tech: 'Tech leggings'
    },
    accessory: {
      headset: 'Holo headset',
      sunglasses: 'Neon sunglasses',
      'adventure-hat': 'Explorer hat',
      none: 'No extra gear'
    }
  };

  const avatarFieldLabels = {
    baseBody: 'Base body',
    hairstyle: 'Hairstyle',
    top: 'Top',
    bottom: 'Bottoms',
    accessory: 'Accessory'
  };

  const viewModeNames = {
    'first-person': 'First Person',
    'third-person-back': 'Third Person Back'
  };

  let activeMenuView = 'home';

  const setMenuView = (view) => {
    activeMenuView = view;
    menuViews.forEach(section => {
      const isActive = section.dataset.view === view;
      section.classList.toggle('hidden', !isActive);
      if (isActive) {
        const focusable = section.querySelector('button, [href], input');
        focusable?.focus({ preventScroll: true });
      }
    });
  };

  const openMenu = (view = 'home') => {
    if (!menuEl) return;
    menuEl.classList.remove('hidden');
    menuEl.setAttribute('aria-hidden', 'false');
    menuButtonEl?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    setMenuView(view);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    reticleEl.style.display = 'none';
  };

  const closeMenu = () => {
    if (!menuEl) return;
    menuEl.classList.add('hidden');
    menuEl.setAttribute('aria-hidden', 'true');
    menuButtonEl?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    activeMenuView = 'home';
  };

  const syncAvatarOptions = (avatar) => {
    avatarOptionGroups.forEach(group => {
      const setting = group.dataset.setting;
      const selected = avatar?.[setting];
      group.querySelectorAll('.option-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.value === selected);
      });
    });
    if (!avatarPreviewEl) return;
    const summaryLines = [
      `<strong>Base:</strong> ${avatarLabels.baseBody[avatar.baseBody] || avatar.baseBody}`,
      `<strong>Hair:</strong> ${avatarLabels.hairstyle[avatar.hairstyle] || avatar.hairstyle}`,
      `<strong>Top:</strong> ${avatarLabels.top[avatar.top] || avatar.top}`,
      `<strong>Bottoms:</strong> ${avatarLabels.bottom[avatar.bottom] || avatar.bottom}`,
      `<strong>Extra:</strong> ${avatarLabels.accessory[avatar.accessory] || avatar.accessory}`
    ];
    avatarPreviewEl.innerHTML = `${summaryLines.join('<br>')}<br><span class="hint">Avatar styling saves instantly and will sync with future character models.</span>`;
  };

  const syncGameplayOptions = (gameplay) => {
    viewModeButtonEls.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.viewMode === gameplay.viewMode);
    });
    if (dinosaursSwitchEl) {
      dinosaursSwitchEl.checked = !!gameplay.dinosaursEnabled;
    }
  };

  const syncSettingsUI = (settings) => {
    if (!settings) return;
    syncAvatarOptions(settings.avatar);
    syncGameplayOptions(settings.gameplay);
  };

  const hud = {
    openMenu(view = 'home') {
      openMenu(view);
    },
    closeMenu() {
      closeMenu();
    },
    updateSettingsUI(settings) {
      syncSettingsUI(settings);
    },
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

  const handleMenuAction = (action) => {
    switch (action) {
      case 'resume':
        closeMenu();
        hud.showPrompt('Click to jump back in');
        break;
      case 'open-settings':
        setMenuView('settings');
        break;
      case 'open-avatar':
        setMenuView('avatar');
        break;
      case 'open-gameplay':
        setMenuView('gameplay');
        break;
      case 'back-home':
        setMenuView('home');
        break;
      case 'back-settings':
        setMenuView('settings');
        break;
      case 'quit':
        closeMenu();
        hud.pushNotification('Thanks for visiting Lifebot Town! Returning to the title screen...', 'warning', 3200);
        setTimeout(() => {
          window.location.reload();
        }, 600);
        break;
      case 'close':
        closeMenu();
        hud.showPrompt('Click to regain control');
        break;
      default:
        break;
    }
  };

  const initialSettings = gameState.getSettings();
  syncSettingsUI(initialSettings);

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

  gameState.addEventListener('settings-change', e => {
    const { category, changes, settings } = e.detail;
    syncSettingsUI(settings);
    if (category === 'gameplay') {
      if (Object.prototype.hasOwnProperty.call(changes, 'viewMode')) {
        const modeLabel = viewModeNames[settings.gameplay.viewMode] || settings.gameplay.viewMode;
        hud.pushNotification(`${modeLabel} view engaged.`, 'info', 2400);
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'dinosaursEnabled')) {
        if (settings.gameplay.dinosaursEnabled) {
          hud.pushNotification('Friendly dinosaurs stomp into the plaza!', 'success', 3600);
        } else {
          hud.pushNotification('The dinosaurs wander back to their sanctuary.', 'warning', 3200);
        }
      }
    } else if (category === 'avatar') {
      Object.entries(changes).forEach(([key, value]) => {
        const fieldLabel = avatarFieldLabels[key] || key;
        const optionLabel = avatarLabels[key]?.[value] || value;
        hud.pushNotification(`${fieldLabel} set to ${optionLabel}.`, 'info', 2200);
      });
    }
  });

  menuButtonEl?.addEventListener('click', () => openMenu('home'));
  menuCloseEl?.addEventListener('click', () => handleMenuAction('close'));

  menuEl?.addEventListener('click', event => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !menuEl.contains(actionEl)) return;
    event.preventDefault();
    handleMenuAction(actionEl.dataset.action);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuEl && !menuEl.classList.contains('hidden')) {
      event.preventDefault();
      handleMenuAction('close');
    }
  });

  avatarOptionGroups.forEach(group => {
    group.addEventListener('click', event => {
      const button = event.target.closest('.option-chip');
      if (!button) return;
      event.preventDefault();
      const value = button.dataset.value;
      const setting = group.dataset.setting;
      gameState.setAvatarOption(setting, value);
    });
  });

  viewModeButtonEls.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.viewMode;
      gameState.updateGameplaySettings({ viewMode: mode });
    });
  });

  dinosaursSwitchEl?.addEventListener('change', event => {
    gameState.updateGameplaySettings({ dinosaursEnabled: event.target.checked });
  });

  return hud;
}
