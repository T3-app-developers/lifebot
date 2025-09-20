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

function colorFromHex(hex) {
  return BABYLON.Color3.FromHexString(hex);
}

function createMaterial(scene, name, hex) {
  const mat = new BABYLON.StandardMaterial(name, scene);
  mat.diffuseColor = colorFromHex(hex);
  mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  return mat;
}

export function createPlayerAvatar(scene) {
  const root = new BABYLON.TransformNode('playerAvatarRoot', scene);
  root.setEnabled(false);

  const skinMat = createMaterial(scene, 'avatarSkinMat', basePalettes['bot-boy'].skin);
  const topMat = createMaterial(scene, 'avatarTopMat', topColors['retro-tee']);
  const bottomMat = createMaterial(scene, 'avatarBottomMat', bottomColors.adventure);
  const hairMat = createMaterial(scene, 'avatarHairMat', basePalettes['bot-boy'].accent);
  const accessoryMat = createMaterial(scene, 'avatarAccessoryMat', accessoryColors.headset);

  const hips = new BABYLON.TransformNode('avatarHips', scene);
  hips.parent = root;

  const legs = BABYLON.MeshBuilder.CreateBox('avatarLegs', { width: 0.55, height: 1.0, depth: 0.45 }, scene);
  legs.position.y = 0.5;
  legs.material = bottomMat;
  legs.parent = hips;

  const torso = BABYLON.MeshBuilder.CreateBox('avatarTorso', { width: 0.8, height: 1.1, depth: 0.5 }, scene);
  torso.position.y = 1.3;
  torso.material = topMat;
  torso.parent = hips;

  const shoulder = BABYLON.MeshBuilder.CreateBox('avatarShoulder', { width: 1.1, height: 0.35, depth: 0.35 }, scene);
  shoulder.position.y = 1.7;
  shoulder.material = topMat;
  shoulder.parent = hips;

  const armLeft = BABYLON.MeshBuilder.CreateCylinder('avatarArmLeft', { diameter: 0.2, height: 1.0 }, scene);
  armLeft.rotation.z = BABYLON.Tools.ToRadians(8);
  armLeft.position = new BABYLON.Vector3(-0.6, 1.1, 0);
  armLeft.material = skinMat;
  armLeft.parent = hips;

  const armRight = armLeft.clone('avatarArmRight');
  armRight.position.x *= -1;

  const head = BABYLON.MeshBuilder.CreateSphere('avatarHead', { diameter: 0.65 }, scene);
  head.position.y = 2.2;
  head.material = skinMat;
  head.parent = hips;

  const facePlate = BABYLON.MeshBuilder.CreateCylinder('avatarFacePlate', { diameter: 0.5, height: 0.08, tessellation: 12 }, scene);
  facePlate.rotation.x = BABYLON.Tools.ToRadians(90);
  facePlate.position = new BABYLON.Vector3(0, 2.15, 0.3);
  facePlate.material = createMaterial(scene, 'avatarFaceMat', '#f5f9ff');
  facePlate.parent = hips;

  const eyeLeft = BABYLON.MeshBuilder.CreateSphere('avatarEyeLeft', { diameter: 0.12 }, scene);
  eyeLeft.position = new BABYLON.Vector3(-0.12, 2.2, 0.61);
  eyeLeft.material = createMaterial(scene, 'avatarEyeMat', '#1b3e82');
  eyeLeft.parent = hips;
  const eyeRight = eyeLeft.clone('avatarEyeRight');
  eyeRight.position.x *= -1;

  const hairRoot = new BABYLON.TransformNode('avatarHairRoot', scene);
  hairRoot.parent = head;
  hairRoot.position = new BABYLON.Vector3(0, 0.25, 0);

  const hairVariants = {
    spiky: (() => {
      const group = new BABYLON.TransformNode('hairSpiky', scene);
      group.parent = hairRoot;
      for (let i = 0; i < 4; i++) {
        const spike = BABYLON.MeshBuilder.CreateCylinder(`hairSpikySpike${i}`, { diameterTop: 0, diameterBottom: 0.3, height: 0.6 }, scene);
        spike.material = hairMat;
        spike.position = new BABYLON.Vector3((i - 1.5) * 0.18, 0.2, -0.1 + Math.sin(i) * 0.08);
        spike.rotation.x = BABYLON.Tools.ToRadians(-40 - i * 5);
        spike.parent = group;
      }
      return group;
    })(),
    pony: (() => {
      const group = new BABYLON.TransformNode('hairPony', scene);
      group.parent = hairRoot;
      const cap = BABYLON.MeshBuilder.CreateSphere('hairPonyCap', { diameter: 0.7 }, scene);
      cap.scaling.y = 0.6;
      cap.material = hairMat;
      cap.position = new BABYLON.Vector3(0, 0.1, 0);
      cap.parent = group;
      const tail = BABYLON.MeshBuilder.CreateCylinder('hairPonyTail', { diameter: 0.35, height: 0.8 }, scene);
      tail.material = hairMat;
      tail.rotation.x = BABYLON.Tools.ToRadians(120);
      tail.position = new BABYLON.Vector3(0, -0.2, -0.4);
      tail.parent = group;
      return group;
    })(),
    twists: (() => {
      const group = new BABYLON.TransformNode('hairTwists', scene);
      group.parent = hairRoot;
      for (let i = -1; i <= 1; i += 2) {
        const lock = BABYLON.MeshBuilder.CreateCylinder(`hairTwist${i}`, { diameter: 0.25, height: 0.9 }, scene);
        lock.material = hairMat;
        lock.rotation.x = BABYLON.Tools.ToRadians(60);
        lock.position = new BABYLON.Vector3(0.25 * i, -0.1, 0.35);
        lock.parent = group;
      }
      const bun = BABYLON.MeshBuilder.CreateSphere('hairTwistBun', { diameter: 0.6 }, scene);
      bun.material = hairMat;
      bun.position = new BABYLON.Vector3(0, 0.05, 0);
      bun.parent = group;
      return group;
    })(),
    buzz: (() => {
      const group = new BABYLON.TransformNode('hairBuzz', scene);
      group.parent = hairRoot;
      const cap = BABYLON.MeshBuilder.CreateSphere('hairBuzzCap', { diameter: 0.68 }, scene);
      cap.scaling.y = 0.45;
      cap.material = hairMat;
      cap.position = new BABYLON.Vector3(0, 0.05, 0);
      cap.parent = group;
      return group;
    })()
  };

  Object.values(hairVariants).forEach(node => node.setEnabled(false));

  const accessoryRoot = new BABYLON.TransformNode('avatarAccessoryRoot', scene);
  accessoryRoot.parent = head;

  const accessoryVariants = {
    headset: (() => {
      const group = new BABYLON.TransformNode('accHeadset', scene);
      group.parent = accessoryRoot;
      const band = BABYLON.MeshBuilder.CreateTorus('accHeadsetBand', { diameter: 0.8, thickness: 0.08 }, scene);
      band.rotation.x = BABYLON.Tools.ToRadians(90);
      band.material = accessoryMat;
      band.parent = group;
      const mic = BABYLON.MeshBuilder.CreateCylinder('accHeadsetMic', { diameter: 0.08, height: 0.6 }, scene);
      mic.position = new BABYLON.Vector3(0.28, -0.15, 0.45);
      mic.rotation.z = BABYLON.Tools.ToRadians(30);
      mic.material = accessoryMat;
      mic.parent = group;
      return group;
    })(),
    sunglasses: (() => {
      const group = new BABYLON.TransformNode('accSunglasses', scene);
      group.parent = accessoryRoot;
      const frame = BABYLON.MeshBuilder.CreateBox('accGlassesFrame', { width: 0.8, height: 0.25, depth: 0.05 }, scene);
      frame.position = new BABYLON.Vector3(0, 0, 0.38);
      frame.material = accessoryMat;
      frame.parent = group;
      return group;
    })(),
    'adventure-hat': (() => {
      const group = new BABYLON.TransformNode('accHat', scene);
      group.parent = accessoryRoot;
      const brim = BABYLON.MeshBuilder.CreateCylinder('accHatBrim', { diameter: 1.1, height: 0.08 }, scene);
      brim.material = accessoryMat;
      brim.position = new BABYLON.Vector3(0, -0.05, 0);
      brim.parent = group;
      const top = BABYLON.MeshBuilder.CreateCylinder('accHatTop', { diameter: 0.6, height: 0.45 }, scene);
      top.material = accessoryMat;
      top.position = new BABYLON.Vector3(0, 0.18, 0);
      top.parent = group;
      return group;
    })(),
    none: (() => {
      const group = new BABYLON.TransformNode('accNone', scene);
      group.parent = accessoryRoot;
      group.setEnabled(false);
      return group;
    })()
  };

  Object.values(accessoryVariants).forEach(node => node.setEnabled(false));

  const updateAppearance = (settings) => {
    const palette = basePalettes[settings.baseBody] || basePalettes['bot-boy'];
    skinMat.diffuseColor = colorFromHex(palette.skin);
    hairMat.diffuseColor = colorFromHex(palette.accent);

    const topHex = topColors[settings.top] || topColors['retro-tee'];
    const bottomHex = bottomColors[settings.bottom] || bottomColors.adventure;
    topMat.diffuseColor = colorFromHex(topHex);
    bottomMat.diffuseColor = colorFromHex(bottomHex);

    Object.values(hairVariants).forEach(node => node.setEnabled(false));
    (hairVariants[settings.hairstyle] || hairVariants.spiky).setEnabled(true);

    Object.values(accessoryVariants).forEach(node => node.setEnabled(false));
    if (settings.accessory !== 'none') {
      (accessoryVariants[settings.accessory] || accessoryVariants.headset).setEnabled(true);
      accessoryMat.diffuseColor = colorFromHex(accessoryColors[settings.accessory] || accessoryColors.headset);
    }
  };

  return {
    root,
    updateAppearance,
    setEnabled(enabled) {
      root.setEnabled(enabled);
    }
  };
}
