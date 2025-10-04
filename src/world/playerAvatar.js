import { getDashGlbArrayBuffer } from '../assets/dashGlb.js';

const basePalettes = {
  'bot-boy': {
    skin: '#7ed9ff',
    accent: '#13569f'
  },
  'bot-girl': {
    skin: '#f8a8ff',
    accent: '#a032b5'
  }
};

const topColors = {
  'sci-jacket': '#4aa4ff',
  'retro-tee': '#ffce4a',
  sporty: '#5fffd4'
};

const bottomColors = {
  adventure: '#6450ff',
  shorts: '#ff7b64',
  tech: '#44d3ff'
};

const accessoryColors = {
  headset: '#7fd1ff',
  sunglasses: '#1c1c28',
  'adventure-hat': '#c68a42'
};

const HAIR_KEYS = ['spiky', 'pony', 'twists', 'buzz'];
const ACCESSORY_KEYS = ['headset', 'sunglasses', 'adventure-hat'];

function colorFromHex(hex) {
  return BABYLON.Color3.FromHexString(hex);
}

function setMaterialColor(material, color) {
  if (!material || !color) return;
  if (material.albedoColor) {
    material.albedoColor.copyFrom(color);
  } else if (material.diffuseColor) {
    material.diffuseColor.copyFrom(color);
  }
}

function applyColorToMeshes(meshes, color) {
  meshes.forEach(mesh => {
    if (!mesh.material) return;
    if (!mesh.material.metadata || !mesh.material.metadata.__lifebotCloned) {
      const cloned = mesh.material.clone(`${mesh.name}-mat`);
      cloned.metadata = { ...(mesh.material.metadata || {}), __lifebotCloned: true };
      mesh.material = cloned;
    }
    setMaterialColor(mesh.material, color);
  });
}

