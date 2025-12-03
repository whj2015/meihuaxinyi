
import { LocationConfig } from '../types';

/**
 * 地图数据库 (World Map / Locations)
 * 
 * 定义游戏世界的各个区域。
 * 关联性:
 * - exits.targetId -> 关联 locations.ts (自身的 id)
 * - exits.reqItem -> 关联 ITEMS_DB 的 id
 * - staticNpcs -> 关联 NPCS_DB 的 id
 * - monsterTable.entityId -> 关联 MONSTERS_DB 的 id
 * - resourceTable.entityId -> 关联 ITEMS_DB 的 id
 */
export const WORLD_DB: Record<string, LocationConfig> = {
    'village_start': {
        id: 'village_start',
        name: '起始之村',
        description: '这里是冒险开始的地方。阳光明媚，鸟语花香，村民们过着平静的生活。村子中央有一口古老的水井。',
        dangerLevel: 'Lv.1 安全区',
        exits: [
            { id: 'to_forest', targetId: 'forest_edge', direction: '前往幽暗森林', directionLabel: '🌲 幽暗森林', cardinal: 'N', description: '你沿着小路向北走去，进入了幽暗森林。', isHidden: false },
            { id: 'to_mine', targetId: 'mine_entrance', direction: '前往废弃矿坑', directionLabel: '⛏️ 废弃矿坑', cardinal: 'E', description: '你向东前往山区，那是废弃矿坑的方向。', isHidden: false, reqLevel: 3 },
            { id: 'to_mountains', targetId: 'misty_peaks', direction: '前往寒风山脊', directionLabel: '🏔️ 寒风山脊', cardinal: 'NW', description: '你踏上了通往雪山的险峻小路，气温逐渐降低。', isHidden: true, reqLevel: 8 }
        ],
        staticNpcs: ['village_elder', 'shop_lily'],
        monsterTable: [
            { entityId: 'slime', chance: 0.3, levelRange: [1, 2] }
        ],
        resourceTable: [
            { entityId: 'herb', chance: 0.4, levelRange: [1, 1] }
        ],
        minLevel: 1
    },
    'forest_edge': {
        id: 'forest_edge',
        name: '幽暗森林',
        description: '茂密的树冠遮蔽了天空，空气中弥漫着潮湿的泥土气息。远处偶尔传来野兽的嚎叫声。',
        dangerLevel: 'Lv.3 - 6',
        exits: [
            { id: 'to_village', targetId: 'village_start', direction: '返回村庄', directionLabel: '🏠 起始之村', cardinal: 'S', description: '你沿着小路向南走，返回了温暖的村庄。', isHidden: false },
            { id: 'to_ruins', targetId: 'ruins_ancient', direction: '深入遗迹', directionLabel: '🏛️ 远古遗迹', cardinal: 'NE', description: '你拨开密集的灌木丛，踏上了通往森林深处遗迹的隐秘小径。', isHidden: true },
            { id: 'to_swamp', targetId: 'gloomy_swamp', direction: '进入沼泽', directionLabel: '🌫️ 迷雾沼泽', cardinal: 'W', description: '树木变得扭曲，地面逐渐泥泞，你来到了森林西侧的沼泽边缘。', isHidden: false, reqLevel: 5 }
        ],
        staticNpcs: ['forest_hunter'],
        monsterTable: [
            { entityId: 'forest_wolf', chance: 0.4, levelRange: [3, 5] },
            { entityId: 'poison_spider', chance: 0.3, levelRange: [4, 6] },
            { entityId: 'wild_boar', chance: 0.3, levelRange: [2, 4] }
        ],
        resourceTable: [
            { entityId: 'herb', chance: 0.5, levelRange: [1, 1] }
        ],
        minLevel: 3
    },
    'gloomy_swamp': {
        id: 'gloomy_swamp',
        name: '迷雾沼泽',
        description: '空气中弥漫着腐烂的味道，脚下的泥潭冒着诡异的气泡。这里终年被迷雾笼罩，方向难辨。',
        dangerLevel: 'Lv.6 - 10',
        exits: [
            { id: 'back_to_forest', targetId: 'forest_edge', direction: '返回森林', directionLabel: '🌲 幽暗森林', cardinal: 'E', description: '你小心翼翼地离开了危险的沼泽，回到了森林。', isHidden: false }
        ],
        staticNpcs: ['swamp_witch'],
        monsterTable: [
            { entityId: 'swamp_toad', chance: 0.5, levelRange: [6, 9] },
            { entityId: 'poison_spider', chance: 0.3, levelRange: [5, 8] },
            { entityId: 'shadow_snake', chance: 0.2, levelRange: [8, 10] }
        ],
        resourceTable: [
            { entityId: 'poison_sac', chance: 0.2, levelRange: [1, 1] },
            { entityId: 'herb', chance: 0.3, levelRange: [1, 1] }
        ],
        minLevel: 6
    },
    'mine_entrance': {
        id: 'mine_entrance',
        name: '废弃矿坑',
        description: '入口处挂着危险的警示牌。里面阴暗潮湿，回荡着滴水声。',
        dangerLevel: 'Lv.5 - 10',
        exits: [
            { id: 'to_village_from_mine', targetId: 'village_start', direction: '返回村庄', directionLabel: '🏠 起始之村', cardinal: 'W', description: '你离开了阴森的矿坑，回到阳光下。', isHidden: false },
            { id: 'to_lake', targetId: 'underground_lake', direction: '深入地下', directionLabel: '💧 地下湖', cardinal: 'DOWN', description: '你沿着矿道深入，听到了水流的声音。', isHidden: false, reqLevel: 5 },
            { id: 'to_mountains_path', targetId: 'misty_peaks', direction: '攀登后山', directionLabel: '🏔️ 寒风山脊', cardinal: 'N', description: '矿坑后方有一条通往山顶的小路。', isHidden: true, reqLevel: 10 }
        ],
        staticNpcs: ['mine_guard'],
        monsterTable: [
            { entityId: 'skeleton_miner', chance: 0.5, levelRange: [5, 8] },
            { entityId: 'cave_bat', chance: 0.3, levelRange: [4, 6] },
            { entityId: 'slime', chance: 0.2, levelRange: [3, 5] }
        ],
        resourceTable: [
            { entityId: 'iron_ore', chance: 0.4, levelRange: [1, 1] }
        ],
        minLevel: 5
    },
    'underground_lake': {
        id: 'underground_lake', 
        name: '地下湖',
        description: '一片寂静的地下水域，水面闪烁着幽蓝的光芒，这里是洞穴生物的乐园。',
        dangerLevel: 'Lv.8 - 12',
        exits: [
             { id: 'back_to_mine', targetId: 'mine_entrance', direction: '返回矿坑', directionLabel: '⛏️ 废弃矿坑', cardinal: 'UP', description: '你回到了矿坑入口。', isHidden: false },
             { id: 'to_crystal', targetId: 'crystal_cavern', direction: '潜入深处', directionLabel: '💎 水晶地穴', cardinal: 'DOWN', description: '你在湖边发现了一个闪烁着晶莹光芒的深邃洞穴。', isHidden: true, reqLevel: 12 }
        ],
        staticNpcs: [],
        monsterTable: [
            { entityId: 'cave_bat', chance: 0.5, levelRange: [5, 8] }, 
            { entityId: 'slime', chance: 0.3, levelRange: [5, 10] },
            { entityId: 'swamp_toad', chance: 0.2, levelRange: [8, 12] }
        ],
        resourceTable: [
            { entityId: 'magic_crystal', chance: 0.1, levelRange: [1, 1] }
        ],
        minLevel: 8
    },
    'crystal_cavern': {
        id: 'crystal_cavern', 
        name: '水晶地穴',
        description: '这里的岩壁上长满了巨大的水晶，将黑暗的地下照得如同白昼。美丽中潜藏着致命的危险。',
        dangerLevel: 'Lv.15 - 20 (极度危险)',
        exits: [
             { id: 'back_to_lake', targetId: 'underground_lake', direction: '返回地下湖', directionLabel: '💧 地下湖', cardinal: 'UP', description: '你离开了刺眼的水晶地穴。', isHidden: false }
        ],
        staticNpcs: [],
        monsterTable: [
            { entityId: 'crystal_scorpion', chance: 0.6, levelRange: [15, 18] }, 
            { entityId: 'stone_golem', chance: 0.3, levelRange: [16, 20] }
        ],
        resourceTable: [
            { entityId: 'magic_crystal', chance: 0.4, levelRange: [1, 2] },
            { entityId: 'obsidian', chance: 0.1, levelRange: [1, 1] }
        ],
        minLevel: 15
    },
    'ruins_ancient': {
        id: 'ruins_ancient',
        name: '远古遗迹',
        description: '神秘的古代建筑残骸，墙壁上刻满了看不懂的符文，空气中流动着奇异的魔力波动。',
        dangerLevel: 'Lv.10 - 15',
        exits: [
            { id: 'out_ruins', targetId: 'forest_edge', direction: '离开遗迹', directionLabel: '🌲 幽暗森林', cardinal: 'SW', description: '你离开了充满压迫感的遗迹，回到了森林边缘。', isHidden: false }
        ],
        staticNpcs: [],
        monsterTable: [
            { entityId: 'stone_golem', chance: 0.5, levelRange: [10, 15] },
            { entityId: 'shadow_snake', chance: 0.3, levelRange: [11, 14] }
        ],
        resourceTable: [
            { entityId: 'magic_crystal', chance: 0.2, levelRange: [1, 1] }
        ],
        minLevel: 10
    },
    'misty_peaks': {
        id: 'misty_peaks',
        name: '寒风山脊',
        description: '寒风呼啸，云雾缭绕。这里的气温极低，每一步都需要消耗巨大的体力。',
        dangerLevel: 'Lv.10 - 18',
        exits: [
            { id: 'back_to_village', targetId: 'village_start', direction: '下山', directionLabel: '🏠 起始之村', cardinal: 'SE', description: '你顺着山路回到了温暖的平原。', isHidden: false },
            { id: 'back_to_mine_path', targetId: 'mine_entrance', direction: '前往矿山', directionLabel: '⛏️ 废弃矿坑', cardinal: 'S', description: '你沿着山脊南侧的小路前往矿坑。', isHidden: false }
        ],
        staticNpcs: ['mountain_monk'],
        monsterTable: [
            { entityId: 'snow_yeti', chance: 0.4, levelRange: [12, 16] },
            { entityId: 'harpy', chance: 0.4, levelRange: [10, 14] },
            { entityId: 'forest_wolf', chance: 0.2, levelRange: [10, 12] }
        ],
        resourceTable: [
            { entityId: 'ice_shard', chance: 0.3, levelRange: [1, 1] },
            { entityId: 'herb', chance: 0.2, levelRange: [1, 1] }
        ],
        minLevel: 10
    }
};
