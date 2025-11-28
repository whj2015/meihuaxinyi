
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
  xiang: string; // 大象
  lines: Record<number, string>; // 爻辞 (1-6)
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
  changedHexagram: HexagramData;
  movingLine: number; // 1-6
  tiGua: 'upper' | 'lower'; // Which part is Body
  yongGua: 'upper' | 'lower'; // Which part is Application
  relation: string; // Evaluation of Ti/Yong relation
  relationScore: 'Great Auspicious' | 'Minor Auspicious' | 'Auspicious' | 'Minor Bad' | 'Great Bad';
  movingLineText?: string; // 具体的动爻爻辞
}

export type AIProvider = 'gemini' | 'deepseek';

export interface AISettings {
  provider: AIProvider;
  geminiKey: string;
  deepseekKey: string;
}

export interface UserProfile {
  username: string;
  isLoggedIn: boolean;
  token?: string;
}