function buildFallbackAvatar(scene, parent) {
  const root = new BABYLON.TransformNode('avatarFallbackRoot', scene);
  root.parent = parent;

  const skinMat = new BABYLON.StandardMaterial('avatarSkinMat', scene);
  skinMat.diffuseColor = colorFromHex(basePalettes['bot-boy'].skin);
  skinMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const topMat = new BABYLON.StandardMaterial('avatarTopMat', scene);
  topMat.diffuseColor = colorFromHex(topColors['retro-tee']);
  topMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const bottomMat = new BABYLON.StandardMaterial('avatarBottomMat', scene);
  bottomMat.diffuseColor = colorFromHex(bottomColors.adventure);
  bottomMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const hairMat = new BABYLON.StandardMaterial('avatarHairMat', scene);
  hairMat.diffuseColor = colorFromHex(basePalettes['bot-boy'].accent);

  const accessoryMat = new BABYLON.StandardMaterial('avatarAccessoryMat', scene);
  accessoryMat.diffuseColor = colorFromHex(accessoryColors.headset);

  const hips = new BABYLON.TransformNode('avatarFallbackHips', scene);
  hips.parent = root;

  const legs = BABYLON.MeshBuilder.CreateBox('avatarFallbackLegs', { width: 0.55, height: 1.0, depth: 0.45 }, scene);
  legs.position.y = 0.5;
  legs.material = bottomMat;
  legs.parent = hips;

  const torso = BABYLON.MeshBuilder.CreateBox('avatarFallbackTorso', { width: 0.8, height: 1.1, depth: 0.5 }, scene);
  torso.position.y = 1.3;
  torso.material = topMat;
  torso.parent = hips;

  const shoulder = BABYLON.MeshBuilder.CreateBox('avatarFallbackShoulder', { width: 1.1, height: 0.35, depth: 0.35 }, scene);
  shoulder.position.y = 1.7;
  shoulder.material = topMat;
  shoulder.parent = hips;

  const armLeft = BABYLON.MeshBuilder.CreateCylinder('avatarFallbackArmLeft', { diameter: 0.2, height: 1.0 }, scene);
  armLeft.rotation.z = BABYLON.Tools.ToRadians(8);
  armLeft.position = new BABYLON.Vector3(-0.6, 1.1, 0);
  armLeft.material = skinMat;
  armLeft.parent = hips;

  const armRight = armLeft.clone('avatarFallbackArmRight');
  armRight.position.x *= -1;

  const head = BABYLON.MeshBuilder.CreateSphere('avatarFallbackHead', { diameter: 0.65 }, scene);
  head.position.y = 2.2;
  head.material = skinMat;
  head.parent = hips;

  const facePlate = BABYLON.MeshBuilder.CreateCylinder('avatarFallbackFacePlate', { diameter: 0.5, height: 0.08, tessellation: 12 }, scene);
  facePlate.rotation.x = BABYLON.Tools.ToRadians(90);
  facePlate.position = new BABYLON.Vector3(0, 2.15, 0.3);
  facePlate.material = new BABYLON.StandardMaterial('avatarFallbackFaceMat', scene);
  facePlate.material.diffuseColor = colorFromHex('#f5f9ff');
  facePlate.parent = hips;

  const eyeMat = new BABYLON.StandardMaterial('avatarFallbackEyeMat', scene);
  eyeMat.diffuseColor = colorFromHex('#1b3e82');

  const eyeLeft = BABYLON.MeshBuilder.CreateSphere('avatarFallbackEyeLeft', { diameter: 0.12 }, scene);
  eyeLeft.position = new BABYLON.Vector3(-0.12, 2.2, 0.61);
  eyeLeft.material = eyeMat;
  eyeLeft.parent = hips;
  const eyeRight = eyeLeft.clone('avatarFallbackEyeRight');
  eyeRight.position.x *= -1;

  const hairRoot = new BABYLON.TransformNode('avatarFallbackHairRoot', scene);
  hairRoot.parent = head;
  hairRoot.position = new BABYLON.Vector3(0, 0.25, 0);

  const hairVariants = {
    spiky: (() => {
      const group = new BABYLON.TransformNode('fallbackHairSpiky', scene);
      group.parent = hairRoot;
      for (let i = 0; i < 4; i++) {
        const spike = BABYLON.MeshBuilder.CreateCylinder(`fallbackHairSpikySpike${i}`, { diameterTop: 0, diameterBottom: 0.3, height: 0.6 }, scene);
        spike.material = hairMat;
        spike.position = new BABYLON.Vector3((i - 1.5) * 0.18, 0.2, -0.1 + Math.sin(i) * 0.08);
        spike.rotation.x = BABYLON.Tools.ToRadians(-40 - i * 5);
        spike.parent = group;
      }
      return group;
    })(),
    pony: (() => {
      const group = new BABYLON.TransformNode('fallbackHairPony', scene);
      group.parent = hairRoot;
      const cap = BABYLON.MeshBuilder.CreateSphere('fallbackHairPonyCap', { diameter: 0.7 }, scene);
      cap.scaling.y = 0.6;
      cap.material = hairMat;
      cap.position = new BABYLON.Vector3(0, 0.1, 0);
      cap.parent = group;
      const tail = BABYLON.MeshBuilder.CreateCylinder('fallbackHairPonyTail', { diameter: 0.35, height: 0.8 }, scene);
      tail.material = hairMat;
      tail.rotation.x = BABYLON.Tools.ToRadians(120);
      tail.position = new BABYLON.Vector3(0, -0.2, -0.4);
      tail.parent = group;
      return group;
    })(),
    twists: (() => {
      const group = new BABYLON.TransformNode('fallbackHairTwists', scene);
      group.parent = hairRoot;
      for (let i = -1; i <= 1; i += 2) {
        const lock = BABYLON.MeshBuilder.CreateCylinder(`fallbackHairTwist${i}`, { diameter: 0.25, height: 0.9 }, scene);
        lock.material = hairMat;
        lock.rotation.x = BABYLON.Tools.ToRadians(60);
        lock.position = new BABYLON.Vector3(0.25 * i, -0.1, 0.35);
        lock.parent = group;
      }
      const bun = BABYLON.MeshBuilder.CreateSphere('fallbackHairTwistBun', { diameter: 0.6 }, scene);
      bun.material = hairMat;
      bun.position = new BABYLON.Vector3(0, 0.05, 0);
      bun.parent = group;
      return group;
    })(),
    buzz: (() => {
      const group = new BABYLON.TransformNode('fallbackHairBuzz', scene);
      group.parent = hairRoot;
      const cap = BABYLON.MeshBuilder.CreateSphere('fallbackHairBuzzCap', { diameter: 0.68 }, scene);
      cap.scaling.y = 0.45;
      cap.material = hairMat;
      cap.position = new BABYLON.Vector3(0, 0.05, 0);
      cap.parent = group;
      return group;
    })()
  };

  Object.values(hairVariants).forEach(node => node.setEnabled(false));

  const accessoryRoot = new BABYLON.TransformNode('avatarFallbackAccessoryRoot', scene);
  accessoryRoot.parent = head;

  const accessoryVariants = {
    headset: (() => {
      const group = new BABYLON.TransformNode('fallbackAccHeadset', scene);
      group.parent = accessoryRoot;
      const band = BABYLON.MeshBuilder.CreateTorus('fallbackAccHeadsetBand', { diameter: 0.8, thickness: 0.08 }, scene);
      band.rotation.x = BABYLON.Tools.ToRadians(90);
      band.material = accessoryMat;
      band.parent = group;
      const mic = BABYLON.MeshBuilder.CreateCylinder('fallbackAccHeadsetMic', { diameter: 0.08, height: 0.6 }, scene);
      mic.position = new BABYLON.Vector3(0.28, -0.15, 0.45);
      mic.rotation.z = BABYLON.Tools.ToRadians(30);
      mic.material = accessoryMat;
      mic.parent = group;
      return group;
    })(),
    sunglasses: (() => {
      const group = new BABYLON.TransformNode('fallbackAccSunglasses', scene);
      group.parent = accessoryRoot;
      const frame = BABYLON.MeshBuilder.CreateBox('fallbackAccGlassesFrame', { width: 0.8, height: 0.25, depth: 0.05 }, scene);
      frame.position = new BABYLON.Vector3(0, 0, 0.38);
      frame.material = accessoryMat;
      frame.parent = group;
      return group;
    })(),
    'adventure-hat': (() => {
      const group = new BABYLON.TransformNode('fallbackAccHat', scene);
      group.parent = accessoryRoot;
      const brim = BABYLON.MeshBuilder.CreateCylinder('fallbackAccHatBrim', { diameter: 1.1, height: 0.08 }, scene);
      brim.material = accessoryMat;
      brim.position = new BABYLON.Vector3(0, -0.05, 0);
      brim.parent = group;
      const top = BABYLON.MeshBuilder.CreateCylinder('fallbackAccHatTop', { diameter: 0.6, height: 0.45 }, scene);
      top.material = accessoryMat;
      top.position = new BABYLON.Vector3(0, 0.18, 0);
      top.parent = group;
      return group;
    })(),
    none: (() => {
      const group = new BABYLON.TransformNode('fallbackAccNone', scene);
      group.parent = accessoryRoot;
      group.setEnabled(false);
      return group;
    })()
  };

  Object.entries(accessoryVariants).forEach(([key, node]) => {
    node.setEnabled(key === 'none');
  });

  const apply = (settings) => {
    const palette = basePalettes[settings.baseBody] || basePalettes['bot-boy'];
    skinMat.diffuseColor = colorFromHex(palette.skin);
    hairMat.diffuseColor = colorFromHex(palette.accent);

    const topHex = topColors[settings.top] || topColors['retro-tee'];
    const bottomHex = bottomColors[settings.bottom] || bottomColors.adventure;
    topMat.diffuseColor = colorFromHex(topHex);
    bottomMat.diffuseColor = colorFromHex(bottomHex);

    Object.values(hairVariants).forEach(node => node.setEnabled(false));
    (hairVariants[settings.hairstyle] || hairVariants.spiky).setEnabled(true);

    Object.entries(accessoryVariants).forEach(([key, node]) => {
      const enabled = settings.accessory === key;
      node.setEnabled(enabled);
      if (enabled && accessoryColors[key]) {
        accessoryMat.diffuseColor = colorFromHex(accessoryColors[key]);
      }
    });
    if (settings.accessory === 'none') {
      accessoryMat.diffuseColor = colorFromHex(accessoryColors.headset);
    }
  };

  return {
    root,
    apply,
    setEnabled(enabled) {
      root.setEnabled(enabled);
    }
  };
}

