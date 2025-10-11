export class GameState extends EventTarget {
  constructor() {
    super();
    this.coins = 25;
    this.inventory = new Map();
    this.flags = new Set();
    this.quests = new Map();
    this.activeQuestId = null;
    this.objectives = [];
    this.lastStatusLine = 'Explore Lifebot Town';
    this.hiddenSequence = [];
    this.settings = {
      gameplay: {
        viewMode: 'first-person',
        dinosaursEnabled: false
      },
      avatar: {
        baseBody: 'bot-boy',
        hairstyle: 'spiky',
        top: 'retro-tee',
        bottom: 'adventure',
        accessory: 'none'
      }
    };
  }

  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  getInventoryList() {
    return Array.from(this.inventory.values()).map(item => ({ ...item }));
  }

  addCoins(amount, context = 'reward') {
    this.coins += amount;
    this.emit('coins', { coins: this.coins, delta: amount, context });
  }

  spendCoins(amount, context = 'purchase') {
    if (this.coins < amount) {
      this.emit('insufficient-coins', { required: amount, coins: this.coins, context });
      return false;
    }
    this.coins -= amount;
    this.emit('coins', { coins: this.coins, delta: -amount, context });
    return true;
  }

  addItem(id, { name, quantity = 1, type = 'generic', description = '' }) {
    const current = this.inventory.get(id) || { id, name, quantity: 0, type, description };
    current.quantity += quantity;
    current.type = type;
    current.description = description || current.description;
    this.inventory.set(id, current);
    this.emit('inventory', { inventory: this.getInventoryList(), change: { id, name, quantity, type, description, mode: 'add' } });
    return current.quantity;
  }

  removeItem(id, quantity = 1) {
    const existing = this.inventory.get(id);
    if (!existing) {
      return false;
    }
    existing.quantity -= quantity;
    if (existing.quantity <= 0) {
      this.inventory.delete(id);
    } else {
      this.inventory.set(id, existing);
    }
    this.emit('inventory', { inventory: this.getInventoryList(), change: { id, quantity, mode: 'remove' } });
    return true;
  }

  hasItem(id, quantity = 1) {
    const existing = this.inventory.get(id);
    return !!existing && existing.quantity >= quantity;
  }

  setStatusLine(text) {
    this.lastStatusLine = text;
    this.emit('status', { text });
  }

  pushNotification(text, tone = 'info', duration = 3500) {
    this.emit('notification', { text, tone, duration });
  }

  setActiveQuest(quest) {
    if (!quest) {
      this.activeQuestId = null;
      this.emit('quest-ended', {});
      this.setObjectives([]);
      return;
    }
    this.activeQuestId = quest.id;
    this.quests.set(quest.id, quest);
    this.emit('quest-started', { quest });
    if (quest.objectives) {
      this.setObjectives(quest.objectives);
    }
  }

  updateQuestProgress(questId, update) {
    const quest = this.quests.get(questId);
    if (!quest) return;
    Object.assign(quest.state || (quest.state = {}), update);
    this.emit('quest-progress', { quest });
  }

  completeQuest(questId) {
    const quest = this.quests.get(questId);
    if (!quest) return;
    quest.completed = true;
    this.emit('quest-completed', { quest });
    if (this.activeQuestId === questId) {
      this.activeQuestId = null;
      this.setObjectives([]);
    }
  }

  setObjectives(objectives) {
    this.objectives = objectives;
    this.emit('objectives', { objectives });
  }

  setFlag(flag, value = true) {
    if (value) {
      this.flags.add(flag);
    } else {
      this.flags.delete(flag);
    }
    this.emit('flags', { flags: new Set(this.flags) });
  }

  hasFlag(flag) {
    return this.flags.has(flag);
  }

  registerKeyPress(code) {
    const now = performance.now();
    this.hiddenSequence.push({ code, time: now });
    while (this.hiddenSequence.length > 10) {
      this.hiddenSequence.shift();
    }
    this.emit('key-press', { code, time: now, history: [...this.hiddenSequence] });
  }

  getSettings() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  updateGameplaySettings(changes = {}) {
    this.settings.gameplay = { ...this.settings.gameplay, ...changes };
    this.emit('settings-change', {
      category: 'gameplay',
      changes: { ...changes },
      settings: this.getSettings()
    });
  }

  updateAvatarSettings(changes = {}) {
    this.settings.avatar = { ...this.settings.avatar, ...changes };
    this.emit('settings-change', {
      category: 'avatar',
      changes: { ...changes },
      settings: this.getSettings()
    });
  }

  setAvatarOption(key, value) {
    if (!Object.prototype.hasOwnProperty.call(this.settings.avatar, key)) {
      return;
    }
    this.updateAvatarSettings({ [key]: value });
  }
}
