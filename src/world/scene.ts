// @ts-nocheck
/*
 * GameGiaDinh — assets/src/world/scene.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/world/scene.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';

    /* ================== THREE — DỰNG CẢNH QUÊ ================== */
    export var container = document.getElementById("scene");
    export var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fd3e8);
    scene.fog = new THREE.Fog(0xcfe3d8, 34, 95);

    export var camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 300);
    export var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    export var hemi = new THREE.HemisphereLight(0xcfe8ff, 0x6d8f57, 0.85);
    scene.add(hemi);
    export var sun = new THREE.DirectionalLight(0xffe3b3, 1.05);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -34;
    sun.shadow.camera.far = 160;
    scene.add(sun); scene.add(sun.target);

    /* ---- Bầu trời gradient + mặt trời + mây trôi ---- */
    export var skyUni = {
      top: { value: new THREE.Color(0x3d7ab8) },
      mid: { value: new THREE.Color(0x9fd3e8) },
      bot: { value: new THREE.Color(0xf6e3bb) }
    };
    export var skyDome = new THREE.Mesh(new THREE.SphereGeometry(230, 24, 14), new THREE.ShaderMaterial({
      uniforms: skyUni, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP;" +
        "void main(){ float h = normalize(vP).y;" +
        " vec3 c = h > 0.1 ? mix(mid, top, smoothstep(0.1, 0.6, h)) : mix(bot, mid, smoothstep(-0.06, 0.1, h));" +
        " gl_FragColor = vec4(c, 1.0); }"
    }));
    skyDome.renderOrder = -10; skyDome.frustumCulled = false;
    scene.add(skyDome);
    export var sunDisc = new THREE.Mesh(new THREE.CircleGeometry(7, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false, transparent: true, opacity: 0.95 }));
    sunDisc.renderOrder = -9; scene.add(sunDisc);
    export var glowCv = document.createElement("canvas"); glowCv.width = glowCv.height = 128;
    export var glowCx = glowCv.getContext("2d");
    export var glowGr = glowCx.createRadialGradient(64, 64, 4, 64, 64, 64);
    glowGr.addColorStop(0, "rgba(255,236,170,0.85)"); glowGr.addColorStop(0.4, "rgba(255,214,130,0.35)"); glowGr.addColorStop(1, "rgba(255,214,130,0)");
    glowCx.fillStyle = glowGr; glowCx.fillRect(0, 0, 128, 128);
    export var sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCv), transparent: true, fog: false, depthWrite: false }));
    sunGlow.scale.set(85, 85, 1); sunGlow.renderOrder = -9; scene.add(sunGlow);
    export var cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.88, fog: false });
    export var cloudGeo = new THREE.SphereGeometry(1, 10, 8);
    export var clouds = [];
    for (var ci = 0; ci < 8; ci++) {
      var cl = new THREE.Group();
      var np = 3 + Math.floor(Math.random() * 3);
      for (var pi = 0; pi < np; pi++) {
        var puff = new THREE.Mesh(cloudGeo, cloudMat);
        puff.position.set(pi * 2.1 - np, Math.random() * 0.7, Math.random() * 1.6 - 0.8);
        var ps = 1.6 + Math.random() * 1.8; puff.scale.set(ps * 1.5, ps * 0.55, ps);
        cl.add(puff);
      }
      cl.position.set(-140 + Math.random() * 280, 30 + Math.random() * 16, -120 + Math.random() * 200);
      cl.userData.speed = 0.35 + Math.random() * 0.5;
      scene.add(cl); clouds.push(cl);
    }
    export var _sv = new THREE.Vector3();

    export function mat(color, opts) {
      var o = { color: color }; if (opts) for (var k in opts) o[k] = opts[k];
      return new THREE.MeshLambertMaterial(o);
    }

    /* ---- Texture vẽ bằng canvas: cỏ, đất, tường, ngói, gỗ ---- */
    export function canvasTex(size, painter, rx, ry) {
      var cv = document.createElement("canvas"); cv.width = cv.height = size;
      painter(cv.getContext("2d"), size);
      var tx = new THREE.CanvasTexture(cv);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      tx.repeat.set(rx || 1, ry || 1);
      tx.encoding = THREE.sRGBEncoding;
      tx.anisotropy = 8;
      return tx;
    }
    export function speckle(cx, s, base, dots, n, rMin, rMax, alpha) {
      cx.fillStyle = base; cx.fillRect(0, 0, s, s);
      for (var i = 0; i < n; i++) {
        cx.fillStyle = dots[i % dots.length];
        cx.globalAlpha = alpha * (0.5 + Math.random() * 0.5);
        var r = rMin + Math.random() * (rMax - rMin);
        cx.beginPath(); cx.arc(Math.random() * s, Math.random() * s, r, 0, 7); cx.fill();
      }
      cx.globalAlpha = 1;
    }
    export var grassTex = canvasTex(256, function (cx, s) {
      speckle(cx, s, "#77a24d", ["#67913f", "#86b45c", "#5d8439", "#93bd68"], 900, 1, 4, .5);
      cx.strokeStyle = "rgba(70,110,45,.5)"; cx.lineWidth = 1;
      for (var i = 0; i < 260; i++) { var x = Math.random() * s, y = Math.random() * s; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + (Math.random() * 4 - 2), y - 3 - Math.random() * 4); cx.stroke(); }
    }, 26, 26);
    export var dirtTex = canvasTex(256, function (cx, s) {
      speckle(cx, s, "#c9a06b", ["#bb9257", "#d6af76", "#a9824f", "#e0bc82"], 700, 1, 5, .45);
    }, 10, 8);
    export var roadTex = canvasTex(256, function (cx, s) {
      speckle(cx, s, "#bd9257", ["#a87f45", "#cda468", "#98753e"], 800, 1, 5, .5);
      cx.fillStyle = "rgba(120,90,50,.35)";
      cx.fillRect(0, s * 0.28, s, 7); cx.fillRect(0, s * 0.66, s, 7);
    }, 14, 1);
    export var riceTex = canvasTex(256, function (cx, s) {
      speckle(cx, s, "#d9b84a", ["#c7a83e", "#e6c95e", "#bfa035"], 500, 2, 6, .5);
      cx.strokeStyle = "rgba(160,130,40,.55)"; cx.lineWidth = 1.4;
      for (var i = 0; i < 380; i++) { var x = Math.random() * s, y = Math.random() * s; cx.beginPath(); cx.moveTo(x, y); cx.quadraticCurveTo(x + 3, y - 5, x + 6, y - 3); cx.stroke(); }
    }, 8, 6);
    export var plasterTex = canvasTex(256, function (cx, s) {
      speckle(cx, s, "#f3e3bb", ["#ecd9ac", "#f8ecc9", "#e2cd9c"], 500, 2, 7, .35);
    }, 2, 1);
    export var roofTex = canvasTex(256, function (cx, s) {
      cx.fillStyle = "#b4552f"; cx.fillRect(0, 0, s, s);
      var rows = 8, rh = s / rows;
      for (var r = 0; r < rows; r++) {
        for (var q = 0; q < 8; q++) {
          var off = (r % 2) * 16;
          cx.fillStyle = ["#c06136", "#a94e2a", "#ba5830"][(r + q) % 3];
          cx.beginPath(); cx.arc(q * 32 + off, r * rh + rh, 15, Math.PI, 0); cx.fill();
        }
        cx.fillStyle = "rgba(80,30,10,.35)"; cx.fillRect(0, r * rh + rh - 2, s, 2);
      }
    }, 3, 2);
    export var woodTex = canvasTex(256, function (cx, s) {
      cx.fillStyle = "#8a5a2b"; cx.fillRect(0, 0, s, s);
      for (var p = 0; p < 4; p++) {
        cx.fillStyle = p % 2 ? "#94632f" : "#7f5226"; cx.fillRect(0, p * 64, s, 62);
        cx.strokeStyle = "rgba(60,35,10,.5)";
        for (var i = 0; i < 7; i++) { var y = p * 64 + 6 + Math.random() * 52; cx.beginPath(); cx.moveTo(0, y); cx.bezierCurveTo(s * .3, y + 3, s * .7, y - 3, s, y + 2); cx.stroke(); }
      }
    }, 1, 1);
    export var soilTex = canvasTex(256, function (cx, s) {
      speckle(cx, s, "#8a6642", ["#77572f", "#9a744c", "#684628"], 800, 1, 5, .5);
    }, 1, 1);
    export var soilTexWet = canvasTex(256, function (cx, s) {
      speckle(cx, s, "#5d4128", ["#4c3319", "#6d4e30", "#3f2a12"], 800, 1, 5, .5);
    }, 1, 1);
    export var brickTex = canvasTex(256, function (cx, s) {
      cx.fillStyle = "#c9b294"; cx.fillRect(0, 0, s, s);
      var bh = 30, bw = 62;
      for (var r = 0; r < 9; r++) {
        var off = (r % 2) * (bw / 2);
        for (var q = -1; q < 5; q++) {
          cx.fillStyle = ["#b0623f", "#a55736", "#ba6a44", "#9c5133"][(r * 3 + q + 9) % 4];
          cx.fillRect(q * bw + off + 3, r * bh + 3, bw - 6, bh - 6);
          cx.fillStyle = "rgba(255,220,180,.12)";
          cx.fillRect(q * bw + off + 3, r * bh + 3, bw - 6, 5);
        }
      }
    }, 2, 1);
    export var bladeTex = canvasTex(128, function (cx, s) {
      cx.clearRect(0, 0, s, s);
      var cols = ["#5d8f3c", "#6fa34a", "#4e7d33", "#7cb356", "#679a44"];
      cx.lineCap = "round";
      for (var i = 0; i < 7; i++) {
        var bx0 = 14 + i * 16 + (Math.random() * 6 - 3), bend = (Math.random() * 26 - 13), top = 8 + Math.random() * 30;
        cx.strokeStyle = cols[i % cols.length]; cx.lineWidth = 5;
        cx.beginPath(); cx.moveTo(bx0, s); cx.quadraticCurveTo(bx0 + bend * 0.3, s * 0.55, bx0 + bend, top); cx.stroke();
      }
    }, 1, 1);
    export var matTex = canvasTex(256, function (cx, s) {
      cx.fillStyle = "#c9a86b"; cx.fillRect(0, 0, s, s);
      for (var i = 0; i < 16; i++) {
        cx.fillStyle = i % 2 ? "#bfa05f" : "#d3b478";
        cx.fillRect(0, i * 16, s, 8);
        cx.fillRect(i * 16, 0, 8, s);
      }
      cx.strokeStyle = "rgba(120,90,40,.35)"; cx.lineWidth = 1;
      for (var j = 0; j <= 16; j++) { cx.beginPath(); cx.moveTo(0, j * 16); cx.lineTo(s, j * 16); cx.stroke(); }
    }, 1, 1);
    export var bananaLeafTex = canvasTex(256, function (cx, s) {
      var gr = cx.createLinearGradient(0, 0, s, 0);
      gr.addColorStop(0, "#4c9440"); gr.addColorStop(0.5, "#63b254"); gr.addColorStop(1, "#4c9440");
      cx.fillStyle = gr; cx.fillRect(0, 0, s, s);
      cx.strokeStyle = "rgba(34,84,26,.6)"; cx.lineWidth = 4;
      cx.beginPath(); cx.moveTo(s / 2, 0); cx.lineTo(s / 2, s); cx.stroke();
      cx.lineWidth = 1.4; cx.strokeStyle = "rgba(34,84,26,.38)";
      for (var i = 0; i < 12; i++) {
        var y = 10 + i * 21;
        cx.beginPath(); cx.moveTo(s / 2, y); cx.lineTo(4, y + 30); cx.stroke();
        cx.beginPath(); cx.moveTo(s / 2, y); cx.lineTo(s - 4, y + 30); cx.stroke();
      }
    }, 1, 1);
    export function texMat(tex, color, opts) {
      var o = { map: tex }; if (color) o.color = color; if (opts) for (var k in opts) o[k] = opts[k];
      return new THREE.MeshLambertMaterial(o);
    }
    export function box(w, h, d, color, x, y, z, opts) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      scene.add(m); return m;
    }
    export function cyl(rt, rb, h, color, x, y, z, seg) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), mat(color));
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      scene.add(m); return m;
    }
    export function sph(r, color, x, y, z, sy) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), mat(color));
      m.position.set(x, y, z); if (sy) m.scale.y = sy;
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m); return m;
    }

    /* ---- Đất, đường, ruộng xa ---- */
    export var ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), texMat(grassTex));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
    scene.add(ground);
    // Sân đất nện trước nhà
    export var yard = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), texMat(dirtTex));
    yard.rotation.x = -Math.PI / 2; yard.position.set(-4, 0, 0); yard.receiveShadow = true;
    scene.add(yard);
    // Đường đất ra cổng trường, chạy dọc phía nam
    export var road = new THREE.Mesh(new THREE.PlaneGeometry(64, 4.6), texMat(roadTex));
    road.rotation.x = -Math.PI / 2; road.position.set(2, 0.005, -14); road.receiveShadow = true;
    scene.add(road);
    // Lối nhỏ từ sân ra đường
    export var path = new THREE.Mesh(new THREE.PlaneGeometry(3, 9), texMat(dirtTex));
    path.rotation.x = -Math.PI / 2; path.position.set(2, 0.006, -7); path.receiveShadow = true;
    scene.add(path);
    // Ruộng lúa chín phía xa (nền cảnh)
    [[-38, 6, 26, 20, 0xd9b84a], [30, 12, 30, 18, 0xcfc25a], [-6, 26, 44, 14, 0xd9b84a], [38, -6, 20, 14, 0xc7b954]].forEach(function (f) {
      var p = new THREE.Mesh(new THREE.PlaneGeometry(f[2], f[3]), texMat(riceTex));
      p.rotation.x = -Math.PI / 2; p.position.set(f[0], -0.01, f[1]); p.receiveShadow = true;
      scene.add(p);
    });
    // Núi xa trong sương
    [[-52, -42, 26], [6, -58, 34], [58, -40, 28], [-58, 18, 30]].forEach(function (mtn) {
      var c = new THREE.Mesh(new THREE.ConeGeometry(mtn[2], mtn[2] * 0.62, 7), mat(0x7d9b78));
      c.position.set(mtn[0], mtn[2] * 0.28, mtn[1]); scene.add(c);
    });

    /* ---- Va chạm (hình tròn) ---- */
    export var blockers = [];
    export function block(x, z, r) { blockers.push({ x: x, z: z, r: r }); }

    /* ---- Nhà chính ---- */
    (function buildHouse() {
      var g = new THREE.Group();
      var walls = new THREE.Mesh(new THREE.BoxGeometry(8, 3.1, 5.4), texMat(plasterTex));
      walls.position.y = 1.55; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
      window.__houseWalls = walls; // PHASE 2: sửa nhà — sơn lại tường cho mới
      // Mái ngói hai dốc — tấm mái phải dài hơn thân nhà (8m) để phủ kín hai đầu hồi
      var roofMat = texMat(roofTex);
      [-1, 1].forEach(function (s) {
        var r = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.18, 3.6), roofMat);
        r.position.set(0, 3.95, s * 1.42); r.rotation.x = s * 0.62; r.castShadow = true; g.add(r);
      });
      // Đầu hồi tam giác ở hai đầu nhà
      var gShape = new THREE.Shape();
      gShape.moveTo(-2.72, 3.05); gShape.lineTo(2.72, 3.05); gShape.lineTo(0, 4.92); gShape.closePath();
      [-3.94, 3.94].forEach(function (gx) {
        var gGeo = new THREE.ExtrudeGeometry(gShape, { depth: 0.14, bevelEnabled: false });
        gGeo.rotateY(Math.PI / 2);
        var gable = new THREE.Mesh(gGeo, texMat(plasterTex));
        gable.position.set(gx - 0.07, 0, 0); gable.castShadow = true; g.add(gable);
      });
      // Cửa chính + cửa sổ
      var door = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.15, 0.1), mat(0x7a4a21));
      door.position.set(0.6, 1.08, 2.73); g.add(door);
      [-2.4, 2.9].forEach(function (wx) {
        var win = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 0.08), mat(0x5b4632));
        win.position.set(wx, 1.8, 2.73); g.add(win);
        var glass = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.78, 0.09),
          new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
        glass.position.set(wx, 1.8, 2.74); glass.name = "window-glass"; g.add(glass);
      });
      // Hiên + cột + băng ghế
      var porch = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.18, 1.7), texMat(woodTex));
      porch.position.set(0, 0.09, 3.4); porch.receiveShadow = true; g.add(porch);
      [-3.8, 3.8].forEach(function (px) {
        var col = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.5, 8), mat(0x7a4a21));
        col.position.set(px, 1.3, 4.1); g.add(col);
      });
      var porchRoof = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.12, 2.1), roofMat);
      porchRoof.position.set(0, 2.62, 3.6); porchRoof.rotation.x = 0.28; porchRoof.castShadow = true; g.add(porchRoof);
      var bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.5), texMat(woodTex));
      bench.position.set(-2.4, 0.5, 3.6); g.add(bench);
      g.position.set(-11, 0, -6); g.rotation.y = 0.5;
      scene.add(g);
      // Nhà xoay 0.5 rad (8×5,4m) — 1 vòng tròn r=5,2 phủ lấn ~2,5m ra phía
      // bắc, nuốt cả điểm đứng trước tiệm tạp hóa (-12,-9,8) khiến ông Tư
      // kẹt không tới được tiệm, và nuốt cả điểm chợ của bác Hai. Thay bằng
      // 2 vòng r=3,4 đặt dọc trục dài của nhà (đã xoay), ôm sát 4 góc tường
      // (góc xa nhất cách tâm 3,36m) + 1 vòng nhỏ cho ghế dài trên hiên.
      // Xem test/npc-pathing.test.mjs.
      block(-9.24, -6.96, 3.4); block(-12.76, -5.04, 3.4);
      block(-11.38, -1.69, 1.2); // ghế dài trên hiên
      window.__doorPos = new THREE.Vector3(-9.2, 0, -2.6);
    })();

    /* ---- Bếp phụ + đống củi ---- */
    (function buildKitchen() {
      box(3.4, 2.1, 2.6, 0xffffff, -17.5, 1.05, -1.5, { map: brickTex });
      var r = box(4, 0.14, 3.2, 0x9c4f2a, -17.5, 2.5, -1.5); r.rotation.x = 0.18;
      for (var i = 0; i < 5; i++) {
        var log = cyl(0.11, 0.11, 1.1, 0x8a5a2b, -15.2, 0.14 + (i > 2 ? 0.24 : 0), -0.4 + (i % 3) * 0.3, 8);
        log.rotation.z = Math.PI / 2;
      }
      // Bếp củi ngoài trời trước bếp phụ: thân gạch, nồi, khói bốc
      var stove = new THREE.Group();
      var sbase = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 0.8), mat(0xa0522d));
      sbase.position.y = 0.31; sbase.castShadow = true; stove.add(sbase);
      var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.28, 12), mat(0x3c3c40));
      pot.position.y = 0.76; stove.add(pot);
      var lid = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 6), mat(0x55555a));
      lid.position.y = 0.9; lid.scale.y = 0.35; stove.add(lid);
      stove.position.set(-16.4, 0, 0.9); scene.add(stove);
      window.__stovePos = new THREE.Vector3(-16.4, 0, 0.9);
      block(-16.4, 0.9, 0.75);
      // Khói bếp: chùm sprite xám bốc lên, nấu cơm thì bốc mạnh hơn
      var smkCv = document.createElement("canvas"); smkCv.width = smkCv.height = 64;
      var smkCx = smkCv.getContext("2d");
      var smkGr = smkCx.createRadialGradient(32, 32, 3, 32, 32, 32);
      smkGr.addColorStop(0, "rgba(235,235,235,0.55)"); smkGr.addColorStop(1, "rgba(235,235,235,0)");
      smkCx.fillStyle = smkGr; smkCx.fillRect(0, 0, 64, 64);
      var smkTex = new THREE.CanvasTexture(smkCv);
      window.__smoke = [];
      for (var smi = 0; smi < 9; smi++) {
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smkTex, transparent: true, opacity: 0.3, depthWrite: false }));
        sp.userData.ph = smi / 9;
        sp.position.set(-17.4, 2.8, -1.4);
        scene.add(sp); window.__smoke.push(sp);
      }
      block(-17.5, -1.5, 2.3); block(-15.2, -0.2, 0.8);
    })();

    /* ---- Giếng nước ---- */
    export var wellPos = new THREE.Vector3(-4.5, 0, 3.5);
    export var wellBucket;
    (function buildWell() {
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.85, 16, 1, true), texMat(brickTex, null, { side: THREE.DoubleSide }));
      ring.position.set(wellPos.x, 0.43, wellPos.z); ring.castShadow = true; scene.add(ring);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.09, 8, 20), mat(0x8a8378));
      rim.rotation.x = Math.PI / 2; rim.position.set(wellPos.x, 0.88, wellPos.z); scene.add(rim);
      var water = new THREE.Mesh(new THREE.CircleGeometry(0.9, 18), new THREE.MeshBasicMaterial({ color: 0x3f7f9e }));
      water.rotation.x = -Math.PI / 2; water.position.set(wellPos.x, 0.55, wellPos.z); scene.add(water);
      [-0.95, 0.95].forEach(function (s) {
        var post = new THREE.Mesh(new THREE.BoxGeometry(0.13, 2, 0.13), mat(0x7a4a21));
        post.position.set(wellPos.x + s, 1, wellPos.z); post.castShadow = true; scene.add(post);
      });
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 8), mat(0x7a4a21));
      beam.rotation.z = Math.PI / 2; beam.position.set(wellPos.x, 1.95, wellPos.z); scene.add(beam);
      var roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.09, 1.7), mat(0xb4552f));
      roof.position.set(wellPos.x, 2.3, wellPos.z); roof.rotation.x = 0.15; roof.castShadow = true; scene.add(roof);
      wellBucket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.3, 10), mat(0x5d6d7e));
      wellBucket.position.set(wellPos.x, 1.55, wellPos.z); scene.add(wellBucket);
      block(wellPos.x, wellPos.z, 1.35);
    })();

    /* ---- Hàng rào tre quanh sân ---- */
    (function buildFence() {
      var fenceMat = mat(0xb59a5e);
      function run(x1, z1, x2, z2) {
        var len = Math.hypot(x2 - x1, z2 - z1), n = Math.floor(len / 0.55);
        for (var i = 0; i <= n; i++) {
          var t = i / n, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t;
          var p = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.05, 6), fenceMat);
          p.position.set(x, 0.52, z); scene.add(p);
        }
        var rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.07), fenceMat);
        rail.position.set((x1 + x2) / 2, 0.78, (z1 + z2) / 2);
        rail.rotation.y = -Math.atan2(z2 - z1, x2 - x1); scene.add(rail);
      }
      run(-19, 12, 0.4, 12); run(3.6, 12, 19, 12);         // phía bắc (chừa cổng)
      run(-19, 12, -19, -11); run(19, 12, 19, -11);        // hai bên
      run(-19, -11, -1, -11); run(5, -11, 19, -11);        // phía nam, chừa lối ra đường
    })();

    /* ---- Cây xanh ---- */
    export function tree(x, z, s) {
      var t = cyl(0.16 * s, 0.24 * s, 1.9 * s, 0x7a4a21, x, 0.95 * s, z, 8);
      sph(1.35 * s, 0x4e7d33, x, 2.6 * s, z, 0.9);
      sph(0.95 * s, 0x5d8f3c, x + 0.8 * s, 2.1 * s, z + 0.3 * s, 0.9);
      sph(0.85 * s, 0x639b41, x - 0.8 * s, 2.2 * s, z - 0.3 * s, 0.9);
      block(x, z, 0.55 * s);
      return t;
    }
    tree(-16, 9, 1.25); tree(16.5, 7.5, 1.1); tree(-7, -11.5, 0.95);
    tree(24, -6, 1.2); tree(-24, -2, 1.3); tree(12, 14.5, 1.0);

    /* ---- Ao sen nhỏ ---- */
    (function buildPond() {
      var p = new THREE.Mesh(new THREE.CircleGeometry(3.4, 22),
        new THREE.MeshPhongMaterial({ color: 0x3f829e, shininess: 90, specular: 0xbfe6ff, transparent: true, opacity: 0.92 }));
      p.rotation.x = -Math.PI / 2; p.position.set(15.5, 0.01, 3); scene.add(p);
      for (var i = 0; i < 6; i++) {
        var a = i * 1.15, lx = 15.5 + Math.cos(a) * (1 + (i % 3)), lz = 3 + Math.sin(a) * (1 + (i % 2));
        var leaf = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10), mat(0x3e7d32));
        leaf.rotation.x = -Math.PI / 2; leaf.position.set(lx, 0.04, lz); scene.add(leaf);
      }
      sph(0.16, 0xf2a7c3, 14.6, 0.16, 2.2, 0.8);
      // Gợn sóng lan trên mặt ao
      window.__ripples = [];
      for (var ri = 0; ri < 3; ri++) {
        var rp = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 32),
          new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.4 }));
        rp.rotation.x = Math.PI / 2;
        rp.position.set(15.5 + (ri - 1) * 1.1, 0.05, 3 + (ri % 2) * 1.2 - 0.6);
        rp.userData.off = ri / 3;
        scene.add(rp); window.__ripples.push(rp);
      }
      block(15.5, 3, 3.2);
      // Cầu gỗ nhỏ ra ao để đứng câu cá + phao câu (hiện khi thả câu)
      var dock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 1.1), texMat(woodTex));
      dock.position.set(12.8, 0.1, 5.1); dock.rotation.y = 0.5; dock.receiveShadow = true; scene.add(dock);
      window.__fishPos = new THREE.Vector3(12.6, 0, 4.9);
      var bob = new THREE.Group();
      var bobTop = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xe2483a }));
      bobTop.position.y = 0.03; bob.add(bobTop);
      var bobBot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      bobBot.position.y = -0.04; bob.add(bobBot);
      bob.position.set(14.6, 0.06, 3.4); bob.visible = false; scene.add(bob);
      window.__bobber = bob;
    })();

    /* ---- Cỏ, hoa, cây trái: lớp chi tiết làm cảnh sống ---- */
    (function buildGreenery() {
      function freeSpot(x, z) {
        if (x > 1.2 && x < 16.6 && z > -0.6 && z < 10.6) return false;   // vườn rau
        if (Math.hypot(x - 15.5, z - 3) < 4.4) return false;              // ao
        if (Math.hypot(x + 11, z + 6) < 6.4) return false;                // nhà
        if (Math.hypot(x - 25, z + 16.5) < 5.6) return false;             // trường
        if (Math.hypot(x - 9, z + 11.6) < 2.8) return false;              // sạp bán
        if (z < -10.6 && z > -17.4) return false;                         // đường đất
        if (x > 0.2 && x < 3.8 && z < -1 && z > -11.5) return false;      // lối đi
        return true;
      }
      var dummy = new THREE.Object3D();
      // Cỏ: hai lớp màu, mọc khắp nền cỏ, sân đất chỉ lác đác ở rìa
      [[0x5d8f3c, 170], [0x79a94e, 150]].forEach(function (layer) {
        var im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.1, 0.42, 5), mat(layer[0]), layer[1]);
        var placed = 0, guard = 0;
        while (placed < layer[1] && guard++ < 3000) {
          var x = -30 + Math.random() * 66, z = -22 + Math.random() * 44;
          var inYard = x > -19 && x < 11 && z > -11 && z < 11;
          if (inYard && Math.random() < 0.82) continue;
          if (!freeSpot(x, z)) continue;
          dummy.position.set(x, 0.18, z);
          dummy.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * 3.14, (Math.random() - 0.5) * 0.35);
          var sc = 0.7 + Math.random() * 1.1; dummy.scale.set(sc, sc * (0.8 + Math.random() * 0.7), sc);
          dummy.updateMatrix();
          im.setMatrixAt(placed++, dummy.matrix);
        }
        im.count = placed; im.instanceMatrix.needsUpdate = true;
        scene.add(im);
      });
      // Hoa ven hiên nhà, bờ ao, cổng trường
      var fim = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0xffffff }), 112);
      var fCols = [new THREE.Color(0xe2483a), new THREE.Color(0xffd94d), new THREE.Color(0xf2a7c3), new THREE.Color(0xffffff), new THREE.Color(0xef8f2e)];
      var fSpots = [[-6.5, -2.2], [-13.5, -2.6], [-16.5, 8.6], [17.5, 0.2], [12.6, 10.8], [-18.2, -9.6], [20.6, -11.4], [-5.5, 11.2]];
      var fi = 0;
      fSpots.forEach(function (fs) {
        for (var j = 0; j < 14 && fi < 112; j++) {
          dummy.position.set(fs[0] + (Math.random() - 0.5) * 1.7, 0.16 + Math.random() * 0.22, fs[1] + (Math.random() - 0.5) * 1.7);
          dummy.rotation.set(0, 0, 0);
          var fs2 = 0.8 + Math.random() * 0.9; dummy.scale.set(fs2, fs2, fs2);
          dummy.updateMatrix();
          fim.setMatrixAt(fi, dummy.matrix);
          fim.setColorAt(fi, fCols[fi % fCols.length]);
          fi++;
        }
      });
      fim.count = fi; fim.instanceMatrix.needsUpdate = true;
      if (fim.instanceColor) fim.instanceColor.needsUpdate = true;
      scene.add(fim);
      // Cây chuối: thân + tàu lá xòe + buồng chuối (xanh -> chín vàng thì hái được)
      window.__bananas = [];
      function banana(x, z, s) {
        var g = new THREE.Group();
        var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.15 * s, 2.4 * s, 8), mat(0x8fa653));
        trunk.position.y = 1.2 * s; trunk.rotation.z = 0.07; trunk.castShadow = true; g.add(trunk);
        var leafMatB = new THREE.MeshLambertMaterial({ map: bananaLeafTex, side: THREE.DoubleSide });
        for (var i = 0; i < 6; i++) {
          var lgeo = new THREE.PlaneGeometry(1.9 * s, 0.5 * s); lgeo.translate(0.95 * s, 0, 0);
          var leaf = new THREE.Mesh(lgeo, leafMatB);
          leaf.position.y = 2.45 * s;
          leaf.rotation.y = i / 6 * Math.PI * 2 + Math.random() * 0.4;
          leaf.rotation.z = -0.28 - Math.random() * 0.3;
          leaf.castShadow = true; g.add(leaf);
        }
        var bunchMat = mat(0xf2d13c);
        var bunch = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 8, 8), bunchMat);
        bunch.position.set(0.18 * s, 2.05 * s, 0); bunch.scale.y = 1.3; bunch.castShadow = true; g.add(bunch);
        g.position.set(x, 0, z); scene.add(g);
        window.__bananas.push({ x: x, z: z, bunch: bunch, mat: bunchMat, ripe: true, timer: 0, s: s });
        block(x, z, 0.55);
      }
      banana(19.5, 8.5, 1.1); banana(-19.5, -5.5, 1.0); banana(13.5, -9.2, 0.95); banana(-6, 13.8, 1.05);
      // Bụi tre góc sân
      var bg = new THREE.Group();
      for (var bi = 0; bi < 8; bi++) {
        var bh = 4.2 + Math.random() * 2.2;
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, bh, 6), mat(0x86a860));
        pole.position.set((Math.random() - 0.5) * 1.1, bh / 2, (Math.random() - 0.5) * 1.1);
        pole.rotation.z = (Math.random() - 0.5) * 0.09; pole.castShadow = true; bg.add(pole);
        var top = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6), mat(0x639b41));
        top.position.set(pole.position.x * 2.2, bh + 0.2, pole.position.z * 2.2); top.scale.y = 0.7; bg.add(top);
      }
      bg.position.set(-21.5, 0, 5); scene.add(bg); block(-21.5, 5, 1.1);
      // Đống rơm cạnh chuồng trâu
      var hay = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.7, 12), texMat(riceTex));
      hay.position.set(-13.2, 0.85, 10.2); hay.castShadow = true; scene.add(hay);
      block(-13.2, 10.2, 1.2);
      // Hàng cây xa ở chân trời
      var lineTrunkG = new THREE.CylinderGeometry(0.22, 0.3, 2.4, 7);
      var lineLeafG = new THREE.SphereGeometry(1.9, 9, 7);
      var lineMat = mat(0x527a38), lineTrunkMat = mat(0x6e4525);
      function farTree(x, z, s) {
        var tr = new THREE.Mesh(lineTrunkG, lineTrunkMat); tr.position.set(x, 1.2 * s, z); tr.scale.setScalar(s); scene.add(tr);
        var lf = new THREE.Mesh(lineLeafG, lineMat); lf.position.set(x, 3.7 * s, z); lf.scale.set(s, s * 0.85, s); scene.add(lf);
      }
      for (var tx2 = -56; tx2 <= 60; tx2 += 8) {
        farTree(tx2 + (Math.random() * 3 - 1.5), -40 + (Math.random() * 4 - 2), 1.3 + Math.random() * 0.9);
        farTree(tx2 + 4, 36 + (Math.random() * 4 - 2), 1.2 + Math.random() * 0.8);
      }
      for (var tz2 = -28; tz2 <= 28; tz2 += 9) {
        farTree(-46 + (Math.random() * 3 - 1.5), tz2, 1.2 + Math.random() * 0.8);
        farTree(48, tz2 + 4, 1.3 + Math.random() * 0.7);
      }
      // Bướm bay trên khóm hoa
      window.__bflies = [];
      [[-6.5, -2.2, 0xffd94d], [17.5, 0.2, 0xf2a7c3], [-16.5, 8.6, 0xffffff]].forEach(function (fs, bi2) {
        var bf = new THREE.Group();
        var wmat = new THREE.MeshBasicMaterial({ color: fs[2], side: THREE.DoubleSide });
        var wgeoL = new THREE.PlaneGeometry(0.16, 0.12); wgeoL.translate(-0.08, 0, 0);
        var wgeoR = new THREE.PlaneGeometry(0.16, 0.12); wgeoR.translate(0.08, 0, 0);
        var wl = new THREE.Mesh(wgeoL, wmat), wr = new THREE.Mesh(wgeoR, wmat);
        bf.add(wl); bf.add(wr);
        bf.userData = { cx: fs[0], cz: fs[1], r: 1 + bi2 * 0.4, sp: 0.5 + bi2 * 0.17, ph: bi2 * 2.1, wl: wl, wr: wr };
        scene.add(bf); window.__bflies.push(bf);
      });
      // Hạt bụi bay trong nắng
      var dn = 110, dpos = new Float32Array(dn * 3);
      for (var di = 0; di < dn; di++) {
        dpos[di * 3] = -18 + Math.random() * 34; dpos[di * 3 + 1] = 0.3 + Math.random() * 2.6; dpos[di * 3 + 2] = -10 + Math.random() * 22;
      }
      var dgeo = new THREE.BufferGeometry(); dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
      var dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0xfff3c4, size: 0.07, transparent: true, opacity: 0.5, depthWrite: false }));
      scene.add(dust); window.__dust = dust;
    })();

    /* ---- Con trâu trong chuồng nhỏ ---- */
    export var buffalo;
    (function buildBuffalo() {
      buffalo = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1, 0.95), mat(0x5a5a60));
      body.position.y = 1.15; body.castShadow = true; buffalo.add(body);
      var head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.6), mat(0x515157));
      head.position.set(1.15, 1.05, 0); buffalo.add(head);
      [-1, 1].forEach(function (s) {
        var horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 6), mat(0xe8e0cc));
        horn.position.set(1.1, 1.45, s * 0.38); horn.rotation.x = s * 0.9; buffalo.add(horn);
        [[-0.75], [0.75]].forEach(function (lx) {
          var leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.75, 0.16), mat(0x4c4c52));
          leg.position.set(lx[0], 0.38, s * 0.3); buffalo.add(leg);
        });
      });
      var tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.8, 0.07), mat(0x4c4c52));
      tail.position.set(-1.0, 0.95, 0); tail.rotation.z = 0.3; tail.name = "tail"; buffalo.add(tail);
      buffalo.position.set(-15.5, 0, 7.5); buffalo.rotation.y = 0.7;
      scene.add(buffalo);
      block(-15.5, 7.5, 1.5);
    })();

    /* ---- Đàn gà đi lại trong sân ---- */
    export var chickens = [];
    (function buildChickens() {
      for (var i = 0; i < 5; i++) {
        var c = new THREE.Group();
        var b = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), mat(i === 0 ? 0xb06a35 : 0xf3ede0));
        b.scale.set(1.15, 0.9, 0.9); b.position.y = 0.24; b.castShadow = true; c.add(b);
        var h = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), mat(i === 0 ? 0xb06a35 : 0xf3ede0));
        h.position.set(0.2, 0.42, 0); h.name = "head"; c.add(h);
        var comb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.03), mat(0xd43a2a));
        comb.position.set(0.2, 0.54, 0); c.add(comb);
        var tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 6), mat(i === 0 ? 0x8a4f26 : 0xe0d8c4));
        tail.position.set(-0.22, 0.36, 0); tail.rotation.z = 0.9; c.add(tail);
        c.position.set(-3 + i * 1.7, 0, 6.5 - (i % 3));
        c.userData = { ang: Math.random() * 6.28, t: Math.random() * 10, speed: 0.5 + Math.random() * 0.4 };
        scene.add(c); chickens.push(c);
      }
    })();

    /* ---- Chuồng gà + ổ rơm đẻ trứng ---- */
    export var coopPos = new THREE.Vector3(-0.5, 0, 8.1);
    (function buildCoop() {
      var g = new THREE.Group();
      var nest = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.32, 0.7), texMat(woodTex));
      nest.position.y = 0.16; nest.castShadow = true; g.add(nest);
      var straw = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.1, 0.55), texMat(riceTex));
      straw.position.y = 0.36; g.add(straw);
      var roofC = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 0.95), mat(0xb4552f));
      roofC.position.y = 0.95; roofC.rotation.x = 0.2; g.add(roofC);
      [-0.8, 0.8].forEach(function (s) {
        var p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.08), mat(0x7a4a21));
        p.position.set(s, 0.48, -0.3); g.add(p);
      });
      g.position.copy(coopPos); scene.add(g);
      // Trứng trong ổ: hiện dần khi gà đẻ
      window.__eggMeshes = [];
      var eggGeo = new THREE.SphereGeometry(0.085, 8, 8);
      var eggMat = mat(0xfdf6e3);
      for (var ei = 0; ei < 5; ei++) {
        var egg = new THREE.Mesh(eggGeo, eggMat);
        egg.scale.y = 1.25;
        egg.position.set(coopPos.x - 0.6 + ei * 0.3, 0.46, coopPos.z + (ei % 2) * 0.18 - 0.08);
        egg.visible = false; scene.add(egg); window.__eggMeshes.push(egg);
      }
      block(coopPos.x, coopPos.z, 0.9);
    })();

    /* ---- Sào phơi áo ---- */
    (function buildClothesline() {
      [-1.6, 1.6].forEach(function (s) {
        var p = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.9, 0.09), mat(0x7a4a21));
        p.position.set(-8 + s, 0.95, 6.5); p.castShadow = true; scene.add(p);
      });
      var line = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.2, 5), mat(0xdddddd));
      line.rotation.z = Math.PI / 2; line.position.set(-8, 1.85, 6.5); scene.add(line);
      [[0xf2f0e6, -1], [0x7fb069, 0], [0xe88ca0, 1]].forEach(function (c) {
        var cloth = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.03), mat(c[0], { side: THREE.DoubleSide }));
        cloth.position.set(-8 + c[1] * 0.95, 1.36, 6.5); cloth.name = "cloth"; cloth.castShadow = true;
        scene.add(cloth); window.__cloths = window.__cloths || []; window.__cloths.push(cloth);
      });
      block(-8, 6.5, 0.7);
    })();

    /* ---- Đom đóm buổi tối ---- */
    export var fireflies;
    (function buildFireflies() {
      var n = 60, pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        pos[i * 3] = -18 + Math.random() * 38; pos[i * 3 + 1] = 0.4 + Math.random() * 1.6; pos[i * 3 + 2] = -10 + Math.random() * 22;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      fireflies = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe97a, size: 0.14, transparent: true, opacity: 0 }));
      scene.add(fireflies);
    })();


