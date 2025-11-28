import React from 'react';
import { HexagramData, TrigramData } from '../types';

interface Props {
  hexagram: HexagramData;
  label: string;
  highlight?: 'upper' | 'lower'; // Which part to highlight visually
  movingLine?: number; // 1-6, to show a dot or indicator
}

const TrigramLines: React.FC<{ 
  trigram: TrigramData; 
  position: 'upper' | 'lower';
  isHighlight: boolean;
  movingLineIndex?: number; // 1,2,3 relative to trigram
}> = ({ trigram, position, isHighlight, movingLineIndex }) => {
  
  const lines = trigram.binary.split(''); // ['1', '1', '0'] -> [Bottom, Mid, Top]

  return (
    <div className={`flex flex-col-reverse gap-1.5 p-2 rounded-lg transition-colors ${isHighlight ? 'bg-amber-50 border border-amber-200' : 'bg-transparent border border-transparent'}`}>
      {lines.map((bit, idx) => {
        const currentLineNumRelative = idx + 1;
        const isMoving = movingLineIndex === currentLineNumRelative;

        return (
          // 响应式宽度：手机 w-16, 平板/桌面 w-24
          <div key={idx} className="relative h-4 w-16 md:w-24 flex items-center justify-center">
             {/* The Line */}
            {bit === '1' ? (
              <div className="w-full h-2 bg-slate-800 rounded-sm"></div>
            ) : (
              <div className="w-full h-2 flex justify-between">
                <div className="w-[45%] h-full bg-slate-800 rounded-sm"></div>
                <div className="w-[45%] h-full bg-slate-800 rounded-sm"></div>
              </div>
            )}
            
            {/* Moving Indicator */}
            {isMoving && (
               <div className="absolute -right-3 md:-right-4 w-2 h-2 rounded-full bg-cinnabar animate-pulse shadow-[0_0_8px_rgba(198,40,40,0.6)]"></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const HexagramVisual: React.FC<Props> = ({ hexagram, label, highlight, movingLine }) => {
  // Calculate relative moving line index
  const movingLineLower = (movingLine && movingLine <= 3) ? movingLine : undefined;
  const movingLineUpper = (movingLine && movingLine > 3) ? movingLine - 3 : undefined;

  return (
    <div className="flex flex-col items-center">
        <span className="text-xs md:text-sm font-serif text-slate-500 mb-2">{label}</span>
        <div className="flex flex-col gap-1 border-2 border-slate-100 p-2 md:p-3 bg-white shadow-sm rounded-xl">
            {/* Upper Trigram */}
            <div className="relative">
                <TrigramLines 
                    trigram={hexagram.upper} 
                    position="upper" 
                    isHighlight={highlight === 'upper'} 
                    movingLineIndex={movingLineUpper}
                />
                 <span className="absolute -left-5 md:-left-6 top-1/2 -translate-y-1/2 text-[10px] md:text-xs text-slate-400 font-serif writing-vertical-lr pointer-events-none select-none">
                    {hexagram.upper.name} · {hexagram.upper.nature}
                </span>
            </div>

            {/* Lower Trigram */}
            <div className="relative">
                <TrigramLines 
                    trigram={hexagram.lower} 
                    position="lower" 
                    isHighlight={highlight === 'lower'} 
                    movingLineIndex={movingLineLower}
                />
                <span className="absolute -left-5 md:-left-6 top-1/2 -translate-y-1/2 text-[10px] md:text-xs text-slate-400 font-serif writing-vertical-lr pointer-events-none select-none">
                    {hexagram.lower.name} · {hexagram.lower.nature}
                </span>
            </div>
        </div>
        <div className="mt-3 text-center">
            {hexagram.sequence > 0 && (
                <div className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 inline-block mb-1">
                    第 {hexagram.sequence} 卦
                </div>
            )}
            <h3 className="text-base md:text-lg font-bold font-serif text-slate-800">{hexagram.name}</h3>
        </div>
    </div>
  );
};

export default HexagramVisual;