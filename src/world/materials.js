function createCheckerTexture(scene, name, options = {}) {
  const {
    size = 512,
    cells = 6,
    colors = ['#4f7750', '#33553a']
  } = options;
  const texture = new BABYLON.DynamicTexture(name, { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  const cellSize = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const color = colors[(x + y) % colors.length];
      ctx.fillStyle = color;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
  texture.update(false);
  texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  return texture;
}

function createStripeTexture(scene, name, options = {}) {
  const {
    size = 512,
    stripes = 8,
    direction = 'vertical',
    colors = ['#b5b5c8', '#d4d4e2']
  } = options;
  const texture = new BABYLON.DynamicTexture(name, { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  const stripeSize = size / stripes;
  for (let i = 0; i < stripes; i++) {
    const color = colors[i % colors.length];
    ctx.fillStyle = color;
    if (direction === 'vertical') {
      ctx.fillRect(i * stripeSize, 0, stripeSize, size);
    } else {
      ctx.fillRect(0, i * stripeSize, size, stripeSize);
    }
  }
  texture.update(false);
  texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  return texture;
}

function createRadialGlowTexture(scene, name, options = {}) {
  const { size = 256, inner = '#ffffff', outer = 'rgba(0,0,0,0)' } = options;
  const texture = new BABYLON.DynamicTexture(name, { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  texture.update(false);
  texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
  texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  return texture;
}

function ensureAlbedoAlias(material) {
  if (!Object.prototype.hasOwnProperty.call(material, '_albedoColorAlias')) {
    Object.defineProperty(material, 'albedoColor', {
      get() {
        return this.diffuseColor;
      },
      set(value) {
        this.diffuseColor = value;
      }
    });
    material._albedoColorAlias = true;
  }
  if (!material._cloneWrapped) {
    const baseClone = material.clone.bind(material);
    material.clone = function(name) {
      const cloned = baseClone(name);
      return ensureAlbedoAlias(cloned);
    };
    material._cloneWrapped = true;
  }
  if (!material.subSurface) {
    material.subSurface = {
      isTranslucencyEnabled: false,
      isRefractionEnabled: false,
      refractionIntensity: 0,
      translucencyIntensity: 0,
      tintColor: new BABYLON.Color3(1, 1, 1),
      minimumThickness: 0,
      maximumThickness: 1,
      indexOfRefraction: 1.5
    };
  }
  return material;
}

function createStandardMaterial(scene, name, color) {
  const mat = new BABYLON.StandardMaterial(name, scene);
  mat.diffuseColor = color.clone();
  mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  mat.emissiveColor = BABYLON.Color3.Black();
  return ensureAlbedoAlias(mat);
}

export function createMaterials(scene) {
  const ground = createStandardMaterial(scene, 'groundMat', new BABYLON.Color3(0.36, 0.52, 0.32));
  ground.diffuseTexture = createCheckerTexture(scene, 'groundTex', {
    colors: ['#4e7a3a', '#375b2c'],
    cells: 8
  });
  ground.diffuseTexture.uScale = 6;
  ground.diffuseTexture.vScale = 6;

  const plaza = createStandardMaterial(scene, 'plazaMat', new BABYLON.Color3(0.68, 0.7, 0.76));
  plaza.diffuseTexture = createCheckerTexture(scene, 'plazaTex', {
    colors: ['#c4c6cf', '#d4d6de'],
    cells: 10
  });
  plaza.diffuseTexture.uScale = 4;
  plaza.diffuseTexture.vScale = 4;

  const brick = createStandardMaterial(scene, 'brickMat', new BABYLON.Color3(0.72, 0.36, 0.28));
  brick.diffuseTexture = createStripeTexture(scene, 'brickTex', {
    stripes: 12,
    direction: 'horizontal',
    colors: ['#a65a46', '#8d4b39']
  });
  brick.diffuseTexture.uScale = 2;
  brick.diffuseTexture.vScale = 2;

  const metal = createStandardMaterial(scene, 'metalMat', new BABYLON.Color3(0.58, 0.62, 0.72));
  metal.specularColor = new BABYLON.Color3(0.7, 0.72, 0.76);

  const rockyGround = createStandardMaterial(scene, 'rockyGroundMat', new BABYLON.Color3(0.4, 0.4, 0.4));
  rockyGround.diffuseTexture = new BABYLON.Texture('assets/rocky_terrain_diff_4k.jpg', scene);
  rockyGround.diffuseTexture.uScale = 5;
  rockyGround.diffuseTexture.vScale = 5;
  rockyGround.diffuseTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  rockyGround.diffuseTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  rockyGround.specularColor = new BABYLON.Color3(0.06, 0.06, 0.06);
  rockyGround.specularPower = 64;

  const wood = createStandardMaterial(scene, 'woodMat', new BABYLON.Color3(0.52, 0.36, 0.24));
  wood.diffuseTexture = createStripeTexture(scene, 'woodTex', {
    stripes: 16,
    direction: 'vertical',
    colors: ['#8b5a2b', '#6f4420']
  });
  wood.diffuseTexture.uScale = 1;
  wood.diffuseTexture.vScale = 1;

  const neon = new BABYLON.StandardMaterial('neonMat', scene);
  neon.emissiveTexture = createRadialGlowTexture(scene, 'neonGlowTex', {
    inner: 'rgba(140, 200, 255, 1)',
    outer: 'rgba(0, 0, 0, 0)'
  });
  neon.emissiveColor = new BABYLON.Color3(0.4, 0.7, 1);
  neon.diffuseColor = BABYLON.Color3.Black();
  neon.specularColor = BABYLON.Color3.Black();

  const glass = createStandardMaterial(scene, 'glassMat', new BABYLON.Color3(0.85, 0.94, 1));
  glass.alpha = 0.28;
  glass.backFaceCulling = false;
  glass.specularPower = 96;
  glass.emissiveColor = new BABYLON.Color3(0.25, 0.35, 0.45);

  const emissive = new BABYLON.StandardMaterial('emissiveMat', scene);
  emissive.emissiveColor = new BABYLON.Color3(0.9, 0.7, 1);
  emissive.diffuseColor = BABYLON.Color3.Black();
  emissive.specularColor = BABYLON.Color3.Black();

  const doorHighlight = createStandardMaterial(scene, 'doorHighlightMat', new BABYLON.Color3(0.55, 0.7, 0.95));
  doorHighlight.emissiveColor = new BABYLON.Color3(0.35, 0.75, 1.0);

  const glowLayer = new BABYLON.GlowLayer('globalGlow', scene, {
    blurKernelSize: 32
  });
  glowLayer.intensity = 0.45;

  return {
    ground,
    plaza,
    brick,
    metal,
    rockyGround,
    wood,
    neon,
    glass,
    emissive,
    doorHighlight,
    glowLayer
  };
}
