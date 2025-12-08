
import React, { useState, useEffect } from 'react';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, CustomAIConfig } from '../types';
import { getDailyGuidance } from '../services/geminiService';
import HexagramVisual from './HexagramVisual';
import { Sparkles, Sun, RefreshCw, AlertCircle, CheckCircle, XCircle, Calendar, Star } from 'lucide-react';

interface DailyData {
  date: string;
  result: DivinationResult;
  guidance: any; // JSON object from AI
}

const DailyDivination: React.FC = () => {
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [animationStep, setAnimationStep] = useState(0); // 0: Idle, 1: Breathing, 2: Revealing

  // Config retrieval (similar to DivinationTool)
  const [provider, setProvider] = useState<AIProvider>('deepseek');
  const [guestApiKeys, setGuestApiKeys] = useState({ gemini: '', deepseek: '' });
  const [user, setUser] = useState<any>({ isLoggedIn: false });

  useEffect(() => {
    // Load User & Config
    const savedUserStr = localStorage.getItem('user_profile');
    if (savedUserStr) setUser(JSON.parse(savedUserStr));
    
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    if (savedProvider) setProvider(savedProvider);
    
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
        if (provider === 'gemini') currentKey = guestApiKeys.gemini; // Note: In a real app we need to sync this state better
        // For simplicity in this demo, we assume user is configured or logged in, utilizing the same logic as tool
        
        // Fallback: Try to use system defaults via proxy if logged in, handled by service
        const guidance = await getDailyGuidance(res, provider, {
            token: user.token,
            apiKey: currentKey
        });

        const newData: DailyData = {
            date: today,
            result: res,
            guidance: guidance || { 
                summary: "今日气运流转，顺势而为。", 
                fortune: "网络连接波动，未能获取详细AI解读，但卦象已成。请参考本卦与变卦之象。",
                score: 60,
                keywords: ["平和", "守正"],
                todo: ["静心", "观察"],
                not_todo: ["急躁", "强求"]
            }
        };

        localStorage.setItem(`daily_reading_${today}`, JSON.stringify(newData));
        setDailyData(newData);
        setIsAnimating(false);
        setLoadingAI(false);
        setAnimationStep(0);
    }, 4500); // Total animation duration
  };

  const todayStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

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
     const { result, guidance } = dailyData;
     return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
             {/* Header Card */}
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-[100px] -z-10"></div>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Sun size={12}/> 今日运势</div>
                        <h2 className="text-2xl font-serif font-bold text-slate-900">{todayStr}</h2>
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

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                     <p className="font-serif text-lg text-slate-700 leading-relaxed text-center">
                         “{guidance.summary}”
                     </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1"><CheckCircle size={12} className="text-green-500"/> 宜</h4>
                         <div className="flex flex-wrap gap-2">
                             {guidance.todo?.map((t: string, i: number) => (
                                 <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100 font-medium">{t}</span>
                             ))}
                         </div>
                     </div>
                     <div className="space-y-2">
                         <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1"><XCircle size={12} className="text-red-500"/> 忌</h4>
                         <div className="flex flex-wrap gap-2">
                             {guidance.not_todo?.map((t: string, i: number) => (
                                 <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-100 font-medium">{t}</span>
                             ))}
                         </div>
                     </div>
                </div>
             </div>

             {/* Guidance Detail */}
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100/60">
                 <h3 className="font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500"/> 大师指引
                 </h3>
                 <p className="text-slate-600 leading-7 text-justify font-sans">
                     {guidance.fortune}
                 </p>
                 <div className="mt-6 flex gap-2">
                     {guidance.keywords?.map((k: string, i: number) => (
                         <span key={i} className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded">#{k}</span>
                     ))}
                 </div>
             </div>

             {/* Hexagram Reference */}
             <div className="bg-[#fdfbf7] border border-slate-200 rounded-[2rem] p-6 opacity-90">
                 <div className="flex items-center justify-center gap-8 md:gap-16 scale-90 origin-center">
                    <div className="flex flex-col items-center">
                        <HexagramVisual hexagram={result.originalHexagram} label="本卦" highlight={result.tiGua} movingLine={result.movingLine}/>
                    </div>
                    <div className="w-px h-20 bg-slate-300"></div>
                    <div className="flex flex-col items-center">
                        <HexagramVisual hexagram={result.changedHexagram} label="变卦" />
                    </div>
                 </div>
                 <div className="text-center mt-4 text-xs text-slate-400">
                     卦象仅供参考，命运掌握在自己手中
                 </div>
             </div>
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
            <h3 className="text-slate-800 font-serif font-bold mb-2">{todayStr}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
                每日清晨，静心诚意。<br/>
                抽取今日卦象，洞察气运流转，获取行事指引。
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Calendar size={12}/> 每日限占一次
            </div>
        </div>
    </div>
  );
};

export default DailyDivination;
