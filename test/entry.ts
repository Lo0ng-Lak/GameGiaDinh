// @ts-nocheck
// Entry cho test Node: tái xuất các API game cần kiểm thử.
// QUAN TRỌNG: import main ĐẦU TIÊN — main/hud/sound tạo thành vòng tròn
// (main -> hud -> sound -> main). Nạp main trước để hud kịp khởi tạo hàm el
// trước khi code top-level của main gọi el(...) (giống thứ tự nạp thật của
// trình duyệt, khi index.html nạp main.ts trước). KHÔNG import main.ts trực
// tiếp (main chạy animate khi nạp) — nhưng sound.ts import clockT từ main,
// nên main vẫn nằm trong bundle; requestAnimationFrame được stub là no-op
// nên animate chỉ chạy đúng 1 khung.
export { clockT, startRain, PR_STEPS, SHADOW_SIZES, shadowSizeForLevel, applyQualityLevel, qualityState } from '../src/main';
export { seasonOf, seasonName, weatherName, weatherIcon, weatherLabel, rollWeather, weatherSummaryText, SEASON_CYCLE, SEASON_RAINY_DAYS, WEATHERS, WEATHER_ODDS } from '../src/world/weather';
export { G, fmt, fmtTime, produceTotal, produceValue, sellPriceOf, SCHOOL_BELL } from '../src/core/state';
export { CROPS, CROP_KEYS, GOODS, GOOD_KEYS, FRUIT_TREES, LIVESTOCK, UPGRADES, HOUSE_REPAIR_SAVINGS } from '../src/core/data';
export { saveGame, readSave, applySave, SAVE_KEY } from '../src/core/save';
export { endDay } from '../src/core/day';
export { buyUpgrade, buySapling, buyDuckFlock, buyPiglet, sellPigFromShop, repairHouse, canAfford } from '../src/economy/upgrades';
export { rollPrices, renderShop, openShop } from '../src/economy/shop';
export { waterTree, harvestTree, overnightTrees, drawTree } from '../src/farming/trees';
export { feedDucks, collectDuckEggs, feedPigs, sellGrownPig, refreshPigs, refreshDuckEggs } from '../src/farming/livestock';
export { plots, drawCrop, ensureExtraPlots } from '../src/farming/garden';
export { treeGroups } from '../src/farming/trees';
export { checkQuestsAchievements, rollQuests, QUEST_DEFS, ACHIEVEMENTS } from '../src/events/quests';
export { YEAR_CYCLE, FESTIVALS, FESTIVAL_ITEMS, FESTIVAL_GOODS, dayOfYear, eventForDay, eventById, festivalHudSuffix, festivalSummaryText, applyFestivalQuest, checkFestivalToday, isFestivalGood, festivalItemAvailable, availableFestivalItems } from '../src/events/festivals';
export { showFestivalDecor, festivalDecorState } from '../src/world/festivalDecor';
export { buyFestivalItem } from '../src/economy/shop';
export { updateHUD, hudWriteStats } from '../src/ui/hud';
export { questCardWriteStats } from '../src/events/quests';
export { VILLAGERS, villagerById, currentSegment, villagerAtStall, updateVillagers, greetVillager, giveToTeacher, villagerMeshes, villagerParts } from '../src/npc/villagers';
export { VENDORS, GROCERY, marketPriceOf, sellToVendor, buyGrocery, vendorBuyableCount, openVendorPanel, openGroceryPanel } from '../src/economy/market';
export { blockers, sun, hemi, scene, mat, matCacheSize, geoCacheSize, box, cyl, sph, windowGlass, chickens } from '../src/world/scene';
export { pAlive, pGeo, spawnParticles, updateParticles } from '../src/world/particles';
export { MARKET_STALLS, GROCERY_POS, GROCERY_FRONT, HOUSE_POS, HOUSE_FRONT, SCHOOL_YARD_SPOT, SCHOOL_PLAY_SPOT, FIELD_SPOT, POND_SPOT, stallFront } from '../src/world/village';
export { TEMPLE_POS, TEMPLE_PRAY_SPOT, TEMPLE_SPOT, GROVE_CENTER, GROVE_CLUSTERS, GROVE_SHOOTS, GROVE_REST_SPOT, HILL_POS, HILL_REST_SPOT, refreshBambooShoots } from '../src/world/places';
export { gotoTargets } from '../src/ui/goto';
export { collide, player } from '../src/player/player';
export { findTarget, doInteract, setCurrentTarget, currentTarget } from '../src/activities/interactions';
// PHASE 4.4: ánh sáng hoàng hôn, đèn chập tối, chuyển động, âm thanh
export { daylightState, lanternLevel, shadowLengthFactor, stormDimFactor, finalSunIntensity, smooth01, updateSky } from '../src/world/daylight';
export { updateLanterns, lanternsState, STALL_LANTERN_POS, TEMPLE_LAMP_POS, TEMPLE_LIGHT_POS } from '../src/world/lanterns';
export { smoothFacing, angleDelta, walkBobY, walkSwing, idleSway, applyWalkAnim } from '../src/npc/walkAnim';
export { AC, setAC, AMB, initAmbient, updateAmbient, sndTempleBell, sndCricket, cricketLevel, bambooWindLevel, sndBell } from '../src/world/sound';
export { child, childParts } from '../src/npc/child';
export { husband, husbandParts } from '../src/npc/husband';
