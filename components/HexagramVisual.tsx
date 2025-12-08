
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
    <div className="flex items-center w-full py-[3px] px-0">
      <div className="relative flex-1 flex justify-center">
        {/* Background Name Watermark - Subtler */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-serif text-slate-900 pointer-events-none select-none z-0 opacity-[0.03]">
            {trigram.name}
        </div>

        <div className="flex flex-col-reverse gap-[4px] w-full max-w-[60px] md:max-w-[70px] z-10">
          {lines.map((bit, idx) => {
              const currentLineNumRelative = idx + 1;
              const isMoving = movingLineIndex === currentLineNumRelative;

              return (
              <div key={idx} className="h-2 w-full flex justify-between relative group">
                  {bit === '1' ? (
                  <div className={`w-full h-full rounded-sm transition-colors duration-500 ${isMoving ? 'bg-amber-500' : (hasRoleContext && isTi ? 'bg-slate-800' : 'bg-slate-700')}`}></div>
                  ) : (
                  <>
                      <div className={`w-[42%] h-full rounded-sm transition-colors duration-500 ${isMoving ? 'bg-amber-500' : (hasRoleContext && isTi ? 'bg-slate-800' : 'bg-slate-700')}`}></div>
                      <div className={`w-[42%] h-full rounded-sm transition-colors duration-500 ${isMoving ? 'bg-amber-500' : (hasRoleContext && isTi ? 'bg-slate-800' : 'bg-slate-700')}`}></div>
                  </>
                  )}
                  {isMoving && <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_4px_rgba(245,158,11,0.5)]"></div>}
              </div>
              );
          })}
        </div>
      </div>
    </div>
  );
};

const HexagramVisual: React.FC<Props> = ({ hexagram, label, highlight, movingLine }) => {
  const movingLineLower = (movingLine && movingLine <= 3) ? movingLine : undefined;
  const movingLineUpper = (movingLine && movingLine > 3) ? movingLine - 3 : undefined;

  return (
    <div className="flex flex-col items-center select-none">
        {label && <span className="text-[9px] font-bold text-slate-300 mb-1 uppercase tracking-wider">{label}</span>}
        
        <div className="flex flex-col gap-[2px] w-20 md:w-24 relative">
            <TrigramVisualRow 
                trigram={hexagram.upper} 
                position="upper" 
                isTi={highlight === 'upper'} 
                isYong={highlight === 'lower'}
                hasRoleContext={!!highlight}
                movingLineIndex={movingLineUpper}
            />

            {/* Gap between Trigrams */}
            <div className="h-[2px]"></div>

            <TrigramVisualRow 
                trigram={hexagram.lower} 
                position="lower" 
                isTi={highlight === 'lower'} 
                isYong={highlight === 'upper'}
                hasRoleContext={!!highlight}
                movingLineIndex={movingLineLower}
            />
        </div>
        
        {/* Labels below */}
        <div className="mt-2 text-center opacity-0 hover:opacity-100 transition-opacity absolute top-full left-0 right-0 bg-white/90 backdrop-blur text-[10px] py-1 border rounded shadow-sm z-20 pointer-events-none">
            <span className="font-serif font-bold text-slate-800">{hexagram.name}</span>
        </div>
    </div>
  );
};

export default HexagramVisual;
