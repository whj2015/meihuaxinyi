import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile } from '../types';
import { getDailyGuidance } from '../services/geminiService';
import HexagramVisual from './HexagramVisual';
import AuthModal from './AuthModal';
import { Sparkles, Sun, CheckCircle, XCircle, Calendar, Star, History, X, ChevronRight, ArrowUp, ArrowDown, MoveHorizontal, GitCommit, ChevronLeft, Lock, User, Loader2, LogIn, ArrowRight } from 'lucide-react';

interface DailyData {
  date: string; // YYYY-MM-DD
  timestamp: number;
  result: DivinationResult;
  guidance: any; // JSON object from AI
}

const DailyDivination: React.FC = () => {
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [historyList, setHistoryList] = useState<DailyData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isLoadingToday, setIsLoadingToday] = useState(false); // New: Loading state for initial check
  const [animationStep, setAnimationStep] = useState(0); // 0: Idle, 1: Breathing, 2: Revealing

  // Config & User
  const [provider, setProvider] = useState<AIProvider>('deepseek');
  const [guestApiKeys, setGuestApiKeys] = useState({ gemini: '', deepseek: '' });
  const [user, setUser] = useState<UserProfile>({ isLoggedIn: false, username: '' });

  useEffect(() => {
    // Load User & Config
    const savedUserStr = localStorage.getItem('user_profile');
    if (savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setUser(parsedUser);
        if (parsedUser.isLoggedIn && parsedUser.token) {
            fetchTodayData(parsedUser.token);
        }
    }
    
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    if (savedProvider) setProvider(savedProvider);
  }, []);

  // Fetch today's data from server
  const fetchTodayData = async (token: string) => {
      setIsLoadingToday(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/daily-reading?date=${today}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
            setDailyData(json.data);
        } else {
            setDailyData(null);
        }
      } catch (e) {
          console.error("Failed to fetch today's reading", e);
      } finally {
          setIsLoadingToday(false);
      }
  };

  const fetchHistoryData = async () => {
      if (!user.token) return;
      try {
          const res = await fetch('/api/daily-history', {
              headers: { 'Authorization': `Bearer ${user.token}` }
          });
          const json = await res.json();
          if (json.success) {
              setHistoryList(json.data);
          }
      } catch (e) {
          console.error("Failed to fetch history", e);
      }
  };

  const saveToServer = async (data: DailyData) => {
      if (!user.token) return;
      try {
          await fetch('/api/daily-reading', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
              },
              body: JSON.stringify(data)
          });
          // Refresh history silently
          fetchHistoryData();
      } catch (e) {
          console.error("Failed to save reading", e);
      }
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
      setUser(newUser);
      if (newUser.token) {
          fetchTodayData(newUser.token);
      }
  };

  const handleStartClick = () => {
      if (!user.isLoggedIn) {
          setShowLoginModal(true);
      } else {
          startDivination();
      }
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

        await saveToServer(newData); // Save to DB
        setDailyData(newData);
        setIsAnimating(false);
        setLoadingAI(false);
        setAnimationStep(0);
    }, 4500); // Total animation duration
  };

  const handleShowHistory = () => {
      setShowHistory(true);
      fetchHistoryData();
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

  // --- Render: Loading Phase ---
  if (isLoadingToday) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in">
             <Loader2 size={32} className="animate-spin text-slate-300 mb-4"/>
             <p className="text-slate-400 text-xs font-serif tracking-widest">正在连接云端...</p>
        </div>
      );
  }

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
        <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
             {/* Unified Auth Modal */}
             <AuthModal 
                isOpen={showLoginModal} 
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
             />

             {/* Header Actions */}
             <div className="flex justify-between items-center px-4 md:px-2 pt-2">
                 {isToday ? (
                     <span className="inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 font-bold shadow-sm">
                        <Sun size={12}/> 今日运势已生成
                     </span>
                 ) : (
                     <span className="inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-bold shadow-sm">
                        <History size={12}/> 历史回溯：{date}
                     </span>
                 )}
                 <button onClick={handleShowHistory} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm">
                    <History size={16} /> <span className="text-xs font-bold">历史记录</span>
                 </button>
             </div>

             {/* 1. Luck Card (Mobile Optimized) */}
             <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative group">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-50/80 to-transparent rounded-bl-[100px] -z-0"></div>
                
                <div className="p-6 md:p-8 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg md:text-2xl font-serif font-bold text-slate-900 flex flex-col md:block">
                                <span>{formatDate(date)}</span>
                            </h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {guidance.keywords?.map((k: string, i: number) => (
                                    <span key={i} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded border border-slate-200/50 backdrop-blur-sm">#{k}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-5xl font-serif font-bold text-slate-800 leading-none">{guidance.score}<span className="text-xs text-slate-400 font-sans font-normal ml-1 align-top mt-2 inline-block">分</span></div>
                        </div>
                    </div>

                    <div className="p-5 bg-[#fbfbf9] rounded-2xl border border-slate-100/80 mb-6 relative">
                        <span className="absolute -top-3 left-4 bg-white px-2 text-amber-500"><Sparkles size={16}/></span>
                        <p className="font-serif text-lg md:text-xl text-slate-800 leading-relaxed text-center font-medium">
                            “{guidance.summary}”
                        </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle size={12}/></div>
                                <span className="text-xs font-bold text-slate-400">宜</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {guidance.todo?.map((t: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-green-50 text-green-800 text-xs rounded-lg border border-green-100/50 font-medium">{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600"><XCircle size={12}/></div>
                                <span className="text-xs font-bold text-slate-400">忌</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {guidance.not_todo?.map((t: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-red-50 text-red-800 text-xs rounded-lg border border-red-100/50 font-medium">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-5">
                        <h3 className="font-serif font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                             大师指引
                        </h3>
                        <p className="text-slate-600 leading-7 text-justify text-sm md:text-base">
                            {guidance.fortune}
                        </p>
                    </div>
                </div>
             </div>

             {/* 2. Detailed Hexagram Flow */}
             <div className="bg-white rounded-[2rem] p-5 md:p-8 shadow-sm border border-slate-100/60">
                 <div className="text-center mb-6 md:mb-8">
                     <h3 className="text-base md:text-lg font-serif font-bold text-slate-800">卦象演变详解</h3>
                 </div>
                 
                 {/* Mobile: Vertical Stack, Desktop: Horizontal. REMOVED scale-75 hack. */}
                 <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                    {/* Original */}
                    <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto justify-between md:justify-center p-3 md:p-0 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
                        <span className="md:hidden text-xs font-bold text-slate-500 w-12">本卦</span>
                        <div><HexagramVisual hexagram={result.originalHexagram} label="" highlight={result.tiGua} movingLine={result.movingLine}/></div>
                        <span className="hidden md:block mt-2 text-xs text-slate-400 font-mono">Start</span>
                    </div>
                    
                    <div className="hidden md:flex flex-col items-center justify-center opacity-30">
                        <ChevronRight className="text-slate-400" size={16}/>
                    </div>

                    {/* Mutual */}
                    <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto justify-between md:justify-center p-3 md:p-0 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
                         <span className="md:hidden text-xs font-bold text-slate-500 w-12">互卦</span>
                         <div className="relative">
                            <HexagramVisual hexagram={result.huHexagram} label=""/>
                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-50 rounded-full flex items-center justify-center border border-white shadow-sm text-slate-300"><GitCommit size={12}/></div>
                         </div>
                         <span className="hidden md:block mt-2 text-xs text-slate-400 font-mono">Process</span>
                    </div>

                    <div className="hidden md:flex flex-col items-center justify-center opacity-30">
                        <ChevronRight className="text-slate-400" size={16}/>
                    </div>

                    {/* Changed */}
                    <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto justify-between md:justify-center p-3 md:p-0 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
                        <span className="md:hidden text-xs font-bold text-slate-500 w-12">变卦</span>
                        <div><HexagramVisual hexagram={result.changedHexagram} label=""/></div>
                        <span className="hidden md:block mt-2 text-xs text-slate-400 font-mono">End</span>
                    </div>
                </div>
             </div>

             {/* 3. Relation Logic */}
             <div className="bg-white p-5 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
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
                     <div className={`p-4 md:p-5 rounded-2xl border flex flex-col items-center justify-center w-full md:w-auto ${relationInfo.color}`}>
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
                                    <p>暂无云端记录</p>
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

  // --- Render: Initial Phase with Auth Guard ---
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 animate-in fade-in zoom-in-95 duration-500 px-4">
        {/* Unified Auth Modal */}
        <AuthModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)}
            onSuccess={handleLoginSuccess}
        />

        <div className="relative group cursor-pointer" onClick={handleStartClick}>
            <div className={`absolute inset-0 bg-amber-200 rounded-full blur-2xl transition-opacity duration-500 ${user.isLoggedIn ? 'opacity-30 group-hover:opacity-60' : 'opacity-0'}`}></div>
            
            <button className={`relative w-48 h-48 md:w-56 md:h-56 bg-white rounded-full border-4 shadow-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${user.isLoggedIn ? 'border-slate-50 hover:scale-105 active:scale-95 group-hover:border-amber-100' : 'border-slate-100 grayscale hover:grayscale-0'}`}>
                
                {/* Locked Overlay */}
                {!user.isLoggedIn && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-200 z-10">
                        <Lock size={14}/>
                    </div>
                )}

                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full text-white flex items-center justify-center shadow-inner mb-2 transition-colors ${user.isLoggedIn ? 'bg-slate-900 group-hover:bg-slate-800' : 'bg-slate-200'}`}>
                    {user.isLoggedIn ? (
                        <span className="font-serif text-4xl md:text-5xl font-bold select-none">卦</span>
                    ) : (
                        <LogIn size={32} className="text-slate-400"/>
                    )}
                </div>
                <div className="text-center px-4">
                    <div className="font-serif font-bold text-slate-800 text-lg md:text-xl">
                        {user.isLoggedIn ? '今日一占' : '登录解锁'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans tracking-widest uppercase mt-1 group-hover:text-amber-600 transition-colors">
                        {user.isLoggedIn ? 'Daily Divination' : 'Login Required'}
                    </div>
                </div>
            </button>
        </div>
        
        <div className="mt-12 text-center max-w-sm mx-auto px-4">
            <h3 className="text-slate-800 font-serif font-bold mb-2">{formatDate(new Date().toISOString())}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                每日清晨，静心诚意。<br/>
                {user.isLoggedIn ? "抽取今日卦象，洞察气运流转。" : "天机珍贵，专属留存。登录后即可开启每日运势。"}
            </p>
            
            {user.isLoggedIn ? (
                <div className="flex gap-3 justify-center">
                    <div className="inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                        <Calendar size={12}/> 每日限占一次
                    </div>
                    <button onClick={handleShowHistory} className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 px-3 py-1 rounded-full border border-slate-200 transition-colors">
                        <History size={12}/> 往期回顾
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <button onClick={() => setShowLoginModal(true)} className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                         <User size={14}/> 账号登录 / 注册
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2">云端同步 · 隐私加密</p>
                </div>
            )}
        </div>

        {/* Reuse History for Initial Screen */}
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
                                <p>正在获取云端数据...</p>
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