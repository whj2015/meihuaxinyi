
import React, { useState, useMemo } from 'react';
import { HEXAGRAM_SEQUENCE, HEXAGRAM_NAMES, TRIGRAMS } from '../constants';
import { getIChingText } from '../utils/ichingData';
import { HexagramData, TrigramData } from '../types';
import HexagramVisual from './HexagramVisual';
import { Search, X, ScrollText, ArrowRight } from 'lucide-react';

const MiniHexagram: React.FC<{ upper: TrigramData; lower: TrigramData }> = ({ upper, lower }) => {
  const lowerLines = lower.binary.split('');
  const upperLines = upper.binary.split('');
  const allLines = [...lowerLines, ...upperLines];

  return (
    <div className="flex flex-col-reverse gap-[2px] w-6 h-8 items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
      {allLines.map((bit, idx) => (
        <div key={idx} className="w-full h-[2px] flex justify-between">
          {bit === '1' ? (
            <div className="w-full bg-slate-800 rounded-[1px]"></div>
          ) : (
            <>
              <div className="w-[40%] bg-slate-800 rounded-[1px]"></div>
              <div className="w-[40%] bg-slate-800 rounded-[1px]"></div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

const HexagramLib: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHex, setSelectedHex] = useState<HexagramData | null>(null);

  const allHexagrams = useMemo(() => {
    const list: HexagramData[] = [];
    Object.entries(HEXAGRAM_SEQUENCE).forEach(([key, seq]) => {
      const [upperId, lowerId] = key.split('-').map(Number);
      const upper = TRIGRAMS[upperId];
      const lower = TRIGRAMS[lowerId];
      const name = HEXAGRAM_NAMES[upperId]?.[lowerId] || '未知';
      const text = getIChingText(upperId, lowerId);
      list.push({ upper, lower, name, sequence: seq, text });
    });
    return list.sort((a, b) => a.sequence - b.sequence);
  }, []);

  const filteredList = allHexagrams.filter(h => 
    h.name.includes(searchTerm) || 
    h.sequence.toString() === searchTerm ||
    `上${h.upper.name}下${h.lower.name}`.includes(searchTerm)
  );

  return (
    <div className="max-w-4xl mx-auto min-h-[80vh] pb-24">
      {/* Header & Search */}
      <div className="mb-6 text-center space-y-4 px-2">
        <h2 className="text-xl font-serif font-bold text-slate-800">周易六十四卦典</h2>
        <div className="relative max-w-md mx-auto">
          <input 
            type="text" 
            placeholder="搜索..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-full shadow-sm focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all text-sm"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
        </div>
      </div>

      {/* Grid: 3 cols mobile, 6 cols tablet, 8 cols desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2 md:gap-4 px-1">
        {filteredList.map((hex) => (
          <button 
            key={hex.sequence}
            onClick={() => setSelectedHex(hex)}
            className="flex flex-col items-center justify-between py-2 px-1 bg-white border border-slate-100 rounded-xl active:scale-95 hover:shadow-md transition-all group aspect-[3/4]"
          >
            <span className="text-[9px] text-slate-300 font-mono self-start ml-1">#{hex.sequence}</span>
            <MiniHexagram upper={hex.upper} lower={hex.lower} />
            <div className="text-center mt-1">
                <div className="font-serif font-bold text-slate-700 text-xs leading-tight">{hex.name}</div>
            </div>
          </button>
        ))}
      </div>
      
      {filteredList.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">未找到相关卦象</div>}

      {/* Detail Drawer/Modal */}
      {selectedHex && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div 
            className="bg-[#fdfbf7] w-full max-w-2xl h-[85vh] md:h-[85vh] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200/60 bg-white/50 shrink-0 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-xs font-mono px-1.5 py-0.5 rounded">#{selectedHex.sequence}</span>
                    <h3 className="font-serif font-bold text-lg text-slate-800">{selectedHex.name}</h3>
                </div>
                <button onClick={() => setSelectedHex(null)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto p-5 md:p-8 space-y-6 pb-safe">
                <div className="flex flex-col items-center">
                    <HexagramVisual hexagram={selectedHex} label="" />
                    <div className="mt-4 flex gap-4 text-xs text-slate-500 font-medium">
                        <span>上{selectedHex.upper.name}{selectedHex.upper.nature} ({selectedHex.upper.element})</span>
                        <span className="w-[1px] h-4 bg-slate-300"></span>
                        <span>下{selectedHex.lower.name}{selectedHex.lower.nature} ({selectedHex.lower.element})</span>
                    </div>
                </div>

                {selectedHex.text ? (
                    <div className="space-y-6">
                        <div className="relative pl-3 border-l-4 border-slate-800 space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase">卦辞</h4>
                            <p className="font-serif text-base leading-relaxed text-slate-800">{selectedHex.text.guaci}</p>
                            {selectedHex.text.guaci_explain && (
                                <div className="bg-slate-100/80 p-2.5 rounded-lg text-sm text-slate-600 font-sans mt-2">{selectedHex.text.guaci_explain}</div>
                            )}
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2">
                             <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><ScrollText size={12}/> 大象传</h4>
                             <p className="font-serif text-slate-700 text-sm leading-relaxed">{selectedHex.text.xiang}</p>
                             {selectedHex.text.xiang_explain && <div className="pt-2 border-t border-slate-50 text-xs text-slate-500">{selectedHex.text.xiang_explain}</div>}
                        </div>

                        <div>
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 text-center">六爻</h4>
                             <div className="space-y-2">
                                {[6, 5, 4, 3, 2, 1].map((lineNum) => (
                                    <div key={lineNum} className="p-3 bg-white rounded-xl border border-slate-50 flex gap-3">
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-serif font-bold flex items-center justify-center text-xs">{lineNum}</div>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-serif text-slate-700 text-sm font-medium">{selectedHex.text?.lines[lineNum]}</p>
                                            {selectedHex.text?.lines_explain?.[lineNum] && <p className="text-xs text-slate-400">{selectedHex.text.lines_explain[lineNum]}</p>}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                ) : <div className="text-center py-10 text-slate-400">暂无数据</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HexagramLib;
