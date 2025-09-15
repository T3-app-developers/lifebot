export function setupLighting(scene) {
  const environment = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/environment.env', scene);
  scene.environmentTexture = environment;
  scene.environmentIntensity = 1.1;

  const sun = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(-0.4, -1, -0.6), scene);
  sun.position = new BABYLON.Vector3(120, 180, 60);
  sun.intensity = 1.8;
  sun.shadowMaxZ = 300;
  sun.shadowMinZ = -30;

  const shadowGenerator = new BABYLON.ShadowGenerator(4096, sun);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;
  shadowGenerator.bias = 0.0005;
  shadowGenerator.normalBias = 0.02;

  const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0.2, 1, 0.1), scene);
  ambient.intensity = 0.45;

  scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
  scene.fogDensity = 0.0042;
  scene.fogColor = new BABYLON.Color3(0.09, 0.12, 0.18);

  scene.imageProcessingConfiguration.contrast = 1.15;
  scene.imageProcessingConfiguration.exposure = 1.35;
  scene.imageProcessingConfiguration.toneMappingEnabled = true;

  const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 2000.0 }, scene);
  const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = environment;
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.disableLighting = true;
  skyboxMaterial.diffuseColor = BABYLON.Color3.Black();
  skyboxMaterial.specularColor = BABYLON.Color3.Black();
  skybox.material = skyboxMaterial;

  return { sun, shadowGenerator, environment };
}
