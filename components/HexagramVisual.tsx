
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
  isTi: boolean; 
  isYong: boolean; 
  hasRoleContext: boolean; 
  movingLineIndex?: number; 
}> = ({ trigram, position, isTi, isYong, hasRoleContext, movingLineIndex }) => {
  
  const lines = trigram.binary.split(''); // ['1', '1', '0'] -> [Bottom, Mid, Top]

  return (
    <div className="flex items-center w-full py-2 pl-2 pr-0">
      
      {/* Left: The Lines & Watermark Container */}
      <div className="relative flex-1 flex justify-center py-1">
        
        {/* Watermark Character (Background, centered on lines) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-serif text-slate-100 pointer-events-none select-none z-0 opacity-80">
            {trigram.name}
        </div>

        {/* The Lines */}
        <div className="flex flex-col-reverse gap-2 w-full max-w-[120px] z-10">
          {lines.map((bit, idx) => {
              const currentLineNumRelative = idx + 1;
              const isMoving = movingLineIndex === currentLineNumRelative;

              return (
              <div key={idx} className="h-3.5 md:h-4 w-full flex justify-between relative group">
                  {bit === '1' ? (
                  <div className={`w-full h-full rounded-[1px] transition-colors duration-500 ${isMoving ? 'bg-amber-600' : 'bg-slate-800'}`}></div>
                  ) : (
                  <>
                      <div className={`w-[44%] h-full rounded-[1px] transition-colors duration-500 ${isMoving ? 'bg-amber-600' : 'bg-slate-800'}`}></div>
                      <div className={`w-[44%] h-full rounded-[1px] transition-colors duration-500 ${isMoving ? 'bg-amber-600' : 'bg-slate-800'}`}></div>
                  </>
                  )}
                  
                  {/* Moving Line Dot Indicator (Right of the line) */}
                  {isMoving && (
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-amber-600 rounded-full shadow-sm"></div>
                  )}
              </div>
              );
          })}
        </div>
      </div>

      {/* Right: Dedicated Column for Ti/Yong Seal */}
      <div className="w-12 flex justify-center shrink-0 z-20">
         {hasRoleContext && isTi && (
             <div className="w-8 h-8 rounded-[4px] border border-red-700/60 text-red-700 bg-white/50 flex items-center justify-center font-serif font-bold text-sm shadow-sm rotate-12 backdrop-blur-sm" title="体卦：代表自己">
                 体
             </div>
         )}
         {hasRoleContext && isYong && (
             <div className="w-8 h-8 rounded-[4px] border border-slate-300 text-slate-400 bg-white/50 flex items-center justify-center font-serif font-bold text-sm shadow-sm -rotate-6 backdrop-blur-sm" title="用卦：代表事物">
                 用
             </div>
         )}
      </div>
    </div>
  );
};

const HexagramVisual: React.FC<Props> = ({ hexagram, label, highlight, movingLine }) => {
  const movingLineLower = (movingLine && movingLine <= 3) ? movingLine : undefined;
  const movingLineUpper = (movingLine && movingLine > 3) ? movingLine - 3 : undefined;

  return (
    <div className="flex flex-col items-center">
        <span className="text-[10px] font-sans font-bold text-slate-400 mb-3 tracking-[0.2em] uppercase">{label}</span>
        
        <div className="flex flex-col gap-1 w-44 md:w-52 p-3 rounded-2xl bg-white shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100/50 relative overflow-hidden">
             {/* Sequence Badge */}
            <div className="absolute top-2 left-2 bg-slate-50 text-slate-300 text-[9px] px-1.5 py-0.5 rounded border border-slate-100 font-mono z-30">
                #{hexagram.sequence}
            </div>

            <TrigramVisualRow 
                trigram={hexagram.upper} 
                position="upper" 
                isTi={highlight === 'upper'} 
                isYong={highlight === 'lower'}
                hasRoleContext={!!highlight}
                movingLineIndex={movingLineUpper}
            />

            <div className="h-px bg-slate-100 w-1/2 mx-auto opacity-50 my-1"></div>

            <TrigramVisualRow 
                trigram={hexagram.lower} 
                position="lower" 
                isTi={highlight === 'lower'} 
                isYong={highlight === 'upper'}
                hasRoleContext={!!highlight}
                movingLineIndex={movingLineLower}
            />
        </div>
        
        {/* Hexagram Name & Info */}
        <div className="mt-4 text-center">
            <h3 className="text-xl font-bold font-serif text-slate-800 tracking-wide">{hexagram.name}</h3>
            <div className="mt-2 flex flex-col gap-0.5">
                <div className="text-[10px] text-slate-500 font-medium font-sans">
                   上{hexagram.upper.name}{hexagram.upper.nature}<span className="text-slate-300 mx-1">/</span>五行属{hexagram.upper.element}
                </div>
                <div className="text-[10px] text-slate-500 font-medium font-sans">
                   下{hexagram.lower.name}{hexagram.lower.nature}<span className="text-slate-300 mx-1">/</span>五行属{hexagram.lower.element}
                </div>
            </div>
        </div>
    </div>
  );
};

export default HexagramVisual;