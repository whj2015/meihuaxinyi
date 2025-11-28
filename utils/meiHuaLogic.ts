
import { TRIGRAMS, HEXAGRAM_NAMES, HEXAGRAM_SEQUENCE } from '../constants';
import { DivinationResult, ElementType, TrigramData, HexagramData } from '../types';
import { getIChingText } from './ichingData';

const getTrigram = (num: number): TrigramData => {
  const remainder = num % 8;
  const index = remainder === 0 ? 8 : remainder;
  return TRIGRAMS[index];
};

const getMovingLine = (num: number): number => {
  const remainder = num % 6;
  return remainder === 0 ? 6 : remainder;
};

const getHexagramName = (upper: TrigramData, lower: TrigramData): string => {
  return HEXAGRAM_NAMES[upper.id]?.[lower.id] || '未知';
};

const getHexagramSequence = (upperId: number, lowerId: number): number => {
  return HEXAGRAM_SEQUENCE[`${upperId}-${lowerId}`] || 0;
};

const invertBit = (bit: string): string => (bit === '1' ? '0' : '1');

// Function to change a trigram based on line change (1, 2, or 3 relative to trigram)
const changeTrigram = (trigram: TrigramData, lineIndex: number): TrigramData => {
  // lineIndex 1 = bottom, 2 = middle, 3 = top
  const chars = trigram.binary.split('');
  // Binary string is stored Bottom -> Top (index 0 is bottom line)
  const targetIndex = lineIndex - 1; 
  chars[targetIndex] = invertBit(chars[targetIndex]);
  const newBinary = chars.join('');
  
  // Find trigram with this binary
  const newTrigramEntry = Object.values(TRIGRAMS).find(t => t.binary === newBinary);
  return newTrigramEntry || trigram; // Should always find
};

// Check relationship: Does A generate B? A control B?
const checkRelation = (ti: ElementType, yong: ElementType): { desc: string; score: DivinationResult['relationScore'] } => {
  if (ti === yong) return { desc: '体用比和 (同心同德)', score: 'Auspicious' };

  // Generating cycle: Metal->Water->Wood->Fire->Earth->Metal
  const generates = (a: ElementType, b: ElementType) => {
    if (a === ElementType.Metal && b === ElementType.Water) return true;
    if (a === ElementType.Water && b === ElementType.Wood) return true;
    if (a === ElementType.Wood && b === ElementType.Fire) return true;
    if (a === ElementType.Fire && b === ElementType.Earth) return true;
    if (a === ElementType.Earth && b === ElementType.Metal) return true;
    return false;
  };

  // Controlling cycle: Metal->Wood->Earth->Water->Fire->Metal
  const controls = (a: ElementType, b: ElementType) => {
    if (a === ElementType.Metal && b === ElementType.Wood) return true;
    if (a === ElementType.Wood && b === ElementType.Earth) return true;
    if (a === ElementType.Earth && b === ElementType.Water) return true;
    if (a === ElementType.Water && b === ElementType.Fire) return true;
    if (a === ElementType.Fire && b === ElementType.Metal) return true;
    return false;
  };

  if (generates(yong, ti)) return { desc: '用生体 (大吉 · 事情助我)', score: 'Great Auspicious' };
  if (generates(ti, yong)) return { desc: '体生用 (小凶 · 泄气操劳)', score: 'Minor Bad' };
  if (controls(ti, yong)) return { desc: '体克用 (小吉 · 努力可成)', score: 'Minor Auspicious' };
  if (controls(yong, ti)) return { desc: '用克体 (大凶 · 压力巨大)', score: 'Great Bad' };

  return { desc: '未知关系', score: 'Minor Bad' };
};

export const calculateDivination = (n1: number, n2: number, n3: number): DivinationResult => {
  const upperOriginal = getTrigram(n1);
  const lowerOriginal = getTrigram(n2);
  const movingLine = getMovingLine(n3);

  // Determine Ti (Body) and Yong (Application)
  // Rules: The Trigram WITH the moving line is Yong. The other is Ti.
  // Lines 1-3 are Lower, 4-6 are Upper.
  let tiGua: 'upper' | 'lower';
  let yongGua: 'upper' | 'lower';
  let upperChanged = upperOriginal;
  let lowerChanged = lowerOriginal;

  if (movingLine <= 3) {
    // Moving line in Lower Trigram
    yongGua = 'lower';
    tiGua = 'upper';
    lowerChanged = changeTrigram(lowerOriginal, movingLine);
  } else {
    // Moving line in Upper Trigram (line 4 is bottom of upper, etc)
    yongGua = 'upper';
    tiGua = 'lower';
    // Calculate relative line index for upper (4->1, 5->2, 6->3)
    upperChanged = changeTrigram(upperOriginal, movingLine - 3);
  }

  const tiElement = tiGua === 'upper' ? upperOriginal.element : lowerOriginal.element;
  const yongElement = yongGua === 'upper' ? upperOriginal.element : lowerOriginal.element;

  const relation = checkRelation(tiElement, yongElement);

  // Fetch I Ching Text
  const ichingText = getIChingText(upperOriginal.id, lowerOriginal.id);
  const movingLineText = ichingText ? ichingText.lines[movingLine] : undefined;
  
  // Fetch Changed Hexagram Text (Newly Added)
  const changedHexText = getIChingText(upperChanged.id, lowerChanged.id);

  return {
    inputNumbers: [n1, n2, n3],
    originalHexagram: {
      upper: upperOriginal,
      lower: lowerOriginal,
      name: getHexagramName(upperOriginal, lowerOriginal),
      sequence: getHexagramSequence(upperOriginal.id, lowerOriginal.id),
      text: ichingText,
    },
    changedHexagram: {
      upper: upperChanged,
      lower: lowerChanged,
      name: getHexagramName(upperChanged, lowerChanged),
      sequence: getHexagramSequence(upperChanged.id, lowerChanged.id),
      text: changedHexText, // Inject text for changed hexagram
    },
    movingLine,
    tiGua,
    yongGua,
    relation: relation.desc,
    relationScore: relation.score,
    movingLineText,
  };
};
