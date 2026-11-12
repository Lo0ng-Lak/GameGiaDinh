// @ts-nocheck
/*
 * GameGiaDinh — assets/src/world/sound.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/world/sound.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { G } from '../core/state';
import { clockT } from '../main';
import { player } from '../player/player';

    /* ================== ÂM THANH NHẸ (tổng hợp) ================== */
    export var AC = null;

    export function setAC(v) { AC = v; }
    export function beep(freq, dur, type, vol, when) {
      if (!AC || !G.soundOn) return;
      var t = AC.currentTime + (when || 0);
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur);
    }
    export function sndPlant() { beep(300, 0.12, "triangle", 0.15); beep(210, 0.15, "triangle", 0.1, 0.05); }
    export function sndWater() { beep(700, 0.3, "sine", 0.06); beep(520, 0.35, "sine", 0.05, 0.08); beep(880, 0.2, "sine", 0.04, 0.16); }
    export function sndHarvest() { beep(520, 0.09, "square", 0.08); beep(760, 0.12, "square", 0.08, 0.07); }
    export function sndCoin() { beep(990, 0.1, "square", 0.09); beep(1320, 0.18, "square", 0.09, 0.08); }
    export function sndBell() { beep(1568, 0.5, "sine", 0.1); beep(1568, 0.7, "sine", 0.08, 0.55); }
    export function sndStep() { beep(120 + Math.random() * 40, 0.05, "triangle", 0.03); }
    export function sndCluck() { beep(500, 0.07, "square", 0.07); beep(420, 0.09, "square", 0.07, 0.1); beep(560, 0.07, "square", 0.06, 0.22); }
    export function sndSplash() { beep(340, 0.16, "sine", 0.1); beep(620, 0.22, "sine", 0.07, 0.07); beep(950, 0.14, "sine", 0.05, 0.15); }
    export function sndCook() { beep(180, 0.3, "sine", 0.07); beep(240, 0.3, "sine", 0.06, 0.18); beep(150, 0.4, "sine", 0.06, 0.4); }
    export function sndBark() { beep(210, 0.09, "square", 0.1); beep(250, 0.09, "square", 0.1, 0.14); beep(210, 0.09, "square", 0.09, 0.3); beep(270, 0.08, "square", 0.08, 0.44); }
    // Gà trống gáy sáng: ò ó o kéo dài, nghe là biết trời sắp sáng ở quê
    export function sndRooster() {
      if (!AC || !G.soundOn) return;
      beep(880, 0.14, "sawtooth", 0.05); beep(1180, 0.16, "sawtooth", 0.055, 0.16);
      beep(990, 0.14, "sawtooth", 0.05, 0.36); beep(1320, 0.42, "sawtooth", 0.06, 0.54);
      beep(880, 0.2, "sawtooth", 0.04, 1.0);
    }

    /* ---- Âm thanh tự nhiên nền: gió thổi, mưa rơi (tiếng ồn lọc), chim hót, dế kêu ----
       Tất cả tổng hợp bằng WebAudio, không cần file nhạc. Bật khi bấm bắt đầu ngày. */
    export var AMB = { ready: false, chirpT: 3, cricketT: 1 };
    export function noiseBuffer() {
      var len = AC.sampleRate * 2, buf = AC.createBuffer(1, len, AC.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }
    export function noiseLoop(freq, type, gain0) {
      var src = AC.createBufferSource(); src.buffer = AMB.buf; src.loop = true;
      var f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq;
      var g = AC.createGain(); g.gain.value = gain0;
      src.connect(f); f.connect(g); g.connect(AMB.master); src.start();
      return { src: src, filter: f, gain: g };
    }
    export function initAmbient() {
      if (!AC || AMB.ready) return;
      AMB.ready = true;
      AMB.buf = noiseBuffer();
      AMB.master = AC.createGain(); AMB.master.gain.value = G.soundOn ? 1 : 0;
      AMB.master.connect(AC.destination);
      AMB.wind = noiseLoop(320, "lowpass", 0.012);          // gió rì rào qua lá
      AMB.rain = noiseLoop(1800, "bandpass", 0);            // mưa rào, chỉ kêu khi mưa
      AMB.rain.filter.Q.value = 0.6;
    }
    // Tiếng ồn ngắn một lần: bước chân trên đất, nước dội, đất xới — nghe "thật" hơn tiếng bíp
    export function noiseHit(dur, freq, vol, type) {
      if (!AC || !G.soundOn || !AMB.ready) return;
      var src = AC.createBufferSource(); src.buffer = AMB.buf;
      src.playbackRate.value = 0.7 + Math.random() * 0.6;
      var f = AC.createBiquadFilter(); f.type = type || "lowpass"; f.frequency.value = freq;
      var g = AC.createGain(), t = AC.currentTime;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f); f.connect(g); g.connect(AC.destination);
      src.start(t, Math.random() * 1.2, dur + 0.05);
    }
    export function sndStepReal() { noiseHit(0.07, 500 + Math.random() * 250, 0.05); }
    export function sndPour() { noiseHit(0.5, 2400, 0.05, "bandpass"); noiseHit(0.35, 900, 0.04, "bandpass"); }
    export function sndDig() { noiseHit(0.16, 380, 0.09); }
    // Chim hót ngẫu nhiên ban ngày: vài tiếng luyến láy lên xuống như chim thật
    export function sndChirp() {
      if (!AC || !G.soundOn) return;
      var f0 = 2100 + Math.random() * 1300, n = 2 + Math.floor(Math.random() * 3);
      for (var i = 0; i < n; i++) {
        beep(f0 + Math.random() * 500, 0.09, "sine", 0.028, i * 0.14);
        beep(f0 * 0.82, 0.07, "sine", 0.022, i * 0.14 + 0.07);
      }
    }
    export function sndCricket() { for (var i = 0; i < 3; i++) beep(4300, 0.05, "sine", 0.012, i * 0.09); }
    export function sndFrog() { beep(160, 0.12, "square", 0.02); beep(140, 0.14, "square", 0.018, 0.2); }
    // Cập nhật lớp âm thanh nền theo giờ giấc + thời tiết, gọi trong vòng lặp chính
    export function updateAmbient(dt) {
      if (!AMB.ready) return;
      AMB.wind.gain.gain.value = 0.008 + G.wind * 0.012;
      var rainTarget = G.raining ? 0.11 : 0;
      AMB.rain.gain.gain.value += (rainTarget - AMB.rain.gain.gain.value) * Math.min(1, dt * 2);
      AMB.chirpT -= dt; AMB.cricketT -= dt;
      if (AMB.chirpT <= 0) {
        AMB.chirpT = 2.5 + Math.random() * 6;
        if (!G.raining && G.minutes > 345 && G.minutes < 1060 && Math.random() < 0.75) sndChirp();
      }
      if (AMB.cricketT <= 0) {
        AMB.cricketT = 0.7 + Math.random() * 1.6;
        if (G.minutes > 1050 || G.minutes < 345) sndCricket();                 // dế kêu lúc chập tối
        else if (G.minutes > 960 && Math.random() < 0.4) sndFrog();           // ếch kêu ngoài ao buổi chiều tối
      }
    }
    // Tiếng máy xe Honda chạy qua đường: nổ máy xa, lớn dần khi tới gần rồi nhỏ dần
    export var BIKE = { osc: null, gain: null };
    export function startBikeSound() {
      if (!AC || BIKE.osc) return;
      BIKE.osc = AC.createOscillator(); BIKE.osc.type = "sawtooth"; BIKE.osc.frequency.value = 75;
      var f = AC.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420;
      BIKE.gain = AC.createGain(); BIKE.gain.gain.value = 0;
      BIKE.osc.connect(f); f.connect(BIKE.gain); BIKE.gain.connect(AC.destination);
      BIKE.osc.start();
    }
    export function updateBikeSound() {
      if (!BIKE.osc) return;
      var d = Math.hypot(player.x - G.bike.x, player.z - G.bike.z);
      BIKE.gain.gain.value = G.soundOn ? Math.max(0, 0.055 * (1 - d / 36)) : 0;
      BIKE.osc.frequency.value = 82 + Math.sin(clockT.elapsedTime * 27) * 5;
    }
    export function stopBikeSound() {
      if (!BIKE.osc) return;
      try { BIKE.osc.stop(); } catch (e) {}
      BIKE.osc.disconnect(); BIKE.osc = null; BIKE.gain = null;
    }

