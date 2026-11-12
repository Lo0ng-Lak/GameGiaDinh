// @ts-nocheck
/*
 * GameGiaDinh — assets/src/world/ambient.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/world/ambient.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { planeGeoT, scene, sphGeo } from './scene';

    /* ================== ĐỜI SỐNG NỀN: CHIM BAY, LÁ RƠI, SAO ĐÊM, ĐÈN HIÊN ================== */
    (function buildAmbientLife() {
      // Đàn chim bay ngang trời
      window.__birds = [];
      var birdMat = new THREE.MeshBasicMaterial({ color: 0x2e3a2a, side: THREE.DoubleSide });
      for (var bi = 0; bi < 6; bi++) {
        var b = new THREE.Group();
        var wgeoL = planeGeoT(0.75, 0.22, -0.37, 0);
        var wgeoR = planeGeoT(0.75, 0.22, 0.37, 0);
        var wl = new THREE.Mesh(wgeoL, birdMat), wr = new THREE.Mesh(wgeoR, birdMat);
        wl.rotation.x = -Math.PI / 2; wr.rotation.x = -Math.PI / 2;
        b.add(wl); b.add(wr);
        b.userData = { off: bi * 1.6, row: (bi % 3) * 1.3, wl: wl, wr: wr };
        b.position.set(-130, 25 + (bi % 3) * 1.6, -55 + bi * 3);
        scene.add(b); window.__birds.push(b);
      }
      // Lá rơi quanh mấy cây lớn
      var ln = 36, lpos = new Float32Array(ln * 3);
      window.__leafBase = [];
      var treeSpots = [[-16, 9], [16.5, 7.5], [-7, -11.5], [12, 14.5]];
      for (var li = 0; li < ln; li++) {
        var ts = treeSpots[li % treeSpots.length];
        var bx = ts[0] + (Math.random() - 0.5) * 3.4, bz = ts[1] + (Math.random() - 0.5) * 3.4;
        window.__leafBase.push({ x: bx, z: bz, ph: Math.random() });
        lpos[li * 3] = bx; lpos[li * 3 + 1] = 3; lpos[li * 3 + 2] = bz;
      }
      var lgeo = new THREE.BufferGeometry(); lgeo.setAttribute("position", new THREE.BufferAttribute(lpos, 3));
      var leaves = new THREE.Points(lgeo, new THREE.PointsMaterial({ color: 0x86b45c, size: 0.16, transparent: true, opacity: 0.85, depthWrite: false }));
      scene.add(leaves); window.__leaves = leaves;
      // Sao trên trời, hiện dần lúc chập tối
      var sn = 240, spos = new Float32Array(sn * 3);
      for (var si2 = 0; si2 < sn; si2++) {
        var th = Math.random() * Math.PI * 2, ph2 = Math.random() * Math.PI * 0.42;
        spos[si2 * 3] = Math.cos(th) * Math.cos(ph2) * 215;
        spos[si2 * 3 + 1] = Math.sin(ph2) * 215 + 8;
        spos[si2 * 3 + 2] = Math.sin(th) * Math.cos(ph2) * 215;
      }
      var sgeo = new THREE.BufferGeometry(); sgeo.setAttribute("position", new THREE.BufferAttribute(spos, 3));
      var stars = new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
      stars.frustumCulled = false; scene.add(stars); window.__stars = stars;
      // Đèn vàng trước hiên nhà, chập tối tự sáng
      var lamp = new THREE.PointLight(0xffb45e, 0, 11, 1.6);
      lamp.position.set(-9.4, 2.3, -2.4); scene.add(lamp);
      window.__porchLight = lamp;
      var bulb = new THREE.Mesh(sphGeo(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      bulb.position.copy(lamp.position); scene.add(bulb);
      window.__porchBulb = bulb;
      // Mưa rào: hạt mưa rơi quanh người chơi, chỉ hiện khi trời đổ mưa
      var rn = 700, rpos = new Float32Array(rn * 3);
      for (var ri = 0; ri < rn; ri++) {
        rpos[ri * 3] = (Math.random() - 0.5) * 42;
        rpos[ri * 3 + 1] = Math.random() * 16;
        rpos[ri * 3 + 2] = (Math.random() - 0.5) * 42;
      }
      var rgeo = new THREE.BufferGeometry(); rgeo.setAttribute("position", new THREE.BufferAttribute(rpos, 3));
      var rain = new THREE.Points(rgeo, new THREE.PointsMaterial({ color: 0xbfd9ea, size: 0.14, transparent: true, opacity: 0.55, depthWrite: false }));
      rain.visible = false; rain.frustumCulled = false; scene.add(rain);
      window.__rain = rain;
    })();

