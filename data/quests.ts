
import { Quest, QuestType } from '../types';

/**
 * 任务数据库 (Quests Database)
 * 
 * 定义游戏中的任务。
 * 关联性:
 * - giverNpcId / turnInNpcId -> 关联 NPCS_DB 的 id
 * - objectives.targetId -> 关联 MONSTERS_DB 或 ITEMS_DB 的 id
 * - rewards.items.itemId -> 关联 ITEMS_DB 的 id
 */
export const QUESTS_DB: Record<string, Quest> = {
    'q_first_hunt': {
        id: 'q_first_hunt',
        title: '初次狩猎',
        description: '村长希望你去村外清理一些史莱姆，证明你的实力。',
        type: QuestType.MAIN,
        currentProgress: 0,
        maxProgress: 3,
        isComplete: false,
        status: 'available',
        giverNpcId: 'village_elder',
        turnInNpcId: 'village_elder',
        objectives: [
            { type: 'kill', targetId: 'slime', targetName: '史莱姆', count: 3, current: 0 }
        ],
        rewards: { 
            exp: 50, 
            gold: 50, 
            items: [{ itemId: 'potion_hp_small', count: 2 }] 
        },
        dialogueStart: ['最近村子周围的史莱姆越来越多了。', '年轻人，你能帮我去清理3只史莱姆吗？'],
        dialogueEnd: ['干得漂亮！这是给你的奖励。']
    },
    'q_collect_herbs': {
        id: 'q_collect_herbs',
        title: '采集草药',
        description: '莉莉需要一些止血草来制作药水。',
        type: QuestType.SIDE,
        currentProgress: 0,
        maxProgress: 2,
        isComplete: false,
        status: 'available',
        giverNpcId: 'shop_lily',
        turnInNpcId: 'shop_lily',
        objectives: [
            { type: 'collect', targetId: 'herb', targetName: '止血草', count: 2, current: 0 }
        ],
        rewards: { 
            exp: 30, 
            gold: 20, 
            items: [{ itemId: 'potion_hp_small', count: 1 }] 
        },
        dialogueStart: ['哎呀，止血草的库存不够了...', '你能帮我去森林边缘采2株止血草吗？'],
        dialogueEnd: ['太感谢了！这些药水送给你。']
    },
    'q_cave_clean': {
        id: 'q_cave_clean',
        title: '清理蝙蝠',
        description: '矿坑守卫抱怨蝙蝠太多了，影响了巡逻。',
        type: QuestType.SIDE,
        currentProgress: 0,
        maxProgress: 5,
        isComplete: false,
        status: 'available',
        giverNpcId: 'mine_guard',
        turnInNpcId: 'mine_guard',
        objectives: [
            { type: 'kill', targetId: 'cave_bat', targetName: '吸血蝙蝠', count: 5, current: 0 },
            { type: 'collect', targetId: 'bat_wing', targetName: '蝙蝠翅膀', count: 3, current: 0 }
        ],
        rewards: { 
            exp: 100, 
            gold: 80, 
            items: [] 
        },
        dialogueStart: ['那些蝙蝠吵得我睡不着觉！', '去帮我教训它们，顺便带点翅膀回来下酒。'],
        dialogueEnd: ['终于清静了！拿着，这是你的辛苦费。']
    }
};
