function buildHouse(scene, materials, shadowGenerator, name, position) {
  const house = new BABYLON.TransformNode(name, scene);
  house.position.copyFrom(position);

  const base = BABYLON.MeshBuilder.CreateBox(`${name}_base`, { width: 10, depth: 8, height: 4 }, scene);
  base.material = materials.brick;
  base.position.y = 2;
  base.parent = house;
  base.checkCollisions = true;
  base.receiveShadows = true;
  shadowGenerator?.addShadowCaster(base);

  const roof = BABYLON.MeshBuilder.CreateCylinder(`${name}_roof`, { diameter: 12, height: 2.2, tessellation: 6 }, scene);
  roof.rotation.z = Math.PI / 2;
  roof.position.y = 5.4;
  roof.material = materials.wood;
  roof.parent = house;
  shadowGenerator?.addShadowCaster(roof);

  const door = BABYLON.MeshBuilder.CreateBox(`${name}_door`, { width: 1.6, height: 2.6, depth: 0.2 }, scene);
  door.position = new BABYLON.Vector3(0, 1.3, 4.1);
  door.material = materials.wood.clone(`${name}_doorMat`);
  door.material.albedoColor = new BABYLON.Color3(0.35, 0.25, 0.18);
  door.parent = house;

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

  return { node: house, sink, water };
}

function createShop(scene, materials, shadowGenerator, position) {
  const shop = new BABYLON.TransformNode('townShop', scene);
  shop.position.copyFrom(position);

  const frame = BABYLON.MeshBuilder.CreateBox('shopFrame', { width: 14, depth: 10, height: 5 }, scene);
  frame.material = materials.brick;
  frame.position.y = 2.5;
  frame.parent = shop;
  frame.checkCollisions = true;
  frame.receiveShadows = true;
  shadowGenerator?.addShadowCaster(frame);

  const awning = BABYLON.MeshBuilder.CreateBox('shopAwning', { width: 14, depth: 1.6, height: 0.4 }, scene);
  awning.position = new BABYLON.Vector3(0, 4.6, 5.3);
  const awningMat = materials.wood.clone('shopAwningMat');
  awningMat.albedoColor = new BABYLON.Color3(0.2, 0.35, 0.8);
  awning.material = awningMat;
  awning.parent = shop;

  const counter = BABYLON.MeshBuilder.CreateBox('shopCounter', { width: 10, depth: 2, height: 1 }, scene);
  counter.position = new BABYLON.Vector3(0, 1, 4.4);
  counter.material = materials.wood.clone('shopCounterMat');
  counter.material.albedoColor = new BABYLON.Color3(0.4, 0.3, 0.2);
  counter.parent = shop;

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

  const items = [];
  const itemData = [
    { id: 'energy-drink', name: 'Energy Drink', price: 6, color: new BABYLON.Color3(0.7, 0.2, 0.8), description: 'Restores sprint instantly.' },
    { id: 'repair-kit', name: 'Repair Kit', price: 9, color: new BABYLON.Color3(0.2, 0.8, 0.6), description: 'Useful for drone repairs.' },
    { id: 'spy-pass', name: 'Spy Clearance Badge', price: 14, color: new BABYLON.Color3(0.9, 0.6, 0.1), description: 'Required to access the spy island elevator.' }
  ];

  itemData.forEach((data, index) => {
    const mesh = BABYLON.MeshBuilder.CreateCylinder(`shopItem_${data.id}`, { diameter: 1, height: 0.8 }, scene);
    mesh.material = materials.metal.clone(`shopItemMat_${data.id}`);
    mesh.material.albedoColor = data.color;
    mesh.position = new BABYLON.Vector3(-3 + index * 3, 1.4, 3.2);
    mesh.parent = shop;
    mesh.metadata = { item: data };
    items.push(mesh);
  });

  return { node: shop, items, sign };
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
    const result = buildHouse(scene, materials, shadowGenerator, `house_${idx}`, pos);
    result.node.parent = town;
    houses.push(result);
  });

  const shop = createShop(scene, materials, shadowGenerator, new BABYLON.Vector3(0, sampleHeight(0, -18), -18));
  shop.node.parent = town;

  const flameBot = createFlameBot(scene, materials, shadowGenerator, new BABYLON.Vector3(-6, sampleHeight(-6, 0), 0));
  flameBot.parent = town;

  const jobBoard = createJobBoard(scene, materials, new BABYLON.Vector3(10, sampleHeight(10, 10), 10));
  jobBoard.parent = town;

  const sinkInteractable = houses[0].sink;
  interactionManager.register(sinkInteractable, {
    prompt: 'Press E to collect fresh water',
    tooltip: '<strong>Clean Water</strong><br/>Use this sample to help FlameBot calibrate the fire system.',
    action: () => {
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

  if (terrainRefs?.cropRows) {
    terrainRefs.cropRows.forEach((row, idx) => {
      interactionManager.register(row, {
        prompt: 'Press E to harvest glow berries',
        tooltip: '<strong>Glow Berries</strong><br/>Deliver to merchants for a quick payout.',
        action: () => {
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
