
import { Entity } from '../types';

/**
 * NPC 数据库 (NPCs Database)
 * 
 * 定义非玩家角色。
 * 关联性:
 * - questsGiven -> 关联 QUESTS_DB 的 id
 */
export const NPCS_DB: Record<string, Partial<Entity>> = {
    'village_elder': { 
        id: 'village_elder', 
        name: '村长', 
        type: 'npc', 
        avatar: '👴', 
        description: '慈祥的老人，知晓许多传说。', 
        questsGiven: ['q_first_hunt'], 
        dialogue: ['欢迎来到起始之村，年轻人。', '外面的世界很危险，带上这个。', '北方的森林最近不太平。'] 
    },
    'shop_lily': { 
        id: 'shop_lily', 
        name: '莉莉', 
        type: 'npc', 
        avatar: '👧', 
        description: '充满活力的杂货店女孩。', 
        questsGiven: ['q_collect_herbs'], 
        dialogue: ['想要买点什么吗？', '最近森林里不太平。', '听说矿坑里有幽灵...好可怕。'] 
    },
    'forest_hunter': { 
        id: 'forest_hunter', 
        name: '流浪猎人', 
        type: 'npc', 
        avatar: '🏹', 
        description: '正在追踪猎物的猎人。', 
        questsGiven: [], 
        dialogue: ['嘘...别惊动了猎物。', '森林深处有一座遗迹，但入口很难找。', '不要轻易踏入沼泽，那里连光都会被吞噬。'] 
    },
    'mine_guard': { 
        id: 'mine_guard', 
        name: '矿坑守卫', 
        type: 'npc', 
        avatar: '🛡️', 
        description: '守卫着废弃矿坑的入口。', 
        questsGiven: ['q_cave_clean'], 
        dialogue: ['里面很危险，新手止步。', '没有足够的实力，我是不会让你进去的。', '那些蝙蝠真是烦人。'] 
    },
    'swamp_witch': { 
        id: 'swamp_witch', 
        name: '沼泽女巫', 
        type: 'npc', 
        avatar: '🧙‍♀️', 
        description: '隐居在沼泽深处的神秘女子，精通药剂。', 
        questsGiven: [], 
        dialogue: ['嘶...生人的味道。', '想要我的药水吗？拿毒囊来换。', '沼泽里埋葬着无数贪婪的灵魂。'] 
    },
    'mountain_monk': { 
        id: 'mountain_monk', 
        name: '苦行僧', 
        type: 'npc', 
        avatar: '🙏', 
        description: '在雪山之巅修行的武者。', 
        questsGiven: [], 
        dialogue: ['心如止水，方能抵御严寒。', '你也是来寻找力量的真谛吗？', '雪怪变得越来越暴躁了。'] 
    }
};
