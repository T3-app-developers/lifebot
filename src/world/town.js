function buildHouse(scene, materials, shadowGenerator, interactionManager, name, position) {
  const house = new BABYLON.TransformNode(name, scene);
  house.position.copyFrom(position);

  const doorWidth = 1.6;
  const doorHeight = 2.6;
  const doorDepth = 0.2;

  let base = BABYLON.MeshBuilder.CreateBox(`${name}_base`, { width: 10, depth: 8, height: 4 }, scene);
  base.material = materials.brick;
  base.position.y = 2;
  base.parent = house;

  const doorCut = BABYLON.MeshBuilder.CreateBox(`${name}_doorCut`, {
    width: doorWidth + 0.4,
    height: doorHeight + 0.4,
    depth: doorDepth + 0.8
  }, scene);
  doorCut.parent = house;
  doorCut.position = new BABYLON.Vector3(0, doorHeight / 2, 3.9);
  doorCut.isVisible = false;

  const baseCSG = BABYLON.CSG.FromMesh(base);
  const doorCSG = BABYLON.CSG.FromMesh(doorCut);
  const carvedBase = baseCSG.subtract(doorCSG).toMesh(base.name, base.material, scene);
  carvedBase.position = base.position.clone();
  carvedBase.rotation = base.rotation.clone();
  carvedBase.scaling = base.scaling.clone();
  carvedBase.parent = house;
  carvedBase.checkCollisions = true;
  carvedBase.receiveShadows = true;
  shadowGenerator?.addShadowCaster(carvedBase);

  base.dispose();
  doorCut.dispose();
  base = carvedBase;

  const roof = BABYLON.MeshBuilder.CreateCylinder(`${name}_roof`, { diameter: 12, height: 2.2, tessellation: 6 }, scene);
  roof.rotation.z = Math.PI / 2;
  roof.position.y = 5.4;
  roof.material = materials.wood;
  roof.parent = house;
  shadowGenerator?.addShadowCaster(roof);

  const doorPivot = new BABYLON.TransformNode(`${name}_doorPivot`, scene);
  doorPivot.parent = house;
  doorPivot.position = new BABYLON.Vector3(-doorWidth / 2, doorHeight / 2, 4 + doorDepth / 2);

  const door = BABYLON.MeshBuilder.CreateBox(`${name}_door`, { width: doorWidth, height: doorHeight, depth: doorDepth }, scene);
  door.material = materials.wood.clone(`${name}_doorMat`);
  door.material.albedoColor = new BABYLON.Color3(0.35, 0.25, 0.18);
  door.parent = doorPivot;
  door.position = new BABYLON.Vector3(doorWidth / 2, 0, 0);
  door.checkCollisions = true;
  shadowGenerator?.addShadowCaster(door);

  const doorSwing = new BABYLON.Animation(`${name}_doorSwing`, 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  doorSwing.setKeys([
    { frame: 0, value: 0 },
    { frame: 30, value: -Math.PI / 2 }
  ]);
  doorPivot.animations = [doorSwing];

  const doorState = { open: false, animating: false };
  const animateDoor = (from, to, onEnd) => {
    const animatable = scene.beginDirectAnimation(doorPivot, [doorSwing], from, to, false);
    animatable.onAnimationEndObservable.addOnce(() => {
      onEnd?.();
    });
    return animatable;
  };

  const openDoor = () => {
    if (doorState.open || doorState.animating) return null;
    doorState.animating = true;
    door.checkCollisions = false;
    return animateDoor(0, 30, () => {
      doorState.open = true;
      doorState.animating = false;
    });
  };

  const closeDoor = () => {
    if (!doorState.open || doorState.animating) return null;
    doorState.animating = true;
    return animateDoor(30, 0, () => {
      doorState.open = false;
      doorState.animating = false;
      door.checkCollisions = true;
    });
  };

  const toggleDoor = () => (doorState.open ? closeDoor() : openDoor());

  const doorBaseMaterial = door.material;
  const highlightMaterial = materials.doorHighlight;
  if (interactionManager && highlightMaterial) {
    interactionManager.register(door, {
      prompt: null,
      range: 4.5,
      highlightColor: highlightMaterial.emissiveColor,
      onFocus: () => {
        door.material = highlightMaterial;
      },
      onBlur: () => {
        door.material = doorBaseMaterial;
      }
    });
  }

  const windowLeft = BABYLON.MeshBuilder.CreatePlane(`${name}_windowL`, { width: 2, height: 1.4 }, scene);
  windowLeft.position = new BABYLON.Vector3(-3, 2, 4.02);
  windowLeft.material = materials.glass;
  windowLeft.parent = house;

  const windowRight = windowLeft.clone(`${name}_windowR`);
  windowRight.position.x = 3;

  const interior = new BABYLON.TransformNode(`${name}_interior`, scene);
  interior.parent = house;

  const floor = BABYLON.MeshBuilder.CreateBox(`${name}_floor`, { width: 9.6, depth: 7.6, height: 0.2 }, scene);
  floor.position = new BABYLON.Vector3(0, 0.1, 0);
  floor.material = materials.wood;
  floor.parent = interior;

  const bed = BABYLON.MeshBuilder.CreateBox(`${name}_bed`, { width: 3, depth: 2, height: 0.6 }, scene);
  bed.position = new BABYLON.Vector3(-2.5, 0.5, -2.2);
  bed.material = materials.wood.clone(`${name}_bedMat`);
  bed.material.albedoColor = new BABYLON.Color3(0.4, 0.2, 0.5);
  bed.parent = interior;

  const sink = BABYLON.MeshBuilder.CreateBox(`${name}_sink`, { width: 1.6, depth: 0.8, height: 0.6 }, scene);
  sink.position = new BABYLON.Vector3(3, 0.6, -2.4);
  sink.material = materials.metal;
  sink.parent = interior;

  const basin = BABYLON.MeshBuilder.CreateBox(`${name}_basin`, { width: 1.2, depth: 0.6, height: 0.2 }, scene);
  basin.position = new BABYLON.Vector3(0, 0.35, 0);
  basin.parent = sink;
  basin.material = materials.glass;

  const faucet = BABYLON.MeshBuilder.CreateCylinder(`${name}_faucet`, { diameterTop: 0.1, diameterBottom: 0.15, height: 0.8 }, scene);
  faucet.rotation.z = Math.PI / 2;
  faucet.position = new BABYLON.Vector3(0, 0.4, -0.2);
  faucet.material = materials.metal;
  faucet.parent = sink;

  const water = BABYLON.MeshBuilder.CreateCylinder(`${name}_water`, { diameter: 0.3, height: 0.01, tessellation: 16 }, scene);
  water.rotation.x = Math.PI / 2;
  water.position = new BABYLON.Vector3(0, 0.25, -0.2);
  const waterMat = new BABYLON.StandardMaterial(`${name}_waterMat`, scene);
  waterMat.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.9);
  waterMat.alpha = 0.7;
  water.material = waterMat;
  water.parent = sink;

  const anim = new BABYLON.Animation(`${name}_waterAnim`, 'scaling.y', 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  anim.setKeys([
    { frame: 0, value: 0 },
    { frame: 10, value: 1 },
    { frame: 20, value: 1 },
    { frame: 30, value: 0 }
  ]);
  water.animations = [anim];

  return {
    node: house,
    sink,
    water,
    door: {
      mesh: door,
      pivot: doorPivot,
      open: openDoor,
      close: closeDoor,
      toggle: toggleDoor,
      state: doorState
    }
  };
}

function createShop(scene, materials, shadowGenerator, position) {
  const shop = new BABYLON.TransformNode('townShop', scene);
  shop.position.copyFrom(position);

  const doorOpeningWidth = 3.6;
  const doorOpeningHeight = 3.2;
  const doorDepth = 0.2;

  let frame = BABYLON.MeshBuilder.CreateBox('shopFrame', { width: 14, depth: 10, height: 5 }, scene);
  frame.material = materials.brick;
  frame.position.y = 2.5;
  frame.parent = shop;

  const shopDoorCut = BABYLON.MeshBuilder.CreateBox('shopDoorCut', {
    width: doorOpeningWidth + 0.4,
    height: doorOpeningHeight + 0.3,
    depth: doorDepth + 1.2
  }, scene);
  shopDoorCut.parent = shop;
  shopDoorCut.position = new BABYLON.Vector3(0, doorOpeningHeight / 2, 4.9);
  shopDoorCut.isVisible = false;

  const interiorCut = BABYLON.MeshBuilder.CreateBox('shopInteriorCut', {
    width: 12.4,
    depth: 8.4,
    height: 4.4
  }, scene);
  interiorCut.parent = shop;
  interiorCut.position = new BABYLON.Vector3(0, 2.2, -0.2);
  interiorCut.isVisible = false;

  const frameCSG = BABYLON.CSG.FromMesh(frame);
  const carvedFrameCSG = frameCSG
    .subtract(BABYLON.CSG.FromMesh(shopDoorCut))
    .subtract(BABYLON.CSG.FromMesh(interiorCut));
  const carvedFrame = carvedFrameCSG.toMesh(frame.name, frame.material, scene);
  carvedFrame.position = frame.position.clone();
  carvedFrame.rotation = frame.rotation.clone();
  carvedFrame.scaling = frame.scaling.clone();
  carvedFrame.parent = shop;
  carvedFrame.checkCollisions = true;
  carvedFrame.receiveShadows = true;
  shadowGenerator?.addShadowCaster(carvedFrame);

  frame.dispose();
  shopDoorCut.dispose();
  interiorCut.dispose();
  frame = carvedFrame;

  const floor = BABYLON.MeshBuilder.CreateBox('shopFloor', { width: 11.6, depth: 7.8, height: 0.15 }, scene);
  floor.position = new BABYLON.Vector3(0, 0.075, -0.4);
  const floorMat = materials.wood.clone('shopFloorMat');
  floorMat.albedoColor = new BABYLON.Color3(0.75, 0.72, 0.68);
  floor.material = floorMat;
  floor.parent = shop;

  const accent = BABYLON.MeshBuilder.CreatePlane('shopAccent', { width: 3, height: 3 }, scene);
  accent.position = new BABYLON.Vector3(0, 3, -3.7);
  accent.rotation = new BABYLON.Vector3(0, Math.PI, 0);
  const accentMat = new BABYLON.StandardMaterial('shopAccentMat', scene);
  accentMat.emissiveColor = new BABYLON.Color3(0.05, 0.2, 0.35);
  accentMat.alpha = 0.6;
  accentMat.backFaceCulling = false;
  accent.material = accentMat;
  accent.parent = shop;

  const awning = BABYLON.MeshBuilder.CreateBox('shopAwning', { width: 14, depth: 1.6, height: 0.4 }, scene);
  awning.position = new BABYLON.Vector3(0, 4.6, 5.3);
  const awningMat = materials.wood.clone('shopAwningMat');
  awningMat.albedoColor = new BABYLON.Color3(0.2, 0.35, 0.8);
  awning.material = awningMat;
  awning.parent = shop;

  const counter = BABYLON.MeshBuilder.CreateBox('shopCounter', { width: 4.2, depth: 1.4, height: 1 }, scene);
  counter.position = new BABYLON.Vector3(-3.8, 1, 2.4);
  counter.rotation = new BABYLON.Vector3(0, Math.PI / 8, 0);
  counter.material = materials.wood.clone('shopCounterMat');
  counter.material.albedoColor = new BABYLON.Color3(0.38, 0.28, 0.22);
  counter.parent = shop;

  const counterShelf = BABYLON.MeshBuilder.CreateBox('shopCounterShelf', { width: 3.8, depth: 0.6, height: 0.12 }, scene);
  counterShelf.parent = shop;
  counterShelf.position = new BABYLON.Vector3(-3.6, 1.6, 1.2);
  counterShelf.material = counter.material.clone('shopCounterShelfMat');
  counterShelf.material.albedoColor = new BABYLON.Color3(0.45, 0.33, 0.25);

  const lightStrip = BABYLON.MeshBuilder.CreateBox('shopLightStrip', { width: 8, height: 0.08, depth: 0.4 }, scene);
  lightStrip.parent = shop;
  lightStrip.position = new BABYLON.Vector3(0, 4.6, -1.2);
  const lightMat = new BABYLON.StandardMaterial('shopLightMat', scene);
  lightMat.emissiveColor = new BABYLON.Color3(0.6, 0.7, 0.95);
  lightMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
  lightStrip.material = lightMat;

  const sign = BABYLON.MeshBuilder.CreatePlane('shopSign', { width: 6, height: 2 }, scene);
  sign.position = new BABYLON.Vector3(0, 5.8, 5.2);
  sign.rotation = new BABYLON.Vector3(Math.PI / 8, 0, 0);
  const signTex = new BABYLON.DynamicTexture('shopSignTex', { width: 512, height: 256 }, scene, true);
  const ctx = signTex.getContext();
  ctx.fillStyle = '#101520';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#6ad6ff';
  ctx.font = 'bold 72px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Lifebot Supply', 256, 120);
  signTex.update(false);
  const signMat = new BABYLON.StandardMaterial('shopSignMat', scene);
  signMat.diffuseTexture = signTex;
  signMat.emissiveColor = new BABYLON.Color3(0.2, 0.5, 0.9);
  sign.material = signMat;
  sign.parent = shop;

  const doorRoot = new BABYLON.TransformNode('shopDoorRoot', scene);
  doorRoot.parent = shop;
  doorRoot.position = new BABYLON.Vector3(0, doorOpeningHeight / 2, 5.05);

  const doorMaterial = materials.glass.clone('shopDoorGlass');
  doorMaterial.alpha = 0.82;

  const doorPanelWidth = doorOpeningWidth / 2;
  const slideDistance = 1.2;

  const leftDoor = BABYLON.MeshBuilder.CreateBox('shopDoorLeft', { width: doorPanelWidth, height: doorOpeningHeight, depth: doorDepth }, scene);
  leftDoor.material = doorMaterial;
  leftDoor.parent = doorRoot;
  leftDoor.position = new BABYLON.Vector3(-doorPanelWidth / 2, 0, 0);
  leftDoor.checkCollisions = true;

  const rightDoor = leftDoor.clone('shopDoorRight');
  rightDoor.position.x = doorPanelWidth / 2;
  rightDoor.checkCollisions = true;

  const leftSlide = new BABYLON.Animation('shopDoorLeftSlide', 'position.x', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  leftSlide.setKeys([
    { frame: 0, value: -doorPanelWidth / 2 },
    { frame: 30, value: -doorPanelWidth / 2 - slideDistance }
  ]);
  leftDoor.animations = [leftSlide];

  const rightSlide = new BABYLON.Animation('shopDoorRightSlide', 'position.x', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  rightSlide.setKeys([
    { frame: 0, value: doorPanelWidth / 2 },
    { frame: 30, value: doorPanelWidth / 2 + slideDistance }
  ]);
  rightDoor.animations = [rightSlide];

  const doorPanels = [leftDoor, rightDoor];
  const doorState = { open: false, animating: false };

  const animatePanels = (from, to, onEnd) => {
    let completed = 0;
    const total = doorPanels.length;
    const handleEnd = () => {
      completed += 1;
      if (completed === total) {
        onEnd?.();
      }
    };
    const results = [];
    const leftAnim = scene.beginDirectAnimation(leftDoor, [leftSlide], from, to, false);
    leftAnim.onAnimationEndObservable.addOnce(handleEnd);
    results.push(leftAnim);
    const rightAnim = scene.beginDirectAnimation(rightDoor, [rightSlide], from, to, false);
    rightAnim.onAnimationEndObservable.addOnce(handleEnd);
    results.push(rightAnim);
    return results;
  };

  const openDoor = () => {
    if (doorState.open || doorState.animating) return null;
    doorState.animating = true;
    doorPanels.forEach(panel => (panel.checkCollisions = false));
    return animatePanels(0, 30, () => {
      doorState.open = true;
      doorState.animating = false;
    });
  };

  const closeDoor = () => {
    if (!doorState.open || doorState.animating) return null;
    doorState.animating = true;
    return animatePanels(30, 0, () => {
      doorState.open = false;
      doorState.animating = false;
      doorPanels.forEach(panel => (panel.checkCollisions = true));
    });
  };

  const toggleDoor = () => (doorState.open ? closeDoor() : openDoor());

  const items = [];
  const createHitbox = (id, parent) => {
    const hitbox = BABYLON.MeshBuilder.CreateBox(`shopItemHit_${id}`, { width: 1.6, height: 2.2, depth: 1.6 }, scene);
    hitbox.isVisible = false;
    hitbox.parent = parent;
    hitbox.position.y = 1.1;
    return hitbox;
  };

  const itemData = [
    {
      id: 'energy-drink',
      name: 'Energy Drink',
      price: 6,
      description: 'Restores sprint instantly.',
      position: new BABYLON.Vector3(-2.8, 0, -0.8),
      build: parent => {
        const pedestal = BABYLON.MeshBuilder.CreateCylinder('energyPedestal', { diameter: 1.5, height: 0.4, tessellation: 32 }, scene);
        pedestal.material = counter.material.clone('energyPedestalMat');
        pedestal.material.albedoColor = new BABYLON.Color3(0.32, 0.28, 0.24);
        pedestal.parent = parent;
        pedestal.position.y = 0.2;

        const bottle = BABYLON.MeshBuilder.CreateCylinder('energyBottle', {
          diameterTop: 0.45,
          diameterBottom: 0.55,
          height: 1.4,
          tessellation: 24
        }, scene);
        const bottleMat = materials.glass.clone('energyBottleMat');
        bottleMat.alpha = 0.75;
        bottleMat.emissiveColor = new BABYLON.Color3(0.5, 0.15, 0.7);
        bottleMat.diffuseColor = new BABYLON.Color3(0.4, 0.1, 0.6);
        bottle.material = bottleMat;
        bottle.parent = parent;
        bottle.position.y = 1.1;

        const cap = BABYLON.MeshBuilder.CreateCylinder('energyCap', { diameter: 0.45, height: 0.2 }, scene);
        cap.parent = parent;
        cap.position.y = 1.9;
        const capMat = materials.metal.clone('energyCapMat');
        capMat.albedoColor = new BABYLON.Color3(0.9, 0.9, 0.95);
        cap.material = capMat;

        const label = BABYLON.MeshBuilder.CreatePlane('energyLabel', { width: 0.9, height: 0.6 }, scene);
        label.parent = parent;
        label.position = new BABYLON.Vector3(0, 1.2, 0.3);
        const labelTex = new BABYLON.DynamicTexture('energyLabelTex', { width: 256, height: 128 }, scene, true);
        const labelCtx = labelTex.getContext();
        labelCtx.fillStyle = '#0f172a';
        labelCtx.fillRect(0, 0, 256, 128);
        labelCtx.fillStyle = '#7c3aed';
        labelCtx.beginPath();
        labelCtx.moveTo(16, 64);
        labelCtx.lineTo(90, 16);
        labelCtx.lineTo(170, 64);
        labelCtx.lineTo(90, 112);
        labelCtx.closePath();
        labelCtx.fill();
        labelCtx.fillStyle = '#e0f2fe';
        labelCtx.font = 'bold 52px Inter';
        labelCtx.textAlign = 'center';
        labelCtx.textBaseline = 'middle';
        labelCtx.fillText('BOOST', 176, 64);
        labelTex.update(false);
        const labelMat = new BABYLON.StandardMaterial('energyLabelMat', scene);
        labelMat.diffuseTexture = labelTex;
        labelMat.emissiveColor = new BABYLON.Color3(0.4, 0.2, 0.7);
        label.material = labelMat;
        return bottle;
      }
    },
    {
      id: 'repair-kit',
      name: 'Repair Kit',
      price: 9,
      description: 'Useful for drone repairs.',
      position: new BABYLON.Vector3(0, 0, -2.2),
      build: parent => {
        const table = BABYLON.MeshBuilder.CreateBox('repairTable', { width: 1.8, depth: 1, height: 0.2 }, scene);
        table.parent = parent;
        table.position.y = 0.1;
        table.material = counterShelf.material.clone('repairTableMat');
        table.material.albedoColor = new BABYLON.Color3(0.3, 0.36, 0.4);

        const caseBase = BABYLON.MeshBuilder.CreateBox('repairCaseBase', { width: 1.4, depth: 0.8, height: 0.4 }, scene);
        caseBase.parent = parent;
        caseBase.position.y = 0.5;
        const caseMat = materials.metal.clone('repairCaseMat');
        caseMat.albedoColor = new BABYLON.Color3(0.75, 0.3, 0.1);
        caseBase.material = caseMat;

        const caseLid = BABYLON.MeshBuilder.CreateBox('repairCaseLid', { width: 1.4, depth: 0.05, height: 0.9 }, scene);
        caseLid.parent = parent;
        caseLid.position = new BABYLON.Vector3(0, 0.85, -0.32);
        caseLid.rotation.x = Math.PI / 8;
        caseLid.material = caseMat.clone('repairCaseLidMat');

        const handle = BABYLON.MeshBuilder.CreateTorus('repairHandle', {
          diameter: 0.6,
          thickness: 0.1,
          tessellation: 16
        }, scene);
        handle.parent = parent;
        handle.rotation.x = Math.PI / 2;
        handle.position = new BABYLON.Vector3(0, 0.78, 0.45);
        const handleMat = materials.metal.clone('repairHandleMat');
        handleMat.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        handle.material = handleMat;

        const wrench1 = BABYLON.MeshBuilder.CreateBox('repairWrench1', { width: 0.2, depth: 0.05, height: 1.1 }, scene);
        wrench1.parent = parent;
        wrench1.position = new BABYLON.Vector3(-0.3, 0.6, 0);
        wrench1.rotation.z = Math.PI / 8;
        const wrenchMat = materials.metal.clone('repairWrenchMat');
        wrenchMat.albedoColor = new BABYLON.Color3(0.85, 0.9, 0.95);
        wrench1.material = wrenchMat;

        const wrench2 = wrench1.clone('repairWrench2');
        wrench2.position = new BABYLON.Vector3(0.3, 0.65, 0.1);
        wrench2.rotation.z = -Math.PI / 6;

        const holo = BABYLON.MeshBuilder.CreatePlane('repairHolo', { width: 1.2, height: 0.6 }, scene);
        holo.parent = parent;
        holo.position = new BABYLON.Vector3(0, 1.3, 0.05);
        const holoTex = new BABYLON.DynamicTexture('repairHoloTex', { width: 256, height: 128 }, scene, true);
        const holoCtx = holoTex.getContext();
        holoCtx.fillStyle = '#0a1a24';
        holoCtx.fillRect(0, 0, 256, 128);
        holoCtx.fillStyle = '#67e8f9';
        holoCtx.font = 'bold 48px Inter';
        holoCtx.textAlign = 'center';
        holoCtx.textBaseline = 'middle';
        holoCtx.fillText('DRONE CARE', 128, 60);
        holoCtx.fillStyle = '#38bdf8';
        holoCtx.fillText('TOOLS', 128, 110);
        holoTex.update(false);
        const holoMat = new BABYLON.StandardMaterial('repairHoloMat', scene);
        holoMat.diffuseTexture = holoTex;
        holoMat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 0.9);
        holoMat.alpha = 0.85;
        holo.material = holoMat;
        return caseBase;
      }
    },
    {
      id: 'spy-pass',
      name: 'Spy Clearance Badge',
      price: 14,
      description: 'Required to access the spy island elevator.',
      position: new BABYLON.Vector3(2.8, 0, -1),
      build: parent => {
        const stand = BABYLON.MeshBuilder.CreateCylinder('spyStand', { diameterTop: 0.6, diameterBottom: 0.8, height: 0.6 }, scene);
        stand.parent = parent;
        stand.position.y = 0.3;
        const standMat = materials.metal.clone('spyStandMat');
        standMat.albedoColor = new BABYLON.Color3(0.2, 0.28, 0.35);
        stand.material = standMat;

        const badge = BABYLON.MeshBuilder.CreatePlane('spyBadge', { width: 1.4, height: 1 }, scene);
        badge.parent = parent;
        badge.position = new BABYLON.Vector3(0, 1.2, 0);
        badge.rotation = new BABYLON.Vector3(0, Math.PI, Math.PI / 18);
        const badgeTex = new BABYLON.DynamicTexture('spyBadgeTex', { width: 512, height: 384 }, scene, true);
        const badgeCtx = badgeTex.getContext();
        badgeCtx.fillStyle = '#020617';
        badgeCtx.fillRect(0, 0, 512, 384);
        badgeCtx.fillStyle = '#facc15';
        badgeCtx.beginPath();
        badgeCtx.moveTo(60, 320);
        badgeCtx.lineTo(256, 60);
        badgeCtx.lineTo(452, 320);
        badgeCtx.closePath();
        badgeCtx.fill();
        badgeCtx.fillStyle = '#0f172a';
        badgeCtx.font = 'bold 72px Inter';
        badgeCtx.textAlign = 'center';
        badgeCtx.fillText('SPY', 256, 200);
        badgeCtx.font = 'bold 48px Inter';
        badgeCtx.fillText('CLEARANCE', 256, 280);
        badgeTex.update(false);
        const badgeMat = new BABYLON.StandardMaterial('spyBadgeMat', scene);
        badgeMat.diffuseTexture = badgeTex;
        badgeMat.emissiveColor = new BABYLON.Color3(0.8, 0.7, 0.2);
        badge.material = badgeMat;

        const projector = BABYLON.MeshBuilder.CreateBox('spyProjector', { width: 0.6, depth: 0.6, height: 0.4 }, scene);
        projector.parent = parent;
        projector.position = new BABYLON.Vector3(0, 0.6, -0.25);
        const projectorMat = materials.metal.clone('spyProjectorMat');
        projectorMat.albedoColor = new BABYLON.Color3(0.18, 0.24, 0.35);
        projector.material = projectorMat;

        const beam = BABYLON.MeshBuilder.CreateCylinder('spyBeam', { diameter: 0.2, height: 1.2, tessellation: 12 }, scene);
        beam.parent = parent;
        beam.position = new BABYLON.Vector3(0, 1, -0.2);
        const beamMat = new BABYLON.StandardMaterial('spyBeamMat', scene);
        beamMat.emissiveColor = new BABYLON.Color3(0.95, 0.85, 0.25);
        beamMat.alpha = 0.6;
        beam.material = beamMat;
        return badge;
      }
    }
  ];

  itemData.forEach(data => {
    const root = new BABYLON.TransformNode(`shopItemRoot_${data.id}`, scene);
    root.parent = shop;
    root.position = data.position;
    const featuredMesh = data.build(root);
    const hitbox = createHitbox(data.id, root);
    hitbox.metadata = { item: data };
    items.push(hitbox);

    if (featuredMesh) {
      featuredMesh.metadata = featuredMesh.metadata || {};
      featuredMesh.metadata.itemId = data.id;
    }
  });

  return {
    node: shop,
    items,
    sign,
    door: {
      panels: doorPanels,
      root: doorRoot,
      open: openDoor,
      close: closeDoor,
      toggle: toggleDoor,
      state: doorState
    }
  };
}

function createFlameBot(scene, materials, shadowGenerator, position) {
  const root = new BABYLON.TransformNode('flameBot', scene);
  root.position.copyFrom(position);

  const body = BABYLON.MeshBuilder.CreateCylinder('flameBotBody', { diameter: 2, height: 3 }, scene);
  body.material = materials.metal.clone('flameBotBodyMat');
  body.material.albedoColor = new BABYLON.Color3(0.9, 0.3, 0.2);
  body.parent = root;
  body.position.y = 1.5;
  shadowGenerator?.addShadowCaster(body);

  const head = BABYLON.MeshBuilder.CreateSphere('flameBotHead', { diameter: 1.6 }, scene);
  head.material = materials.metal.clone('flameBotHeadMat');
  head.material.albedoColor = new BABYLON.Color3(1, 0.6, 0.2);
  head.position.y = 3.2;
  head.parent = root;
  shadowGenerator?.addShadowCaster(head);

  const visor = BABYLON.MeshBuilder.CreatePlane('flameBotVisor', { width: 1.1, height: 0.5 }, scene);
  visor.position = new BABYLON.Vector3(0, 3.2, 0.8);
  visor.material = materials.glass;
  visor.parent = root;

  const nozzle = BABYLON.MeshBuilder.CreateCylinder('flameBotNozzle', { diameter: 0.4, height: 1.4 }, scene);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position = new BABYLON.Vector3(0.9, 1.6, 0.9);
  nozzle.material = materials.metal;
  nozzle.parent = root;

  const flame = new BABYLON.ParticleSystem('flameBotFire', 800, scene);
  flame.particleTexture = new BABYLON.Texture('https://assets.babylonjs.com/particles/flare.png', scene);
  flame.emitter = nozzle;
  flame.minEmitBox = new BABYLON.Vector3(0, 0, 0);
  flame.maxEmitBox = new BABYLON.Vector3(0, 0, 0.1);
  flame.color1 = new BABYLON.Color4(1, 0.6, 0.1, 1);
  flame.color2 = new BABYLON.Color4(1, 0.2, 0, 1);
  flame.minLifeTime = 0.3;
  flame.maxLifeTime = 0.6;
  flame.emitRate = 80;
  flame.minSize = 0.1;
  flame.maxSize = 0.4;
  flame.direction1 = new BABYLON.Vector3(1, 0, 0.2);
  flame.direction2 = new BABYLON.Vector3(1, 0.2, 0.4);
  flame.start();

  return root;
}

function createJobBoard(scene, materials, position) {
  const board = BABYLON.MeshBuilder.CreateBox('jobBoard', { width: 4, height: 3, depth: 0.5 }, scene);
  board.material = materials.wood.clone('jobBoardMat');
  board.material.albedoColor = new BABYLON.Color3(0.35, 0.26, 0.18);
  board.position = position.add(new BABYLON.Vector3(0, 1.5, 0));

  const boardFront = BABYLON.MeshBuilder.CreatePlane('jobBoardFront', { width: 3.6, height: 2.6 }, scene);
  boardFront.position = new BABYLON.Vector3(0, 0, 0.26);
  boardFront.parent = board;
  const tex = new BABYLON.DynamicTexture('jobBoardTexture', { width: 512, height: 512 }, scene, true);
  const ctx = tex.getContext();
  ctx.fillStyle = '#1a263a';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#6ad6ff';
  ctx.font = 'bold 56px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('Town Jobs', 256, 80);
  ctx.font = '32px Inter';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e5ecff';
  ctx.fillText('• Deliver supplies', 70, 180);
  ctx.fillText('• Harvest crops', 70, 240);
  ctx.fillText('• Cheer at stadium', 70, 300);
  ctx.fillText('• Patrol the bridge', 70, 360);
  tex.update(false);
  const texMat = new BABYLON.StandardMaterial('jobBoardTextureMat', scene);
  texMat.diffuseTexture = tex;
  texMat.emissiveColor = new BABYLON.Color3(0.3, 0.6, 0.9);
  boardFront.material = texMat;

  return board;
}

export function createTown(scene, materials, shadowGenerator, interactionManager, gameState, hud, terrainRefs) {
  const town = new BABYLON.TransformNode('townRoot', scene);
  const houses = [];
  const ground = terrainRefs?.ground;
  const sampleHeight = (x, z) => ground ? ground.getHeightAtCoordinates(x, z) : 0;
  const housePositions = [
    new BABYLON.Vector3(-14, sampleHeight(-14, 12), 12),
    new BABYLON.Vector3(18, sampleHeight(18, -6), -6),
    new BABYLON.Vector3(-20, sampleHeight(-20, -12), -12)
  ];

  housePositions.forEach((pos, idx) => {
    const result = buildHouse(scene, materials, shadowGenerator, interactionManager, `house_${idx}`, pos);
    result.node.parent = town;
    houses.push(result);

    interactionManager.register(result.door.mesh, {
      prompt: 'Press E to enter',
      tooltip: `<strong>Townhouse ${idx + 1}</strong><br/>Swing the door open to step inside.`,
      action: () => result.door.toggle()
    });
  });

  const shop = createShop(scene, materials, shadowGenerator, new BABYLON.Vector3(0, sampleHeight(0, -18), -18));
  shop.node.parent = town;

  shop.door.panels.forEach(panel => {
    interactionManager.register(panel, {
      prompt: 'Press E to enter',
      tooltip: '<strong>Lifebot Supply</strong><br/>Slide the glass doors to browse new gadgets.',
      action: () => shop.door.toggle()
    });
  });

  const flameBot = createFlameBot(scene, materials, shadowGenerator, new BABYLON.Vector3(-6, sampleHeight(-6, 0), 0));
  flameBot.parent = town;

  const jobBoard = createJobBoard(scene, materials, new BABYLON.Vector3(10, sampleHeight(10, 10), 10));
  jobBoard.parent = town;

  const sinkInteractable = houses[0].sink;
  interactionManager.register(sinkInteractable, {
    prompt: 'Press E to collect fresh water',
    tooltip: '<strong>Clean Water</strong><br/>Use this sample to help FlameBot calibrate the fire system.',
    action: () => {
      if (gameState.hasItem('water-sample')) {
        hud.pushNotification('You already filled a purifier bottle. Deliver it before collecting more.', 'warning', 2600);
        return null;
      }
      gameState.addItem('water-sample', {
        name: 'Water Sample',
        quantity: 1,
        type: 'quest',
        description: 'Collected from the residential purifier.'
      });
      const sceneAnim = scene.beginAnimation(houses[0].water, 0, 30, false);
      hud.pushNotification('Water gushes into your bottle.', 'info', 2400);
      return sceneAnim;
    }
  });

  shop.items.forEach(mesh => {
    const item = mesh.metadata.item;
    interactionManager.register(mesh, {
      prompt: `Press E to buy ${item.name} (${item.price} coins)`,
      tooltip: `<strong>${item.name}</strong><br/>${item.description}`,
      action: () => {
        if (!gameState.spendCoins(item.price, 'purchase')) return;
        gameState.addItem(item.id, item);
        if (item.id === 'spy-pass') {
          gameState.setFlag('spy-clearance', true);
          gameState.pushNotification('Spy clearance badge acquired. The hidden elevator might respond now.', 'success', 3800);
        }
      }
    });
  });

  interactionManager.register(flameBot, {
    prompt: 'Press E to talk to FlameBot',
    tooltip: '<strong>FlameBot</strong><br/>Guardian of the harbor, loves a good quest update.',
    action: () => {
      const lines = [
        'My sensors read irregularities across town. Can you help calibrate our defense grid?',
        'Bring me a water sample from the houses and check on the harbor bridge after.'
      ];
      lines.forEach((line, idx) => setTimeout(() => hud.pushNotification(line, 'info', 3200), idx * 400));
      if (gameState.hasItem('water-sample')) {
        gameState.removeItem('water-sample', 1);
        hud.pushNotification('FlameBot calibrates the system with your sample.', 'success', 3600);
        gameState.emit('water-delivered', {});
      }
      if (gameState.hasFlag('bridge-authorized')) {
        hud.pushNotification('Bridge controls unlocked near the harbor pier.', 'success', 2600);
      }
      gameState.emit('flamebot-contact', {});
    }
  });

  interactionManager.register(jobBoard, {
    prompt: 'Press E to view available jobs',
    tooltip: '<strong>Town Jobs</strong><br/>Daily contracts to earn coins and reputation.',
    action: () => gameState.emit('job-board', {})
  });

  const harvestCooldowns = new WeakMap();
  const HARVEST_COOLDOWN_MS = 12000;

  if (terrainRefs?.cropRows) {
    terrainRefs.cropRows.forEach((row, idx) => {
      interactionManager.register(row, {
        prompt: 'Press E to harvest glow berries',
        tooltip: '<strong>Glow Berries</strong><br/>Deliver to merchants for a quick payout.',
        action: () => {
          const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
          const lastHarvest = harvestCooldowns.get(row) || 0;
          if (now - lastHarvest < HARVEST_COOLDOWN_MS) {
            hud.pushNotification('These glow berries need more time to regrow.', 'warning', 2200);
            return;
          }
          harvestCooldowns.set(row, now);
          gameState.addItem('glow-berry', {
            name: 'Glow Berry',
            quantity: 2,
            type: 'ingredient',
            description: 'Shimmers softly, valued by stadium vendors.'
          });
          gameState.addCoins(4, 'Harvest contract');
          hud.pushNotification('Harvested fresh glow berries!', 'success', 2600);
        }
      });
    });
  }

  return { town, houses, shop, flameBot, jobBoard };
}