export function createPlayerAvatar(scene) {
  const root = new BABYLON.TransformNode('playerAvatarRoot', scene);
  root.setEnabled(false);

  const fallback = buildFallbackAvatar(scene, root);

  const dashState = {
    container: null,
    loaded: false,
    parts: {
      body: [],
      top: [],
      bottom: [],
      hair: HAIR_KEYS.reduce((acc, key) => ({ ...acc, [key]: [] }), {}),
      accessory: ACCESSORY_KEYS.reduce((acc, key) => ({ ...acc, [key]: [] }), {})
    },
    animations: {},
    loopGroup: null,
    shootGroup: null,
    shootObserver: null
  };

  let appearanceSettings = null;
  let movementState = { isMoving: false, isSprinting: false };
  let desiredLoop = 'Idle';

  const ensureLoop = (forceRestart = false) => {
    if (!dashState.loaded) return;
    const targetName = desiredLoop in dashState.animations ? desiredLoop : 'Idle';
    const targetGroup = dashState.animations[targetName];
    if (!targetGroup) return;

    if (dashState.loopGroup && dashState.loopGroup !== targetGroup) {
      dashState.loopGroup.stop();
    }

    if (dashState.loopGroup !== targetGroup || forceRestart) {
      targetGroup.reset();
    }

    dashState.loopGroup = targetGroup;
    targetGroup.speedRatio = movementState.isSprinting ? 1.35 : 1.0;

    if (!targetGroup.isPlaying) {
      targetGroup.start(true);
    } else if (forceRestart) {
      targetGroup.stop();
      targetGroup.start(true);
    }
  };

  const stopShootObserver = () => {
    if (dashState.shootGroup && dashState.shootObserver) {
      dashState.shootGroup.onAnimationEndObservable.remove(dashState.shootObserver);
      dashState.shootObserver = null;
    }
  };

  const applyDashAppearance = () => {
    if (!appearanceSettings || !dashState.loaded) return;
    const palette = basePalettes[appearanceSettings.baseBody] || basePalettes['bot-boy'];
    const bodyColor = colorFromHex(palette.skin);
    const hairColor = colorFromHex(palette.accent);
    const topColor = colorFromHex(topColors[appearanceSettings.top] || topColors['retro-tee']);
    const bottomColor = colorFromHex(bottomColors[appearanceSettings.bottom] || bottomColors.adventure);

    applyColorToMeshes(dashState.parts.body, bodyColor);
    applyColorToMeshes(dashState.parts.top, topColor);
    applyColorToMeshes(dashState.parts.bottom, bottomColor);
    Object.values(dashState.parts.hair).forEach(meshes => applyColorToMeshes(meshes, hairColor));

    const accessoryChoice = appearanceSettings.accessory;
    Object.entries(dashState.parts.accessory).forEach(([key, meshes]) => {
      const enabled = key === accessoryChoice;
      const color = accessoryColors[key] ? colorFromHex(accessoryColors[key]) : colorFromHex(accessoryColors.headset);
      applyColorToMeshes(meshes, color);
      meshes.forEach(mesh => mesh.setEnabled(enabled));
    });
    if (accessoryChoice === 'none' || !dashState.parts.accessory[accessoryChoice]) {
      Object.values(dashState.parts.accessory).forEach(meshes => meshes.forEach(mesh => mesh.setEnabled(false)));
    }

    const hairChoice = appearanceSettings.hairstyle;
    Object.entries(dashState.parts.hair).forEach(([key, meshes]) => {
      const enabled = key === hairChoice;
      meshes.forEach(mesh => mesh.setEnabled(enabled));
    });
    if (!dashState.parts.hair[hairChoice]) {
      dashState.parts.hair.spiky.forEach(mesh => mesh.setEnabled(true));
    }
  };

  const applyAppearance = () => {
    if (!appearanceSettings) return;
    fallback.apply(appearanceSettings);
    applyDashAppearance();
  };

  const dashGlbBuffer = getDashGlbArrayBuffer();
  BABYLON.SceneLoader.ImportMeshAsync('', '', dashGlbBuffer, scene, undefined, '.glb').then(result => {
    const container = new BABYLON.TransformNode('dashAvatarContainer', scene);
    container.parent = root;

    [...result.meshes, ...(result.transformNodes || [])].forEach(node => {
      if (!node.parent) {
        node.parent = container;
      }
    });

    const hairNameMap = {
      DashHairSpiky: 'spiky',
      DashHairPony: 'pony',
      DashHairTwists: 'twists',
      DashHairBuzz: 'buzz'
    };
    const accessoryNameMap = {
      DashAccessoryHeadset: 'headset',
      DashAccessorySunglasses: 'sunglasses',
      DashAccessoryHat: 'adventure-hat'
    };

    result.meshes.forEach(mesh => {
      if (mesh.material) {
        const cloned = mesh.material.clone(`${mesh.name}-mat`);
        cloned.metadata = { ...(mesh.material.metadata || {}), __lifebotCloned: true };
        mesh.material = cloned;
      }
      if (/DashCore|DashHead|DashArm/.test(mesh.name)) {
        dashState.parts.body.push(mesh);
      }
      if (mesh.name === 'DashTorso') {
        dashState.parts.top.push(mesh);
      }
      if (mesh.name.startsWith('DashLeg')) {
        dashState.parts.bottom.push(mesh);
      }
      const hairKey = hairNameMap[mesh.name];
      if (hairKey && dashState.parts.hair[hairKey]) {
        dashState.parts.hair[hairKey].push(mesh);
      }
      const accessoryKey = accessoryNameMap[mesh.name];
      if (accessoryKey && dashState.parts.accessory[accessoryKey]) {
        dashState.parts.accessory[accessoryKey].push(mesh);
      }
    });

    result.animationGroups.forEach(group => {
      group.stop();
      dashState.animations[group.name] = group;
    });

    dashState.container = container;
    dashState.loaded = true;

    fallback.setEnabled(false);
    applyDashAppearance();
    ensureLoop(true);
  }).catch(err => {
    console.warn('Failed to load Dash GLB, keeping fallback avatar.', err);
  });

  return {
    root,
    updateAppearance(settings) {
      appearanceSettings = { ...settings };
      applyAppearance();
    },
    setEnabled(enabled) {
      root.setEnabled(enabled);
      if (dashState.container) {
        dashState.container.setEnabled(enabled);
      }
      if (!dashState.loaded) {
        fallback.setEnabled(enabled);
      }
    },
    setMovementState(state) {
      const moving = !!state?.isMoving;
      const sprinting = !!state?.isSprinting;
      const nextLoop = moving ? 'RunForward' : 'Idle';
      const loopChanged = desiredLoop !== nextLoop;
      const sprintChanged = movementState.isSprinting !== sprinting;
      movementState = { isMoving: moving, isSprinting: sprinting };
      desiredLoop = nextLoop;
      if (loopChanged || sprintChanged) {
        ensureLoop(loopChanged);
      } else if (dashState.loaded && dashState.loopGroup) {
        dashState.loopGroup.speedRatio = sprinting ? 1.35 : 1.0;
      }
    },
    playShoot() {
      if (!dashState.loaded) return;
      const shootGroup = dashState.animations.Shoot;
      if (!shootGroup) return;

      stopShootObserver();
      if (dashState.loopGroup && dashState.loopGroup.isPlaying) {
        dashState.loopGroup.stop();
      }

      shootGroup.reset();
      shootGroup.start(false);
      dashState.shootGroup = shootGroup;
      dashState.shootObserver = shootGroup.onAnimationEndObservable.add(() => {
        shootGroup.stop();
        stopShootObserver();
        ensureLoop(true);
      });
    }
  };
}
