// LifeBot Stadium Asset
// Babylon.js utility
// Creates a compact multi-sport stadium with seating and interactive seats.

function createParticleTexture(scene, name = 'lifebotParticleTexture') {
  const size = 128;
  const texture = new BABYLON.DynamicTexture(name, { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  texture.update(false);
  texture.hasAlpha = true;
  return texture;
}

export function createLifeBotStadium(scene, opts) {
  opts = opts || {};
  var infieldRadius = opts.infieldRadius || 40;
  var seatRows = opts.seatRows || 10;
  var seatsPerRow = opts.seatsPerRow || 80;
  var aisleCount = opts.aisleCount || 8;
  var aisleAngleDeg = opts.aisleAngleDeg || 6;
  var entranceAngleDeg = opts.entranceAngleDeg || 20;
  var entranceCenterDeg = opts.entranceCenterDeg || 0;
  var seatRise = opts.seatRise || 0.6;
  var seatTread = opts.seatTread || 1.1;
  var seatWidth = opts.seatWidth || 0.55;
  var seatDepth = opts.seatDepth || 0.5;
  var npcFillRatio = opts.npcFillRatio || 0.07;
  var onSit = opts.onSit;
  var parent = opts.parent;

  var root = new BABYLON.TransformNode("LifeBotStadiumRoot", scene);
  if (parent) root.parent = parent;

  // Materials
  var matGrass = new BABYLON.StandardMaterial("matGrass", scene);
  matGrass.diffuseColor = new BABYLON.Color3(0.05, 0.35, 0.05);

  var matTennis = new BABYLON.StandardMaterial("matTennis", scene);
  matTennis.diffuseColor = new BABYLON.Color3(0.04, 0.4, 0.25);

  var matHockey = new BABYLON.StandardMaterial("matHockey", scene);
  matHockey.diffuseColor = new BABYLON.Color3(0.85, 0.9, 0.95);

  var matLine = new BABYLON.StandardMaterial("matLine", scene);
  matLine.emissiveColor = BABYLON.Color3.White();
  matLine.diffuseColor = BABYLON.Color3.White();

  var matSeat = new BABYLON.StandardMaterial("matSeat", scene);
  matSeat.diffuseColor = new BABYLON.Color3(0.25, 0.3, 0.45);

  var matSeatAlt = new BABYLON.StandardMaterial("matSeatAlt", scene);
  matSeatAlt.diffuseColor = new BABYLON.Color3(0.35, 0.15, 0.15);

  var matStair = new BABYLON.StandardMaterial("matStair", scene);
  matStair.diffuseColor = new BABYLON.Color3(0.75, 0.75, 0.75);

  var matWall = new BABYLON.StandardMaterial("matWall", scene);
  matWall.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.65);

  var matNpc1 = new BABYLON.StandardMaterial("matNpc1", scene); matNpc1.diffuseColor = new BABYLON.Color3(0.9, 0.2, 0.2);
  var matNpc2 = new BABYLON.StandardMaterial("matNpc2", scene); matNpc2.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.9);
  var matNpc3 = new BABYLON.StandardMaterial("matNpc3", scene); matNpc3.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.2);

  // A. Infield
  var infield = BABYLON.MeshBuilder.CreateDisc("infield", { radius: infieldRadius, tessellation: 64 }, scene);
  infield.material = matGrass;
  infield.rotation.x = Math.PI / 2;
  infield.parent = root;

  function makeLinedPlane(name, w, h, baseMat, lines) {
    var plane = BABYLON.MeshBuilder.CreateGround(name, { width: w, height: h, subdivisions: 1 }, scene);
    plane.position.y = 0.02;
    plane.material = baseMat.clone(name + "Mat");

    var tex = new BABYLON.DynamicTexture(name + "DT", { width: 1024, height: 512 }, scene, true);
    var ctx = tex.getContext();
    var texW = tex.getSize().width; var texH = tex.getSize().height;
    ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fillRect(0,0,texW,texH);
    ctx.strokeStyle = "white"; ctx.lineWidth = 4; ctx.globalAlpha = 0.95;
    lines(tex, ctx, texW, texH);
    tex.update(false);

    var mat = plane.material;
    mat.diffuseTexture = tex;
    mat.emissiveColor = new BABYLON.Color3(0.05,0.05,0.05);
    return plane;
  }

  function drawSoccer(dt, ctx, w, h) {
    var pad = 40;
    var left = pad, right = w - pad, top = pad, bottom = h - pad;
    ctx.strokeRect(left, top, right-left, bottom-top);
    ctx.beginPath(); ctx.moveTo(w/2, top); ctx.lineTo(w/2, bottom); ctx.stroke();
    ctx.beginPath(); ctx.arc(w/2, h/2, 40, 0, Math.PI*2); ctx.stroke();
    var pbW = 120, pbH = 200;
    ctx.strokeRect(left, h/2 - pbH/2, pbW, pbH);
    ctx.strokeRect(right-pbW, h/2 - pbH/2, pbW, pbH);
    var gaW = 60, gaH = 120;
    ctx.strokeRect(left, h/2 - gaH/2, gaW, gaH);
    ctx.strokeRect(right-gaW, h/2 - gaH/2, gaW, gaH);
  }

  function drawTennis(dt, ctx, w, h) {
    var pad = 32; var L = pad, R = w-pad, T = pad, B = h-pad;
    ctx.strokeRect(L, T, R-L, B-T);
    ctx.beginPath(); ctx.moveTo(w/2, T); ctx.lineTo(w/2, B); ctx.stroke();
    var sbOff = (R-L)*0.04;
    ctx.beginPath();
    ctx.moveTo(L+sbOff, T); ctx.lineTo(L+sbOff, B);
    ctx.moveTo(R-sbOff, T); ctx.lineTo(R-sbOff, B);
    ctx.moveTo(L, h/2); ctx.lineTo(R, h/2);
    ctx.moveTo(w/2, T); ctx.lineTo(w/2, B);
    ctx.stroke();
  }

  function drawHockey(dt, ctx, w, h) {
    var pad = 34; var L = pad, R = w-pad, T = pad, B = h-pad;
    ctx.strokeRect(L, T, R-L, B-T);
    ctx.beginPath(); ctx.moveTo(w/2, T); ctx.lineTo(w/2, B); ctx.stroke();
    ctx.beginPath(); ctx.arc(L + (R-L)*0.22, h/2, 36, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(R - (R-L)*0.22, h/2, 36, 0, Math.PI*2); ctx.stroke();
  }

  var cell = infieldRadius * 0.9;

  var soccer1 = makeLinedPlane("soccer1", 30, 50, matGrass, drawSoccer);
  soccer1.position = new BABYLON.Vector3(-cell*0.35, 0.02, -cell*0.15);
  soccer1.rotation.y = BABYLON.Angle.FromDegrees(15).radians();
  soccer1.parent = root;

  var soccer2 = makeLinedPlane("soccer2", 30, 50, matGrass, drawSoccer);
  soccer2.position = new BABYLON.Vector3(cell*0.35, 0.02, -cell*0.15);
  soccer2.rotation.y = BABYLON.Angle.FromDegrees(-15).radians();
  soccer2.parent = root;

  var tennis1 = makeLinedPlane("tennis1", 12, 24, matTennis, drawTennis);
  tennis1.position = new BABYLON.Vector3(-cell*0.25, 0.02, cell*0.25);
  tennis1.rotation.y = BABYLON.Angle.FromDegrees(10).radians();
  tennis1.parent = root;

  var tennis2 = makeLinedPlane("tennis2", 12, 24, matTennis, drawTennis);
  tennis2.position = new BABYLON.Vector3(cell*0.25, 0.02, cell*0.25);
  tennis2.rotation.y = BABYLON.Angle.FromDegrees(-10).radians();
  tennis2.parent = root;

  var hockey = makeLinedPlane("hockey", 25, 45, matHockey, drawHockey);
  hockey.position = new BABYLON.Vector3(0, 0.02, 0);
  hockey.parent = root;

  var wallHeight = 4;
  var wallThickness = 0.6;
  var wallInnerR = infieldRadius + 2;
  var segments = 96;
  var entranceCenter = BABYLON.Angle.FromDegrees(entranceCenterDeg).radians();
  var entranceHalf = BABYLON.Angle.FromDegrees(entranceAngleDeg/2).radians();

  var wallParent = new BABYLON.TransformNode("wallParent", scene); wallParent.parent = root;
  for (var i=0;i<segments;i++) {
    var t = (i/segments) * Math.PI * 2;
    var delta = Math.atan2(Math.sin(t-entranceCenter), Math.cos(t-entranceCenter));
    if (Math.abs(delta) <= entranceHalf) continue;

    var r = wallInnerR + wallThickness/2;
    var x = Math.cos(t) * r;
    var z = Math.sin(t) * r;
    var wallSeg = BABYLON.MeshBuilder.CreateBox("wallSeg", { width: (Math.PI*2*r)/segments, height: wallHeight, depth: wallThickness }, scene);
    wallSeg.position.set(x, wallHeight/2, z);
    wallSeg.rotation.y = t;
    wallSeg.material = matWall;
    wallSeg.parent = wallParent;
  }

  var bowlParent = new BABYLON.TransformNode("bowlParent", scene); bowlParent.parent = root;

  var seatProto = BABYLON.MeshBuilder.CreateBox("seatProto", { width: seatWidth, depth: seatDepth, height: 0.45 }, scene);
  seatProto.bakeCurrentTransformIntoVertices();
  seatProto.isVisible = false;
  var back = BABYLON.MeshBuilder.CreateBox("seatBack", { width: seatWidth, depth: 0.05, height: 0.55 }, scene);
  back.position.y = 0.5*0.45; back.position.z = -seatDepth/2 + 0.025;
  back.parent = seatProto;
  var seatMatChoices = [matSeat, matSeatAlt];
  seatProto.material = seatMatChoices[0];

  var stairProto = BABYLON.MeshBuilder.CreateBox("stairProto", { width: seatTread, depth: 1.0, height: 0.1 }, scene);
  stairProto.isVisible = false; stairProto.material = matStair;

  var rng = (function(){ var s = 1234567; return function(){ s = (s*1664525+1013904223)|0; return ((s>>>0)%1000000)/1000000; }; })();

  function defaultSit(seat) {
    var cam = scene.activeCamera;
    var seatWorld = seat.getAbsolutePosition();
    var sitPos = seatWorld.add(new BABYLON.Vector3(0, 0.4, 0.0));
    if (cam instanceof BABYLON.ArcRotateCamera) {
      cam.setTarget(seatWorld.add(new BABYLON.Vector3(0,0.25,0.5)));
      cam.alpha = Math.atan2(sitPos.z, sitPos.x) + Math.PI;
      cam.beta = Math.PI/2.5;
      cam.radius = 2.5;
    } else if (cam instanceof BABYLON.UniversalCamera) {
      cam.position = sitPos.add(new BABYLON.Vector3(0, 0.1, 0.05));
      cam.setTarget(seatWorld.add(new BABYLON.Vector3(0,0.2,-0.2)));
    } else if (cam && cam.position) {
      cam.position = sitPos.clone();
    }
  }

  var onSeatClick = onSit || defaultSit;
  if (!scene.actionManager) scene.actionManager = new BABYLON.ActionManager(scene);

  var aisleAngles = [];
  for (var a=0; a<aisleCount; a++) {
    var theta = (a/aisleCount) * Math.PI*2;
    aisleAngles.push(theta);
  }
  var aisleHalf = BABYLON.Angle.FromDegrees(aisleAngleDeg/2).radians();

  var seatsRoot = new BABYLON.TransformNode("seatsRoot", scene); seatsRoot.parent = bowlParent;

  for (var row=0; row<seatRows; row++) {
    var radius = wallInnerR + 2 + row * seatTread + 0.8;
    var y = row * seatRise + 0.2;
    var ringLen = Math.PI*2*radius;
    var seatPitch = ringLen / seatsPerRow;
    for (var i=0;i<seatsPerRow;i++) {
      var t2 = (i/seatsPerRow)*Math.PI*2;
      var inAisle = false;
      for (var j=0; j<aisleAngles.length; j++) {
        var d = Math.atan2(Math.sin(t2-aisleAngles[j]), Math.cos(t2-aisleAngles[j]));
        if (Math.abs(d) < aisleHalf) { inAisle = true; break; }
      }
      if (inAisle) continue;

      var x = Math.cos(t2)*radius;
      var z = Math.sin(t2)*radius;

      var seat = seatProto.createInstance("seat_r"+row+"_i"+i);
      seat.position.set(x, y, z);
      seat.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, t2 + Math.PI, 0);
      seat.material = seatMatChoices[((row+i)%seatMatChoices.length)];
      seat.parent = seatsRoot;

      seat.actionManager = seat.actionManager || new BABYLON.ActionManager(scene);
      seat.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, (function(s){ return function(){ onSeatClick(s); }; })(seat)));

      if (rng() < npcFillRatio) {
        var npc = BABYLON.MeshBuilder.CreateCapsule("npc_r"+row+"_i"+i, { radius: 0.12, height: 0.6 }, scene);
        npc.position = seat.position.add(new BABYLON.Vector3(0, 0.38, 0));
        npc.parent = seatsRoot;
        var r = rng();
        npc.material = r < 0.33 ? matNpc1 : r < 0.66 ? matNpc2 : matNpc3;
        npc.rotation.y = t2 + Math.PI;
      }
    }

    for (var k=0; k<aisleAngles.length; k++) {
      var a2 = aisleAngles[k];
      var rCenter = radius;
      var stair = stairProto.createInstance("stair_r"+row+"_a"+((a2*100)|0));
      var span = seatTread * 0.9;
      stair.scaling.z = 2.4;
      stair.position.set(Math.cos(a2)*rCenter, y + 0.05, Math.sin(a2)*rCenter);
      stair.rotation.y = a2 + Math.PI/2;
      stair.parent = bowlParent;
    }
  }

  seatProto.setEnabled(false);
  stairProto.setEnabled(false);

  if (!scene.lights || scene.lights.length === 0) {
    var hemi = new BABYLON.HemisphericLight("stadiumHemi", new BABYLON.Vector3(0,1,0), scene);
    hemi.intensity = 0.9;
  }

  var signR = wallInnerR + wallThickness + 0.2;
  var scoreboard = BABYLON.MeshBuilder.CreatePlane("stadiumScoreboard", { width: 12, height: 6 }, scene);
  scoreboard.position = new BABYLON.Vector3(0, wallHeight + 6, wallInnerR + 3);
  scoreboard.rotation.x = -Math.PI / 10;
  var scoreboardTex = new BABYLON.DynamicTexture("stadiumScoreTex", { width: 1024, height: 512 }, scene, true);
  var scoreboardMat = new BABYLON.StandardMaterial("stadiumScoreMat", scene);
  scoreboardMat.diffuseTexture = scoreboardTex;
  scoreboardMat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1);
  scoreboard.material = scoreboardMat;
  scoreboard.parent = root;

  var scoreboardState = { home: 0, away: 0, period: 1, message: "Welcome" };
  function drawScoreboard() {
    var ctx = scoreboardTex.getContext();
    ctx.fillStyle = "#091220";
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = "#6ad6ff";
    ctx.font = "bold 120px Inter";
    ctx.textAlign = "center";
    ctx.fillText("LIFEBOT", 512, 150);
    ctx.font = "bold 160px Inter";
    ctx.fillText(scoreboardState.home + " : " + scoreboardState.away, 512, 300);
    ctx.font = "bold 64px Inter";
    ctx.fillText("Period " + scoreboardState.period, 256, 420);
    ctx.fillText(scoreboardState.message, 768, 420);
    scoreboardTex.update(false);
  }
  drawScoreboard();

  var scoreboardLight = new BABYLON.SpotLight("scoreboardLight", new BABYLON.Vector3(0, wallHeight + 10, wallInnerR - 4), new BABYLON.Vector3(0, -0.6, 1), Math.PI / 3, 2, scene);
  scoreboardLight.intensity = 1.2;

  var cheerParticles = new BABYLON.ParticleSystem("stadiumCheer", 2000, scene);
  cheerParticles.particleTexture = createParticleTexture(scene, 'stadiumCheerParticle');
  cheerParticles.emitter = new BABYLON.Vector3(0, wallHeight + 4, 0);
  cheerParticles.minEmitBox = new BABYLON.Vector3(-10, 0, -10);
  cheerParticles.maxEmitBox = new BABYLON.Vector3(10, 0, 10);
  cheerParticles.color1 = new BABYLON.Color4(0.2, 0.6, 1, 1);
  cheerParticles.color2 = new BABYLON.Color4(0.9, 0.6, 0.2, 1);
  cheerParticles.minSize = 0.3;
  cheerParticles.maxSize = 0.8;
  cheerParticles.minLifeTime = 0.4;
  cheerParticles.maxLifeTime = 1.2;
  cheerParticles.emitRate = 0;
  cheerParticles.start();

  var crowdAmbience = new BABYLON.Sound('stadiumCrowd', 'https://cdn.pixabay.com/download/audio/2021/11/15/audio_9c2c9b499d.mp3?filename=stadium-ambience-1-126380.mp3', scene, function(){}, { loop: true, autoplay: true, volume: 0.25 });

  function triggerCheer(deltaHome, deltaAway, message) {
    scoreboardState.home = Math.max(0, scoreboardState.home + (deltaHome || 0));
    scoreboardState.away = Math.max(0, scoreboardState.away + (deltaAway || 0));
    if (message) scoreboardState.message = message;
    scoreboardState.period = Math.min(9, scoreboardState.period + 1);
    drawScoreboard();
    cheerParticles.emitRate = 600;
    setTimeout(function(){ cheerParticles.emitRate = 0; }, 1200);
  }

  var sign = BABYLON.MeshBuilder.CreateTorus("entranceSign", { diameter: 2.4, thickness: 0.08, tessellation: 24, arc: 0.5 }, scene);
  sign.position = new BABYLON.Vector3(Math.cos(entranceCenter)*signR, 2.6, Math.sin(entranceCenter)*signR);
  sign.rotation.y = entranceCenter;
  sign.material = matWall;
  sign.parent = root;

  return {
    root: root,
    infield: infield,
    courts: { soccer1: soccer1, soccer2: soccer2, tennis1: tennis1, tennis2: tennis2, hockey: hockey },
    seating: seatsRoot,
    triggerCheer: triggerCheer,
    scoreboardState: scoreboardState
  };
}


