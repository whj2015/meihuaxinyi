
import React from 'react';

// --- Enums ---
export enum QuestType {
  MAIN = 'MAIN',
  SIDE = 'SIDE',
  DAILY = 'DAILY',
  CHALLENGE = 'CHALLENGE'
}

export enum ItemType {
  CONSUMABLE = 'consumable',
  EQUIPMENT = 'equipment',
  MATERIAL = 'material',
  QUEST = 'quest'
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

// --- Interfaces ---

export interface Achievement {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  unlockedAt?: number;
  condition?: string; // e.g., "kill_wolf_10"
  rewardTitleId?: string;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  effect: string; // Text description of effect
  statBonus?: Partial<PlayerStats>; // Actual mechanical bonus
}

export interface QuestReward {
    exp?: number;
    gold?: number;
    items?: { itemId: string; count: number }[];
    titleId?: string;
}

export interface QuestObjective {
    type: 'kill' | 'collect' | 'talk' | 'explore';
    targetId: string; // Enemy ID, Item ID, or NPC ID
    targetName?: string; // Display name
    count: number;
    current: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  currentProgress: number; // 0 to 100 usually, or mapped to objectives
  maxProgress: number;
  type: QuestType;
  isComplete: boolean;
  status: 'available' | 'active' | 'completed' | 'turned_in';
  giverNpcId?: string; // Linked NPC ID
  turnInNpcId?: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  dialogueStart?: string[];
  dialogueEnd?: string[];
}

export interface Pet {
  id?: string;
  name: string;
  title: string;
  stars: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  loyalty: number;
  skills: string[];
  description?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType | string;
  rarity: ItemRarity | string;
  effect?: string; // e.g., "heal_50", "atk_5"
  quantity: number;
  icon?: string;
  price?: number;
  // Equipment specific
  slot?: 'weapon' | 'armor' | 'accessory'; // slot type
  stats?: { attack?: number; defense?: number; hp?: number; speed?: number }; // equipment stats
}

// Normalized Drop Entry for Database
export interface LootEntry {
  itemId: string;
  chance: number; // 0.0 - 1.0
  min: number;
  max: number;
}

export interface SpawnEntry {
    entityId: string; // Reference to a Monster/Item ID
    chance: number; // Weight or Chance
    levelRange: [number, number];
}

export interface Entity {
  uid?: string; // Instance ID
  id: string; // Template ID (e.g., 'slime_001')
  name: string;
  type: 'monster' | 'npc' | 'boss' | 'item';
  level: number;
  hp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  expReward?: number; // Base EXP provided on kill
  status: string;
  avatar?: string;
  description?: string;
  
  // Data Logic
  itemData?: Item; // If it's an item on the ground
  lootTable?: LootEntry[]; // If it's a monster
  
  // Interaction Logic
  dialogue?: string[]; 
  questsGiven?: string[]; // IDs of quests this NPC can give
  isAggressive?: boolean;
}

// --- New Movement System ---
export type CardinalDirection = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW' | 'UP' | 'DOWN';

export interface LocationExit {
    id: string; // Unique ID for the exit logic
    targetId: string; // Target Location Config ID
    direction: string; // Display command: "向北", "进入矿坑", etc.
    directionLabel: string; // UI Label: "北", "矿坑"
    cardinal: CardinalDirection; // Logic Direction
    description: string; // Narrative when traveling
    isHidden: boolean; // Needs exploration to find?
    reqLevel?: number; // Lock condition
    reqItem?: string; // Lock condition (Key ID)
}

export interface LocationConfig {
    id: string;
    name: string;
    description: string;
    dangerLevel: string; // Display string for level range (e.g. "Lv.1-5")
    exits: LocationExit[]; // New explicit exit system
    staticNpcs: string[]; // IDs of NPCs always here
    monsterTable: SpawnEntry[];
    resourceTable: SpawnEntry[];
    minLevel: number; // General danger level for logic
}

export interface LocationData {
    id: string;
    name: string;
    description: string;
    dangerLevel: string; // Display string
    npcs: Entity[];     
    monsters: Entity[]; // Templates available
    activeEntities: Entity[]; // Current instantiated entities
    availableQuests: Quest[];
    visibleExits: LocationExit[]; // Exits currently visible to player
    isVisited: boolean;
    visitedAt: number;
}

export interface Equipment {
    weapon?: Item;
    armor?: Item;
    accessory?: Item;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  gold: number;
  attack: number;
  defense: number;
  speed: number;
  element: string;
  reputation: number;
  location: string; // Stores Location Name usually, but logic uses ID internally mostly
  locationId: string; // Explicit ID tracking
  exp: number;
  maxExp: number;
  pet?: Pet;
  ownedPets: Pet[];
  inventory: Item[];
  equipment: Equipment; // New Equipment System
  activeTitle?: Title; 
  unlockedTitles: Title[]; 
  achievements: Achievement[]; 
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'narrative' | 'combat' | 'system' | 'command' | 'levelup' | 'achievement';
  timestamp: number;
}

export interface AISettings {
  provider: 'gemini' | 'deepseek' | 'local';
  apiKey: string;
  model: string;
}

export interface SaveData {
  version: number;
  timestamp: number;
  stats: PlayerStats;
  quests: Quest[]; // Active/Completed quests
  worldRegistry: Record<string, LocationData>; 
  currentEntities: Entity[];
  logs: LogEntry[];
  knownLocations?: string[]; // Deprecated mostly, handled by worldRegistry now
}

export interface GameTurnResponse {
  narrative: string;
  location: string; // Name
  locationId: string; // ID
  entities: Entity[]; 
  updatedStats: Partial<PlayerStats>;
  updatedQuests: Quest[]; // Only quests that changed
  newAchievementId?: string;
  isCombat: boolean;
}

export interface CombatState {
    playerAp: number;
    enemyAp: number;
    petAp: number;
    round: number;
    isPlayerTurn: boolean;
    isPetTurn: boolean;
    localPlayerHp: number;
    localPetHp: number;
    localEnemyHp: number;
    localEnemyMaxHp: number;
}

export type ActionCategory = 'explore' | 'status' | 'pet' | 'system' | 'achievement' | 'character' | 'inventory';

export interface QuickAction {
  label: string;
  command?: string;
  action?: () => void;
  icon?: React.ReactNode;
}
