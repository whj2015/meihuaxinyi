
export enum ElementType {
  Metal = '金',
  Wood = '木',
  Water = '水',
  Fire = '火',
  Earth = '土',
}

export enum TrigramName {
  Qian = '乾',
  Dui = '兑',
  Li = '离',
  Zhen = '震',
  Xun = '巽',
  Kan = '坎',
  Gen = '艮',
  Kun = '坤',
}

export interface TrigramData {
  id: number;
  name: TrigramName;
  nature: string; // 象征 (天, 泽, 火...)
  element: ElementType;
  binary: string; 
}

export interface IChingText {
  guaci: string; // 卦辞
  guaci_explain?: string; // 卦辞白话注解
  xiang: string; // 大象
  xiang_explain?: string; // 大象白话注解
  lines: Record<number, string>; // 爻辞 (1-6)
  lines_explain?: Record<number, string>; // 爻辞白话注解 (1-6)
}

export interface HexagramData {
  upper: TrigramData;
  lower: TrigramData;
  name: string;
  sequence: number; // 新增：第几卦 (1-64)
  description?: string;
  text?: IChingText; // 原典数据
}

export interface DivinationResult {
  inputNumbers: [number, number, number];
  originalHexagram: HexagramData;
  huHexagram: HexagramData; // 新增：互卦 (过程)
  changedHexagram: HexagramData;
  movingLine: number; // 1-6
  tiGua: 'upper' | 'lower'; // Which part is Body
  yongGua: 'upper' | 'lower'; // Which part is Application
  relation: string; // Evaluation of Ti/Yong relation
  relationScore: 'Great Auspicious' | 'Minor Auspicious' | 'Auspicious' | 'Minor Bad' | 'Great Bad';
  movingLineText?: string; // 具体的动爻爻辞
}

export type AIProvider = 'gemini' | 'deepseek' | 'custom';

export interface CustomAIConfig {
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

export interface AISettings {
  provider: AIProvider;
  geminiKey: string;
  deepseekKey: string;
  customConfig?: CustomAIConfig;
}

export interface UserProfile {
  username: string;
  isLoggedIn: boolean;
  token?: string; // JWT Token
  credits?: number; // 剩余灵力/点数
}

export interface HistoryRecord {
  id: number | string; // Guest uses string/timestamp, User uses DB ID
  username?: string;
  question: string;
  n1: number;
  n2: number;
  n3: number;
  ai_response?: string;
  timestamp: number;
}

export interface TransactionRecord {
  id: number;
  username: string;
  type: 'recharge' | 'usage' | 'refund';
  amount: number;
  description: string;
  timestamp: number;
}
