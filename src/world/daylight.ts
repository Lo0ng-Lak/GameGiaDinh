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
    // PHASE 4.4: chuyển mượt 0..1 (smoothstep) — bình minh/hoàng hôn không
    // còn gãy khúc ở ranh giới khung giờ như nội suy tuyến tính cũ.
    export function smooth01(t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return t * t * (3 - 2 * t);
    }
    // PHASE 4.4: trạng thái ánh sáng ban ngày, hàm thuần theo phút trong
    // ngày (330 = 05:30, 1140 = 19:00) — test được trong Node, updateSky()
    // chỉ việc áp dụng. Giữ đúng các mốc cũ: bình minh 05:30–06:00, ngày
    // 06:00–17:00 cường độ 1.05, hoàng hôn 17:00–19:00 mờ dần 1.0 -> 0.55
    // rồi 0.5 sau 19:00; chỉ làm mượt đường hoàng hôn bằng smoothstep.
    //  - duskT: 0 ban ngày -> 1 lúc tối hẳn (để đổi màu nắng sang cam ấm,
    //    kéo dài bóng, bật đèn lồng).
    //  - lanternLevel: 0 trước 17:00 -> 1 lúc 17:30 (đèn chập tối).
    //  - shadowLen: hệ số dài bóng — trưa ~1, hoàng hôn ~2.9 (nắng xiên).
    export function daylightState(m) {
      var sunAng, intensity, duskT, dawnT, skyT;
      if (m < 360) {
        var t1 = (m - 330) / 30;
        sunAng = 0.06 + t1 * 0.1; intensity = 0.75;
        duskT = 0; dawnT = 1 - smooth01(t1); skyT = Math.max(0, t1);
      } else if (m < 1020) {
        var t2 = (m - 360) / 660;
        sunAng = 0.16 + t2 * 0.68; intensity = 1.05;
        duskT = 0; dawnT = 0; skyT = 1;
      } else if (m < 1140) {
        var t3 = (m - 1020) / 120, s3 = smooth01(t3);
        sunAng = 0.84 + t3 * 0.14; intensity = 1.0 - s3 * 0.45;
        duskT = s3; dawnT = 0; skyT = t3;
      } else {
        sunAng = 1; intensity = 0.5;
        duskT = 1; dawnT = 0; skyT = 1;
      }
      var sunSin = Math.max(0, Math.sin(sunAng * Math.PI));
      // Nắng trưa hơi vàng (hue 0.12), hoàng hôn ngả cam đậm (hue 0.055),
      // đậm màu và tối dần theo duskT — bình minh cũng ấm như vậy (dawnT).
      var warm = Math.max(duskT, dawnT * 0.8);
      var sunHue = 0.12 - 0.065 * warm;
      var sunSat = 0.65 + 0.25 * warm;
      var sunLight = 0.72 - 0.12 * warm;
      var shadowLen = 1 / Math.max(0.35, sunSin);
      return {
        minutes: m, sunAng: sunAng, intensity: intensity, sunSin: sunSin,
        sunHue: sunHue, sunSat: sunSat, sunLight: sunLight,
        duskT: duskT, dawnT: dawnT, skyT: skyT,
        shadowLen: shadowLen,
        lanternLevel: lanternLevel(m),
        fireflyLevel: m > 1080 ? Math.min(0.9, (m - 1080) / 60) : 0,
        starLevel: m > 1065 ? Math.min(0.95, (m - 1065) / 70) : 0
      };
    }
    // Đèn chập tối: tắt hẳn trước 17:00 (1020), sáng dần 17:00–17:30,
    // sáng hẳn tới hết ngày. Ban ngày = 0 (không bật đèn giữa trưa).
    export function lanternLevel(m) {
      if (m < 1020) return 0;
      return smooth01((m - 1020) / 30);
    }
    // Bóng đổ dài lúc hoàng hôn: trưa ~1, 18:30 ~2.9. Dùng cho khung
    // bóng của mặt trời (xem updateSky) — bóng dài vẫn nằm trong khung.
    export function shadowLengthFactor(m) { return daylightState(m).shadowLen; }
    // PHASE 4.4: hệ số làm tối khi mưa/giông/mây — tách riêng thành hàm
    // thuần để ánh sáng hoàng hôn và giông CỘNG với nhau thay vì đánh
    // nhau: cường độ cuối = daylightState.intensity × dim.sun (xem
    // main.ts, khối mưa trong hudT). Giữ đúng hệ số cũ của Phase 4.1:
    // giông ×0.32, mưa ×0.5, mây ×0.85; hemi tương ứng ×0.6/×0.75/×0.92.
    export function stormDimFactor(weather, raining) {
      if (raining) {
        if (weather === "storm") return { sun: 0.32, hemi: 0.6 };
        return { sun: 0.5, hemi: 0.75 };
      }
      if (weather === "cloudy") return { sun: 0.85, hemi: 0.92 };
      return { sun: 1, hemi: 1 };
    }
    // Cường độ nắng cuối cùng sau khi cộng giông/mây — test kiểm chứng
    // hoàng hôn + giông tối hơn hoàng hôn nắng, nhưng không tối hẳn về 0.
    export function finalSunIntensity(minutes, weather, raining) {
      return daylightState(minutes).intensity * stormDimFactor(weather, raining).sun;
    }
    export function updateSky() {
      var m = G.minutes;
      var st = daylightState(m);
      var sunAng = st.sunAng, intensity = st.intensity, skyC;
      if (m < 360) { skyC = lerpColor(skyDawn, skyDay, Math.max(0, (m - 330) / 30)); }
      else if (m < 1020) { skyC = lerpColor(skyDay, skyDay, 0); }
      else if (m < 1140) { skyC = lerpColor(skyDay, skyDusk, (m - 1020) / 120); }
      else { skyC = lerpColor(skyDusk, skyNight, Math.min(1, (m - 1140) / 60)); }
      scene.background.copy(skyC);
      scene.fog.color.copy(skyC).lerp(new THREE.Color(0xffffff), 0.25);
      skyUni.mid.value.copy(skyC);
      skyUni.top.value.copy(skyC).lerp(new THREE.Color(0x2e6cb0), 0.55);
      skyUni.bot.value.copy(skyC).lerp(new THREE.Color(0xffd9a0), 0.5);
      cloudMat.color.copy(skyC).lerp(new THREE.Color(0xffffff), 0.6);
      var sunVis = Math.max(0.12, st.sunSin);
      sunDisc.material.opacity = sunVis * 0.95;
      sunGlow.material.opacity = sunVis * 0.85;
      var sx = Math.cos(sunAng * Math.PI) * 55, sy = Math.sin(sunAng * Math.PI) * 48 + 4;
      sun.position.set(player.x + sx, sy, player.z - 28);
      sun.target.position.set(player.x, 0, player.z);
      sun.intensity = intensity;
      // PHASE 4.4: khung bóng mở rộng theo bóng dài lúc hoàng hôn (giới
      // hạn ×1.8 để không làm mờ bóng quá) — bóng dài vẫn nằm trong khung,
      // không bị cắt cụt ở rìa. Chỉ cập nhật khi hệ số đổi đủ lớn.
      var shScale = Math.min(1.8, st.shadowLen);
      if (Math.abs(shScale - (sun.userData.shScale || 1)) > 0.05) {
        sun.userData.shScale = shScale;
        sun.shadow.camera.left = -34 * shScale; sun.shadow.camera.right = 34 * shScale;
        sun.shadow.camera.top = 34 * shScale; sun.shadow.camera.bottom = -34 * shScale;
        sun.shadow.camera.updateProjectionMatrix();
      }
      renderer.toneMappingExposure = 1.0 + 0.09 * st.sunSin;
      // PHASE 4.4: nắng hoàng hôn/bình minh ấm hơn — cam đậm, đậm màu,
      // tối dần theo độ ấm (xem daylightState), thay cho hue cố định cũ.
      sun.color.setHSL(st.sunHue, st.sunSat, st.sunLight);
      hemi.intensity = 0.45 + 0.4 * st.sunSin;
      fireflies.material.opacity = st.fireflyLevel;
      // Sao đêm hiện dần + đèn hiên nhà sáng lên lúc chập tối
      if (window.__stars) window.__stars.material.opacity = st.starLevel;
      // PHASE 4.4: đèn hiên dùng chung lanternLevel (sáng dần 17:00–
      // 17:30) thay cho mốc bật/tắt cứng 17:10 cũ — cùng nhịp với đèn
      // sạp chợ + đèn chùa ở lanterns.ts.
      var lk = st.lanternLevel;
      if (window.__porchLight) window.__porchLight.intensity = lk * 1.15;
      if (window.__porchBulb) window.__porchBulb.material.color.setHex(lk > 0 ? 0xffd97a : 0xcfc8ae);
      if (window.__lantern) window.__lantern.material.color.setHex(lk > 0 ? 0xffc46b : 0xd4573a);
      if (window.__tvScreen) window.__tvScreen.material.color.setHex(m > 1030 ? 0x8fd8ff : 0x2c4a5e); // PHASE 2: tivi sáng lúc chập tối
      if (window.__moonG) {
        var mo = st.starLevel;
        window.__moonG.children[0].material.opacity = mo;
        window.__moonG.children[1].material.opacity = mo * 0.45;
      }
      if (window.__stars) window.__stars.position.copy(camera.position);
      // Đèn cửa sổ nhà sáng lên lúc chập tối
      var glow = m > 1050 ? 1 : 0.15;
      scene.traverse(function (o) { if (o.name === "window-glass") o.material.color.setRGB(1 * glow + 0.3, 0.91 * glow + 0.25, 0.66 * glow); });
    }

