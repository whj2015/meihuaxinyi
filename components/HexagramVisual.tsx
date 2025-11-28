
import React from 'react';
import { HexagramData, TrigramData } from '../types';

interface Props {
  hexagram: HexagramData;
  label: string;
  highlight?: 'upper' | 'lower'; // Highlight indicates the 'Ti' (Body) gua
  movingLine?: number; // 1-6, to show indicator
}

const TrigramLines: React.FC<{ 
  trigram: TrigramData; 
  position: 'upper' | 'lower';
  isHighlight: boolean; // True if this is Ti (Body)
  hasRoleContext: boolean; // True if we should show Ti/Yong labels
  movingLineIndex?: number; // 1,2,3 relative to trigram
}> = ({ trigram, position, isHighlight, hasRoleContext, movingLineIndex }) => {
  
  const lines = trigram.binary.split(''); // ['1', '1', '0'] -> [Bottom, Mid, Top]

  return (
    <div className={`relative flex flex-col-reverse gap-1.5 p-2 rounded-lg transition-colors ${isHighlight ? 'bg-amber-50/60 border border-amber-200/50' : 'bg-transparent border border-transparent'}`}>
      
      {/* Ti/Yong Badge */}
      {hasRoleContext && (
        <div className={`absolute -right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border ${isHighlight ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-400 border-slate-200'}`}>
          {isHighlight ? '体' : '用'}
        </div>
      )}

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
        <span className="text-xs font-serif text-slate-400 mb-1 tracking-widest">{label}</span>
        
        {/* Sequence Badge */}
        <div className="mb-2 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-mono">
            第 {hexagram.sequence} 卦
        </div>

        <div className="flex flex-col gap-1 border border-slate-200 p-2 bg-white shadow-sm rounded-xl relative">
            {/* Upper Trigram */}
            <div className="relative">
                <TrigramLines 
                    trigram={hexagram.upper} 
                    position="upper" 
                    isHighlight={highlight === 'upper'} 
                    hasRoleContext={!!highlight}
                    movingLineIndex={movingLineUpper}
                />
                 <span className="absolute -left-5 md:-left-8 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-serif w-full text-right pr-2">
                    {hexagram.upper.name}
                </span>
            </div>

            {/* Lower Trigram */}
            <div className="relative">
                <TrigramLines 
                    trigram={hexagram.lower} 
                    position="lower" 
                    isHighlight={highlight === 'lower'} 
                    hasRoleContext={!!highlight}
                    movingLineIndex={movingLineLower}
                />
                <span className="absolute -left-5 md:-left-8 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-serif w-full text-right pr-2">
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
