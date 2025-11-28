
import React from 'react';
import { HexagramData, TrigramData } from '../types';

interface Props {
  hexagram: HexagramData;
  label: string;
  highlight?: 'upper' | 'lower'; // Which part to highlight visually
  movingLine?: number; // 1-6, to show indicator
}

const TrigramLines: React.FC<{ 
  trigram: TrigramData; 
  position: 'upper' | 'lower';
  isHighlight: boolean;
  movingLineIndex?: number; // 1,2,3 relative to trigram
}> = ({ trigram, position, isHighlight, movingLineIndex }) => {
  
  const lines = trigram.binary.split(''); // ['1', '1', '0'] -> [Bottom, Mid, Top]

  return (
    <div className={`flex flex-col-reverse gap-1.5 p-2 rounded-lg transition-colors ${isHighlight ? 'bg-amber-50/60 border border-amber-200/50' : 'bg-transparent border border-transparent'}`}>
      {lines.map((bit, idx) => {
        const currentLineNumRelative = idx + 1;
        const isMoving = movingLineIndex === currentLineNumRelative;

        return (
          // 响应式宽度：手机优化
          <div key={idx} className="relative h-4 w-16 md:w-20 lg:w-24 flex items-center justify-center">
             {/* The Line */}
            {bit === '1' ? (
              <div className={`w-full h-2 rounded-sm transition-colors ${isMoving ? 'bg-amber-600 shadow-sm' : 'bg-slate-800'}`}></div>
            ) : (
              <div className="w-full h-2 flex justify-between">
                <div className={`w-[45%] h-full rounded-sm transition-colors ${isMoving ? 'bg-amber-600 shadow-sm' : 'bg-slate-800'}`}></div>
                <div className={`w-[45%] h-full rounded-sm transition-colors ${isMoving ? 'bg-amber-600 shadow-sm' : 'bg-slate-800'}`}></div>
              </div>
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
        <span className="text-xs font-serif text-slate-400 mb-2 tracking-widest">{label}</span>
        <div className="flex flex-col gap-1 border border-slate-200 p-2 bg-white shadow-sm rounded-xl">
            {/* Upper Trigram */}
            <div className="relative">
                <TrigramLines 
                    trigram={hexagram.upper} 
                    position="upper" 
                    isHighlight={highlight === 'upper'} 
                    movingLineIndex={movingLineUpper}
                />
                 <span className="absolute -left-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-serif writing-vertical-lr pointer-events-none select-none">
                    {hexagram.upper.name}
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
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-serif writing-vertical-lr pointer-events-none select-none">
                    {hexagram.lower.name}
                </span>
            </div>
        </div>
        
        {/* Optimized Hexagram Info Info */}
        <div className="mt-3 text-center">
            <h3 className="text-base font-bold font-serif text-slate-800">{hexagram.name}</h3>
            {/* Comprehensive Structure Info */}
            <div className="mt-1 text-[10px] text-slate-400 font-medium leading-tight space-y-0.5">
                <div>上{hexagram.upper.name}{hexagram.upper.nature} ({hexagram.upper.element})</div>
                <div>下{hexagram.lower.name}{hexagram.lower.nature} ({hexagram.lower.element})</div>
            </div>
        </div>
    </div>
  );
};

export default HexagramVisual;
