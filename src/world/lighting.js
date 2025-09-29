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
  skyboxMaterial.alpha = 0.95;
  skybox.material = skyboxMaterial;

  return { sun, shadowGenerator, environment };
}
