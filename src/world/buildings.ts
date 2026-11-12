// @ts-nocheck
/*
 * GameGiaDinh — assets/src/world/buildings.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/world/buildings.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { block, mat, plasterTex, scene, texMat, woodTex } from './scene';

    /* ================== SẠP BÁN RAU ================== */
    export var stallPos = new THREE.Vector3(9, 0, -11.6);
    (function buildStall() {
      var g = new THREE.Group();
      [[-1.5, -0.9], [1.5, -0.9], [-1.5, 0.9], [1.5, 0.9]].forEach(function (pp) {
        var post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.3, 0.11), mat(0x7a4a21));
        post.position.set(pp[0], 1.15, pp[1]); post.castShadow = true; g.add(post);
      });
      // Mái sạp sọc xanh trắng (vẽ bằng canvas)
      var cv = document.createElement("canvas"); cv.width = 128; cv.height = 32;
      var cx = cv.getContext("2d");
      for (var i = 0; i < 8; i++) { cx.fillStyle = i % 2 ? "#f3ede0" : "#3e7d5a"; cx.fillRect(i * 16, 0, 16, 32); }
      var awnTex = new THREE.CanvasTexture(cv);
      var awn = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.08, 2.6),
        new THREE.MeshLambertMaterial({ map: awnTex }));
      awn.position.y = 2.42; awn.rotation.x = 0.16; awn.castShadow = true; g.add(awn);
      var counter = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.75, 1.5), texMat(woodTex));
      counter.position.y = 0.55; counter.castShadow = true; g.add(counter);
      // Sọt rau trên sạp
      [[0xe2483a, -1], [0x8fce4f, 0], [0xef8f2e, 1]].forEach(function (cc) {
        var crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), mat(0x8a5a2b));
        crate.position.set(cc[1] * 1.05, 1.08, 0); g.add(crate);
        for (var j = 0; j < 3; j++) {
          var v = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), mat(cc[0]));
          v.position.set(cc[1] * 1.05 + (j - 1) * 0.22, 1.3, (j % 2) * 0.2 - 0.1); g.add(v);
        }
      });
      // Cô Tư đứng sau sạp
      var person = new THREE.Group();
      var dress = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.85, 10), mat(0x38618c));
      dress.position.y = 0.43; person.add(dress);
      var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.5, 10), mat(0x38618c));
      torso.position.y = 1.08; person.add(torso);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), mat(0xe8b48c));
      head.position.y = 1.52; person.add(head);
      var hat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.16, 12), mat(0xd6b26a));
      hat.position.y = 1.66; person.add(hat);
      person.position.set(0, 0, -1.15); g.add(person);
      g.position.copy(stallPos); scene.add(g);
      block(stallPos.x, stallPos.z, 1.9);
    })();

    /* ================== TRƯỜNG HỌC ================== */
    export var schoolPos = new THREE.Vector3(25, 0, -16.5);
    export var gatePos = new THREE.Vector3(21.5, 0, -13.2);
    (function buildSchool() {
      var g = new THREE.Group();
      var walls = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3, 4.6), texMat(plasterTex));
      walls.position.y = 1.5; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
      [-1, 1].forEach(function (s) {
        var r = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.16, 3.1), mat(0x38618c));
        r.position.set(0, 3.6, s * 1.25); r.rotation.x = s * 0.6; r.castShadow = true; g.add(r);
      });
      var door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 0.1), mat(0x7a4a21));
      door.position.set(0, 1, 2.32); g.add(door);
      [-2.3, 2.3].forEach(function (wx) {
        var win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 0.08), mat(0xbfd9e8));
        win.position.set(wx, 1.8, 2.32); g.add(win);
      });
      // Biển trường
      var cv = document.createElement("canvas"); cv.width = 512; cv.height = 96;
      var cx = cv.getContext("2d");
      cx.fillStyle = "#fdf6e3"; cx.fillRect(0, 0, 512, 96);
      cx.fillStyle = "#38618c"; cx.font = "bold 52px sans-serif"; cx.textAlign = "center";
      cx.fillText("TRƯỜNG TIỂU HỌC", 256, 66);
      var sign = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.8, 0.08),
        new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cv) }));
      sign.position.set(0, 3.05, 2.36); g.add(sign);
      // Cột cờ
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.6, 8), mat(0xcccccc));
      pole.position.set(-3.4, 2.3, 3.4); g.add(pole);
      var flag = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.6, 0.03), new THREE.MeshBasicMaterial({ color: 0xd43a2a }));
      flag.position.set(-2.9, 4.15, 3.4); flag.name = "flag"; g.add(flag);
      window.__flag = flag;
      g.position.copy(schoolPos); scene.add(g);
      block(schoolPos.x, schoolPos.z, 4.4);
      // Cổng trường: hai trụ + vòng đánh dấu nơi đưa bé tới
      [-1.3, 1.3].forEach(function (s) {
        var post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.7, 0.28), mat(0x9a938a));
        post.position.set(gatePos.x + s, 0.85, gatePos.z); post.castShadow = true; scene.add(post);
      });
      var gring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.06, 8, 30),
        new THREE.MeshBasicMaterial({ color: 0xffd94d, transparent: true, opacity: 0.75 }));
      gring.rotation.x = Math.PI / 2; gring.position.set(gatePos.x, 0.06, gatePos.z);
      gring.name = "gate-ring"; scene.add(gring);
      window.__gateRing = gring;
    })();

