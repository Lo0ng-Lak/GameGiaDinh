// @ts-nocheck
/*
 * GameGiaDinh — assets/src/core/day.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/core/day.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { refreshEggs } from '../activities/interactions';
import { saveGame } from './save';
import { G, fmt } from './state';
import { rollQuests } from '../events/quests';
import { rollPrices } from '../economy/shop';
import { drawCrop, plots } from '../farming/garden';
import { overnightTrees } from '../farming/trees';
import { refreshDuckEggs, refreshPigs } from '../farming/livestock';
import { UPGRADES } from '../core/data';
import { child, childHome } from '../npc/child';
import { husband, husbandPath } from '../npc/husband';
import { thief, thiefParts, thiefPath } from '../npc/thief';
import { visitPath, visitor } from '../npc/visitor';
import { exitLock, player } from '../player/player';
import { el, toast, updateHUD } from '../ui/hud';
import { stopBikeSound } from '../world/sound';

    /* ================== KẾT THÚC NGÀY ================== */
    export var dayOverlay = el("day-overlay");
    export function endDay() {
      if (G.dayOver) return;
      G.dayOver = true;
      exitLock();
      saveGame();
      el("sum-title").textContent = "Hết ngày " + G.day;
      el("sum-line").textContent = G.childState === "school"
        ? "Bé An đã về nhà, cả nhà ăn cơm tối rồi nghỉ sớm."
        : "Một ngày nữa trôi qua ở quê mình.";
      var schoolTxt = G.schoolOnTime === true ? "Đúng giờ, bé được khen"
        : G.schoolOnTime === false ? "Hơi trễ một chút" : "Bà Tư hàng xóm đưa hộ";
      // Chi tiêu sinh hoạt mỗi ngày: gạo mắm, điện nước, đồ dùng — tiền có chỗ ra rõ ràng
      G.livingCost = Math.min(G.money, 12000 + Math.floor(Math.random() * 5) * 1000);
      G.money -= G.livingCost;
      var questsDoneTxt = G.quests.filter(function (q) { return q.done; }).length + "/3 việc";
      // PHASE 2: đồ đã mua cho nhà — liệt kê tên món đã có
      var ownedNames = Object.keys(UPGRADES).filter(function (id) { return G.owned[id]; }).map(function (id) { return UPGRADES[id].name; });
      if (G.owned.houseFixed) ownedNames.push("Nhà đã sửa");
      if (G.ducks.owned) ownedNames.push("Đàn vịt");
      if (G.pigs.count > 0) ownedNames.push("Lợn (" + G.pigs.count + " con)");
      el("sum-rows").innerHTML =
        '<div class="sum-row"><span>Tiền bán nông sản hôm nay</span><b>' + fmt(G.earnedToday) + '</b></div>' +
        '<div class="sum-row"><span>Tiền công anh đi làm thuê</span><b>' + (G.noWorkToday ? "Hôm nay không có việc" : G.husband.wage > 0 ? fmt(G.husband.wage) : "Anh về trễ, chưa kịp") + '</b></div>' +
        '<div class="sum-row"><span>Chi tiêu sinh hoạt (gạo mắm, điện nước)</span><b>-' + fmt(G.livingCost) + '</b></div>' +
        '<div class="sum-row"><span>Tiền mua đồ, hạt giống & chăn nuôi</span><b>-' + fmt(G.spentToday) + '</b></div>' +
        '<div class="sum-row"><span>Nhiệm vụ hôm nay</span><b>' + questsDoneTxt + '</b></div>' +
        '<div class="sum-row"><span>Quỹ sửa nhà đã để dành</span><b>' + fmt(G.savings) + ' / 300.000đ</b></div>' +
        '<div class="sum-row"><span>Đồ đã mua cho nhà</span><b>' + (ownedNames.length ? ownedNames.join(", ") : "Chưa mua gì — ra sạp cô Tư") + '</b></div>' +
        '<div class="sum-row"><span>Số rau đã thu hoạch</span><b>' + G.harvestedToday + ' món</b></div>' +
        '<div class="sum-row"><span>Trứng nhặt được · Cá câu được</span><b>' + G.eggsToday + ' trứng · ' + G.fishToday + ' cá</b></div>' +
        '<div class="sum-row"><span>Trứng vịt nhặt được · Trái cây hái được · Lợn bán được</span><b>' + G.duckEggsToday + ' trứng vịt · ' + G.fruitToday + ' trái · ' + G.pigsSoldToday + ' con</b></div>' +
        '<div class="sum-row"><span>Số luống đã trồng</span><b>' + G.plantedToday + ' luống</b></div>' +
        '<div class="sum-row"><span>Bữa cơm nhà</span><b>' + (G.cookedToday ? "Đã nấu, cả nhà vui vẻ" : "Chưa nấu hôm nay") + '</b></div>' +
        '<div class="sum-row"><span>Đưa con đi học</span><b>' + schoolTxt + '</b></div>' +
        '<div class="sum-row"><span>Trộm lẻn vào sân</span><b>' + (G.thief.result || "Không có, nhà yên ổn") + '</b></div>' +
        '<div class="sum-row"><span>Khách qua nhà</span><b>' + (G.visit.talked ? "Bà Tư ghé chơi, biếu hạt giống" : "Không có ai ghé") + '</b></div>' +
        '<div class="sum-row"><span>Thời tiết</span><b>' + (G.rainedToday ? "Có mưa rào, rau được trời tưới" : "Nắng cả ngày") + '</b></div>' +
        '<div class="sum-row"><span>Tiền hiện có</span><b>' + fmt(G.money) + '</b></div>';
      dayOverlay.classList.add("show");
    }
    el("btn-next-day").addEventListener("click", function () {
      dayOverlay.classList.remove("show");
      G.day++; G.minutes = 5 * 60 + 30; G.dayOver = false;
      G.earnedToday = 0; G.harvestedToday = 0; G.plantedToday = 0;
      G.eggsToday = 0; G.fishToday = 0; G.wateredToday = 0; G.bananaToday = 0; G.livingCost = 0;
      // PHASE 2: reset số liệu ngày, quay giá bán mới, cây ăn quả ra trái mới, vịt/lợn chờ ngày mới
      G.boughtToday = 0; G.duckEggsToday = 0; G.fruitToday = 0; G.pigsSoldToday = 0; G.spentToday = 0;
      rollPrices();
      G.ducks.fed = false; G.ducks.ready = 0; G.ducks.timer = 0; refreshDuckEggs();
      G.pigs.fedToday = false; refreshPigs();
      rollQuests();   // ngày mới, việc mới
      G.husbandAt = 990 + Math.random() * 105;
      G.noWorkToday = Math.random() < 0.12;
      G.husbandMode = "rest"; G.husbandPlot = null;
      G.childPlay.spot = -1; G.childPlay.pauseT = 4; G.childPlay.lineT = 30;
      G.childPlay.mood = "vui"; G.childPlay.playedToday = false;
      G.cookedToday = false; G.smokeBoost = 0;
      G.chicken.fed = false; G.chicken.ready = 0; G.chicken.timer = 0; refreshEggs();
      G.fish.state = "idle"; if (window.__bobber) window.__bobber.visible = false;
      G.husband.state = "notyet"; G.husband.wage = 0; G.husband.wp = 0; G.husband.talked = false;
      husband.visible = false; husband.position.copy(husbandPath[0]);
      // Ngày mới: sự kiện bất ngờ lên lịch lại ngẫu nhiên
      G.thief.state = "none"; G.thief.wp = 0; G.thief.t = 0; G.thief.loot = 0; G.thief.lootKind = ""; G.thief.lootTxt = ""; G.thief.lootItems = null; G.thief.result = "";
      G.thiefDay = Math.random() < 0.65;              // có hôm trộm tới, có hôm không
      G.thiefAt = 480 + Math.random() * 570;          // giờ nào cũng có thể, 8:00–17:30
      thief.visible = false; thief.position.copy(thiefPath[0]); thief.position.y = 0;
      if (thiefParts.sack) thiefParts.sack.scale.set(1, 1.15, 0.8);
      G.raining = false; G.rainT = 0; G.rainedToday = false; G.rainAt = 780 + Math.random() * 150;
      if (window.__rain) window.__rain.visible = false;
      G.visit.state = "none"; G.visit.wp = 0; G.visit.t = 0; G.visit.talked = false; G.visitAt = 900 + Math.random() * 60;
      visitor.visible = false; visitor.position.copy(visitPath[0]);
      if (window.__dog) window.__dog.position.copy(window.__dogHome);
      (window.__bananas || []).forEach(function (b) {
        if (!b.ripe && b.timer > 30) b.timer = 30;   // qua đêm chuối chín nhanh hơn
      });
      G.roosterDone = false; G.bellDone = false; G.wet = 0; G.rainbowT = 0; G.dipT = 0;
      G.bike.state = "idle"; G.bike.t = 20 + Math.random() * 40;
      if (window.__bike) window.__bike.visible = false;
      stopBikeSound();
      player.vx = 0; player.vz = 0;
      G.schoolOnTime = null; G.childState = "home";
      child.position.copy(childHome); child.rotation.y = 2.4; child.visible = true;
      // Qua đêm: luống đã tưới thì lớn thêm một đoạn, đất khô lại
      plots.forEach(function (p) {
        if (p.state === "growing") {
          if (p.watered) p.progress = Math.min(0.92, p.progress + 0.25);
          p.watered = false; drawCrop(p);
        }
      });
      // PHASE 2: cây ăn quả lớn theo ngày — cây chỉ lớn/ra trái khi được tưới
      // hôm trước (xem overnightTrees trong farming/trees.ts). Sửa lỗi cũ: code
      // cũ so sánh t.type (chỉ là "xoai"/"oi") với "growing"/"mature" nên nhánh
      // này không bao giờ chạy — cây trưởng thành không bao giờ ra trái mới
      // nữa sau đợt đầu, cây đang lớn cũng không lớn thêm.
      var treeEvents = overnightTrees();
      treeEvents.forEach(function (ev) {
        if (ev.kind === "matured") toast("Cây " + (ev.type === "xoai" ? "xoài" : "ổi") + " đã lớn thành cây trưởng thành! Từ giờ chăm tưới là có trái ăn.");
        else if (ev.kind === "fruited") toast("Cây " + (ev.type === "xoai" ? "xoài" : "ổi") + " ra " + ev.n + " trái chín — hái mang bán nhé!");
      });
      toast("Ngày mới bắt đầu. Bé An đang chờ ở hiên nhà.");
      updateHUD();
      saveGame();
    });

