const palettes = [
  {
    body: '#6ac76d',
    belly: '#f0ffd6',
    accent: '#34754a'
  },
  {
    body: '#7fc7ff',
    belly: '#e8f6ff',
    accent: '#376c9b'
  },
  {
    body: '#f5a05a',
    belly: '#ffe6c7',
    accent: '#b86a2c'
  },
  {
    body: '#c58bff',
    belly: '#f5e6ff',
    accent: '#7d4cb5'
  }
];

function createMaterial(scene, name, hex) {
  const mat = new BABYLON.StandardMaterial(name, scene);
  mat.diffuseColor = BABYLON.Color3.FromHexString(hex);
  mat.specularColor = BABYLON.Color3.FromHexString(hex).scale(0.1);
  mat.emissiveColor = BABYLON.Color3.FromHexString(hex).scale(0.05);
  return mat;
}

function buildFriendlyDino(scene, name, palette, scale = 1) {
  const root = new BABYLON.TransformNode(name, scene);
  const bodyMat = createMaterial(scene, `${name}-bodyMat`, palette.body);
  const bellyMat = createMaterial(scene, `${name}-bellyMat`, palette.belly);
  const accentMat = createMaterial(scene, `${name}-accentMat`, palette.accent);

  const body = BABYLON.MeshBuilder.CreateBox(`${name}-body`, { width: 1.6 * scale, height: 1 * scale, depth: 3 * scale }, scene);
  body.position.y = 1.2 * scale;
  body.material = bodyMat;
  body.parent = root;

  const belly = BABYLON.MeshBuilder.CreateBox(`${name}-belly`, { width: 1.2 * scale, height: 0.6 * scale, depth: 2.4 * scale }, scene);
  belly.position.y = 1.05 * scale;
  belly.material = bellyMat;
  belly.parent = root;

  const neck = BABYLON.MeshBuilder.CreateCylinder(`${name}-neck`, { diameterTop: 0.4 * scale, diameterBottom: 0.5 * scale, height: 1.1 * scale, tessellation: 8 }, scene);
  neck.position = new BABYLON.Vector3(0, 1.7 * scale, 1.2 * scale);
  neck.rotation.x = BABYLON.Tools.ToRadians(-15);
  neck.material = bodyMat;
  neck.parent = root;

  const head = BABYLON.MeshBuilder.CreateSphere(`${name}-head`, { diameter: 0.9 * scale }, scene);
  head.position = new BABYLON.Vector3(0, 2.25 * scale, 1.8 * scale);
  head.material = bodyMat;
  head.parent = root;

  const eyes = BABYLON.MeshBuilder.CreateSphere(`${name}-eyes`, { diameter: 0.18 * scale }, scene);
  eyes.scaling = new BABYLON.Vector3(1.6, 1, 1);
  eyes.position = new BABYLON.Vector3(0.28 * scale, 2.32 * scale, 2.1 * scale);
  eyes.material = accentMat;
  eyes.parent = head;
  const eyesMirror = eyes.clone(`${name}-eyes-right`);
  eyesMirror.position.x *= -1;

  const snout = BABYLON.MeshBuilder.CreateBox(`${name}-snout`, { width: 0.6 * scale, height: 0.4 * scale, depth: 0.9 * scale }, scene);
  snout.position = new BABYLON.Vector3(0, 2 * scale, 2.3 * scale);
  snout.material = bellyMat;
  snout.parent = root;

  const crest = BABYLON.MeshBuilder.CreateCylinder(`${name}-crest`, { diameterTop: 0, diameterBottom: 0.7 * scale, height: 0.9 * scale, tessellation: 6 }, scene);
  crest.position = new BABYLON.Vector3(0, 2.5 * scale, 1.4 * scale);
  crest.material = accentMat;
  crest.parent = root;

  const tail = BABYLON.MeshBuilder.CreateCylinder(`${name}-tail`, { diameterTop: 0.1 * scale, diameterBottom: 0.45 * scale, height: 2.4 * scale, tessellation: 6 }, scene);
  tail.position = new BABYLON.Vector3(0, 1.1 * scale, -1.5 * scale);
  tail.rotation.x = BABYLON.Tools.ToRadians(12);
  tail.material = bodyMat;
  tail.parent = root;

  const legOffsets = [
    new BABYLON.Vector3(0.55 * scale, 0.55 * scale, 1.1 * scale),
    new BABYLON.Vector3(-0.55 * scale, 0.55 * scale, 1.1 * scale),
    new BABYLON.Vector3(0.55 * scale, 0.55 * scale, -0.9 * scale),
    new BABYLON.Vector3(-0.55 * scale, 0.55 * scale, -0.9 * scale)
  ];
  const legs = legOffsets.map((offset, index) => {
    const leg = BABYLON.MeshBuilder.CreateCylinder(`${name}-leg-${index}`, { diameterTop: 0.28 * scale, diameterBottom: 0.36 * scale, height: 1.1 * scale, tessellation: 6 }, scene);
    leg.position = offset;
    leg.material = accentMat;
    leg.parent = root;
    return leg;
  });

  return {
    root,
    head,
    tail,
    crest,
    legs,
    materials: [bodyMat, bellyMat, accentMat],
    baseHeight: root.position.y
  };
}

