
import React, { useState, useMemo } from 'react';
import { HEXAGRAM_SEQUENCE, HEXAGRAM_NAMES, TRIGRAMS } from '../constants';
import { getIChingText } from '../utils/ichingData';
import { HexagramData, TrigramData } from '../types';
import HexagramVisual from './HexagramVisual';
import { Search, X, ScrollText, ArrowRight, MessageCircle } from 'lucide-react';

// 轻量级卦画组件，仅用于列表展示，减少DOM开销
const MiniHexagram: React.FC<{ upper: TrigramData; lower: TrigramData }> = ({ upper, lower }) => {
  // 从下到上绘制：下卦3爻 + 上卦3爻
  const lowerLines = lower.binary.split('');
  const upperLines = upper.binary.split('');
  const allLines = [...lowerLines, ...upperLines];

  return (
    <div className="flex flex-col-reverse gap-[2px] w-8 h-10 items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
      {allLines.map((bit, idx) => (
        <div key={idx} className="w-full h-[3px] flex justify-between">
          {bit === '1' ? (
            <div className="w-full bg-slate-800 rounded-[1px]"></div>
          ) : (
            <>
              <div className="w-[42%] bg-slate-800 rounded-[1px]"></div>
              <div className="w-[42%] bg-slate-800 rounded-[1px]"></div>
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

  // 构建完整的64卦数据列表
  const allHexagrams = useMemo(() => {
    const list: HexagramData[] = [];
    
    // 遍历顺序表
    Object.entries(HEXAGRAM_SEQUENCE).forEach(([key, seq]) => {
      const [upperId, lowerId] = key.split('-').map(Number);
      const upper = TRIGRAMS[upperId];
      const lower = TRIGRAMS[lowerId];
      const name = HEXAGRAM_NAMES[upperId]?.[lowerId] || '未知';
      const text = getIChingText(upperId, lowerId);

      list.push({
        upper,
        lower,
        name,
        sequence: seq,
        text
      });
    });

    return list.sort((a, b) => a.sequence - b.sequence);
  }, []);

  // 过滤逻辑
  const filteredList = allHexagrams.filter(h => 
    h.name.includes(searchTerm) || 
    h.sequence.toString() === searchTerm ||
    `上${h.upper.name}下${h.lower.name}`.includes(searchTerm) // 支持搜索结构，如“上坎”
  );

  return (
    <div className="max-w-4xl mx-auto min-h-[80vh] pb-20">
      {/* Header & Search */}
      <div className="mb-6 md:mb-8 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-slate-800">周易六十四卦典</h2>
        <div className="relative max-w-md mx-auto">
          <input 
            type="text" 
            placeholder="搜索卦名、序号或结构（如：既济、上坎下离）..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all"
          />
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 md:gap-4 px-2">
        {filteredList.map((hex) => (
          <button 
            key={hex.sequence}
            onClick={() => setSelectedHex(hex)}
            className="flex flex-col items-center justify-between py-3 px-1 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-amber-200 hover:-translate-y-1 transition-all group aspect-[3/4.5]"
          >
            <span className="text-[10px] text-slate-300 font-mono">#{hex.sequence}</span>
            <MiniHexagram upper={hex.upper} lower={hex.lower} />
            <div className="text-center mt-1">
                <div className="font-serif font-bold text-slate-700 text-sm leading-tight">{hex.name}</div>
                <div className="text-[10px] text-slate-400 scale-90 mt-0.5 font-medium opacity-80 whitespace-nowrap">
                    上{hex.upper.name}下{hex.lower.name}
                </div>
            </div>
          </button>
        ))}
      </div>
      
      {filteredList.length === 0 && (
         <div className="text-center py-12 text-slate-400">
            未找到相关卦象
         </div>
      )}

      {/* Detail Modal */}
      {selectedHex && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div 
            className="bg-[#fdfbf7] w-full max-w-2xl h-[90vh] md:h-[85vh] md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200/60 bg-white/50 shrink-0 md:rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-xs font-mono px-1.5 py-0.5 rounded">#{selectedHex.sequence}</span>
                    <h3 className="font-serif font-bold text-xl text-slate-800">{selectedHex.name}</h3>
                </div>
                <button 
                    onClick={() => setSelectedHex(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto overflow-x-hidden p-5 md:p-8 space-y-8 no-scrollbar">
                
                {/* Visual & Structure */}
                <div className="flex flex-col items-center">
                    <HexagramVisual hexagram={selectedHex} label="" />
                    <div className="mt-4 flex gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                            上卦: {selectedHex.upper.name}{selectedHex.upper.nature} ({selectedHex.upper.element})
                        </span>
                        <span className="w-[1px] h-4 bg-slate-300"></span>
                        <span className="flex items-center gap-1">
                            下卦: {selectedHex.lower.name}{selectedHex.lower.nature} ({selectedHex.lower.element})
                        </span>
                    </div>
                </div>

                {/* Ancient Text Content */}
                {selectedHex.text ? (
                    <div className="space-y-6">
                        {/* Guaci */}
                        <div className="relative pl-4 border-l-4 border-slate-800 space-y-3">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">卦辞</h4>
                                <p className="font-serif text-lg leading-relaxed text-slate-800">
                                    {selectedHex.text.guaci}
                                </p>
                            </div>
                            {/* Modern Explanation */}
                            {selectedHex.text.guaci_explain && (
                                <div className="bg-slate-100/80 p-3 rounded-lg text-sm text-slate-600 leading-relaxed font-sans">
                                    <span className="font-bold text-slate-700 mr-2">【现代速解】</span>
                                    {selectedHex.text.guaci_explain}
                                </div>
                            )}
                        </div>

                        {/* Xiang */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                <ScrollText size={14}/> 大象传
                             </h4>
                             <p className="font-serif text-slate-700 leading-relaxed">
                                {selectedHex.text.xiang}
                             </p>
                             {selectedHex.text.xiang_explain && (
                                <div className="pt-2 border-t border-slate-50 text-sm text-slate-500 font-sans">
                                    {selectedHex.text.xiang_explain}
                                </div>
                             )}
                        </div>

                        {/* Lines (Yaoci) */}
                        <div>
                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">六爻爻辞</h4>
                             <div className="space-y-3">
                                {[6, 5, 4, 3, 2, 1].map((lineNum) => (
                                    <div key={lineNum} className="group p-3 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                        <div className="flex gap-4">
                                            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-serif font-bold flex items-center justify-center text-sm">
                                                {lineNum}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="font-serif text-slate-700 leading-relaxed font-medium">
                                                    {selectedHex.text?.lines[lineNum]}
                                                </p>
                                                {selectedHex.text?.lines_explain?.[lineNum] && (
                                                    <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded-lg font-sans">
                                                       {selectedHex.text.lines_explain[lineNum]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400">
                        暂无古籍数据
                    </div>
                )}
            </div>
            
            {/* Footer Tip */}
            <div className="p-4 text-center text-[10px] text-slate-400 border-t border-slate-100 bg-white/50 md:rounded-b-2xl">
                《梅花易数》取象不拘泥于爻辞，但爻辞是理解卦义的根基。
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HexagramLib;
