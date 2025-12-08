import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile } from '../types';
import { getDailyGuidance } from '../services/geminiService';
import HexagramVisual from './HexagramVisual';
import AuthModal from './AuthModal';
import { Sparkles, Sun, CheckCircle, XCircle, Calendar, History, X, ChevronLeft, Lock, User, Loader2, LogIn, LogOut, ArrowRight, ArrowUp, ArrowDown, MoveHorizontal, GitCommit, ChevronRight, Quote } from 'lucide-react';

interface DailyData {
  date: string; 
  timestamp: number;
  result: DivinationResult;
  guidance: any; 
}

const DailyDivination: React.FC = () => {
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [historyList, setHistoryList] = useState<DailyData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isLoadingToday, setIsLoadingToday] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  const [provider, setProvider] = useState<AIProvider>('deepseek');
  const [guestApiKeys, setGuestApiKeys] = useState({ gemini: '', deepseek: '' });
  const [user, setUser] = useState<UserProfile>({ isLoggedIn: false, username: '' });

  // Init User & Listen for Storage Changes
  useEffect(() => {
    const loadUser = () => {
        const savedUserStr = localStorage.getItem('user_profile');
        if (savedUserStr) {
            const parsedUser = JSON.parse(savedUserStr);
            if (parsedUser.username !== user.username || parsedUser.token !== user.token) {
                setUser(parsedUser);
                if (parsedUser.isLoggedIn && parsedUser.token) {
                    fetchTodayData(parsedUser.token);
                }
            }
        } else if (user.isLoggedIn) {
            handleLogout();
        }
    };
    loadUser();
    const handleStorageChange = (e: StorageEvent) => { if (e.key === 'user_profile') loadUser(); };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user.username, user.token, user.isLoggedIn]);

  useEffect(() => {
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    if (savedProvider) setProvider(savedProvider);
  }, []);

  const fetchTodayData = async (token: string) => {
      setIsLoadingToday(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/daily-reading?date=${today}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        if (json.success && json.data) setDailyData(json.data);
        else setDailyData(null);
      } catch (e) { setDailyData(null); } finally { setIsLoadingToday(false); }
  };

  const fetchHistoryData = async () => {
      if (!user.token) return;
      try {
          const res = await fetch('/api/daily-history', { headers: { 'Authorization': `Bearer ${user.token}` } });
          const json = await res.json();
          if (json.success) setHistoryList(json.data);
      } catch (e) { console.error(e); }
  };

  const saveToServer = async (data: DailyData) => {
      if (!user.token) return;
      try {
          await fetch('/api/daily-reading', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
              body: JSON.stringify(data)
          });
          fetchHistoryData();
      } catch (e) { console.error(e); }
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
      setUser(newUser);
      if (newUser.token) fetchTodayData(newUser.token);
  };

  const handleLogout = () => {
      setUser({ isLoggedIn: false, username: '' });
      localStorage.removeItem('user_profile');
      setDailyData(null);
      setHistoryList([]);
      window.dispatchEvent(new Event("storage"));
  };

  const startDivination = async () => {
    setIsAnimating(true);
    setAnimationStep(1);
    setTimeout(() => setAnimationStep(2), 2000); 
    
    setTimeout(async () => {
        const n1 = Math.floor(Math.random() * 800) + 100;
        const n2 = Math.floor(Math.random() * 800) + 100;
        const n3 = Math.floor(Math.random() * 800) + 100;
        const res = calculateDivination(n1, n2, n3);
        
        setLoadingAI(true);
        const today = new Date().toISOString().split('T')[0];
        let currentKey = provider === 'gemini' ? guestApiKeys.gemini : '';
        
        const guidance = await getDailyGuidance(res, provider, { token: user.token, apiKey: currentKey });

        const newData: DailyData = {
            date: today,
            timestamp: Date.now(),
            result: res,
            guidance: guidance || { 
                summary: "心诚则灵，卦象自现。", 
                fortune: "网络波动，请参考下方卦象自行体悟。",
                score: 60,
                keywords: ["自省", "观察"],
                todo: ["静心"],
                not_todo: ["急躁"]
            }
        };

        await saveToServer(newData);
        setDailyData(newData);
        setIsAnimating(false);
        setLoadingAI(false);
        setAnimationStep(0);
    }, 4500); 
  };

  const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };

  if (isLoadingToday) return <div className="flex flex-col items-center justify-center min-h-[50vh]"><Loader2 size={32} className="animate-spin text-slate-300 mb-2"/><p className="text-xs text-slate-400">连接云端...</p></div>;

  if (isAnimating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700 relative overflow-hidden">
        <div className={`w-32 h-32 rounded-full border-[8px] border-slate-800 border-t-transparent border-l-amber-500 animate-spin duration-[2000ms] shadow-2xl`}></div>
        <div className="absolute font-serif text-slate-800 font-bold tracking-widest text-lg animate-pulse mt-1">{animationStep === 1 ? "凝神" : "感应"}</div>
        <p className="mt-12 text-slate-400 text-xs tracking-widest">{loadingAI ? "正在解析天机..." : "心诚则灵"}</p>
      </div>
    );
  }

  // --- Result View ---
  if (dailyData) {
     const { result, guidance, date } = dailyData;
     const isToday = date === new Date().toISOString().split('T')[0];

     return (
        <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
             <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess}/>

             {/* Top Bar */}
             <div className="flex justify-between items-center px-1">
                 {isToday ? (
                     <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1"><Sun size={12}/>今日运势</span>
                 ) : (
                     <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1"><History size={12}/>历史: {date}</span>
                 )}
                 <button onClick={() => {setShowHistory(true); fetchHistoryData();}} className="text-xs font-bold text-slate-500 bg-white border px-3 py-1 rounded-full flex items-center gap-1 shadow-sm"><History size={12} />记录</button>
             </div>

             {/* Main Luck Card */}
             <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -z-0"></div>
                
                <div className="p-6">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Fortune Score</div>
                            <div className="text-5xl font-serif font-bold text-slate-800 leading-none">{guidance.score}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-serif font-bold text-lg text-slate-900">{formatDate(date)}</div>
                            <div className="flex gap-1 justify-end mt-1">
                                {guidance.keywords?.map((k: string, i: number) => (
                                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">#{k}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#fcfbf9] p-5 rounded-2xl border border-dashed border-slate-200 mb-6 relative">
                        <Quote className="absolute -top-3 left-4 bg-[#fcfbf9] px-1 text-slate-300" size={24} fill="currentColor"/>
                        <p className="font-serif text-lg text-slate-800 leading-relaxed text-center font-medium pt-2">
                            {guidance.summary}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50/50 p-3 rounded-xl border border-green-100/50">
                            <div className="flex items-center gap-1.5 mb-2">
                                <CheckCircle size={14} className="text-green-600"/>
                                <span className="text-xs font-bold text-green-800">宜</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {guidance.todo?.map((t: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-white text-green-700 text-xs rounded border border-green-100 shadow-sm">{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                            <div className="flex items-center gap-1.5 mb-2">
                                <XCircle size={14} className="text-red-600"/>
                                <span className="text-xs font-bold text-red-800">忌</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {guidance.not_todo?.map((t: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-white text-red-700 text-xs rounded border border-red-100 shadow-sm">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-slate-600 leading-7 text-justify border-t border-slate-100 pt-4">
                        <span className="font-bold text-slate-800 mr-1">大师指引：</span>{guidance.fortune}
                    </div>
                </div>
             </div>

             {/* Compact Hexagram Display */}
             <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">卦象演变</h3>
                 <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col items-center gap-2">
                        <HexagramVisual hexagram={result.originalHexagram} label="" highlight={result.tiGua}/>
                        <span className="text-[10px] text-slate-400">本卦</span>
                    </div>
                    <ChevronRight className="text-slate-200" size={20}/>
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <HexagramVisual hexagram={result.huHexagram} label=""/>
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center"><GitCommit size={8} className="text-slate-400"/></div>
                        </div>
                        <span className="text-[10px] text-slate-400">互卦</span>
                    </div>
                    <ChevronRight className="text-slate-200" size={20}/>
                    <div className="flex flex-col items-center gap-2">
                        <HexagramVisual hexagram={result.changedHexagram} label=""/>
                        <span className="text-[10px] text-slate-400">变卦</span>
                    </div>
                 </div>
             </div>
             
             {/* History Drawer */}
             {showHistory && createPortal(
                <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50 animate-in slide-in-from-right duration-300">
                    <div className="bg-white px-4 py-3 border-b border-slate-100 flex justify-between items-center shrink-0 safe-top">
                        <h3 className="font-bold text-lg">每日足迹</h3>
                        <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">
                        {historyList.map((record, idx) => (
                            <div key={idx} onClick={() => { setDailyData(record); setShowHistory(false); }} className={`bg-white p-4 rounded-xl border ${dailyData?.date === record.date ? 'border-amber-400 ring-1 ring-amber-50' : 'border-slate-100'} shadow-sm flex flex-col gap-2`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-serif font-bold text-slate-800">{formatDate(record.date)}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${record.guidance.score>=80?'bg-red-50 text-red-600':'bg-slate-100 text-slate-500'}`}>{record.guidance.score}分</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-1">{record.guidance.summary}</p>
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
             )}
        </div>
     );
  }

  // --- Initial Auth View ---
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500 px-4">
        <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess}/>

        <div className="relative group cursor-pointer" onClick={() => !user.isLoggedIn ? setShowLoginModal(true) : startDivination()}>
            <button className={`relative w-48 h-48 bg-white rounded-full border-4 shadow-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${user.isLoggedIn ? 'border-slate-50 active:scale-95' : 'border-slate-100 grayscale'}`}>
                {!user.isLoggedIn && <div className="absolute top-4 right-4 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100"><Lock size={14}/></div>}
                <div className={`w-24 h-24 rounded-full text-white flex items-center justify-center shadow-inner mb-2 ${user.isLoggedIn ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    {user.isLoggedIn ? <span className="font-serif text-4xl font-bold">卦</span> : <LogIn size={32}/>}
                </div>
                <div className="text-center">
                    <div className="font-serif font-bold text-slate-800 text-lg">{user.isLoggedIn ? '今日一占' : '登录解锁'}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">{user.isLoggedIn ? 'Daily Fortune' : 'Login Required'}</div>
                </div>
            </button>
        </div>
        
        <div className="mt-12 text-center max-w-xs mx-auto">
            <h3 className="text-slate-800 font-serif font-bold mb-2">{formatDate(new Date().toISOString())}</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {user.isLoggedIn ? "每日清晨，静心诚意。" : "天机珍贵，专属留存。"}
            </p>
            {!user.isLoggedIn && (
                <button onClick={() => setShowLoginModal(true)} className="px-8 py-3 bg-slate-900 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2 mx-auto">
                     <User size={14}/> 账号登录
                </button>
            )}
        </div>
    </div>
  );
};

export default DailyDivination;