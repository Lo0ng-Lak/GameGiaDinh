// @ts-nocheck
/*
 * GameGiaDinh — src/economy/upgrades.ts
 * GIAI ĐOẠN 2: mua đồ cho nhà — logic mua hàng (trừ tiền, hiện đồ 3D, lưu game).
 * Gọi từ sạp cô Tư (shop.ts) và từ tương tác trực tiếp (interactions.ts).
 */
import { G } from '../core/state';
import { fmt } from '../core/state';
import { UPGRADES, LIVESTOCK, FRUIT_TREES, HOUSE_REPAIR_SAVINGS } from '../core/data';
import { saveGame } from '../core/save';
import { updateHUD, toast } from '../ui/hud';
import { applyUpgrades } from '../world/upgrades';
import { refreshDuckEggs, refreshPigs } from '../farming/livestock';
import { ensureExtraPlots } from '../farming/garden';
import { addMemory, checkQuestsAchievements } from '../events/quests';

// Mua 1 món nâng cấp nhà — trả về true nếu mua được
export function buyUpgrade(id) {
  var def = UPGRADES[id];
  if (!def || G.owned[id]) return false;
  if (G.money < def.price) return false;
  G.money -= def.price;
  G.spentToday += def.price;
  G.boughtToday++;
  G.owned[id] = true;
  if (def.stars) { G.stars += def.stars; }
  if (id === "land") ensureExtraPlots();
  if (id === "coopBig") { /* ổ đẻ mới hiện qua applyUpgrades; trứng đẻ nhiều hơn qua chickenLayCount */ }
  if (id === "pigpen") refreshPigs();
  applyUpgrades();
  if (def.stars) toast("Mua " + def.name + " — +" + def.stars + " sao, nhà mình khang trang hơn rồi!");
  else toast("Mua " + def.name + " — " + def.desc);
  if (id === "tv" || id === "fridge" || id === "bike") addMemory("Ngày " + G.day + " — Nhà mình đã có " + def.name.toLowerCase() + ".");
  checkQuestsAchievements();
  updateHUD(); saveGame();
  return true;
}

// Sửa nhà bằng Quỹ sửa nhà (300.000đ đã gửi đủ)
export function repairHouse() {
  if (G.owned.houseFixed || G.savings < HOUSE_REPAIR_SAVINGS) return false;
  G.savings -= HOUSE_REPAIR_SAVINGS;
  // savingsGoalDone giữ nguyên true — quỹ đã hoàn thành nhiệm vụ, khỏi cày sao lại
  G.owned.houseFixed = true;
  G.stars += 2;
  applyUpgrades();
  toast("Sửa nhà xong! Tường sơn mới, đèn lồng đỏ treo hai bên cửa — +2 sao.");
  addMemory("Ngày " + G.day + " — Sửa nhà xong, nhà mình mới hẳn ra.");
  checkQuestsAchievements();
  updateHUD(); saveGame();
  return true;
}

// Mua cây giống — trả về true nếu mua được
export function buySapling(kind) {
  var def = FRUIT_TREES[kind];
  if (!def) return false;
  if (G.money < def.sapling) return false;
  G.money -= def.sapling;
  G.spentToday += def.sapling;
  G.boughtToday++;
  G.saplings[kind]++;
  toast("Mua cây " + def.name.toLowerCase() + " giống — ra chỗ đất trống ở sân mà trồng.");
  checkQuestsAchievements();
  updateHUD(); saveGame();
  return true;
}

// Mua đàn vịt (3 con) — trả về true nếu mua được
export function buyDuckFlock() {
  var def = LIVESTOCK.duckFlock;
  if (G.ducks.owned || G.money < def.price) return false;
  G.money -= def.price;
  G.spentToday += def.price;
  G.boughtToday++;
  G.ducks.owned = true;
  refreshDuckEggs();
  toast("Mua đàn vịt (3 con) — vịt đã về bờ ao, cho ăn cám là đẻ trứng.");
  addMemory("Ngày " + G.day + " — Nhà mình có đàn vịt ở bờ ao.");
  checkQuestsAchievements();
  updateHUD(); saveGame();
  return true;
}

// Mua lợn con — trả về true nếu mua được (tối đa 2 con)
export function buyPiglet() {
  var def = LIVESTOCK.piglet;
  if (!G.owned.pigpen) return false;
  if (G.pigs.count >= def.max || G.money < def.price) return false;
  G.money -= def.price;
  G.spentToday += def.price;
  G.boughtToday++;
  G.pigs.count++;
  G.pigs.days.push(0); // con mới: chưa ăn hôm nào
  refreshPigs();
  toast("Mua lợn con — cho ăn mỗi ngày, ăn đủ " + def.growDays + " hôm là lớn, bán được " + fmt(def.sell) + ".");
  checkQuestsAchievements();
  updateHUD(); saveGame();
  return true;
}

// Bán lợn đã lớn từ sạp — trả về số tiền hoặc 0
export function sellPigFromShop() {
  if (G.pigs.grown <= 0) return 0;
  var price = LIVESTOCK.piglet.sell;
  G.pigs.grown--; G.pigs.count--;
  G.pigs.days.splice(0, 1); // bán con lớn nhất đầu tiên, con đang lớn giữ tiến độ
  G.money += price; G.totalEarned += price; G.earnedToday += price; G.pigsSoldToday++;
  refreshPigs();
  toast("Bán 1 con lợn đã lớn — +" + fmt(price) + ".");
  checkQuestsAchievements();
  updateHUD(); saveGame();
  return price;
}

// Kiểm tra xem người chơi có đủ tiền mua không — dùng để vô hiệu hóa nút
export function canAfford(price) { return G.money >= price; }
