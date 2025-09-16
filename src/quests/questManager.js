export function createQuestManager({ gameState, hud, interactionManager }) {
  const quests = new Map();

  function updateObjectives(questId) {
    const quest = quests.get(questId);
    if (!quest) return;
    gameState.setObjectives(quest.objectives.map(obj => ({ ...obj })));
  }

  function startQuest(data) {
    quests.set(data.id, data);
    gameState.setActiveQuest(data);
    updateObjectives(data.id);
  }

  function completeQuest(id) {
    const quest = quests.get(id);
    if (!quest || quest.completed) return;
    quest.completed = true;
    gameState.completeQuest(id);
    if (quest.rewardCoins) {
      gameState.addCoins(quest.rewardCoins, quest.title);
    }
    if (quest.rewardFlag) {
      gameState.setFlag(quest.rewardFlag, true);
    }
  }

  function setObjectiveState(questId, objectiveId, changes) {
    const quest = quests.get(questId);
    if (!quest) return;
    const obj = quest.objectives.find(o => o.id === objectiveId);
    if (!obj) return;
    Object.assign(obj, changes);
    updateObjectives(questId);
  }

  function markObjectiveComplete(questId, objectiveId) {
    setObjectiveState(questId, objectiveId, { completed: true, active: false });
    const quest = quests.get(questId);
    if (!quest) return;
    const idx = quest.objectives.findIndex(o => o.id === objectiveId);
    if (idx >= 0 && idx < quest.objectives.length - 1) {
      quest.objectives[idx + 1].active = true;
    }
    updateObjectives(questId);
  }

  const harborBriefing = {
    id: 'harbor-briefing',
    title: 'Harbor Systems Check',
    description: 'Assist FlameBot with calibrations to unlock the spy bridge.',
    completionText: 'Harbor defences calibrated.',
    rewardText: 'Harbor systems restored',
    rewardCoins: 12,
    rewardFlag: 'bridge-authorized',
    objectives: [
      { id: 'collect-water', label: 'Collect a purified water sample from the residences.', active: true, completed: false },
      { id: 'deliver-water', label: 'Deliver the sample to FlameBot in the plaza.', active: false, completed: false },
      { id: 'deploy-bridge', label: 'Deploy the harbor bridge from its control console.', active: false, completed: false }
    ]
  };

  const spyInitiative = {
    id: 'spy-initiative',
    title: 'Spy Initiative',
    description: 'Gain clearance and descend into the spy island facility.',
    completionText: 'Spy base secured and intel decrypted.',
    rewardText: 'Spy initiative complete',
    rewardCoins: 20,
    objectives: [
      { id: 'buy-clearance', label: 'Purchase a spy clearance badge from the town shop.', active: true, completed: false },
      { id: 'enter-base', label: 'Enter the spy portal on the offshore island.', active: false, completed: false },
      { id: 'decrypt-intel', label: 'Decrypt harbor intel within the spy base.', active: false, completed: false }
    ]
  };

  let jobsQueue = [
    { id: 'deliver-energy', label: 'Deliver an energy drink to the stadium commentator', reward: 6 },
    { id: 'stadium-cheer', label: 'Trigger a cheer event from the stadium seats', reward: 5 },
    { id: 'bridge-patrol', label: 'Inspect the deployed harbor bridge', reward: 4 }
  ];
  let activeJob = null;

  function completeJob(job, message) {
    if (!job) return;
    hud.pushNotification(message || `Job complete: ${job.label}`, 'success', 3200);
    gameState.addCoins(job.reward, job.label);
    activeJob = null;
  }

  function assignJob() {
    if (!jobsQueue.length) {
      hud.pushNotification('All town contracts are complete for today.', 'info', 2600);
      return;
    }
    const job = jobsQueue.shift();
    activeJob = job;
    hud.pushNotification(`New contract: ${job.label} (+${job.reward} coins)`, 'success', 3400);
    gameState.pushNotification(`Job added: ${job.label}`, 'info', 3000);
    gameState.emit('job-assigned', { job });
  }

  gameState.addEventListener('flamebot-contact', () => {
    if (!quests.has('harbor-briefing')) {
      startQuest(JSON.parse(JSON.stringify(harborBriefing)));
      gameState.setFlag('flamebot-spoke', true);
      hud.pushNotification('FlameBot authorized you to assist with the harbor systems.', 'info', 3600);
    } else if (!quests.get('harbor-briefing').completed) {
      hud.pushNotification('FlameBot awaits your progress report.', 'info', 2600);
    }
  });

  gameState.addEventListener('inventory', e => {
    const change = e.detail.change;
    if (activeJob?.id === 'deliver-energy' && change?.mode === 'add' && change.id === 'energy-drink') {
      completeJob(activeJob, 'Energy drink delivered to commentary booth.');
    }
    if (change?.mode === 'add' && change.id === 'water-sample' && quests.has('harbor-briefing')) {
      markObjectiveComplete('harbor-briefing', 'collect-water');
      setObjectiveState('harbor-briefing', 'deliver-water', { active: true });
      hud.pushNotification('Bring the sample back to FlameBot.', 'info', 2800);
    }
    if (change?.mode === 'add' && change.id === 'spy-pass' && quests.has('spy-initiative')) {
      markObjectiveComplete('spy-initiative', 'buy-clearance');
      setObjectiveState('spy-initiative', 'enter-base', { active: true });
    }
  });

  gameState.addEventListener('water-delivered', () => {
    if (!quests.has('harbor-briefing')) return;
    markObjectiveComplete('harbor-briefing', 'deliver-water');
    setObjectiveState('harbor-briefing', 'deploy-bridge', { active: true });
    gameState.setFlag('bridge-authorized', true);
    hud.pushNotification('FlameBot authorized you to deploy the harbor bridge.', 'success', 3200);
  });

  gameState.addEventListener('bridge-deployed', () => {
    if (activeJob?.id === 'bridge-patrol') {
      completeJob(activeJob, 'Bridge patrol signed off.');
    }
    if (!quests.has('harbor-briefing')) return;
    markObjectiveComplete('harbor-briefing', 'deploy-bridge');
    completeQuest('harbor-briefing');
    gameState.setFlag('spy-briefing', true);
    hud.pushNotification('Bridge deployment complete. Spy portal now listening for clearance.', 'success', 3800);
    if (!quests.has('spy-initiative')) {
      startQuest(JSON.parse(JSON.stringify(spyInitiative)));
    }
  });

  gameState.addEventListener('entered-spy-base', () => {
    if (!quests.has('spy-initiative')) return;
    markObjectiveComplete('spy-initiative', 'enter-base');
    setObjectiveState('spy-initiative', 'decrypt-intel', { active: true });
  });

  gameState.addEventListener('notification', e => {
    const text = e.detail.text;
    if (text && text.includes('Harbor intel decrypted') && quests.has('spy-initiative')) {
      markObjectiveComplete('spy-initiative', 'decrypt-intel');
      completeQuest('spy-initiative');
    }
  });

  gameState.addEventListener('job-board', () => assignJob());

  gameState.addEventListener('job-assigned', e => {
    const job = e.detail.job;
    if (!job) return;
    if (job.id === 'deliver-energy') {
      hud.pushNotification('Find the commentator near the stadium scoreboard.', 'info', 2800);
    }
    if (job.id === 'stadium-cheer') {
      hud.pushNotification('The crowd expects a cheer from the stands.', 'info', 2400);
      const handler = () => {
        if (activeJob?.id === 'stadium-cheer') {
          completeJob(activeJob, 'Cheer contract fulfilled.');
          gameState.removeEventListener('stadium-cheer', handler);
        }
      };
      gameState.addEventListener('stadium-cheer', handler);
    }
  });

  return {
    startQuest,
    completeQuest,
    setObjectiveState,
    markObjectiveComplete,
    assignJob
  };
}
