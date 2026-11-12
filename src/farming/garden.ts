// @ts-nocheck
/*
 * GameGiaDinh — assets/src/farming/garden.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/farming/garden.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { CROPS } from '../core/data';
import { mat, scene, soilTex, soilTexWet, texMat } from '../world/scene';

    /* ================== VƯỜN RAU — 12 LUỐNG ================== */
    export var soilDry = texMat(soilTex), soilWet = texMat(soilTexWet);
    export var leafMat = mat(0x4e7d33), leafLight = mat(0x6fae4e), sproutMat = mat(0x86c65c);
    export var plots = [];
    export var PLOT_X0 = 4.5, PLOT_Z0 = 1.5, PLOT_DX = 3.1, PLOT_DZ = 3.1;
    export function plotCenter(col, row) { return { x: PLOT_X0 + col * PLOT_DX, z: PLOT_Z0 + row * PLOT_DZ }; }

    export function clearGroup(gr) {
      while (gr.children.length) {
        var c = gr.children.pop();
        if (c.geometry && !c.geometry.userData.shared) c.geometry.dispose();
        gr.remove(c);
      }
    }
    // Hình khối dùng chung cho cây trồng — tạo 1 lần, dùng lại mọi lần vẽ, khỏi tốn bộ nhớ
    export function sharedGeo(geo) { geo.userData.shared = true; return geo; }
    export var GEO = {
      coneLeaf: sharedGeo(new THREE.ConeGeometry(0.3, 0.55, 7)),
      ballLeaf: sharedGeo(new THREE.SphereGeometry(0.3, 10, 8)),
      bush: sharedGeo(new THREE.SphereGeometry(0.55, 10, 8)),
      flatLeaf: sharedGeo(new THREE.SphereGeometry(0.42, 9, 7)),
      fruitS: sharedGeo(new THREE.SphereGeometry(0.13, 8, 8)),
      pumpL: sharedGeo(new THREE.SphereGeometry(0.34, 12, 10)),
      pumpS: sharedGeo(new THREE.SphereGeometry(0.26, 12, 10)),
      sprout: sharedGeo(new THREE.ConeGeometry(0.12, 0.3, 6)),
      stalk: sharedGeo(new THREE.CylinderGeometry(0.035, 0.05, 1.5, 6)),
      stake: sharedGeo(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 6)),
      cob: sharedGeo(new THREE.CylinderGeometry(0.07, 0.09, 0.42, 8)),
      dropBall: sharedGeo(new THREE.SphereGeometry(0.11, 8, 8)),
      dropTip: sharedGeo(new THREE.ConeGeometry(0.07, 0.14, 8))
    };
    export var fruitMats = {};
    export function fruitMat(k) {
      if (!fruitMats[k]) fruitMats[k] = mat(CROPS[k].fruit);
      return fruitMats[k];
    }
    export var stakeMat = mat(0x7a4a21);
    export var tasselMat = mat(0xd9c07a), flowerMatY = mat(0xffd94d);
    export function addMesh(gr, geo, material, x, y, z, sy) {
      var m = new THREE.Mesh(geo, material);
      m.position.set(x, y, z); if (sy) m.scale.y = sy;
      m.castShadow = true; gr.add(m); return m;
    }
    // Vẽ cây theo giai đoạn
    export function drawCrop(p) {
      clearGroup(p.cropGroup);
      clearGroup(p.markGroup);
      if (p.state === "empty") return;
      var c = CROPS[p.type], stage = p.state === "mature" ? 2 : (p.progress < 0.35 ? 0 : 1);
      var s = stage === 0 ? 0.35 : stage === 1 ? 0.7 : 1;
      var i, a, x, z;
      if (p.type === "cai") {
        for (i = 0; i < 5; i++) {
          a = i / 5 * Math.PI * 2;
          x = Math.cos(a) * 0.45; z = Math.sin(a) * 0.45;
          var cm = addMesh(p.cropGroup, GEO.coneLeaf, stage === 0 ? sproutMat : leafLight, x, 0.35 + 0.25 * s, z);
          cm.scale.set(s + 0.27, s + 0.22, s + 0.27);
        }
        var bm = addMesh(p.cropGroup, GEO.ballLeaf, stage === 0 ? sproutMat : leafMat, 0, 0.35 + 0.3 * s, 0);
        bm.scale.set(s, s * 0.75, s);
        if (stage === 2) for (i = 0; i < 4; i++) {
          a = i / 4 * Math.PI * 2 + 0.4;
          var ol = addMesh(p.cropGroup, GEO.flatLeaf, leafMat, Math.cos(a) * 0.6, 0.42, Math.sin(a) * 0.6);
          ol.scale.set(0.95, 0.4, 0.95); ol.rotation.y = a;
        }
      } else if (p.type === "cachua") {
        var tm = addMesh(p.cropGroup, GEO.bush, leafMat, 0, 0.35 + 0.55 * s, 0);
        tm.scale.set(s + 0.18, (s + 0.18) * 0.8, s + 0.18);
        var sm = addMesh(p.cropGroup, GEO.stake, stakeMat, 0.25, 0.35 + 0.45 * s, 0.25);
        sm.scale.y = (0.9 * s + 0.2) / 1.1;
        if (stage >= 1) for (i = 0; i < 3; i++) {
          a = i / 3 * Math.PI * 2 + 0.9;
          var fl2 = addMesh(p.cropGroup, GEO.fruitS, flowerMatY, Math.cos(a) * 0.42, 1.05 + (i % 2) * 0.18, Math.sin(a) * 0.42);
          fl2.scale.setScalar(0.45);
        }
        if (stage === 2) for (i = 0; i < 5; i++) {
          a = i / 5 * Math.PI * 2 + 0.5;
          addMesh(p.cropGroup, GEO.fruitS, fruitMat(p.type),
            Math.cos(a) * 0.5, 0.75 + (i % 2) * 0.25, Math.sin(a) * 0.5);
        }
      } else if (p.type === "ngo") {
        // Ngô: 3 thân cao, lá dài, chín thì có bắp vàng
        [[-0.35, -0.2], [0.3, 0.25], [0.05, -0.45]].forEach(function (sp2, si) {
          var st = addMesh(p.cropGroup, GEO.stalk, leafMat, sp2[0], 0.35 + 0.75 * s, sp2[1]);
          st.scale.y = s;
          var lf = addMesh(p.cropGroup, GEO.flatLeaf, leafLight, sp2[0], 0.35 + 1.5 * s, sp2[1]);
          lf.scale.set(0.55 * s + 0.15, 0.3 * s + 0.1, 0.55 * s + 0.15);
          if (stage === 2) addMesh(p.cropGroup, GEO.sprout, tasselMat, sp2[0], 0.35 + 1.66 * s, sp2[1]);
          if (stage === 2) {
            var cob = addMesh(p.cropGroup, GEO.cob, fruitMat("ngo"), sp2[0] + 0.14, 0.35 + 0.95 * s, sp2[1]);
            cob.rotation.z = 0.55; cob.rotation.y = si * 1.7;
          }
        });
        if (stage === 0) addMesh(p.cropGroup, GEO.sprout, sproutMat, 0, 0.45, 0);
      } else { // bí đỏ: dây bò + quả nằm đất
        for (i = 0; i < 4; i++) {
          a = i / 4 * Math.PI * 2 + 0.4;
          var pm = addMesh(p.cropGroup, GEO.flatLeaf, leafMat,
            Math.cos(a) * 0.55, 0.42, Math.sin(a) * 0.55);
          pm.scale.set(s + 0.14, (s + 0.14) * 0.5, s + 0.14);
        }
        if (stage === 2) {
          addMesh(p.cropGroup, GEO.pumpL, fruitMat(p.type), 0.3, 0.5, 0.15, 0.78);
          addMesh(p.cropGroup, GEO.pumpS, fruitMat(p.type), -0.45, 0.44, -0.3, 0.78);
        } else if (stage === 0) {
          addMesh(p.cropGroup, GEO.sprout, sproutMat, 0, 0.45, 0);
        }
      }
      // Dấu hiệu: khô nước -> giọt nước xanh lơ lửng; chín -> vòng vàng dưới đất
      if (p.state === "growing" && !p.watered) {
        var dm = drawCrop._dm || (drawCrop._dm = new THREE.MeshBasicMaterial({ color: 0x6ec3e8 }));
        var drop = addMesh(p.markGroup, GEO.dropBall, dm, 0, 1.35, 0, 1.35);
        drop.name = "drop";
        var tip = addMesh(p.markGroup, GEO.dropTip, dm, 0, 1.52, 0);
        tip.name = "drop";
      }
      if (p.state === "mature") {
        var ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 8, 26),
          new THREE.MeshBasicMaterial({ color: 0xffd94d }));
        ring.rotation.x = Math.PI / 2; ring.position.y = 0.42; ring.name = "ring";
        p.markGroup.add(ring);
      }
      p.soil.material = p.watered || p.state === "mature" ? soilWet : soilDry;
      // Khát nước lâu thì cây héo rũ xuống, tưới vào là tươi lại — như rau ngoài vườn thật
      p.cropGroup.scale.y = (p.state === "growing" && !p.watered && p.dryT > 7) ? 0.76 : 1;
    }

    (function buildGarden() {
      // Hàng rào thấp quanh vườn
      var fm = mat(0xb59a5e);
      for (var i = 0; i < 14; i++) {
        var px = 2.6 + i * 0.95;
        [0.1, 9.4].forEach(function (pz) {
          var post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), fm);
          post.position.set(px, 0.3, pz); scene.add(post);
        });
      }
      for (var row = 0; row < 3; row++) for (var col = 0; col < 4; col++) {
        var ctr = plotCenter(col, row);
        var g = new THREE.Group(); g.position.set(ctr.x, 0, ctr.z); scene.add(g);
        var soil = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.32, 2.3), soilDry);
        soil.position.y = 0.16; soil.receiveShadow = true; soil.castShadow = true; g.add(soil);
        // Rãnh đất
        for (var rI = -1; rI <= 1; rI++) {
          var ridge = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 0.3), soilDry);
          ridge.position.set(0, 0.36, rI * 0.7); g.add(ridge);
        }
        var cropGroup = new THREE.Group(); cropGroup.position.y = 0.35; g.add(cropGroup);
        var markGroup = new THREE.Group(); g.add(markGroup);
        var p = {
          col: col, row: row, x: ctr.x, z: ctr.z, group: g, soil: soil,
          cropGroup: cropGroup, markGroup: markGroup,
          state: "empty", type: null, progress: 0, watered: false, waterings: 0, dryT: 0
        };
        plots.push(p);
      }
    })();

    // PHASE 2: mở rộng đất — thêm 4 luống mới ở phía Bắc vườn (hàng -1), tổng 16 luống.
    // Chỉ gọi 1 lần (khi mua "Mở rộng đất trồng" hoặc khi tải save đã mua). Idempotent.
    export var extraPlotsBuilt = false;
    export function ensureExtraPlots() {
      if (extraPlotsBuilt) return;
      extraPlotsBuilt = true;
      var fm = mat(0xb59a5e);
      for (var i = 0; i < 14; i++) {
        var px = 2.6 + i * 0.95;
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), fm);
        post.position.set(px, 0.3, -2.7); scene.add(post);
      }
      for (var col = 0; col < 4; col++) {
        var ctr = plotCenter(col, -1);
        var g = new THREE.Group(); g.position.set(ctr.x, 0, ctr.z); scene.add(g);
        var soil = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.32, 2.3), soilDry);
        soil.position.y = 0.16; soil.receiveShadow = true; soil.castShadow = true; g.add(soil);
        for (var rI = -1; rI <= 1; rI++) {
          var ridge = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 0.3), soilDry);
          ridge.position.set(0, 0.36, rI * 0.7); g.add(ridge);
        }
        var cropGroup = new THREE.Group(); cropGroup.position.y = 0.35; g.add(cropGroup);
        var markGroup = new THREE.Group(); g.add(markGroup);
        var p = {
          col: col, row: -1, x: ctr.x, z: ctr.z, group: g, soil: soil,
          cropGroup: cropGroup, markGroup: markGroup,
          state: "empty", type: null, progress: 0, watered: false, waterings: 0, dryT: 0
        };
        plots.push(p);
      }
    }

