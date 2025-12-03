
import { PlayerStats, Achievement, Title } from '../types';
import { ITEMS_DB } from './items';

// --- Default Achievements ---
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
    { id: 'first_blood', name: '初试锋芒', description: '第一次赢得战斗胜利', isUnlocked: false, rewardTitleId: 'rookie' },
    { id: 'pet_owner', name: '幻兽伙伴', description: '成功契约第一只幻兽', isUnlocked: false, rewardTitleId: 'tamer' },
    { id: 'rich_man', name: '第一桶金', description: '持有金币超过 500', isUnlocked: false, rewardTitleId: 'wealthy' },
    { id: 'survivor', name: '九死一生', description: '在战斗中以低于 5% HP 获胜', isUnlocked: false, rewardTitleId: 'lucky' }
];

// --- Title Registry ---
export const TITLE_REGISTRY: Record<string, Title> = {
    'rookie': { id: 'rookie', name: '见习冒险者', description: '初出茅庐', effect: '攻击 +2', statBonus: { attack: 2 } },
    'tamer': { id: 'tamer', name: '唤灵师', description: '与幻兽心意相通', effect: '幻兽防御 +5', statBonus: {} }, 
    'wealthy': { id: 'wealthy', name: '暴发户', description: '钱袋子沉甸甸的', effect: '声望 +10', statBonus: { reputation: 10 } },
    'lucky': { id: 'lucky', name: '天选之人', description: '运气也是实力的一部分', effect: '防御 +3', statBonus: { defense: 3 } }
};

// --- Initial Player State ---
export const INITIAL_STATS: PlayerStats = {
    hp: 120, maxHp: 120,
    mp: 50, maxMp: 50,
    level: 1,
    location: '起始之村',
    locationId: 'village_start',
    gold: 100,
    attack: 20,
    defense: 10,
    speed: 15,
    element: '无',
    reputation: 0,
    exp: 0, maxExp: 100,
    pet: undefined,
    ownedPets: [],
    // 初始物品: 从 ITEMS_DB 中获取，防止数据不一致
    inventory: [
        { ...ITEMS_DB['potion_hp_small'], quantity: 1 },
        { ...ITEMS_DB['old_sword'], quantity: 1 }
    ],
    equipment: {}, 
    achievements: DEFAULT_ACHIEVEMENTS,
    unlockedTitles: [],
    activeTitle: undefined
};
