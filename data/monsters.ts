
import { Entity } from '../types';

/**
 * 怪物数据库 (Monsters Database)
 * 
 * 定义怪物的属性、战斗数值和掉落表。
 * 关联性:
 * - lootTable.itemId -> 关联 ITEMS_DB 的 id
 */
export const MONSTERS_DB: Record<string, Partial<Entity>> = {
    'slime': { 
        id: 'slime', 
        name: '史莱姆', 
        type: 'monster', 
        avatar: '💧', 
        description: '黏糊糊的初级怪物', 
        status: 'Hostile', 
        hp: 30, maxHp: 30, attack: 8, defense: 2, speed: 5, expReward: 15, 
        lootTable: [
            { itemId: 'slime_fluid', chance: 0.5, min: 1, max: 2 }, 
            { itemId: 'herb', chance: 0.1, min: 1, max: 1 }
        ] 
    },
    'wild_boar': { 
        id: 'wild_boar', 
        name: '野猪', 
        type: 'monster', 
        avatar: '🐗', 
        description: '脾气暴躁的野兽', 
        status: 'Hostile', 
        hp: 50, maxHp: 50, attack: 12, defense: 5, speed: 8, expReward: 25, 
        lootTable: [] 
    },
    'forest_wolf': { 
        id: 'forest_wolf', 
        name: '森林狼', 
        type: 'monster', 
        avatar: '🐺', 
        description: '成群结队的捕食者', 
        status: 'Aggressive', 
        hp: 80, maxHp: 80, attack: 18, defense: 8, speed: 15, expReward: 40, isAggressive: true, 
        lootTable: [
            { itemId: 'wolf_fang', chance: 0.8, min: 1, max: 1 }
        ] 
    },
    'poison_spider': { 
        id: 'poison_spider', 
        name: '剧毒蜘蛛', 
        type: 'monster', 
        avatar: '🕷️', 
        description: '带有剧毒', 
        status: 'Lurking', 
        hp: 60, maxHp: 60, attack: 25, defense: 5, speed: 12, expReward: 35, isAggressive: true, 
        lootTable: [
            { itemId: 'poison_sac', chance: 0.4, min: 1, max: 1 }
        ] 
    },
    'cave_bat': { 
        id: 'cave_bat', 
        name: '吸血蝙蝠', 
        type: 'monster', 
        avatar: '🦇', 
        description: '倒挂在洞穴顶部的生物', 
        status: 'Hostile', 
        hp: 40, maxHp: 40, attack: 15, defense: 3, speed: 20, expReward: 30, 
        lootTable: [
            { itemId: 'bat_wing', chance: 0.7, min: 1, max: 2 }
        ] 
    },
    'skeleton_miner': { 
        id: 'skeleton_miner', 
        name: '骷髅矿工', 
        type: 'monster', 
        avatar: '💀', 
        description: '死后仍在挖掘的亡灵', 
        status: 'Undead', 
        hp: 120, maxHp: 120, attack: 30, defense: 15, speed: 8, expReward: 80, 
        lootTable: [
            { itemId: 'iron_ore', chance: 0.6, min: 1, max: 3 }
        ] 
    },
    'stone_golem': { 
        id: 'stone_golem', 
        name: '岩石巨人', 
        type: 'monster', 
        avatar: '🗿', 
        description: '坚硬无比的元素生物', 
        status: 'Guardian', 
        hp: 300, maxHp: 300, attack: 45, defense: 40, speed: 5, expReward: 300, 
        lootTable: [
            { itemId: 'magic_crystal', chance: 1.0, min: 1, max: 1 }
        ] 
    },
    // --- New Monsters ---
    'swamp_toad': { 
        id: 'swamp_toad', 
        name: '沼泽巨蟾', 
        type: 'monster', 
        avatar: '🐸', 
        description: '皮糙肉厚的巨大蟾蜍，能喷吐毒液', 
        status: 'Hostile', 
        hp: 150, maxHp: 150, attack: 20, defense: 20, speed: 5, expReward: 60, 
        lootTable: [
            { itemId: 'poison_sac', chance: 0.5, min: 1, max: 1 },
            { itemId: 'slime_fluid', chance: 0.3, min: 1, max: 3 }
        ] 
    },
    'shadow_snake': { 
        id: 'shadow_snake', 
        name: '影蛇', 
        type: 'monster', 
        avatar: '🐍', 
        description: '潜伏在阴影中的致命杀手', 
        status: 'Aggressive', 
        hp: 80, maxHp: 80, attack: 35, defense: 5, speed: 25, expReward: 70, isAggressive: true,
        lootTable: [
            { itemId: 'poison_sac', chance: 0.3, min: 1, max: 1 }
        ] 
    },
    'snow_yeti': { 
        id: 'snow_yeti', 
        name: '雪怪', 
        type: 'monster', 
        avatar: '🦍', 
        description: '居住在雪山的力量型怪物', 
        status: 'Hostile', 
        hp: 250, maxHp: 250, attack: 40, defense: 25, speed: 10, expReward: 150, 
        lootTable: [
            { itemId: 'ice_shard', chance: 0.4, min: 1, max: 2 }
        ] 
    },
    'harpy': { 
        id: 'harpy', 
        name: '鹰身女妖', 
        type: 'monster', 
        avatar: '🦅', 
        description: '从空中发动袭击的半人半鸟生物', 
        status: 'Aggressive', 
        hp: 100, maxHp: 100, attack: 35, defense: 10, speed: 30, expReward: 120, isAggressive: true,
        lootTable: [] 
    },
    'crystal_scorpion': { 
        id: 'crystal_scorpion', 
        name: '水晶蝎', 
        type: 'monster', 
        avatar: '🦂', 
        description: '外壳如水晶般坚硬的剧毒生物', 
        status: 'Guardian', 
        hp: 180, maxHp: 180, attack: 50, defense: 35, speed: 15, expReward: 200, 
        lootTable: [
            { itemId: 'magic_crystal', chance: 0.3, min: 1, max: 1 },
            { itemId: 'obsidian', chance: 0.2, min: 1, max: 1 }
        ] 
    }
};
