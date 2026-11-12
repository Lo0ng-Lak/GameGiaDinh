// @ts-nocheck
/*
 * GameGiaDinh — assets/src/world/details.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/world/details.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { stallPos } from './buildings';
import { bladeTex, block, box, boxGeo, coneGeo, cylGeo, glowCv, mat, matTex, planeGeoT, scene, sphGeo, texMat, torusGeo, wellPos, woodTex } from './scene';

    /* ================== LỚP CHI TIẾT — đồ đạc, sân vườn, ao, đồng lúa ================== */
    (function buildDetails() {
      var dummy = new THREE.Object3D();
      function rnd(a, b) { return a + Math.random() * (b - a); }
      // Tọa độ local của nhà chính (nhà ở (-11,-6), xoay 0.5) -> tọa độ thế giới
      function houseLocal(x, y, z) {
        var c = Math.cos(0.5), s = Math.sin(0.5);
        return new THREE.Vector3(-11 + x * c + z * s, y, -6 - x * s + z * c);
      }
      function houseBox(w, h, d, color, lx, ly, lz, tex) {
        var m = new THREE.Mesh(boxGeo(w, h, d), tex ? texMat(tex) : mat(color));
        var p = houseLocal(lx, ly, lz); m.position.copy(p); m.rotation.y = 0.5;
        m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
      }
      function chum(x, z, s, lidColor) {
        var g = new THREE.Group();
        var bodyJ = new THREE.Mesh(new THREE.SphereGeometry(0.36 * s, 12, 10), mat(0x7a5a43));
        bodyJ.scale.y = 1.05; bodyJ.position.y = 0.36 * s; bodyJ.castShadow = true; g.add(bodyJ);
        var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.24 * s, 0.14 * s, 10), mat(0x6d4e38));
        neck.position.y = 0.74 * s; g.add(neck);
        var lid = new THREE.Mesh(new THREE.CylinderGeometry(0.23 * s, 0.23 * s, 0.05 * s, 10), mat(lidColor || 0x9c4f2a));
        lid.position.y = 0.83 * s; g.add(lid);
        g.position.set(x, 0, z); scene.add(g); return g;
      }

      /* --- Cỏ lá mảnh thành bụi, hai mặt chéo nhau --- */
      function bladeSpot(x, z) {
        if (x > 1.2 && x < 16.6 && z > -0.6 && z < 10.6) return false;
        if (Math.hypot(x - 15.5, z - 3) < 4.3) return false;
        if (Math.hypot(x + 11, z + 6) < 6.2) return false;
        if (Math.hypot(x - 25, z + 16.5) < 5.4) return false;
        if (Math.hypot(x - 9, z + 11.6) < 2.7) return false;
        if (z < -10.8 && z > -16.8 && Math.random() < 0.85) return false;
        if (x > 0.2 && x < 3.8 && z < -1 && z > -11.5) return false;
        return true;
      }
      var bladeGeo = new THREE.PlaneGeometry(0.6, 0.52); bladeGeo.translate(0, 0.26, 0);
      var bladeGeo2 = bladeGeo.clone(); bladeGeo2.rotateY(Math.PI / 2);
      var bladeMat = mat(0xffffff, { map: bladeTex, alphaTest: 0.42, side: THREE.DoubleSide });
      var BN = 520;
      var blades1 = new THREE.InstancedMesh(bladeGeo, bladeMat, BN);
      var blades2 = new THREE.InstancedMesh(bladeGeo2, bladeMat, BN);
      var bp = 0, bguard = 0;
      while (bp < BN && bguard++ < 6000) {
        var bx = rnd(-27, 30), bz = rnd(-19, 18);
        if (bx > -19 && bx < 11 && bz > -11 && bz < 11 && Math.random() < 0.72) continue;
        if (!bladeSpot(bx, bz)) continue;
        dummy.position.set(bx, 0, bz);
        dummy.rotation.set(rnd(-0.12, 0.12), Math.random() * Math.PI, rnd(-0.12, 0.12));
        var bs = rnd(0.7, 1.6); dummy.scale.set(bs, bs * rnd(0.8, 1.3), bs);
        dummy.updateMatrix();
        blades1.setMatrixAt(bp, dummy.matrix); blades2.setMatrixAt(bp, dummy.matrix);
        bp++;
      }
      blades1.count = blades2.count = bp;
      blades1.instanceMatrix.needsUpdate = blades2.instanceMatrix.needsUpdate = true;
      scene.add(blades1); scene.add(blades2);

      /* --- Sỏi đá rải sân, hai bên đường, quanh vườn --- */
      var peb = new THREE.InstancedMesh(sphGeo(0.09, 7, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }), 140);
      var pebCols = [new THREE.Color(0x9a938a), new THREE.Color(0x8a8378), new THREE.Color(0xaaa294), new THREE.Color(0x7d766a)];
      for (var pi2 = 0; pi2 < 140; pi2++) {
        var px2, pz2;
        if (pi2 < 60) { px2 = rnd(-18, 10); pz2 = rnd(-10.5, 10.5); }
        else if (pi2 < 95) { px2 = rnd(-20, 30); pz2 = Math.random() < 0.5 ? rnd(-16.6, -15.6) : rnd(-12.4, -11.5); }
        else { px2 = rnd(1.5, 16); pz2 = rnd(-0.5, 10); }
        dummy.position.set(px2, 0.03, pz2);
        dummy.rotation.set(0, Math.random() * 3, 0);
        var ps2 = rnd(0.6, 1.7); dummy.scale.set(ps2, ps2 * 0.5, ps2);
        dummy.updateMatrix(); peb.setMatrixAt(pi2, dummy.matrix);
        peb.setColorAt(pi2, pebCols[pi2 % 4]);
      }
      peb.instanceMatrix.needsUpdate = true;
      if (peb.instanceColor) peb.instanceColor.needsUpdate = true;
      scene.add(peb);

      /* --- Lối đá bước từ cổng vào hiên nhà --- */
      var stoneMatD = mat(0x9a958c);
      [[2, -10.6], [2.1, -9.2], [1.9, -7.8], [2.05, -6.4], [1.9, -5], [1.2, -3.9], [-0.2, -3.3], [-1.8, -2.9], [-3.4, -2.6], [-5, -2.4], [-6.6, -2.3]].forEach(function (st, si3) {
        var sm2 = new THREE.Mesh(new THREE.CylinderGeometry(rnd(0.3, 0.4), rnd(0.34, 0.44), 0.07, 9), stoneMatD);
        sm2.position.set(st[0], 0.035, st[1]); sm2.rotation.y = si3 * 1.3;
        sm2.receiveShadow = true; scene.add(sm2);
      });
      /* --- Vệt đất mòn chỗ hay đi lại --- */
      var patchMat = new THREE.MeshBasicMaterial({ color: 0x8a6a42, transparent: true, opacity: 0.26, depthWrite: false });
      [[-4.5, 5.6, 2.2], [-15.6, 2.2, 1.8], [-8.6, -0.4, 2.4], [9, -9.2, 1.9], [-0.5, 6.2, 1.7], [12.9, 6.6, 1.5]].forEach(function (pt) {
        var pm2 = new THREE.Mesh(new THREE.CircleGeometry(pt[2], 18), patchMat);
        pm2.rotation.x = -Math.PI / 2; pm2.position.set(pt[0], 0.015, pt[1]); scene.add(pm2);
      });

      /* --- Nhà chính: ô cửa, đèn lồng, ngô khô, thảm, chậu hoa, chổi --- */
      [-2.4, 2.9].forEach(function (wx) {
        houseBox(0.055, 0.95, 0.04, 0x5a3a22, wx, 1.8, 2.79);
        houseBox(1.05, 0.055, 0.04, 0x5a3a22, wx, 1.8, 2.79);
      });
      houseBox(0.85, 0.62, 0.03, 0x6d4525, 0.6, 1.52, 2.79);
      houseBox(0.85, 0.55, 0.03, 0x6d4525, 0.6, 0.62, 2.79);
      var knobP = houseLocal(0.18, 1.05, 2.82);
      var knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), mat(0xd9b84a));
      knob.position.copy(knobP); scene.add(knob);
      houseBox(1.7, 0.045, 0.95, 0, 0.6, 0.21, 3.35, matTex);
      // Đèn lồng giấy treo đầu hiên — chập tối ngả màu vàng sáng
      var lampStrP = houseLocal(2.2, 2.38, 3.95);
      var lampStr = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 5), mat(0x5a3a22));
      lampStr.position.copy(lampStrP); scene.add(lampStr);
      var lantern = new THREE.Mesh(sphGeo(0.17, 10, 8), new THREE.MeshBasicMaterial({ color: 0xd4573a }));
      var lampP = houseLocal(2.2, 2.12, 3.95);
      lantern.position.copy(lampP); lantern.scale.y = 0.82; scene.add(lantern);
      window.__lantern = lantern;
      // Xâu ngô khô treo cột hiên
      for (var ci2 = 0; ci2 < 6; ci2++) {
        var cornP = houseLocal(-3.2 + (ci2 % 2) * 0.14, 2.25 - Math.floor(ci2 / 2) * 0.19, 3.98);
        var corn = new THREE.Mesh(cylGeo(0.035, 0.045, 0.17, 7), mat(0xf2c230));
        corn.position.copy(cornP); corn.rotation.z = 0.15; scene.add(corn);
      }
      // Chậu hoa hai đầu hiên
      [[-1.8, 4.18, 0xe2483a], [1.7, 4.18, 0xffd94d]].forEach(function (fp) {
        var potP = houseLocal(fp[0], 0.29, fp[1]);
        var pot = new THREE.Mesh(cylGeo(0.13, 0.1, 0.22, 9), mat(0xa55736));
        pot.position.copy(potP); pot.castShadow = true; scene.add(pot);
        var bushP = houseLocal(fp[0], 0.48, fp[1]);
        var bushF = new THREE.Mesh(sphGeo(0.15, 8, 7), mat(0x4e7d33));
        bushF.position.copy(bushP); bushF.scale.y = 0.75; scene.add(bushF);
        for (var fj = 0; fj < 4; fj++) {
          var flP = houseLocal(fp[0] + rnd(-0.11, 0.11), 0.56 + rnd(0, 0.06), fp[1] + rnd(-0.11, 0.11));
          var fl3 = new THREE.Mesh(sphGeo(0.05, 7, 6), mat(fp[2]));
          fl3.position.copy(flP); scene.add(fl3);
        }
      });
      // Chổi rơm dựa tường cạnh cửa
      var broom = new THREE.Group();
      var bHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.15, 6), mat(0x8a5a2b));
      bHandle.position.y = 0.72; broom.add(bHandle);
      var bHead = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 8), mat(0xd9b84a));
      bHead.position.y = 0.18; bHead.rotation.x = Math.PI; broom.add(bHead);
      var broomP = houseLocal(1.65, 0, 2.95);
      broom.position.copy(broomP); broom.rotation.z = 0.24; broom.rotation.y = 0.5; scene.add(broom);
      // Chum nước trên hiên + cạnh giếng + góc bếp
      var hp1 = houseLocal(3.35, 0, 3.2); chum(hp1.x, hp1.z, 1, 0x9c4f2a);
      var hp2 = houseLocal(-3.55, 0, 3.3); chum(hp2.x, hp2.z, 0.8, 0x38618c);
      chum(-3.05, 4.75, 1.1, 0x9c4f2a); block(-3.05, 4.75, 0.55);
      chum(-18.9, 0.55, 0.9, 0x38618c); block(-18.9, 0.55, 0.5);

      /* --- Chó mực nằm canh hiên, đuôi vẫy --- */
      var dog = new THREE.Group();
      var dogMat = mat(0xc9a06b), dogDark = mat(0x8a6a42);
      var dBody = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), dogMat);
      dBody.scale.set(1.15, 0.9, 0.85); dBody.position.y = 0.26; dBody.castShadow = true; dog.add(dBody);
      var dHead = new THREE.Mesh(sphGeo(0.16, 10, 8), dogMat);
      dHead.position.set(0.26, 0.44, 0); dog.add(dHead);
      var dSnout = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.11), dogDark);
      dSnout.position.set(0.4, 0.4, 0); dog.add(dSnout);
      [-1, 1].forEach(function (s) {
        var ear = new THREE.Mesh(coneGeo(0.055, 0.13, 6), dogDark);
        ear.position.set(0.2, 0.58, s * 0.09); ear.rotation.x = s * 0.35; dog.add(ear);
        var legF = new THREE.Mesh(cylGeo(0.035, 0.035, 0.3, 6), dogMat);
        legF.position.set(0.22, 0.15, s * 0.13); dog.add(legF);
      });
      var dogTailPiv = new THREE.Group(); dogTailPiv.position.set(-0.3, 0.34, 0);
      var dTail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.34, 6), dogDark);
      dTail.position.y = 0.15; dTail.rotation.z = 0.7; dogTailPiv.add(dTail); dog.add(dogTailPiv);
      dog.position.set(-6.9, 0, -0.85); dog.rotation.y = -0.7;
      scene.add(dog);
      window.__dogTail = dogTailPiv;
      window.__dog = dog;
      window.__dogHome = dog.position.clone();

      /* --- Giếng: bờ đá, dây gầu, ròng rọc, gáo dừa, bình tưới để cạnh --- */
      var apron = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.65, 0.07, 18), mat(0xa39a8d));
      apron.position.set(wellPos.x, 0.035, wellPos.z); apron.receiveShadow = true; scene.add(apron);
      var rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 5), mat(0xa8895a));
      rope.position.set(wellPos.x, 1.8, wellPos.z); scene.add(rope);
      var pulley = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 12), mat(0x5a3a22));
      pulley.position.set(wellPos.x, 1.95, wellPos.z); scene.add(pulley);
      var ladle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 9, 6), mat(0x6d4e38));
      ladle.scale.y = 0.55; ladle.position.set(wellPos.x + 0.95, 0.93, wellPos.z + 0.25); scene.add(ladle);
      var canProp = new THREE.Group();
      var canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.26, 10), mat(0x4e7d5a));
      canBody.position.y = 0.13; canBody.castShadow = true; canProp.add(canBody);
      var spout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.3, 6), mat(0x4e7d5a));
      spout.position.set(0.18, 0.16, 0); spout.rotation.z = -0.8; canProp.add(spout);
      canProp.position.set(-3.55, 0, 5.1); scene.add(canProp);

      /* --- Bếp: nồi niêu đất + lửa than hồng trong bếp củi + xâu tỏi --- */
      [[-18.15, 0.95, 0.62], [-17.6, 1.25, 0.5]].forEach(function (cp) {
        var potC = new THREE.Mesh(new THREE.SphereGeometry(cp[2] * 0.3, 10, 8), mat(0x6d4e38));
        potC.scale.y = 0.85; potC.position.set(cp[0], cp[2] * 0.24, cp[1]); potC.castShadow = true; scene.add(potC);
        var rimC = new THREE.Mesh(new THREE.CylinderGeometry(cp[2] * 0.19, cp[2] * 0.19, 0.05, 9), mat(0x59402c));
        rimC.position.set(cp[0], cp[2] * 0.48, cp[1]); scene.add(rimC);
      });
      var coals = new THREE.Group();
      var coalMat = new THREE.MeshBasicMaterial({ color: 0xff7a33 });
      [[-0.09, 0], [0.07, 0.05], [0, -0.07]].forEach(function (co) {
        var cm2 = new THREE.Mesh(sphGeo(0.055, 7, 6), coalMat);
        cm2.position.set(co[0], 0, co[1]); coals.add(cm2);
      });
      coals.position.set(-16.4, 0.17, 1.26); scene.add(coals);
      window.__coalMat = coalMat;
      var stoveLight = new THREE.PointLight(0xff7a33, 0.35, 5.5, 2);
      stoveLight.position.set(-16.4, 0.5, 1.55); scene.add(stoveLight);
      window.__stoveLight = stoveLight;
      for (var gi = 0; gi < 5; gi++) {
        var gar = new THREE.Mesh(sphGeo(0.05, 7, 6), mat(0xf3ede0));
        gar.position.set(-16.15, 1.62 - gi * 0.11, -0.08); gar.scale.y = 1.2; scene.add(gar);
      }
      // Phên phơi ớt trước bếp
      var dryMat = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.05, 1.5), texMat(matTex));
      dryMat.position.set(-13.5, 0.06, 3.1); dryMat.rotation.y = 0.35; dryMat.receiveShadow = true; scene.add(dryMat);
      for (var chi = 0; chi < 14; chi++) {
        var chili = new THREE.Mesh(sphGeo(0.045, 6, 5), mat(chi % 3 ? 0xd43a2a : 0xef8f2e));
        chili.scale.set(1.6, 0.5, 0.7);
        chili.position.set(-13.5 + rnd(-0.95, 0.95), 0.11, 3.1 + rnd(-0.55, 0.55));
        chili.rotation.y = Math.random() * 3; scene.add(chili);
      }

      /* --- Chuồng gà: hàng rào quây + máng ăn + máng nước --- */
      var penMat = mat(0xb59a5e);
      function penPost(x, z) {
        var p = new THREE.Mesh(cylGeo(0.035, 0.035, 0.55, 6), penMat);
        p.position.set(x, 0.27, z); scene.add(p);
      }
      var pxA = -2.9, pxB = 1.9, pzA = 6.1, pzB = 10.1, k2;
      for (k2 = 0; k2 <= 4; k2++) { penPost(pxA + k2 * (pxB - pxA) / 4, pzA); penPost(pxA + k2 * (pxB - pxA) / 4, pzB); }
      for (k2 = 1; k2 < 4; k2++) { penPost(pxA, pzA + k2 * (pzB - pzA) / 4); penPost(pxB, pzA + k2 * (pzB - pzA) / 4); }
      [[pxA, pzB, pxB, pzB], [pxA, pzA, -1.3, pzA], [0.3, pzA, pxB, pzA], [pxA, pzA, pxA, pzB], [pxB, pzA, pxB, pzB]].forEach(function (rl) {
        var len = Math.hypot(rl[2] - rl[0], rl[3] - rl[1]);
        var rail = new THREE.Mesh(boxGeo(len, 0.055, 0.055), penMat);
        rail.position.set((rl[0] + rl[2]) / 2, 0.42, (rl[1] + rl[3]) / 2);
        rail.rotation.y = -Math.atan2(rl[3] - rl[1], rl[2] - rl[0]); scene.add(rail);
      });
      var feeder = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.24), texMat(woodTex));
      feeder.position.set(0.9, 0.06, 7.2); scene.add(feeder);
      var waterBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.11, 10), mat(0x5d6d7e));
      waterBowl.position.set(-1.9, 0.055, 9.3); scene.add(waterBowl);

      /* --- Biển vườn rau --- */
      function textSign(text, w, h, fs) {
        var cv = document.createElement("canvas"); cv.width = 512; cv.height = 128;
        var cx2 = cv.getContext("2d");
        cx2.fillStyle = "#8a5a2b"; cx2.fillRect(0, 0, 512, 128);
        cx2.strokeStyle = "#fdf6e3"; cx2.lineWidth = 6; cx2.strokeRect(10, 10, 492, 108);
        cx2.fillStyle = "#fdf6e3"; cx2.font = "bold " + fs + "px sans-serif"; cx2.textAlign = "center";
        cx2.fillText(text, 256, 84);
        var m = new THREE.Mesh(boxGeo(w, h, 0.06), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cv) }));
        m.castShadow = true; return m;
      }
      var gPost = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 7), mat(0x7a4a21));
      gPost.position.set(3.1, 0.5, -0.75); scene.add(gPost);
      var gSign = textSign("VƯỜN RAU", 1.35, 0.34, 64);
      gSign.position.set(3.1, 1.05, -0.75); gSign.rotation.y = 0.12; scene.add(gSign);

      /* --- Sạp cô Tư: biển hiệu, bao tải, cân đĩa, buồng chuối treo --- */
      var stallSign = textSign("SẠP RAU CÔ TƯ", 2.7, 0.55, 58);
      stallSign.position.set(stallPos.x, 1.38, stallPos.z + 0.85); scene.add(stallSign);
      [[-2.15, 0.55], [-2.0, -0.55]].forEach(function (sk) {
        var sack = new THREE.Mesh(sphGeo(0.34, 9, 8), mat(0xa8895a));
        sack.scale.y = 0.78; sack.position.set(stallPos.x + sk[0], 0.24, stallPos.z + sk[1]);
        sack.castShadow = true; scene.add(sack);
      });
      var scaleG = new THREE.Group();
      var scBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.05, 9), mat(0x5d6d7e));
      scBase.position.y = 0.03; scaleG.add(scBase);
      var scPole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 6), mat(0x5d6d7e));
      scPole.position.y = 0.22; scaleG.add(scPole);
      var scBeam = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.03), mat(0x5d6d7e));
      scBeam.position.y = 0.4; scaleG.add(scBeam);
      var scPan = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.03, 10), mat(0xd9b84a));
      scPan.position.set(0.22, 0.34, 0); scaleG.add(scPan);
      scaleG.position.set(stallPos.x - 1.25, 0.93, stallPos.z + 0.25); scene.add(scaleG);
      for (var bni = 0; bni < 5; bni++) {
        var bn2 = new THREE.Mesh(sphGeo(0.055, 7, 6), mat(0xf2d13c));
        bn2.scale.y = 1.5;
        bn2.position.set(stallPos.x + 1.72 + (bni % 2) * 0.09, 1.95 - Math.floor(bni / 2) * 0.13, stallPos.z + 0.95);
        scene.add(bn2);
      }

      /* --- Ao: đá bờ, lau sậy, sen nở, vịt bơi, chuồn chuồn --- */
      var rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.3), mat(0x8f8a80), 16);
      for (var ri2 = 0; ri2 < 16; ri2++) {
        var ra = ri2 / 16 * Math.PI * 2 + rnd(-0.15, 0.15);
        dummy.position.set(15.5 + Math.cos(ra) * rnd(3.5, 3.85), 0.08, 3 + Math.sin(ra) * rnd(3.5, 3.85));
        dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        var rs3 = rnd(0.5, 1.15); dummy.scale.set(rs3, rs3 * 0.7, rs3);
        dummy.updateMatrix(); rocks.setMatrixAt(ri2, dummy.matrix);
      }
      rocks.instanceMatrix.needsUpdate = true; scene.add(rocks);
      var reedN = 15;
      var reedStems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.03, 1.15, 5), mat(0x6d9a4e), reedN);
      var reedHeads = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, 6), mat(0x7a4a21), reedN);
      for (var rdi = 0; rdi < reedN; rdi++) {
        var ra2 = rnd(-1.5, 1.1), rr = rnd(3.3, 3.65);
        var rx2 = 15.5 + Math.cos(ra2) * rr, rz2 = 3 + Math.sin(ra2) * rr;
        dummy.rotation.set(rnd(-0.09, 0.09), 0, rnd(-0.09, 0.09));
        dummy.position.set(rx2, 0.55, rz2); dummy.scale.setScalar(rnd(0.85, 1.25));
        dummy.updateMatrix(); reedStems.setMatrixAt(rdi, dummy.matrix);
        dummy.position.y = 1.12 * dummy.scale.y; dummy.updateMatrix(); reedHeads.setMatrixAt(rdi, dummy.matrix);
      }
      reedStems.instanceMatrix.needsUpdate = reedHeads.instanceMatrix.needsUpdate = true;
      scene.add(reedStems); scene.add(reedHeads);
      // Sen nở + nụ sen
      var lotus = new THREE.Group();
      var petalMat = mat(0xf2a7c3, { side: THREE.DoubleSide });
      for (var pt2 = 0; pt2 < 6; pt2++) {
        var petal = new THREE.Mesh(sphGeo(0.13, 8, 6), petalMat);
        var pa = pt2 / 6 * Math.PI * 2;
        petal.position.set(Math.cos(pa) * 0.11, 0.03, Math.sin(pa) * 0.11);
        petal.scale.set(0.55, 0.35, 1); petal.rotation.y = -pa + Math.PI / 2; petal.rotation.x = 0.5;
        lotus.add(petal);
      }
      var lotusCore = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xffd94d));
      lotusCore.position.y = 0.05; lotus.add(lotusCore);
      lotus.position.set(17.2, 0.07, 4.7); scene.add(lotus);
      [[16.6, 1.6], [14.2, 4.9]].forEach(function (bd) {
        var budStem = new THREE.Mesh(cylGeo(0.015, 0.015, 0.3, 5), mat(0x3e7d32));
        budStem.position.set(bd[0], 0.15, bd[1]); scene.add(budStem);
        var bud = new THREE.Mesh(coneGeo(0.07, 0.18, 8), petalMat);
        bud.position.set(bd[0], 0.38, bd[1]); scene.add(bud);
      });
      // Vịt bơi vòng quanh ao
      window.__ducks = [];
      [[1.5, 0.16, 0], [2.2, 0.11, 2.4]].forEach(function (dc) {
        var dk = new THREE.Group();
        var dkb = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), mat(0xf3ede0));
        dkb.scale.set(0.9, 0.78, 1.2); dkb.position.y = 0.05; dk.add(dkb);
        var dkh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 9, 8), mat(0xf3ede0));
        dkh.position.set(0, 0.2, 0.2); dk.add(dkh);
        var dbeak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.11, 7), mat(0xef8f2e));
        dbeak.rotation.x = Math.PI / 2; dbeak.position.set(0, 0.19, 0.33); dk.add(dbeak);
        var dtail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 7), mat(0xf3ede0));
        dtail.rotation.x = -Math.PI / 2.6; dtail.position.set(0, 0.1, -0.24); dk.add(dtail);
        scene.add(dk);
        window.__ducks.push({ g: dk, r: dc[0], sp: dc[1], a: dc[2], cx: 15.5, cz: 3, ph: dc[2] * 2 });
      });
      // Chuồn chuồn lượn trên mặt ao
      window.__dragonflies = [];
      [[2.6, 0.55, 0], [3.1, 0.42, 2.2]].forEach(function (dfc) {
        var df = new THREE.Group();
        var dfBody = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.008, 0.24, 5), new THREE.MeshBasicMaterial({ color: 0x3e7dc2 }));
        dfBody.rotation.z = Math.PI / 2; df.add(dfBody);
        var wingGeoD = planeGeoT(0.05, 0.2, 0, 0.1);
        var wingMatD = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
        var w1 = new THREE.Mesh(wingGeoD, wingMatD); df.add(w1);
        var wingGeoD2 = planeGeoT(0.05, 0.2, 0, -0.1);
        var w2 = new THREE.Mesh(wingGeoD2, wingMatD); df.add(w2);
        scene.add(df);
        window.__dragonflies.push({ g: df, r: dfc[0], sp: dfc[1], ph: dfc[2], w1: w1, w2: w2 });
      });

      /* --- Đồng lúa phía bắc: bờ ruộng, bụi lúa thật, bù nhìn --- */
      box(44, 0.18, 0.5, 0x7d9b52, -6, 0.09, 19.1);
      box(44, 0.18, 0.5, 0x7d9b52, -6, 0.09, 32.9);
      box(0.5, 0.18, 14, 0x7d9b52, -28.1, 0.09, 26);
      box(0.5, 0.18, 14, 0x7d9b52, 16.1, 0.09, 26);
      var riceTuftGeo = new THREE.ConeGeometry(0.17, 0.55, 5);
      var riceTufts = new THREE.InstancedMesh(riceTuftGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 380);
      var riceCols = [new THREE.Color(0xd9b84a), new THREE.Color(0xc7b954), new THREE.Color(0xe0c25e)];
      var rt = 0;
      for (var rz3 = 20.4; rz3 < 31.8 && rt < 290; rz3 += 1.35) {
        for (var rx3 = -26.5; rx3 < 14.5 && rt < 290; rx3 += 1.15) {
          dummy.position.set(rx3 + rnd(-0.3, 0.3), 0.26, rz3 + rnd(-0.3, 0.3));
          dummy.rotation.set(rnd(-0.1, 0.1), Math.random() * 3, rnd(-0.1, 0.1));
          dummy.scale.setScalar(rnd(0.85, 1.35)); dummy.updateMatrix();
          riceTufts.setMatrixAt(rt, dummy.matrix); riceTufts.setColorAt(rt, riceCols[rt % 3]); rt++;
        }
      }
      for (var rz4 = 5; rz4 < 18 && rt < 380; rz4 += 1.4) {
        for (var rx4 = 35; rx4 < 44 && rt < 380; rx4 += 1.2) {
          dummy.position.set(rx4 + rnd(-0.3, 0.3), 0.26, rz4 + rnd(-0.3, 0.3));
          dummy.rotation.set(rnd(-0.1, 0.1), Math.random() * 3, rnd(-0.1, 0.1));
          dummy.scale.setScalar(rnd(0.85, 1.3)); dummy.updateMatrix();
          riceTufts.setMatrixAt(rt, dummy.matrix); riceTufts.setColorAt(rt, riceCols[rt % 3]); rt++;
        }
      }
      riceTufts.count = rt; riceTufts.instanceMatrix.needsUpdate = true;
      if (riceTufts.instanceColor) riceTufts.instanceColor.needsUpdate = true;
      scene.add(riceTufts);
      var scare = new THREE.Group();
      var scPoleM = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 7), mat(0x8a5a2b));
      scPoleM.position.y = 1.05; scare.add(scPoleM);
      var scArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 6), mat(0x8a5a2b));
      scArm.rotation.z = Math.PI / 2; scArm.position.y = 1.62; scare.add(scArm);
      var scShirt = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1, 9), mat(0x38618c));
      scShirt.position.y = 1.25; scShirt.castShadow = true; scare.add(scShirt);
      var scHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 9, 8), mat(0xe8d9a8));
      scHead.position.y = 1.92; scare.add(scHead);
      var scHat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.15, 11), mat(0xd6b26a));
      scHat.position.y = 2.06; scare.add(scHat);
      [-1, 1].forEach(function (s) {
        var straw = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(0xd9b84a));
        straw.position.set(s * 0.6, 1.6, 0); scare.add(straw);
      });
      scare.position.set(-2, 0, 24); scene.add(scare);
      window.__scarecrow = scare;

      /* --- Cây ăn quả gần nhà: chấm quả chín trên tán --- */
      [[-16, 9, 1.25, 0xef8f2e], [16.5, 7.5, 1.1, 0xe2483a]].forEach(function (ft) {
        for (var fi3 = 0; fi3 < 8; fi3++) {
          var fa = fi3 / 8 * Math.PI * 2 + ft[0];
          var fr = new THREE.Mesh(sphGeo(0.09, 7, 6), mat(ft[3]));
          fr.position.set(ft[0] + Math.cos(fa) * 1.15 * ft[2], (2.35 + (fi3 % 3) * 0.28) * ft[2], ft[1] + Math.sin(fa) * 1.15 * ft[2]);
          scene.add(fr);
        }
      });

      /* --- Xe đạp dựng ở cổng trường --- */
      (function bike(x, z, ry) {
        var g = new THREE.Group();
        var tireM = mat(0x2b2b2b), frameM = mat(0x38618c);
        [-0.42, 0.42].forEach(function (wx2) {
          var w = new THREE.Mesh(torusGeo(0.33, 0.028, 8, 20), tireM);
          w.position.set(wx2, 0.33, 0); g.add(w);
        });
        function bar(x1, y1, x2, y2) {
          var len = Math.hypot(x2 - x1, y2 - y1);
          var b = new THREE.Mesh(cylGeo(0.025, 0.025, len, 6), frameM);
          b.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
          b.rotation.z = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2; g.add(b);
        }
        bar(-0.42, 0.33, -0.05, 0.6); bar(-0.05, 0.6, 0.42, 0.33); bar(-0.05, 0.6, 0.02, 0.33);
        bar(0.02, 0.33, -0.42, 0.33); bar(0.4, 0.33, 0.45, 0.7);
        var seat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.14), mat(0x5a3a22));
        seat.position.set(-0.08, 0.66, 0); g.add(seat);
        var hbar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), tireM);
        hbar.rotation.x = Math.PI / 2; hbar.position.set(0.45, 0.72, 0); g.add(hbar);
        var basketB = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.26), mat(0x8a5a2b));
        basketB.position.set(0.52, 0.52, 0); g.add(basketB);
        g.position.set(x, 0, z); g.rotation.y = ry; g.rotation.z = 0.05;
        g.traverse(function (o) { o.castShadow = true; });
        scene.add(g);
      })(20.3, -11.8, 0.5);
      block(20.3, -11.8, 0.7);
      // Chậu hoa hai bên cổng trường
      [[22.9, -13.9], [27.3, -13.9]].forEach(function (pl) {
        var planter = new THREE.Mesh(boxGeo(1.7, 0.32, 0.5), texMat(woodTex));
        planter.position.set(pl[0], 0.16, pl[1]); planter.castShadow = true; scene.add(planter);
        for (var pj = 0; pj < 6; pj++) {
          var pf = new THREE.Mesh(sphGeo(0.075, 7, 6), mat([0xe2483a, 0xffd94d, 0xf2a7c3][pj % 3]));
          pf.position.set(pl[0] - 0.65 + pj * 0.26, 0.42, pl[1] + rnd(-0.1, 0.1)); scene.add(pf);
        }
      });

      /* --- Trăng đêm --- */
      var moonG = new THREE.Group();
      var moonDisc = new THREE.Mesh(new THREE.CircleGeometry(5, 24),
        new THREE.MeshBasicMaterial({ color: 0xf6f3e0, fog: false, transparent: true, opacity: 0 }));
      moonG.add(moonDisc);
      var moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCv), color: 0xbdd2ff, transparent: true, opacity: 0, fog: false, depthWrite: false }));
      moonGlow.scale.set(34, 34, 1); moonG.add(moonGlow);
      moonG.renderOrder = -9; moonG.frustumCulled = false;
      scene.add(moonG);
      window.__moonG = moonG;
    })();

