// @ts-nocheck
/*
 * GameGiaDinh — assets/src/world/daylight.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/world/daylight.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { G } from '../core/state';
import { player } from '../player/player';
import { camera, cloudMat, fireflies, hemi, renderer, scene, skyUni, sun, sunDisc, sunGlow } from './scene';

    /* ================== ÁNH SÁNG THEO GIỜ ================== */
    export var skyDay = new THREE.Color(0x9fd3e8), skyDawn = new THREE.Color(0xf6c98f),
        skyDusk = new THREE.Color(0xe8906a), skyNight = new THREE.Color(0x35486b);
    export var tmpColor = new THREE.Color();
    export function lerpColor(a, b, t) { return tmpColor.copy(a).lerp(b, t); }
    export function updateSky() {
      var m = G.minutes;
      var sunAng, intensity, skyC;
      if (m < 360) { var t1 = (m - 330) / 30; sunAng = 0.06 + t1 * 0.1; intensity = 0.75; skyC = lerpColor(skyDawn, skyDay, Math.max(0, t1)); }
      else if (m < 1020) { var t2 = (m - 360) / 660; sunAng = 0.16 + t2 * 0.68; intensity = 1.05; skyC = lerpColor(skyDay, skyDay, 0); }
      else if (m < 1140) { var t3 = (m - 1020) / 120; sunAng = 0.84 + t3 * 0.14; intensity = 1.0 - t3 * 0.45; skyC = lerpColor(skyDay, skyDusk, t3); }
      else { sunAng = 1; intensity = 0.5; skyC = lerpColor(skyDusk, skyNight, Math.min(1, (m - 1140) / 60)); }
      scene.background.copy(skyC);
      scene.fog.color.copy(skyC).lerp(new THREE.Color(0xffffff), 0.25);
      skyUni.mid.value.copy(skyC);
      skyUni.top.value.copy(skyC).lerp(new THREE.Color(0x2e6cb0), 0.55);
      skyUni.bot.value.copy(skyC).lerp(new THREE.Color(0xffd9a0), 0.5);
      cloudMat.color.copy(skyC).lerp(new THREE.Color(0xffffff), 0.6);
      var sunVis = Math.max(0.12, Math.sin(sunAng * Math.PI));
      sunDisc.material.opacity = sunVis * 0.95;
      sunGlow.material.opacity = sunVis * 0.85;
      var sx = Math.cos(sunAng * Math.PI) * 55, sy = Math.sin(sunAng * Math.PI) * 48 + 4;
      sun.position.set(player.x + sx, sy, player.z - 28);
      sun.target.position.set(player.x, 0, player.z);
      sun.intensity = intensity;
      renderer.toneMappingExposure = 1.0 + 0.09 * Math.sin(sunAng * Math.PI);
      sun.color.setHSL(0.09 + 0.03 * Math.sin(sunAng * Math.PI), 0.65, 0.72);
      hemi.intensity = 0.45 + 0.4 * Math.sin(sunAng * Math.PI);
      fireflies.material.opacity = m > 1080 ? Math.min(0.9, (m - 1080) / 60) : 0;
      // Sao đêm hiện dần + đèn hiên nhà sáng lên lúc chập tối
      if (window.__stars) window.__stars.material.opacity = m > 1065 ? Math.min(0.95, (m - 1065) / 70) : 0;
      if (window.__porchLight) window.__porchLight.intensity = m > 1030 ? Math.min(1.15, (m - 1030) / 55 * 1.15) : 0;
      if (window.__porchBulb) window.__porchBulb.material.color.setHex(m > 1030 ? 0xffd97a : 0xcfc8ae);
      if (window.__lantern) window.__lantern.material.color.setHex(m > 1030 ? 0xffc46b : 0xd4573a);
      if (window.__moonG) {
        var mo = m > 1065 ? Math.min(0.95, (m - 1065) / 70) : 0;
        window.__moonG.children[0].material.opacity = mo;
        window.__moonG.children[1].material.opacity = mo * 0.45;
      }
      if (window.__stars) window.__stars.position.copy(camera.position);
      // Đèn cửa sổ nhà sáng lên lúc chập tối
      var glow = m > 1050 ? 1 : 0.15;
      scene.traverse(function (o) { if (o.name === "window-glass") o.material.color.setRGB(1 * glow + 0.3, 0.91 * glow + 0.25, 0.66 * glow); });
    }

