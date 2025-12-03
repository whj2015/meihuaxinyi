
import { Item } from '../types';

/**
 * 道具数据库 (Items Database)
 * 
 * 定义游戏中所有的物品。
 * 被引用处: 
 * - Monsters (掉落物)
 * - Locations (采集资源)
 * - Quests (奖励物品, 收集目标)
 * - Player (初始物品)
 */
export const ITEMS_DB: Record<string, Item> = {
    // --- Consumables (消耗品) ---
    'potion_hp_small': { 
        id: 'potion_hp_small', 
        name: '初级治疗药水', 
        description: '恢复 50 点生命值', 
        type: 'consumable', 
        rarity: 'common', 
        quantity: 1, 
        icon: '🧪', 
        effect: 'heal_50', 
        price: 10 
    },
    'potion_hp_medium': { 
        id: 'potion_hp_medium', 
        name: '中级治疗药水', 
        description: '恢复 150 点生命值', 
        type: 'consumable', 
        rarity: 'uncommon', 
        quantity: 1, 
        icon: '🍷', 
        effect: 'heal_150', 
        price: 30 
    },
    
    // --- Materials (材料) ---
    'herb': { 
        id: 'herb', 
        name: '止血草', 
        description: '常见的草药', 
        type: 'material', 
        rarity: 'common', 
        quantity: 1, 
        icon: '🌿', 
        price: 2 
    },
    'iron_ore': { 
        id: 'iron_ore', 
        name: '铁矿石', 
        description: '锻造用的基础材料', 
        type: 'material', 
        rarity: 'uncommon', 
        quantity: 1, 
        icon: '🪨', 
        price: 5 
    },
    'magic_crystal': { 
        id: 'magic_crystal', 
        name: '魔力结晶', 
        description: '蕴含微弱魔力', 
        type: 'material', 
        rarity: 'rare', 
        quantity: 1, 
        icon: '💎', 
        price: 50 
    },
    'slime_fluid': { 
        id: 'slime_fluid', 
        name: '史莱姆粘液', 
        description: '黏糊糊的液体', 
        type: 'material', 
        rarity: 'common', 
        quantity: 1, 
        icon: '💧', 
        price: 1 
    },
    'bat_wing': { 
        id: 'bat_wing', 
        name: '蝙蝠翅膀', 
        description: '洞穴蝙蝠的翅膀，虽然破旧但可以入药', 
        type: 'material', 
        rarity: 'common', 
        quantity: 1, 
        icon: '🦇', 
        price: 3 
    },
    // New Materials
    'poison_sac': { 
        id: 'poison_sac', 
        name: '毒囊', 
        description: '从有毒生物体内取出的器官，含有剧毒', 
        type: 'material', 
        rarity: 'uncommon', 
        quantity: 1, 
        icon: '🤢', 
        price: 8 
    },
    'ice_shard': { 
        id: 'ice_shard', 
        name: '冰之碎片', 
        description: '终年不化的寒冰碎片，散发着冷气', 
        type: 'material', 
        rarity: 'uncommon', 
        quantity: 1, 
        icon: '❄️', 
        price: 12 
    },
    'obsidian': { 
        id: 'obsidian', 
        name: '黑曜石', 
        description: '坚硬无比的黑色石头', 
        type: 'material', 
        rarity: 'rare', 
        quantity: 1, 
        icon: '⚫', 
        price: 25 
    },

    // --- Quest Items (任务物品) ---
    'wolf_fang': { 
        id: 'wolf_fang', 
        name: '狼牙', 
        description: '尖锐的狼牙，是证明狩猎的凭证', 
        type: 'quest', 
        rarity: 'common', 
        quantity: 1, 
        icon: '🦷', 
        price: 1 
    },
    'ancient_key': { 
        id: 'ancient_key', 
        name: '遗迹钥匙', 
        description: '散发着古老气息的石质钥匙', 
        type: 'quest', 
        rarity: 'rare', 
        quantity: 1, 
        icon: '🗝️', 
        price: 0 
    },
    'mysterious_scroll': { 
        id: 'mysterious_scroll', 
        name: '神秘卷轴', 
        description: '记载着看不懂的文字', 
        type: 'quest', 
        rarity: 'epic', 
        quantity: 1, 
        icon: '📜', 
        price: 0 
    },

    // --- Equipment (装备) ---
    'old_sword': { 
        id: 'old_sword', 
        name: '生锈的铁剑', 
        description: '勉强能用', 
        type: 'equipment', 
        rarity: 'common', 
        quantity: 1, 
        icon: '🗡️', 
        effect: 'atk_5', 
        price: 15,
        slot: 'weapon',
        stats: { attack: 5 }
    },
    'leather_armor': { 
        id: 'leather_armor', 
        name: '破旧皮甲', 
        description: '提供微弱的防护', 
        type: 'equipment', 
        rarity: 'common', 
        quantity: 1, 
        icon: '🛡️', 
        effect: 'def_3', 
        price: 20,
        slot: 'armor',
        stats: { defense: 3 }
    },
    // New Equipment
    'steel_sword': { 
        id: 'steel_sword', 
        name: '精钢长剑', 
        description: '铁匠精心打造的利刃', 
        type: 'equipment', 
        rarity: 'uncommon', 
        quantity: 1, 
        icon: '⚔️', 
        effect: 'atk_15', 
        price: 150,
        slot: 'weapon',
        stats: { attack: 15 }
    },
    'chainmail': { 
        id: 'chainmail', 
        name: '锁子甲', 
        description: '由金属环编织而成，防御力不错', 
        type: 'equipment', 
        rarity: 'uncommon', 
        quantity: 1, 
        icon: '⛓️', 
        effect: 'def_10', 
        price: 200,
        slot: 'armor',
        stats: { defense: 10, speed: -2 }
    },
    'frost_ring': { 
        id: 'frost_ring', 
        name: '冰霜指环', 
        description: '散发着寒气的戒指', 
        type: 'equipment', 
        rarity: 'rare', 
        quantity: 1, 
        icon: '💍', 
        effect: 'def_5', 
        price: 300,
        slot: 'accessory',
        stats: { defense: 5, attack: 5 }
    },
};
