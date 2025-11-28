
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Compass, Award, Layers } from 'lucide-react';

const RoadmapItem: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 px-2 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-serif font-bold text-slate-800 text-lg">{title}</span>
        {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-2 pb-6 text-slate-600 leading-relaxed space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

const Roadmap: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-2xl p-6 border border-slate-100">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">梅花易数 · 修行之路</h2>
        <p className="text-slate-500 text-sm">从小白到自主实践的进阶指南</p>
      </div>

      <RoadmapItem title="第一阶段：打好根基（新手村）" defaultOpen={true}>
        <div className="flex items-start gap-3">
          <BookOpen className="text-amber-600 mt-1 shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-slate-800 mb-1">核心思想：自然 Wi-Fi</h4>
            <p className="text-sm">接受“天人感应”、“万物关联”。相信眼前的一切都不是偶然，这是学习的基础。</p>
          </div>
        </div>
        <div className="flex items-start gap-3 mt-4">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0 mt-1">八</div>
          <div>
             <h4 className="font-bold text-slate-800 mb-1">掌握八卦</h4>
             <p className="text-sm mb-2">熟悉八个基本卦的象征和万物类象。</p>
             <div className="grid grid-cols-4 gap-2 text-center text-xs text-slate-500">
                <span className="bg-slate-50 p-1 rounded">乾(天)</span>
                <span className="bg-slate-50 p-1 rounded">坤(地)</span>
                <span className="bg-slate-50 p-1 rounded">震(雷)</span>
                <span className="bg-slate-50 p-1 rounded">巽(风)</span>
                <span className="bg-slate-50 p-1 rounded">坎(水)</span>
                <span className="bg-slate-50 p-1 rounded">离(火)</span>
                <span className="bg-slate-50 p-1 rounded">艮(山)</span>
                <span className="bg-slate-50 p-1 rounded">兑(泽)</span>
             </div>
          </div>
        </div>
      </RoadmapItem>

      <RoadmapItem title="第二阶段：掌握方法（技能营）">
        <div className="flex items-start gap-3">
          <Compass className="text-amber-600 mt-1 shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-slate-800 mb-1">数字起卦法（最常用）</h4>
            <ul className="list-disc list-inside text-sm space-y-1 ml-1">
              <li><span className="font-semibold">上卦</span>：第一个数 ÷ 8 (取余数)</li>
              <li><span className="font-semibold">下卦</span>：第二个数 ÷ 8 (取余数)</li>
              <li><span className="font-semibold">动爻</span>：第三个数 ÷ 6 (取余数)</li>
            </ul>
            <p className="text-xs text-slate-400 mt-2">注：余数为0时，取除数(8或6)。</p>
          </div>
        </div>

        <div className="flex items-start gap-3 mt-6">
          <Layers className="text-amber-600 mt-1 shrink-0" size={20} />
          <div>
             <h4 className="font-bold text-slate-800 mb-1">互卦：洞察隐情与过程</h4>
             <p className="text-sm mb-2 text-slate-600">本卦代表开始，变卦代表结果，而互卦代表<strong>中间过程</strong>和内部隐情。</p>
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                <p><span className="font-bold text-slate-700">内互（下卦）</span>：取本卦的 2、3、4 爻。</p>
                <p><span className="font-bold text-slate-700">外互（上卦）</span>：取本卦的 3、4、5 爻。</p>
                <p className="text-slate-400 mt-1">组合起来即为互卦，揭示事物发展的内在逻辑。</p>
             </div>
          </div>
        </div>

        <div className="flex items-start gap-3 mt-6">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0 mt-1">解</div>
          <div>
            <h4 className="font-bold text-slate-800 mb-1">五步解卦法</h4>
            <div className="space-y-3 text-sm border-l-2 border-slate-100 pl-3">
                <div>
                    <span className="text-amber-600 font-bold">1. 看本卦</span>
                    <p className="text-slate-500">查字典（易经），看大环境。</p>
                </div>
                <div>
                    <span className="text-amber-600 font-bold">2. 看动爻</span>
                    <p className="text-slate-500">找关键转折点。</p>
                </div>
                <div>
                    <span className="text-amber-600 font-bold">3. 分体用（精髓）</span>
                    <p className="text-slate-500">不动为体（自己），动为用（事物）。看五行生克。</p>
                </div>
                <div>
                    <span className="text-amber-600 font-bold">4. 看互卦与变卦</span>
                    <p className="text-slate-500">互卦看过程与隐情，变卦看最终趋势。</p>
                </div>
                <div>
                    <span className="text-amber-600 font-bold">5. 编故事</span>
                    <p className="text-slate-500">综合所有信息，结合所问之事，像侦探一样推理。</p>
                </div>
            </div>
          </div>
        </div>
      </RoadmapItem>

      <RoadmapItem title="第三阶段：实践与精进（出师）">
         <div className="flex items-start gap-3">
          <Award className="text-amber-600 mt-1 shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-slate-800 mb-1">日常修行</h4>
            <ul className="list-disc list-inside text-sm space-y-2 ml-1">
              <li><span className="font-semibold">从小事练起</span>：找钥匙、测天气。</li>
              <li><span className="font-semibold">占卜日记</span>：记录并复盘，这是进步最快的方式。</li>
              <li><span className="font-semibold">象思维</span>：看树不仅是树，是震卦（生长），是巽卦（木）。</li>
            </ul>
          </div>
        </div>
         <div className="bg-amber-50 p-3 rounded-lg mt-4 text-xs text-amber-900 border border-amber-100">
            <strong>核心心法：</strong>不动不占，心诚则灵，善易者不卜。
         </div>
      </RoadmapItem>
    </div>
  );
};

export default Roadmap;
