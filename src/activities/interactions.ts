// @ts-nocheck
/*
 * GameGiaDinh — assets/src/activities/interactions.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/activities/interactions.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { CROPS, CROP_KEYS, GOOD_KEYS, priceOf } from '../core/data';
import { endDay } from '../core/day';
import { saveGame } from '../core/save';
import { G, fmt, goodName, produceTotal } from '../core/state';
import { openShop } from '../economy/shop';
import { addMemory } from '../events/quests';
import { drawCrop, plots } from '../farming/garden';
import { child } from '../npc/child';
import { husband } from '../npc/husband';
import { thief, thiefParts } from '../npc/thief';
import { visitor } from '../npc/visitor';
import { player } from '../player/player';
import { toast, updateHUD } from '../ui/hud';
import { stallPos } from '../world/buildings';
import { spawnParticles } from '../world/particles';
import { coopPos, wellPos } from '../world/scene';
import { sndBark, sndBell, sndCluck, sndCoin, sndCook, sndDig, sndHarvest, sndPlant, sndPour, sndSplash, sndWater } from '../world/sound';

    /* ================== TƯƠNG TÁC ================== */
    export var currentTarget = null; // {kind, plot?, label}

    export function setCurrentTarget(v) { currentTarget = v; }
    export var doorPos = window.__doorPos || new THREE.Vector3(-9.2, 0, -2.6);
    export function findTarget() {
      var px = player.x, pz = player.z, best = null, bestD = 1e9;
      function consider(kind, x, z, range, extra) {
        var d = Math.hypot(px - x, pz - z);
        if (d < range && d < bestD) { bestD = d; best = { kind: kind, d: d }; if (extra) for (var k in extra) best[k] = extra[k]; }
      }
      plots.forEach(function (p) { consider("plot", p.x, p.z, 2.3, { plot: p }); });
      consider("well", wellPos.x, wellPos.z, 2.6);
      consider("stall", stallPos.x, stallPos.z, 3.1);
      consider("door", doorPos.x, doorPos.z, 2.6);
      consider("coop", coopPos.x, coopPos.z, 2.6);
      consider("fish", window.__fishPos.x, window.__fishPos.z, 2.5);
      consider("stove", window.__stovePos.x, window.__stovePos.z, 2.5);
      (window.__bananas || []).forEach(function (b) { consider("banana", b.x, b.z, 2.3, { banana: b }); });
      if (G.husband.state === "home") consider("husband", husband.position.x, husband.position.z, 2.4);
      if (G.thief.state === "in" || G.thief.state === "steal" || G.thief.state === "out")
        consider("thief", thief.position.x, thief.position.z, 2.5);
      if (G.visit.state === "here") consider("visitor", visitor.position.x, visitor.position.z, 2.4);
      if (G.childState === "home") consider("child", child.position.x, child.position.z, 2.4);
      if (G.childState === "play") consider("childplay", child.position.x, child.position.z, 2.4);
      if (!best) return null;
      // Nhãn theo ngữ cảnh
      if (best.kind === "plot") {
        var p = best.plot;
        if (p.state === "empty") best.label = G.seeds[G.selSeed] > 0 ? "Trồng " + CROPS[G.selSeed].name : "Hết hạt " + CROPS[G.selSeed].name + " — ra sạp mua";
        else if (p.state === "mature") best.label = "Thu hoạch " + CROPS[p.type].name;
        else if (!p.watered) best.label = G.can > 0 ? "Tưới nước" : "Bình hết nước — ra giếng múc";
        else best.label = CROPS[p.type].name + " đang lớn (" + Math.round(p.progress * 100) + "%)";
      } else if (best.kind === "well") best.label = G.can < G.canMax ? "Múc nước đầy bình" : "Bình đã đầy nước";
      else if (best.kind === "stall") best.label = "Tới sạp cô Tư — bán rau, mua hạt";
      else if (best.kind === "door") best.label = "Vào nhà nghỉ — kết thúc ngày";
      else if (best.kind === "child") best.label = "Nắm tay bé An, đưa đi học";
      else if (best.kind === "childplay") best.label = G.childPlay.mood === "vui" ? "Chơi với bé An một lát" : "Dỗ bé An — bé đang buồn";
      else if (best.kind === "coop") {
        if (G.chicken.ready > 0) best.label = "Nhặt " + G.chicken.ready + " trứng gà trong ổ";
        else if (G.chicken.fed) best.label = "Gà đang ăn cám… sắp đẻ trứng";
        else best.label = "Cho gà ăn cám (3.000đ)";
      }
      else if (best.kind === "fish") {
        if (G.fish.state === "bite") best.label = "Cá cắn câu! Giật cần ngay!";
        else if (G.fish.state === "wait") best.label = "Đang thả câu… suỵt, chờ cá cắn";
        else best.label = "Thả câu câu cá ở ao";
      }
      else if (best.kind === "stove") {
        if (G.cookedToday) best.label = "Cơm đã nấu rồi — thơm cả nhà";
        else if (G.produce.ca > 0) best.label = "Nấu cơm với cá rô trong giỏ";
        else if (G.produce.trung >= 2) best.label = "Nấu cơm với trứng gà trong giỏ";
        else best.label = "Nấu cơm nhà (8.000đ đồ ăn)";
      }
      else if (best.kind === "banana") best.label = best.banana.ripe ? "Hái nải chuối chín vàng" : "Buồng chuối còn xanh…";
      else if (best.kind === "husband") best.label = "Nói chuyện với anh";
      else if (best.kind === "thief") best.label = "Đuổi trộm ra khỏi sân!";
      else if (best.kind === "visitor") best.label = G.tuQuest ? "Nói chuyện với bà Tư (bà đang nhờ mua hộ đồ)" : G.visit.talked ? "Chào bà Tư hàng xóm" : "Nói chuyện với bà Tư hàng xóm";
      return best;
    }

    export function refreshEggs() {
      if (!window.__eggMeshes) return;
      window.__eggMeshes.forEach(function (e, i) { e.visible = i < G.chicken.ready; });
    }
    /* ---- Trộm hốt đồ: ưu tiên trứng trong ổ, rồi nông sản trong giỏ, rồi rau chín ngoài luống ---- */
    export function thiefSteal() {
      var th = G.thief;
      if (G.chicken.ready > 0) {
        th.lootKind = "trung"; th.loot = Math.min(G.chicken.ready, 4);
        G.chicken.ready -= th.loot; if (G.chicken.ready === 0) G.chicken.fed = false;
        refreshEggs(); th.lootTxt = th.loot + " trứng gà trong ổ";
      } else if (produceTotal() > 0) {
        var left = 3; th.lootKind = "produce"; th.lootItems = {}; th.loot = 0;
        for (var k in G.produce) {
          while (G.produce[k] > 0 && left > 0) {
            G.produce[k]--; th.lootItems[k] = (th.lootItems[k] || 0) + 1; th.loot++; left--;
          }
        }
        th.lootTxt = th.loot + " món nông sản trong giỏ";
      } else {
        var mp = null;
        plots.forEach(function (p) { if (p.state === "mature" && !mp) mp = p; });
        if (mp) {
          th.lootKind = "plot"; th.lootType = mp.type; th.loot = CROPS[mp.type].yield;
          th.lootTxt = "1 luống " + CROPS[mp.type].name + " chín ngoài vườn";
          mp.state = "empty"; mp.type = null; mp.progress = 0; mp.watered = false; mp.waterings = 0;
          drawCrop(mp);
        } else { th.lootKind = ""; th.loot = 0; th.lootTxt = "chưa kịp lấy gì"; }
      }
      if (th.loot > 0 && thiefParts.sack) thiefParts.sack.scale.set(1.45, 1.65, 1.15);
      updateHUD();
    }
    export function thiefReturnLoot() {
      var th = G.thief;
      if (th.lootKind === "trung") { G.chicken.ready += th.loot; refreshEggs(); }
      else if (th.lootKind === "produce" && th.lootItems) { for (var k in th.lootItems) G.produce[k] += th.lootItems[k]; }
      else if (th.lootKind === "plot") { G.produce[th.lootType] += th.loot; }
      th.loot = 0; th.lootKind = ""; th.lootItems = null;
      if (thiefParts.sack) thiefParts.sack.scale.set(1, 1.15, 0.8);
    }

    export function cookMeal(dish) {
      G.cookedToday = true; G.stars++; G.smokeBoost = 22;
      sndCook();
      toast("Đã nấu xong bữa cơm " + dish + ". Cả nhà vui vẻ +1 sao", true);
    }

    export function doInteract() {
      if (!G.started || G.dayOver) return;
      var t = currentTarget; if (!t) return;
      if (t.kind === "plot") {
        var p = t.plot;
        if (p.state === "empty") {
          if (G.seeds[G.selSeed] <= 0) { toast("Hết hạt " + CROPS[G.selSeed].name + " rồi — ra sạp cô Tư mua thêm."); return; }
          G.seeds[G.selSeed]--;
          p.state = "growing"; p.type = G.selSeed; p.progress = 0; p.watered = false; p.waterings = 0; p.dryT = 0;
          G.plantedToday++;
          drawCrop(p); sndPlant(); sndDig(); G.dipT = 0.32;
          spawnParticles(p.x, 0.55, p.z, 12, 0x8a6642, 1.3, 1.3, 0.55, 5);
          toast("Đã gieo " + CROPS[p.type].name + ". Tưới nước cho cây lớn nhé.");
        } else if (p.state === "growing" && !p.watered) {
          if (G.can <= 0) { toast("Bình hết nước — ra giếng múc đầy bình trước."); return; }
          G.can--; p.watered = true; p.waterings++; p.dryT = 0; G.wateredToday++;
          drawCrop(p); sndWater(); sndPour();
          spawnParticles(p.x, 1.15, p.z, 20, 0x6ec3e8, 1.5, 0.4, 0.6, 6);
          toast("Đã tưới. " + (CROPS[p.type].waters > p.waterings ? "Cây này cần tưới " + CROPS[p.type].waters + " lần mới chín." : "Đất ẩm rồi, cây đang lớn."));
        } else if (p.state === "mature") {
          var y = CROPS[p.type].yield;
          G.produce[p.type] += y; G.harvestedToday += y; G.totalHarvest += y;
          toast("Thu hoạch " + CROPS[p.type].name + " +" + y + " vào giỏ.", true);
          spawnParticles(p.x, 1.0, p.z, 16, CROPS[p.type].fruit, 1.7, 1.7, 0.7, 4); G.dipT = 0.32;
          p.state = "empty"; p.type = null; p.progress = 0; p.watered = false; p.waterings = 0;
          drawCrop(p); sndHarvest();
        } else {
          toast(CROPS[p.type].name + " đang lớn, chờ thêm chút nữa.");
        }
      } else if (t.kind === "well") {
        if (G.can >= G.canMax) { toast("Bình đang đầy nước rồi."); return; }
        G.can = G.canMax; sndWater(); sndPour();
        spawnParticles(wellPos.x, 1.0, wellPos.z, 14, 0x6ec3e8, 1.1, 1.4, 0.55, 6);
        toast("Đã múc đầy bình nước ở giếng.");
      } else if (t.kind === "stall") {
        openShop();
      } else if (t.kind === "door") {
        endDay();
      } else if (t.kind === "child") {
        G.childState = "follow"; sndBell();
        toast("Bé An: \"Đi học thôi mẹ!\" — dẫn bé tới cổng trường nhé.");
      } else if (t.kind === "childplay") {
        var cp2 = G.childPlay;
        if (cp2.mood === "buon") {
          cp2.mood = "vui";
          toast("Mẹ ôm bé một cái, kể chuyện con gà mái mơ — bé An cười lại rồi. Bé vui là nhà vui.", true);
        } else if (!cp2.playedToday) {
          cp2.playedToday = true; G.stars++;
          toast("Hai mẹ con chơi đuổi bắt quanh sân một vòng. Bé An cười khanh khách. +1 sao vui vẻ", true);
          addMemory("Chơi đuổi bắt với bé An quanh sân.");
        } else {
          var alines = [
            "Bé An: \"Mẹ ơi, hôm nay con được điểm mười môn đọc!\"",
            "Bé An: \"Mai mẹ cho con phụ tưới rau với nhé.\"",
            "Bé An: \"Con thương mẹ nhất nhà!\""
          ];
          toast(alines[Math.floor(Math.random() * alines.length)]);
        }
      } else if (t.kind === "coop") {
        if (G.chicken.ready > 0) {
          var nEgg = G.chicken.ready;
          G.produce.trung += nEgg; G.eggsToday += nEgg;
          G.chicken.ready = 0; G.chicken.fed = false; refreshEggs(); sndHarvest();
          toast("Nhặt được " + nEgg + " trứng gà vào giỏ.", true);
        } else if (G.chicken.fed) {
          toast("Gà đang mổ cám, lát nữa mới đẻ trứng.");
        } else if (G.money >= 3000) {
          G.money -= 3000; G.chicken.fed = true; G.chicken.timer = 26 + Math.random() * 10;
          sndCluck();
          toast("Đã rải cám cho gà (3.000đ). Chờ một lát gà đẻ trứng nhé.");
        } else {
          toast("Không đủ tiền mua cám cho gà — cần 3.000đ.");
        }
      } else if (t.kind === "fish") {
        if (G.fish.state === "idle") {
          G.fish.state = "wait"; G.fish.t = 3.5 + Math.random() * 3.5;
          window.__bobber.visible = true; sndSplash();
          toast("Đã thả câu xuống ao. Chờ cá cắn câu…");
        } else if (G.fish.state === "wait") {
          G.fish.state = "idle"; window.__bobber.visible = false;
          toast("Giật sớm quá — cá chạy mất rồi. Thả câu lại nhé.");
        } else { // bite
          G.fish.state = "idle"; window.__bobber.visible = false;
          G.produce.ca++; G.fishToday++;
          sndSplash(); sndCoin();
          spawnParticles(14.6, 0.18, 3.4, 22, 0xbfe6ff, 1.8, 2.0, 0.6, 6);
          toast("Câu được 1 con cá rô! Cho vào giỏ mang bán hoặc nấu cơm.", true);
        }
      } else if (t.kind === "stove") {
        if (G.cookedToday) { toast("Cơm đã nấu rồi, để dành tối cả nhà ăn."); return; }
        if (G.produce.ca > 0) { G.produce.ca--; cookMeal("cá rô kho tộ"); }
        else if (G.produce.trung >= 2) { G.produce.trung -= 2; cookMeal("trứng chiên hành"); }
        else if (G.money >= 8000) { G.money -= 8000; cookMeal("thịt kho trứng"); }
        else { toast("Chưa có cá hay trứng trong giỏ, tiền cũng không đủ 8.000đ mua đồ ăn."); return; }
      } else if (t.kind === "banana") {
        var bn = t.banana;
        if (bn.ripe) {
          bn.ripe = false; bn.timer = 80;
          bn.mat.color.setHex(0xa8c256); bn.bunch.scale.set(0.55, 0.75, 0.55);
          G.produce.chuoi++; G.bananaToday++; sndHarvest();
          toast("Hái được 1 nải chuối chín vào giỏ.", true);
        } else toast("Buồng chuối này còn xanh, chờ chín vàng đã.");
      } else if (t.kind === "husband") {
        var lines = [
          "Anh: \"Hôm nay chủ trả công đàng hoàng. Nhà mình cứ yên tâm.\"",
          "Anh: \"Cơm em nấu thơm quá, đi làm cả ngày chỉ mong tới bữa này.\"",
          "Anh: \"Bé An khoe được cô khen. Con gái mình giỏi giống mẹ nó.\""
        ];
        toast(lines[Math.min(G.husband.talked, lines.length - 1)]);
        G.husband.talked++;
      } else if (t.kind === "thief") {
        var th2 = G.thief;
        if (th2.loot > 0) {
          thiefReturnLoot();
          toast("Đuổi kịp trộm! Nó vứt lại bao đồ rồi bỏ chạy — của cải giữ nguyên. +1 sao vui vẻ", true);
        } else {
          toast("Đuổi kịp trộm trước khi nó lấy được gì! Nó bỏ chạy rồi. +1 sao vui vẻ", true);
        }
        G.stars++; G.thiefChased++;
        addMemory("Đuổi kịp tên trộm lẻn vào sân, giữ nguyên của cải.");
        th2.result = "Đuổi kịp, giữ nguyên của cải";
        th2.state = "flee";
        sndBark();
        saveGame();
      } else if (t.kind === "visitor") {
        if (G.tuQuest) {
          // Bà Tư đang chờ món bà nhờ mua hộ — có đủ trong giỏ thì giao luôn, bà trả hậu hĩnh
          var tq = G.tuQuest;
          if ((G.produce[tq.key] || 0) >= tq.n) {
            G.produce[tq.key] -= tq.n;
            G.money += tq.reward; G.totalEarned += tq.reward; G.stars++;
            sndCoin();
            toast("Bà Tư: \"Đúng món bà cần! Gửi chị " + fmt(tq.reward) + " — có qua có lại mới toại lòng nhau.\" +1 sao vui vẻ", true);
            addMemory("Giúp bà Tư mua hộ " + tq.n + " " + tq.name + ".");
            G.tuQuest = null; G.visit.talked = true;
            saveGame();
          } else {
            toast("Bà Tư: \"Bà cần " + tq.n + " " + tq.name + " — trong giỏ chị mới có " + (G.produce[tq.key] || 0) + ". Khi nào có đủ thì mang qua cho bà nhé.\"");
          }
        } else if (!G.visit.talked) {
          G.visit.talked = true;
          if (Math.random() < 0.55) {
            // Bà Tư nhờ mua hộ một món — đây là việc riêng, thưởng cao hơn giá sạp
            var allKeys = CROP_KEYS.concat(GOOD_KEYS);
            var qk = allKeys[Math.floor(Math.random() * allKeys.length)];
            var qn = 2 + Math.floor(Math.random() * 2);
            G.tuQuest = { key: qk, name: goodName(qk), n: qn, reward: Math.round(priceOf(qk) * qn * 1.5 / 1000) * 1000 };
            sndCoin();
            toast("Bà Tư: \"Chị ơi, mai nhà bà có giỗ, nhờ chị để dành cho bà " + G.tuQuest.n + " " + G.tuQuest.name + ". Có đủ thì nói chuyện với bà, bà gửi " + fmt(G.tuQuest.reward) + ".\"", true);
          } else {
            var giftKey = CROP_KEYS[Math.floor(Math.random() * CROP_KEYS.length)];
            G.seeds[giftKey] += 2; G.stars++;
            sndCoin();
            toast("Bà Tư: \"Qua thăm mẹ con chị. Biếu 2 hạt " + CROPS[giftKey].name + " nhà trồng, mai gieo thử nhé!\" +1 sao vui vẻ", true);
          }
        } else {
          var vlines = [
            "Bà Tư: \"Vườn rau nhà chị xanh tốt quá, khéo tay thật đấy.\"",
            "Bà Tư: \"Bé An dạo này lớn nhanh, lại lễ phép, ai cũng khen.\"",
            "Bà Tư: \"Chồng chị chịu khó, vợ chị đảm đang — nhà này có phúc.\""
          ];
          toast(vlines[Math.floor(Math.random() * vlines.length)]);
        }
      }
      updateHUD();
    }