export function createDinosaurManager(scene, terrain) {
  const herds = [];
  let observer = null;

  const spawnPoints = [
    { position: new BABYLON.Vector3(12, 0, 18), scale: 1.1, rotation: BABYLON.Tools.ToRadians(40) },
    { position: new BABYLON.Vector3(-18, 0, 24), scale: 0.9, rotation: BABYLON.Tools.ToRadians(-60) },
    { position: new BABYLON.Vector3(24, 0, -12), scale: 1.2, rotation: BABYLON.Tools.ToRadians(120) },
    { position: new BABYLON.Vector3(-32, 0, -20), scale: 1.0, rotation: BABYLON.Tools.ToRadians(15) }
  ];

  const ensureAnimation = () => {
    if (observer || !herds.length) return;
    observer = scene.onBeforeRenderObservable.add(() => {
      const time = performance.now() * 0.001;
      herds.forEach((dino, index) => {
        const walk = Math.sin(time * 2 + index);
        if (dino.head) {
          dino.head.rotation.x = 0.15 + walk * 0.08;
        }
        if (dino.tail) {
          dino.tail.rotation.y = Math.sin(time * 2.4 + index * 0.8) * 0.45;
        }
        if (dino.legs) {
          dino.legs.forEach((leg, legIndex) => {
            leg.rotation.x = Math.sin(time * 3 + legIndex + index) * 0.35;
          });
        }
        if (dino.crest) {
          dino.crest.rotation.z = Math.sin(time * 1.5 + index) * 0.2;
        }
        dino.root.position.y = dino.baseHeight + Math.sin(time * 2 + index) * 0.05;
      });
    });
  };

  const stopAnimation = () => {
    if (!observer) return;
    scene.onBeforeRenderObservable.remove(observer);
    observer = null;
  };

  const spawn = () => {
    if (herds.length) return;
    spawnPoints.forEach((point, idx) => {
      const palette = palettes[idx % palettes.length];
      const dino = buildFriendlyDino(scene, `lifebotDino${idx}`, palette, point.scale);
      const groundY = terrain?.ground?.getHeightAtCoordinates(point.position.x, point.position.z) || 0;
      dino.root.position = new BABYLON.Vector3(point.position.x, groundY + 0.05, point.position.z);
      dino.root.rotation.y = point.rotation;
      dino.baseHeight = dino.root.position.y;
      herds.push(dino);
    });
    ensureAnimation();
  };

  const clear = () => {
    herds.splice(0).forEach(dino => {
      dino.root.dispose();
      dino.materials.forEach(mat => mat.dispose());
    });
    stopAnimation();
  };

  return {
    setEnabled(enabled) {
      if (enabled) {
        spawn();
      } else {
        clear();
      }
    },
    isEnabled() {
      return herds.length > 0;
    }
  };
}
