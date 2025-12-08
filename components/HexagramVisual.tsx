
import React from 'react';
import { HexagramData, TrigramData } from '../types';

interface Props {
  hexagram: HexagramData;
  label?: string;
  highlight?: 'upper' | 'lower'; 
  movingLine?: number; 
}

const TrigramVisualRow: React.FC<{ 
  trigram: TrigramData; 
  position: 'upper' | 'lower';
  isTi: boolean; 
  isYong: boolean; 
  hasRoleContext: boolean; 
  movingLineIndex?: number; 
}> = ({ trigram, position, isTi, isYong, hasRoleContext, movingLineIndex }) => {
  
  const lines = trigram.binary.split(''); 

  return (
    <div className="flex items-center w-full py-1.5 pl-1 pr-0">
      <div className="relative flex-1 flex justify-center py-0.5">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-serif text-slate-100 pointer-events-none select-none z-0 opacity-60">
            {trigram.name}
        </div>

        <div className="flex flex-col-reverse gap-1.5 w-full max-w-[90px] md:max-w-[100px] z-10">
          {lines.map((bit, idx) => {
              const currentLineNumRelative = idx + 1;
              const isMoving = movingLineIndex === currentLineNumRelative;

              return (
              <div key={idx} className="h-3 md:h-3.5 w-full flex justify-between relative group">
                  {bit === '1' ? (
                  <div className={`w-full h-full rounded-[1px] transition-colors duration-500 ${isMoving ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                  ) : (
                  <>
                      <div className={`w-[44%] h-full rounded-[1px] transition-colors duration-500 ${isMoving ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                      <div className={`w-[44%] h-full rounded-[1px] transition-colors duration-500 ${isMoving ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                  </>
                  )}
                  {isMoving && <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full"></div>}
              </div>
              );
          })}
        </div>
      </div>

      <div className="w-8 flex justify-center shrink-0 z-20">
         {hasRoleContext && isTi && (
             <div className="w-6 h-6 rounded border border-red-600/30 text-red-600 bg-red-50 flex items-center justify-center font-serif font-bold text-xs shadow-sm">体</div>
         )}
         {hasRoleContext && isYong && (
             <div className="w-6 h-6 rounded border border-slate-200 text-slate-400 bg-white flex items-center justify-center font-serif font-bold text-xs shadow-sm">用</div>
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
        {label && <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</span>}
        
        <div className="flex flex-col gap-0.5 w-32 md:w-40 pt-2 pb-2 px-2 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
             {/* Small sequence badge at top left */}
             <div className="absolute top-1 left-1.5 text-[8px] text-slate-300 font-mono">#{hexagram.sequence}</div>

            <TrigramVisualRow 
                trigram={hexagram.upper} 
                position="upper" 
                isTi={highlight === 'upper'} 
                isYong={highlight === 'lower'}
                hasRoleContext={!!highlight}
                movingLineIndex={movingLineUpper}
            />

            <div className="h-px bg-slate-100 w-2/3 mx-auto my-0.5"></div>

            <TrigramVisualRow 
                trigram={hexagram.lower} 
                position="lower" 
                isTi={highlight === 'lower'} 
                isYong={highlight === 'upper'}
                hasRoleContext={!!highlight}
                movingLineIndex={movingLineLower}
            />
        </div>
        
        <div className="mt-2 text-center">
            <h3 className="text-base font-bold font-serif text-slate-800 tracking-wide">{hexagram.name}</h3>
            <div className="mt-0.5 flex flex-col gap-0">
                <div className="text-[9px] text-slate-400 font-medium scale-90 origin-center">
                   上{hexagram.upper.name}{hexagram.upper.nature} · 下{hexagram.lower.name}{hexagram.lower.nature}
                </div>
            </div>
        </div>
    </div>
  );
};

export default HexagramVisual;
