export function createMaterials(scene) {
  const textures = {
    ground: 'https://assets.babylonjs.com/environments/grass.jpg',
    groundNormal: 'https://assets.babylonjs.com/environments/grassn.jpg',
    plaza: 'https://assets.babylonjs.com/textures/floor.png',
    plazaNormal: 'https://assets.babylonjs.com/textures/floorNormal.png',
    brick: 'https://assets.babylonjs.com/textures/bricktile.jpg',
    brickNormal: 'https://assets.babylonjs.com/textures/bricktilenormal.jpg',
    metal: 'https://assets.babylonjs.com/textures/metalPanel.jpg',
    wood: 'https://assets.babylonjs.com/textures/wood.jpg',
    woodNormal: 'https://assets.babylonjs.com/textures/woodNormal.jpg',
    waterBump: 'https://assets.babylonjs.com/textures/waterbump.png',
    neon: 'https://assets.babylonjs.com/textures/glow.png'
  };

  const createTexture = (url) => {
    const tex = new BABYLON.Texture(url, scene);
    tex.wrapU = BABYLON.Constants.TEXTURE_CLAMP_ADDRESSMODE;
    tex.wrapV = BABYLON.Constants.TEXTURE_CLAMP_ADDRESSMODE;
    return tex;
  };

  const ground = new BABYLON.PBRMaterial('groundMat', scene);
  ground.albedoTexture = createTexture(textures.ground);
  ground.bumpTexture = createTexture(textures.groundNormal);
  ground.albedoTexture.uScale = ground.albedoTexture.vScale = 8;
  ground.bumpTexture.uScale = ground.bumpTexture.vScale = 8;
  ground.metallic = 0.0;
  ground.roughness = 0.9;

  const plaza = new BABYLON.PBRMaterial('plazaMat', scene);
  plaza.albedoTexture = createTexture(textures.plaza);
  plaza.bumpTexture = createTexture(textures.plazaNormal);
  plaza.albedoTexture.uScale = plaza.albedoTexture.vScale = 4;
  plaza.bumpTexture.uScale = plaza.bumpTexture.vScale = 4;
  plaza.metallic = 0.1;
  plaza.roughness = 0.6;

  const brick = new BABYLON.PBRMaterial('brickMat', scene);
  brick.albedoTexture = createTexture(textures.brick);
  brick.bumpTexture = createTexture(textures.brickNormal);
  brick.albedoTexture.uScale = brick.albedoTexture.vScale = 2;
  brick.bumpTexture.uScale = brick.bumpTexture.vScale = 2;
  brick.metallic = 0.2;
  brick.roughness = 0.55;

  const metal = new BABYLON.PBRMaterial('metalMat', scene);
  metal.albedoTexture = createTexture(textures.metal);
  metal.albedoTexture.uScale = metal.albedoTexture.vScale = 2;
  metal.metallic = 0.8;
  metal.roughness = 0.3;

  const wood = new BABYLON.PBRMaterial('woodMat', scene);
  wood.albedoTexture = createTexture(textures.wood);
  wood.bumpTexture = createTexture(textures.woodNormal);
  wood.albedoTexture.uScale = wood.albedoTexture.vScale = 1.4;
  wood.bumpTexture.uScale = wood.bumpTexture.vScale = 1.4;
  wood.metallic = 0.05;
  wood.roughness = 0.55;

  const neon = new BABYLON.StandardMaterial('neonMat', scene);
  neon.emissiveTexture = createTexture(textures.neon);
  neon.emissiveColor = new BABYLON.Color3(0.3, 0.7, 1);
  neon.diffuseColor = BABYLON.Color3.Black();
  neon.alpha = 0.85;

  const glass = new BABYLON.PBRMaterial('glassMat', scene);
  glass.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
  glass.alpha = 0.4;
  glass.metallic = 0;
  glass.roughness = 0.1;
  glass.indexOfRefraction = 1.5;
  glass.subSurface.isRefractionEnabled = true;
  glass.subSurface.refractionIntensity = 0.8;

  const emissive = new BABYLON.StandardMaterial('emissiveMat', scene);
  emissive.emissiveColor = new BABYLON.Color3(0.9, 0.6, 1);
  emissive.alpha = 0.9;

  const glowLayer = new BABYLON.GlowLayer('globalGlow', scene, {
    blurKernelSize: 32
  });
  glowLayer.intensity = 0.45;

  return {
    ground,
    plaza,
    brick,
    metal,
    wood,
    neon,
    glass,
    emissive,
    glowLayer
  };
}
