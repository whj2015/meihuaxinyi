
import { ElementType, TrigramData, TrigramName } from './types';

// Store binary as Bottom -> Top (Line 1, 2, 3)
export const TRIGRAMS: Record<number, TrigramData> = {
  1: { id: 1, name: TrigramName.Qian, nature: '天', element: ElementType.Metal, binary: '111' },
  2: { id: 2, name: TrigramName.Dui, nature: '泽', element: ElementType.Metal, binary: '110' }, // Bottom: 1, Middle: 1, Top: 0
  3: { id: 3, name: TrigramName.Li, nature: '火', element: ElementType.Fire, binary: '101' },
  4: { id: 4, name: TrigramName.Zhen, nature: '雷', element: ElementType.Wood, binary: '100' },
  5: { id: 5, name: TrigramName.Xun, nature: '风', element: ElementType.Wood, binary: '011' },
  6: { id: 6, name: TrigramName.Kan, nature: '水', element: ElementType.Water, binary: '010' },
  7: { id: 7, name: TrigramName.Gen, nature: '山', element: ElementType.Earth, binary: '001' },
  8: { id: 8, name: TrigramName.Kun, nature: '地', element: ElementType.Earth, binary: '000' },
};

// 64 Hexagram Names Matrix (Upper ID as Row, Lower ID as Column)
// Map[Upper][Lower]
export const HEXAGRAM_NAMES: Record<number, Record<number, string>> = {
  1: { 1: '乾为天', 2: '天泽履', 3: '天火同人', 4: '天雷无妄', 5: '天风姤', 6: '天水讼', 7: '天山遁', 8: '天地否' },
  2: { 1: '泽天夬', 2: '兑为泽', 3: '泽火革', 4: '泽雷随', 5: '泽风大过', 6: '泽水困', 7: '泽山咸', 8: '泽地萃' },
  3: { 1: '火天大有', 2: '火泽睽', 3: '离为火', 4: '火雷噬嗑', 5: '火风鼎', 6: '火水未济', 7: '火山旅', 8: '火地晋' },
  4: { 1: '雷天大壮', 2: '雷泽归妹', 3: '雷火丰', 4: '震为雷', 5: '雷风恒', 6: '雷水解', 7: '雷山小过', 8: '雷地豫' },
  5: { 1: '风天小畜', 2: '风泽中孚', 3: '风火家人', 4: '风雷益', 5: '巽为风', 6: '风水涣', 7: '风山渐', 8: '风地观' },
  6: { 1: '水天需', 2: '水泽节', 3: '水火既济', 4: '水雷屯', 5: '水风井', 6: '坎为水', 7: '水山蹇', 8: '水地比' },
  7: { 1: '山天大畜', 2: '山泽损', 3: '山火贲', 4: '山雷颐', 5: '山风蛊', 6: '山水蒙', 7: '艮为山', 8: '山地剥' },
  8: { 1: '地天泰', 2: '地泽临', 3: '地火明夷', 4: '地雷复', 5: '地风升', 6: '地水师', 7: '地山谦', 8: '坤为地' },
};

// King Wen Sequence Mapping: "UpperID-LowerID" -> Sequence Number (1-64)
export const HEXAGRAM_SEQUENCE: Record<string, number> = {
  "1-1": 1, "8-8": 2, "6-4": 3, "7-6": 4, "6-1": 5, "1-6": 6, "8-6": 7, "6-8": 8,
  "5-1": 9, "1-2": 10, "8-1": 11, "1-8": 12, "1-3": 13, "3-1": 14, "8-7": 15, "4-8": 16,
  "2-4": 17, "7-5": 18, "8-2": 19, "5-8": 20, "3-4": 21, "7-3": 22, "7-8": 23, "8-4": 24,
  "1-4": 25, "7-1": 26, "7-4": 27, "2-5": 28, "6-6": 29, "3-3": 30, "2-7": 31, "4-5": 32,
  "1-7": 33, "4-1": 34, "3-8": 35, "8-3": 36, "5-3": 37, "3-2": 38, "6-7": 39, "4-6": 40,
  "7-2": 41, "5-4": 42, "2-1": 43, "1-5": 44, "2-8": 45, "8-5": 46, "2-6": 47, "6-5": 48,
  "2-3": 49, "3-5": 50, "4-4": 51, "7-7": 52, "5-7": 53, "4-2": 54, "4-3": 55, "3-7": 56,
  "5-5": 57, "2-2": 58, "5-6": 59, "6-2": 60, "5-2": 61, "4-7": 62, "6-3": 63, "3-6": 64
};