
import React from 'react';
import { HexagramData, TrigramData } from '../types';

interface Props {
  hexagram: HexagramData;
  label: string;
  highlight?: 'upper' | 'lower'; // Highlight indicates the 'Ti' (Body) gua
  movingLine?: number; // 1-6, to show indicator
}

const TrigramVisualRow: React.FC<{ 
  trigram: TrigramData; 
  position: 'upper' | 'lower';
  isTi: boolean; // True if this is Ti (Body)
  isYong: boolean; // True if this is Yong (Application)
  hasRoleContext: boolean; // True if we should show Ti/Yong labels
  movingLineIndex?: number; // 1,2,3 relative to trigram
}> = ({ trigram, position, isTi, isYong, hasRoleContext, movingLineIndex }) => {
  
  const lines = trigram.binary.split(''); // ['1', '1', '0'] -> [Bottom, Mid, Top]

  return (
    <div className={`relative flex items-center justify-between gap-3 md:gap-4 p-2.5 rounded-xl transition-all ${isTi ? 'bg-amber-50 border border-amber-200/60 shadow-sm' : 'border border-transparent'}`}>
      
      {/* Left: The Trigram Character (Big) */}
      <div className="flex flex-col items-center justify-center w-8 md:w-10 shrink-0">
         <span className={`text-2xl md:text-3xl font-serif font-bold leading-none ${isTi ? 'text-slate-800' : 'text-slate-400'}`}>
            {trigram.name}
         </span>
         <span className="text-[10px] text-slate-400 mt-1 scale-90">{trigram.nature}·{trigram.element}</span>
      </div>

      {/* Middle: The Lines */}
      <div className="flex flex-col-reverse gap-1.5 grow">
        {lines.map((bit, idx) => {
            const currentLineNumRelative = idx + 1;
            const isMoving = movingLineIndex === currentLineNumRelative;

            return (
            <div key={idx} className="relative h-3.5 md:h-4 flex items-center justify-center w-full">
                {bit === '1' ? (
                <div className={`w-full h-full rounded-[2px] transition-colors ${isMoving ? 'bg-amber-600 shadow-sm ring-1 ring-amber-300' : 'bg-slate-700'}`}></div>
                ) : (
                <div className="w-full h-full flex justify-between">
                    <div className={`w-[42%] h-full rounded-[2px] transition-colors ${isMoving ? 'bg-amber-600 shadow-sm ring-1 ring-amber-300' : 'bg-slate-700'}`}></div>
                    <div className={`w-[42%] h-full rounded-[2px] transition-colors ${isMoving ? 'bg-amber-600 shadow-sm ring-1 ring-amber-300' : 'bg-slate-700'}`}></div>
                </div>
                )}
            </div>
            );
        })}
      </div>

      {/* Right: The Ti/Yong Seal */}
      <div className="w-8 md:w-10 shrink-0 flex items-center justify-center">
         {hasRoleContext && isTi && (
             <div className="w-8 h-8 rounded-full border-2 border-red-700/80 text-red-700 bg-red-50 flex items-center justify-center font-serif font-bold text-sm shadow-sm rotate-12 opacity-90">
                 体
             </div>
         )}
         {hasRoleContext && isYong && (
             <div className="w-8 h-8 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center font-serif font-bold text-sm -rotate-6 bg-slate-50">
                 用
             </div>
         )}
      </div>
    </div>
  );
};

const HexagramVisual: React.FC<Props> = ({ hexagram, label, highlight, movingLine }) => {
  // Calculate relative moving line index
  const movingLineLower = (movingLine && movingLine <= 3) ? movingLine : undefined;
  const movingLineUpper = (movingLine && movingLine > 3) ? movingLine - 3 : undefined;

  return (
    <div className="flex flex-col items-center">
        <span className="text-xs font-serif text-slate-400 mb-2 tracking-[0.2em]">{label}</span>
        
        <div className="flex flex-col gap-2 w-48 md:w-56 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
             {/* Sequence Badge (Top Left Corner) */}
            <div className="absolute top-0 left-0 bg-slate-100 text-slate-400 text-[9px] px-2 py-0.5 rounded-br-lg font-mono z-10">
                #{hexagram.sequence}
            </div>

            {/* Upper Trigram */}
            <TrigramVisualRow 
                trigram={hexagram.upper} 
                position="upper" 
                isTi={highlight === 'upper'} 
                isYong={highlight === 'lower'}
                hasRoleContext={!!highlight}
                movingLineIndex={movingLineUpper}
            />

            {/* Divider */}
            <div className="h-px bg-slate-100 w-full mx-auto"></div>

            {/* Lower Trigram */}
            <TrigramVisualRow 
                trigram={hexagram.lower} 
                position="lower" 
                isTi={highlight === 'lower'} 
                isYong={highlight === 'upper'}
                hasRoleContext={!!highlight}
                movingLineIndex={movingLineLower}
            />
        </div>
        
        {/* Hexagram Name */}
        <div className="mt-3 text-center">
            <h3 className="text-lg font-bold font-serif text-slate-800 tracking-wide">{hexagram.name}</h3>
            <div className="mt-1 text-[10px] text-slate-400 font-medium">
                {/* Structure Info */}
                <span className="mr-1">上{hexagram.upper.name}{hexagram.upper.element}</span>
                <span className="text-slate-300">/</span>
                <span className="ml-1">下{hexagram.lower.name}{hexagram.lower.element}</span>
            </div>
        </div>
    </div>
  );
};

export default HexagramVisual;
