
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider } from '../types';
import { getDailyGuidance } from '../services/geminiService';
import HexagramVisual from './HexagramVisual';
import { Sparkles, Sun, CheckCircle, XCircle, Calendar, Star, History, X, ChevronRight, ArrowUp, ArrowDown, MoveHorizontal, GitCommit, ChevronLeft } from 'lucide-react';

interface DailyData {
  date: string; // YYYY-MM-DD
  timestamp: number;
  result: DivinationResult;
  guidance: any; // JSON object from AI
}

const HISTORY_KEY = 'daily_divination_history_v1';

const DailyDivination: React.FC = () => {
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [historyList, setHistoryList] = useState<DailyData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [animationStep, setAnimationStep] = useState(0); // 0: Idle, 1: Breathing, 2: Revealing

  // Config retrieval
  const [provider, setProvider] = useState<AIProvider>('deepseek');
  const [guestApiKeys, setGuestApiKeys] = useState({ gemini: '', deepseek: '' });
  const [user, setUser] = useState<any>({ isLoggedIn: false });

  useEffect(() => {
    // Load User & Config
    const savedUserStr = localStorage.getItem('user_profile');
    if (savedUserStr) setUser(JSON.parse(savedUserStr));
    
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    if (savedProvider) setProvider(savedProvider);
    
    // Load History
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
        try {
            setHistoryList(JSON.parse(savedHistory));
        } catch(e) {
            console.error("Failed to parse history");
        }
    }

    // Check for today's data
    const today = new Date().toISOString().split('T')[0];
    const savedDaily = localStorage.getItem(`daily_reading_${today}`);
    
    if (savedDaily) {
      try {
        setDailyData(JSON.parse(savedDaily));
      } catch (e) {
        localStorage.removeItem(`daily_reading_${today}`);
      }
    }
  }, []);

  const saveToHistory = (data: DailyData) => {
      // Get current history
      const currentList = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      // Remove any existing entry for this date to avoid duplicates/updates
      const filtered = currentList.filter((item: DailyData) => item.date !== data.date);
      // Add new to top
      const newList = [data, ...filtered];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newList));
      setHistoryList(newList);
  };

  const startDivination = async () => {
    setIsAnimating(true);
    setAnimationStep(1);

    // 1. Animation Sequence
    setTimeout(() => setAnimationStep(2), 2000); // 2s breathing
    
    // 2. Generate Result Logic
    setTimeout(async () => {
        const n1 = Math.floor(Math.random() * 800) + 100;
        const n2 = Math.floor(Math.random() * 800) + 100;
        const n3 = Math.floor(Math.random() * 800) + 100;
        const res = calculateDivination(n1, n2, n3);
        
        // 3. Fetch AI Guidance
        setLoadingAI(true);
        const today = new Date().toISOString().split('T')[0];
        
        let currentKey = '';
        if (provider === 'gemini') currentKey = guestApiKeys.gemini;
        
        // Fallback: Try to use system defaults via proxy if logged in, handled by service
        const guidance = await getDailyGuidance(res, provider, {
            token: user.token,
            apiKey: currentKey
        });

        const newData: DailyData = {
            date: today,
            timestamp: Date.now(),
            result: res,
            guidance: guidance || { 
                summary: "心诚则灵，卦象自现。", 
                fortune: "网络连接波动，未能获取详细AI解读，但卦象已成。请参考下方【本卦】(现状)、【互卦】(过程)与【变卦】(结果)之象，结合动爻与体用关系自行体悟。",
                score: 60,
                keywords: ["自省", "观察"],
                todo: ["静心", "记录"],
                not_todo: ["急躁", "妄动"]
            }
        };

        localStorage.setItem(`daily_reading_${today}`, JSON.stringify(newData));
        saveToHistory(newData); // Save to history list
        setDailyData(newData);
        setIsAnimating(false);
        setLoadingAI(false);
        setAnimationStep(0);
    }, 4500); // Total animation duration
  };

  const getRelationVisual = (score: string) => {
    switch (score) {
        case 'Great Auspicious': return { arrow: <ArrowUp size={24} className="text-red-500" />, desc: '大吉 · 生助', color: 'text-red-600 bg-red-50 border-red-100' };
        case 'Minor Auspicious': return { arrow: <ArrowUp size={24} className="text-orange-500" />, desc: '小吉 · 比/克', color: 'text-orange-600 bg-orange-50 border-orange-100' };
        case 'Auspicious': return { arrow: <ArrowUp size={24} className="text-red-500" />, desc: '吉 · 比和', color: 'text-red-600 bg-red-50 border-red-100' };
        case 'Minor Bad': return { arrow: <ArrowDown size={24} className="text-slate-400" />, desc: '小凶 · 生用', color: 'text-slate-500 bg-slate-50 border-slate-200' };
        case 'Great Bad': return { arrow: <ArrowDown size={24} className="text-green-700" />, desc: '大凶 · 克体', color: 'text-green-700 bg-green-50 border-green-100' };
        default: return { arrow: <MoveHorizontal size={24} className="text-slate-300" />, desc: '平', color: 'text-slate-500 bg-slate-50' };
    }
  };

  const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };

  // --- Render: Animation Phase ---
  if (isAnimating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Background Glows */}
            <div className={`absolute inset-0 bg-amber-100 rounded-full blur-3xl opacity-50 transition-all duration-[2000ms] ${animationStep === 1 ? 'scale-110' : 'scale-75'}`}></div>
            <div className={`absolute inset-0 bg-slate-100 rounded-full blur-2xl opacity-40 animate-pulse`}></div>
            
            {/* Taiji Symbol (Simplified CSS representation) */}
            <div className={`w-32 h-32 rounded-full border-[12px] border-slate-800 border-t-slate-800 border-r-slate-800 border-b-amber-500 border-l-amber-500 animate-spin duration-[3000ms] shadow-2xl ${animationStep === 2 ? 'speed-up' : ''}`}></div>
            
            {/* Center Text */}
            <div className="absolute font-serif text-slate-800 font-bold tracking-widest text-lg animate-pulse">
                {animationStep === 1 ? "凝神..." : "感应..."}
            </div>
        </div>
        <p className="mt-8 text-slate-400 font-serif tracking-widest text-sm">
            {loadingAI ? "正在解析天机..." : "心诚则灵 · 随机而动"}
        </p>
      </div>
    );
  }

  // --- Render: Result Phase ---
  if (dailyData) {
     const { result, guidance, date } = dailyData;
     const tiTrigram = result.tiGua === 'upper' ? result.originalHexagram.upper : result.originalHexagram.lower;
     const yongTrigram = result.yongGua === 'upper' ? result.originalHexagram.upper : result.originalHexagram.lower;
     const relationInfo = getRelationVisual(result.relationScore);
     const isToday = date === new Date().toISOString().split('T')[0];

     return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
             {/* Header Actions */}
             <div className="flex justify-between items-center px-2">
                 {isToday ? (
                     <span className="inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 font-bold">
                        <Sun size={12}/> 今日运势已生成
                     </span>
                 ) : (
                     <span className="inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-bold">
                        <History size={12}/> 历史回溯：{date}
                     </span>
                 )}
                 <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm">
                    <History size={16} /> <span className="text-xs font-bold">历史记录</span>
                 </button>
             </div>

             {/* 1. Luck Card */}
             <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-[100px] -z-10 transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-slate-900">{formatDate(date)}</h2>
                        <div className="flex gap-2 mt-2">
                             {guidance.keywords?.map((k: string, i: number) => (
                                 <span key={i} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100">#{k}</span>
                             ))}
                         </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-4xl font-serif font-bold text-slate-800">{guidance.score}<span className="text-sm text-slate-400 font-sans font-normal ml-1">/100</span></div>
                        <div className="flex gap-1 mt-1">
                             {[...Array(5)].map((_, i) => (
                                 <Star key={i} size={12} className={i < Math.round(guidance.score / 20) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                             ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-[#fbfbf9] rounded-2xl border border-slate-100/80 mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                     <p className="font-serif text-lg text-slate-700 leading-relaxed text-center">
                         “{guidance.summary}”
                     </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="space-y-2">
                         <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1"><CheckCircle size={12} className="text-green-500"/> 宜</h4>
                         <div className="flex flex-wrap gap-2">
                             {guidance.todo?.map((t: string, i: number) => (
                                 <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-lg border border-green-100 font-medium">{t}</span>
                             ))}
                         </div>
                     </div>
                     <div className="space-y-2">
                         <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1"><XCircle size={12} className="text-red-500"/> 忌</h4>
                         <div className="flex flex-wrap gap-2">
                             {guidance.not_todo?.map((t: string, i: number) => (
                                 <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-medium">{t}</span>
                             ))}
                         </div>
                     </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                    <h3 className="font-serif font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                        <Sparkles size={14} className="text-amber-500"/> 大师指引
                    </h3>
                    <p className="text-slate-600 leading-7 text-justify text-sm">
                        {guidance.fortune}
                    </p>
                </div>
             </div>

             {/* 2. Detailed Hexagram Flow (Same detailed view as DivinationTool) */}
             <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100/60">
                 <div className="text-center mb-8">
                     <h3 className="text-lg font-serif font-bold text-slate-800">卦象演变详解</h3>
                     <p className="text-xs text-slate-400 mt-1">即使没有AI解读，观察本、互、变三卦亦可自明吉凶</p>
                 </div>
                 
                 <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 md:gap-8">
                    {/* Original */}
                    <div className="flex-1 flex flex-col items-center group">
                        <HexagramVisual hexagram={result.originalHexagram} label="本卦 · 现状" highlight={result.tiGua} movingLine={result.movingLine}/>
                        <div className="mt-2 text-xs text-slate-400 font-mono">Start</div>
                    </div>
                    
                    {/* Arrow 1 */}
                    <div className="flex md:flex-col items-center justify-center opacity-30">
                        <div className="h-px w-full md:w-px md:h-20 bg-slate-400"></div>
                        <ChevronRight className="md:rotate-90 text-slate-400 -ml-1 md:ml-0 md:-mt-1" size={16}/>
                    </div>

                    {/* Mutual */}
                    <div className="flex-1 flex flex-col items-center group">
                         <div className="relative">
                            <HexagramVisual hexagram={result.huHexagram} label="互卦 · 过程"/>
                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-50 rounded-full flex items-center justify-center border border-white shadow-sm text-slate-300"><GitCommit size={12}/></div>
                         </div>
                         <div className="mt-2 text-xs text-slate-400 font-mono">Process</div>
                    </div>

                    {/* Arrow 2 */}
                    <div className="flex md:flex-col items-center justify-center opacity-30">
                        <div className="h-px w-full md:w-px md:h-20 bg-slate-400"></div>
                        <ChevronRight className="md:rotate-90 text-slate-400 -ml-1 md:ml-0 md:-mt-1" size={16}/>
                    </div>

                    {/* Changed */}
                    <div className="flex-1 flex flex-col items-center group">
                        <HexagramVisual hexagram={result.changedHexagram} label="变卦 · 结果"/>
                        <div className="mt-2 text-xs text-slate-400 font-mono">End</div>
                    </div>
                </div>
             </div>

             {/* 3. Relation Logic (Body vs Application) */}
             <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                     <div className="flex-1 w-full">
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center md:text-left">吉凶能量分析</h4>
                         <div className="flex items-center justify-between gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="text-center">
                                 <span className="text-[10px] text-slate-400 block mb-1">自己 (体)</span>
                                 <span className="font-serif font-bold text-lg text-slate-800">{tiTrigram.name} <span className="text-sm font-normal text-slate-500">({tiTrigram.element})</span></span>
                             </div>
                             <div className="flex flex-col items-center gap-1">
                                {relationInfo.arrow}
                                <span className="text-[10px] text-slate-400 font-medium">生克</span>
                             </div>
                             <div className="text-center">
                                 <span className="text-[10px] text-slate-400 block mb-1">运势 (用)</span>
                                 <span className="font-serif font-bold text-lg text-slate-800">{yongTrigram.name} <span className="text-sm font-normal text-slate-500">({yongTrigram.element})</span></span>
                             </div>
                         </div>
                     </div>
                     <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center min-w-[140px] w-full md:w-auto ${relationInfo.color}`}>
                         <span className="text-xs font-bold opacity-70 mb-1">综合判定</span>
                         <span className="text-2xl font-serif font-bold">{relationInfo.desc.split('·')[0]}</span>
                         <span className="text-[10px] opacity-80 mt-1">{relationInfo.desc.split('·')[1]}</span>
                     </div>
                 </div>
             </div>
             
             {/* History Sidebar Modal */}
            {showHistory && createPortal(
                <>
                    <div 
                        className="fixed inset-0 z-[140] bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowHistory(false)}
                    />
                    <div className="fixed inset-y-0 right-0 z-[150] w-full md:w-80 bg-white shadow-2xl border-l border-slate-100 flex flex-col h-[100dvh] animate-in slide-in-from-right duration-300">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                            <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2">
                                <History size={18}/> 每日一卦记录
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={18} className="text-slate-400"/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar overscroll-contain">
                            {historyList.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 text-sm">
                                    <Calendar size={32} className="mx-auto mb-3 opacity-30"/>
                                    <p>暂无历史记录</p>
                                    <p className="text-xs text-slate-300 mt-1">坚持每日一占，积累运势轨迹</p>
                                </div>
                            ) : (
                                historyList.map((record, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => { setDailyData(record); setShowHistory(false); }}
                                        className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group ${dailyData?.date === record.date ? 'border-amber-400 ring-1 ring-amber-100' : 'border-slate-100 hover:border-amber-200'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-serif font-bold text-slate-800">{formatDate(record.date)}</div>
                                            <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${record.guidance.score >= 80 ? 'text-red-600 bg-red-50' : (record.guidance.score >= 60 ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-50')}`}>
                                                {record.guidance.score}分
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                                            {record.guidance.summary}
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                            <div className="flex gap-1">
                                                {record.guidance.keywords?.slice(0, 2).map((k:string, i:number) => (
                                                    <span key={i} className="text-[9px] text-slate-400 bg-slate-50 px-1 rounded">#{k}</span>
                                                ))}
                                            </div>
                                            <ChevronLeft size={14} className="text-slate-300 group-hover:text-amber-400 transition-colors rotate-180"/>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
     );
  }

  // --- Render: Initial Phase ---
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative group cursor-pointer" onClick={startDivination}>
            <div className="absolute inset-0 bg-amber-200 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <button className="relative w-48 h-48 md:w-56 md:h-56 bg-white rounded-full border-4 border-slate-50 shadow-xl flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform duration-300 active:scale-95 group-hover:border-amber-100">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-inner mb-2 group-hover:bg-slate-800 transition-colors">
                    <span className="font-serif text-4xl md:text-5xl font-bold select-none">卦</span>
                </div>
                <div className="text-center">
                    <div className="font-serif font-bold text-slate-800 text-lg md:text-xl">今日一占</div>
                    <div className="text-[10px] text-slate-400 font-sans tracking-widest uppercase mt-1 group-hover:text-amber-600 transition-colors">Daily Divination</div>
                </div>
            </button>
        </div>
        
        <div className="mt-12 text-center max-w-sm mx-auto px-4">
            <h3 className="text-slate-800 font-serif font-bold mb-2">{formatDate(new Date().toISOString())}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                每日清晨，静心诚意。<br/>
                抽取今日卦象，洞察气运流转，获取行事指引。
            </p>
            <div className="flex gap-3 justify-center">
                <div className="inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    <Calendar size={12}/> 每日限占一次
                </div>
                {historyList.length > 0 && (
                     <button onClick={() => setShowHistory(true)} className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 px-3 py-1 rounded-full border border-slate-200 transition-colors">
                        <History size={12}/> 查看往期 ({historyList.length})
                    </button>
                )}
            </div>
        </div>

        {/* Re-using history sidebar logic for the initial screen as well */}
        {showHistory && createPortal(
                <>
                    <div 
                        className="fixed inset-0 z-[140] bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowHistory(false)}
                    />
                    <div className="fixed inset-y-0 right-0 z-[150] w-full md:w-80 bg-white shadow-2xl border-l border-slate-100 flex flex-col h-[100dvh] animate-in slide-in-from-right duration-300">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                            <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2">
                                <History size={18}/> 每日一卦记录
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={18} className="text-slate-400"/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar overscroll-contain">
                            {historyList.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 text-sm">
                                    <Calendar size={32} className="mx-auto mb-3 opacity-30"/>
                                    <p>暂无历史记录</p>
                                </div>
                            ) : (
                                historyList.map((record, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => { setDailyData(record); setShowHistory(false); }}
                                        className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group border-slate-100 hover:border-amber-200`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-serif font-bold text-slate-800">{formatDate(record.date)}</div>
                                            <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${record.guidance.score >= 80 ? 'text-red-600 bg-red-50' : (record.guidance.score >= 60 ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-50')}`}>
                                                {record.guidance.score}分
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                                            {record.guidance.summary}
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                            <div className="flex gap-1">
                                                {record.guidance.keywords?.slice(0, 2).map((k:string, i:number) => (
                                                    <span key={i} className="text-[9px] text-slate-400 bg-slate-50 px-1 rounded">#{k}</span>
                                                ))}
                                            </div>
                                            <ChevronLeft size={14} className="text-slate-300 group-hover:text-amber-400 transition-colors rotate-180"/>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
    </div>
  );
};

export default DailyDivination;
