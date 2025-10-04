function createDayNightCycle(scene, { sun, ambient, skybox }) {
  const cycleDurationMs = 4 * 60 * 1000;
  const skyboxMaterial = skybox.material;
  const imageProcessing = scene.imageProcessingConfiguration;
  const dayFogColor = new BABYLON.Color3(0.08, 0.11, 0.16);
  const nightFogColor = new BABYLON.Color3(0.02, 0.04, 0.08);
  const duskFogColor = new BABYLON.Color3(0.1, 0.07, 0.12);
  const daySkyColor = new BABYLON.Color3(0.45, 0.62, 0.96);
  const nightSkyColor = new BABYLON.Color3(0.02, 0.05, 0.1);
  const sunriseSkyColor = new BABYLON.Color3(0.78, 0.36, 0.22);
  const nightSunColor = new BABYLON.Color3(0.25, 0.36, 0.55);
  const twilightSunColor = new BABYLON.Color3(1.0, 0.58, 0.32);
  const daySunColor = new BABYLON.Color3(1.0, 0.96, 0.88);
  const fogColor = new BABYLON.Color3();
  const skyTint = new BABYLON.Color3();
  const sunTint = new BABYLON.Color3();
  let timeMs = 0;
  let lastUpdate = performance.now();

  const evaluateCycle = () => {
    const normalized = (timeMs % cycleDurationMs) / cycleDurationMs;
    const theta = normalized * Math.PI * 2;
    const altitude = Math.sin(theta);
    const azimuth = Math.cos(theta);
    const twilight = BABYLON.Scalar.Clamp(1 - Math.abs(altitude) / 0.28, 0, 1);
    const daylight = Math.max(0, altitude);

    const direction = new BABYLON.Vector3(azimuth * 0.6, -altitude, Math.sin(theta) * 0.55 - 0.25);
    direction.normalize();
    sun.direction.copyFrom(direction);
    sun.position.copyFrom(direction.scale(-220));

    BABYLON.Color3.LerpToRef(nightSunColor, twilightSunColor, twilight, sunTint);
    BABYLON.Color3.LerpToRef(sunTint, daySunColor, daylight, sunTint);
    sun.diffuse.copyFrom(sunTint);
    sun.specular.copyFrom(sunTint);

    const sunBaseIntensity = BABYLON.Scalar.Lerp(0.12, 2.2, daylight);
    sun.intensity = sunBaseIntensity + twilight * 0.45;

    ambient.intensity = BABYLON.Scalar.Lerp(0.18, 0.55, daylight) + twilight * 0.15;

    scene.environmentIntensity = BABYLON.Scalar.Lerp(0.25, 1.25, daylight) + twilight * 0.2;

    imageProcessing.exposure = BABYLON.Scalar.Lerp(0.7, 1.4, daylight) + twilight * 0.25;
    imageProcessing.contrast = BABYLON.Scalar.Lerp(1.05, 1.25, daylight);

    BABYLON.Color3.LerpToRef(nightFogColor, duskFogColor, twilight, fogColor);
    BABYLON.Color3.LerpToRef(fogColor, dayFogColor, daylight, fogColor);
    scene.fogColor.copyFrom(fogColor);

    BABYLON.Color3.LerpToRef(nightSkyColor, sunriseSkyColor, twilight, skyTint);
    BABYLON.Color3.LerpToRef(skyTint, daySkyColor, daylight, skyTint);
    skyboxMaterial.emissiveColor.copyFrom(skyTint);
    scene.clearColor.copyFromFloats(skyTint.r * 0.32, skyTint.g * 0.35, skyTint.b * 0.45, 1);
  };

  const updateCycle = () => {
    const now = performance.now();
    const delta = now - lastUpdate;
    lastUpdate = now;
    timeMs = (timeMs + delta) % cycleDurationMs;
    evaluateCycle();
  };

  scene.onBeforeRenderObservable.add(updateCycle);
  evaluateCycle();

  return {
    getTime: () => (timeMs % cycleDurationMs) / cycleDurationMs,
    setTime: (value) => {
      const normalized = BABYLON.Scalar.Clamp(value, 0, 1);
      timeMs = normalized * cycleDurationMs;
      lastUpdate = performance.now();
      evaluateCycle();
    }
  };
}

export function setupLighting(scene) {
  const environment = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/environment.env', scene);
  scene.environmentTexture = environment;
  scene.environmentIntensity = 1.25;

  const sun = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(-0.35, -1, -0.45), scene);
  sun.position = new BABYLON.Vector3(120, 180, 60);
  sun.intensity = 2.1;
  sun.diffuse = new BABYLON.Color3(1.0, 0.96, 0.88);
  sun.specular = new BABYLON.Color3(1.0, 0.95, 0.9);
  sun.shadowMaxZ = 300;
  sun.shadowMinZ = -40;

  const shadowGenerator = new BABYLON.ShadowGenerator(4096, sun);
  shadowGenerator.useContactHardeningShadow = true;
  shadowGenerator.contactHardeningLightSizeUVRatio = 0.15;
  shadowGenerator.bias = 0.00035;
  shadowGenerator.normalBias = 0.015;
  shadowGenerator.forceBackFacesOnly = true;

  const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0.15, 1, 0.35), scene);
  ambient.intensity = 0.55;
  ambient.groundColor = new BABYLON.Color3(0.08, 0.12, 0.18);

  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0018;
  scene.fogColor = new BABYLON.Color3(0.08, 0.11, 0.16);

  const imageProcessing = scene.imageProcessingConfiguration;
  imageProcessing.contrast = 1.2;
  imageProcessing.exposure = 1.4;
  imageProcessing.toneMappingEnabled = true;
  imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
  imageProcessing.vignetteEnabled = true;
  imageProcessing.vignetteStretch = 0.3;
  imageProcessing.vignetteWeight = 1.4;
  imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0.35);

  const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 2000.0 }, scene);
  const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = environment;
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.disableLighting = true;
  skyboxMaterial.diffuseColor = BABYLON.Color3.Black();
  skyboxMaterial.specularColor = BABYLON.Color3.Black();
  skyboxMaterial.emissiveColor = new BABYLON.Color3(0.45, 0.62, 0.96);
  skyboxMaterial.alpha = 0.95;
  skybox.material = skyboxMaterial;

  scene.clearColor = new BABYLON.Color4(0.16, 0.2, 0.28, 1);

  const dayNightCycle = createDayNightCycle(scene, { sun, ambient, skybox });

  return { sun, shadowGenerator, environment, dayNightCycle };
}
