// @ts-nocheck
// Entry cho test Node: tái xuất các API game cần kiểm thử.
// QUAN TRỌNG: import main ĐẦU TIÊN — main/hud/sound tạo thành vòng tròn
// (main -> hud -> sound -> main). Nạp main trước để hud kịp khởi tạo hàm el
// trước khi code top-level của main gọi el(...) (giống thứ tự nạp thật của
// trình duyệt, khi index.html nạp main.ts trước). KHÔNG import main.ts trực
// tiếp (main chạy animate khi nạp) — nhưng sound.ts import clockT từ main,
// nên main vẫn nằm trong bundle; requestAnimationFrame được stub là no-op
// nên animate chỉ chạy đúng 1 khung.
export { clockT } from '../src/main';
export { G, fmt, fmtTime, produceTotal, produceValue, sellPriceOf, SCHOOL_BELL } from '../src/core/state';
export { CROPS, CROP_KEYS, GOODS, GOOD_KEYS, FRUIT_TREES, LIVESTOCK, UPGRADES, HOUSE_REPAIR_SAVINGS } from '../src/core/data';
export { saveGame, readSave, applySave, SAVE_KEY } from '../src/core/save';
export { endDay } from '../src/core/day';
export { buyUpgrade, buySapling, buyDuckFlock, buyPiglet, sellPigFromShop, repairHouse, canAfford } from '../src/economy/upgrades';
export { rollPrices, renderShop, openShop } from '../src/economy/shop';
export { waterTree, harvestTree, overnightTrees, drawTree } from '../src/farming/trees';
export { feedDucks, collectDuckEggs, feedPigs, sellGrownPig, refreshPigs, refreshDuckEggs } from '../src/farming/livestock';
export { plots, drawCrop, ensureExtraPlots } from '../src/farming/garden';
export { checkQuestsAchievements, rollQuests, QUEST_DEFS, ACHIEVEMENTS } from '../src/events/quests';
export { updateHUD } from '../src/ui/hud';
export { VILLAGERS, villagerById, currentSegment, villagerAtStall, updateVillagers, greetVillager, giveToTeacher, villagerMeshes } from '../src/npc/villagers';
export { VENDORS, GROCERY, marketPriceOf, sellToVendor, buyGrocery, vendorBuyableCount, openVendorPanel, openGroceryPanel } from '../src/economy/market';
export { MARKET_STALLS, GROCERY_POS, GROCERY_FRONT, HOUSE_POS, SCHOOL_YARD_SPOT, SCHOOL_PLAY_SPOT, FIELD_SPOT, POND_SPOT, stallFront } from '../src/world/village';
