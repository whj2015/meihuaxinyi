
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile } from '../types';
import { getDailyGuidance } from '../services/geminiService';
import HexagramVisual from './HexagramVisual';
import AuthModal from './AuthModal';
import { History, X, User, Lock, Quote, ArrowLeft } from 'lucide-react';

interface DailyData {
  date: string; 
  timestamp: number;
  result: DivinationResult;
  guidance: any; 
}

const TaiChiSpinner = ({ spinning }: { spinning: boolean }) => (
  <div className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full border border-slate-200/50 shadow-[0_0_60px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center bg-white transition-all duration-1000 ${spinning ? 'scale-110' : 'hover:scale-105'}`}>
      {/* Outer Rings */}
      <div className={`absolute inset-0 rounded-full border border-slate-100 ${spinning ? 'animate-[spin_3s_linear_infinite]' : ''}`}></div>
      <div className={`absolute inset-4 rounded-full border border-slate-100 ${spinning ? 'animate-[spin_5s_linear_infinite_reverse]' : ''}`}></div>
      
      {/* Tai Chi Symbol CSS */}
      <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl overflow-hidden cursor-pointer transition-transform duration-[2000ms] ease-in-out ${spinning ? 'rotate-[720deg]' : 'rotate-0'}`}>
          {/* White half cover */}
          <div className="absolute top-0 left-0 w-1/2 h-full bg-[#fdfbf7]"></div>
          {/* Top circle (White head) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-[#fdfbf7] rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-slate-900 rounded-full"></div>
          </div>
          {/* Bottom circle (Black head) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-slate-900 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-[#fdfbf7] rounded-full"></div>
          </div>
      </div>

      {/* Text Overlay */}
      {!spinning && (
          <div className="absolute -bottom-12 font-serif text-slate-400 text-xs tracking-[0.2em] uppercase opacity-80">
              Click to Divine
          </div>
      )}
  </div>
);

// New Prop Interface
interface DailyDivinationProps {
  onBack?: () => void;
}

const DailyDivination: React.FC<DailyDivinationProps> = ({ onBack }) => {
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [historyList, setHistoryList] = useState<DailyData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'shuffling' | 'calculating' | 'interpreting'>('idle');

  const [provider, setProvider] = useState<AIProvider>('deepseek');
  const [guestApiKeys, setGuestApiKeys] = useState({ gemini: '', deepseek: '' });
  const [user, setUser] = useState<UserProfile>({ isLoggedIn: false, username: '' });

  useEffect(() => {
    const loadUser = () => {
        const savedUserStr = localStorage.getItem('user_profile');
        if (savedUserStr) {
            const parsedUser = JSON.parse(savedUserStr);
            if (parsedUser.username !== user.username || parsedUser.token !== user.token) {
                setUser(parsedUser);
                if (parsedUser.isLoggedIn && parsedUser.token) fetchTodayData(parsedUser.token);
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
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/daily-reading?date=${today}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        if (json.success && json.data) setDailyData(json.data);
      } catch (e) { setDailyData(null); }
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
    setLoadingState('shuffling');
    
    // Animation Phase 1: Shuffling
    setTimeout(() => setLoadingState('calculating'), 1500);

    // Animation Phase 2: AI Request
    setTimeout(async () => {
        setLoadingState('interpreting');
        const n1 = Math.floor(Math.random() * 800) + 100;
        const n2 = Math.floor(Math.random() * 800) + 100;
        const n3 = Math.floor(Math.random() * 800) + 100;
        const res = calculateDivination(n1, n2, n3);
        
        const today = new Date().toISOString().split('T')[0];
        let currentKey = provider === 'gemini' ? guestApiKeys.gemini : '';
        
        const guidance = await getDailyGuidance(res, provider, { token: user.token, apiKey: currentKey });

        const newData: DailyData = {
            date: today,
            timestamp: Date.now(),
            result: res,
            guidance: guidance || { 
                summary: "心如止水，万象自明。", 
                fortune: "今日连接稍有波动，请静心体悟卦象本意。",
                score: 70,
                keywords: ["静心", "等待"],
                todo: ["内省"],
                not_todo: ["焦躁"]
            }
        };

        await saveToServer(newData);
        setDailyData(newData);
        setIsAnimating(false);
        setLoadingState('idle');
    }, 3500); 
  };

  const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };
  
  const getWeekday = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('zh-CN', { weekday: 'long' });
  };

  // --- View: Loading Animation ---
  if (isAnimating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-700">
        <TaiChiSpinner spinning={true} />
        <div className="mt-12 space-y-2 text-center">
            <h3 className="text-xl font-serif font-bold text-slate-800 animate-pulse">
                {loadingState === 'shuffling' && "洗 牌 . . ."}
                {loadingState === 'calculating' && "起 卦 . . ."}
                {loadingState === 'interpreting' && "解 读 天 机 . . ."}
            </h3>
            <p className="text-xs text-slate-400 tracking-widest uppercase font-sans">Connecting to the void</p>
        </div>
      </div>
    );
  }

  // --- View: Result (Almanac Card) ---
  if (dailyData) {
     const { result, guidance, date } = dailyData;
     const isToday = date === new Date().toISOString().split('T')[0];

     return (
        <div className="max-w-lg mx-auto pb-24 px-0 md:px-4 pt-2">
             <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess}/>

             {/* Header Actions */}
             <div className="flex justify-between items-center mb-6 px-2">
                 <div className="flex items-center gap-4">
                     {onBack && (
                         <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                             <ArrowLeft size={20} />
                         </button>
                     )}
                     {isToday ? (
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-slate-800 tracking-widest uppercase">Today's Fortune</span>
                         </div>
                     ) : (
                         <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                            <History size={12}/> {date}
                         </span>
                     )}
                 </div>
                 <button onClick={() => {setShowHistory(true); fetchHistoryData();}} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 active:scale-95 transition-all">
                    <History size={18} />
                 </button>
             </div>

             {/* The Card */}
             <div className="bg-[#fffcf5] rounded-none md:rounded-xl shadow-2xl overflow-hidden relative font-serif text-slate-800 ring-1 ring-slate-900/5 mx-auto max-w-[400px]">
                {/* Decoration: Red Header Line */}
                <div className="h-2 bg-[#c62828] w-full"></div>
                
                <div className="p-8 pb-10 flex flex-col items-center text-center relative">
                    {/* Background Texture Overlay */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>

                    {/* Date Block */}
                    <div className="w-full flex justify-between items-end border-b-2 border-slate-800/10 pb-4 mb-6 relative z-10">
                        <div className="text-left">
                            <div className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-1">Date</div>
                            <div className="text-3xl font-bold text-slate-900 leading-none">{formatDate(date)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-slate-500 mb-1">{getWeekday(date)}</div>
                            <div className={`text-xs font-bold px-2 py-0.5 rounded text-white inline-block ${guidance.score >= 80 ? 'bg-[#c62828]' : (guidance.score >= 60 ? 'bg-amber-600' : 'bg-slate-500')}`}>
                                运势 {guidance.score}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="relative z-10 w-full">
                        <div className="mb-8">
                             <Quote size={24} className="text-amber-500/30 mx-auto mb-4 rotate-180"/>
                             <h2 className="text-2xl font-bold leading-relaxed text-slate-800">
                                {guidance.summary}
                             </h2>
                        </div>

                        {/* Hexagram Visual Minimal */}
                        <div className="flex justify-center mb-8 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                            <HexagramVisual hexagram={result.changedHexagram} />
                        </div>

                        {/* Guidance Text */}
                        <p className="text-sm leading-7 text-slate-600 text-justify mb-8 px-2 font-medium">
                            {guidance.fortune}
                        </p>

                        {/* Todo / Not Todo */}
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="flex flex-col items-center p-3 bg-red-50/50 rounded-lg border border-red-100/50">
                                <span className="w-6 h-6 rounded-full border border-red-800 text-red-800 flex items-center justify-center text-xs font-bold mb-2">宜</span>
                                <div className="space-y-1">
                                    {guidance.todo?.map((t: string, i: number) => (
                                        <div key={i} className="text-xs font-bold text-slate-700">{t}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-slate-100/50 rounded-lg border border-slate-200/50">
                                <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold mb-2">忌</span>
                                <div className="space-y-1">
                                    {guidance.not_todo?.map((t: string, i: number) => (
                                        <div key={i} className="text-xs font-bold text-slate-500">{t}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Stamp */}
                <div className="bg-slate-50 p-3 border-t border-slate-100 text-center relative z-10">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">Mind I-Ching Daily</p>
                </div>
             </div>
             
             {/* History Sidebar */}
             {showHistory && createPortal(
                <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-xs bg-[#fdfbf7] h-full shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-serif font-bold text-lg text-slate-800">往日足迹</h3>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="space-y-3">
                            {historyList.map((record, idx) => (
                                <button key={idx} onClick={() => { setDailyData(record); setShowHistory(false); }} className="w-full text-left bg-white p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-serif font-bold text-slate-700">{formatDate(record.date)}</span>
                                        <span className="text-[10px] text-slate-400">{record.guidance.score}分</span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-1 group-hover:text-amber-600 transition-colors">{record.guidance.summary}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
             )}
        </div>
     );
  }

  // --- View: Initial Start Screen (Embedded Mode) ---
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-700 px-4">
        <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess}/>

        {/* Header for Embedded Mode */}
        {onBack && (
            <div className="w-full max-w-md flex items-center mb-8 relative">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors absolute left-0">
                    <ArrowLeft size={20} />
                </button>
                <div className="w-full text-center pointer-events-none">
                    <h2 className="font-serif font-bold text-xl text-slate-900">晨起占运</h2>
                </div>
            </div>
        )}

        <div onClick={() => !user.isLoggedIn ? setShowLoginModal(true) : startDivination()}>
             <TaiChiSpinner spinning={false} />
        </div>

        <div className="mt-12 text-center space-y-4 max-w-xs">
            {user.isLoggedIn ? (
                <>
                    <h2 className="font-serif text-2xl font-bold text-slate-900">今日一卦</h2>
                    <p className="font-serif text-sm text-slate-500 leading-relaxed">
                        心动即占，无事不占。<br/>请保持内心平静，点击上方太极开启。
                    </p>
                </>
            ) : (
                <>
                    <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                        <Lock size={16}/>
                        <span className="text-xs uppercase tracking-widest font-bold">Member Only</span>
                    </div>
                    <button onClick={() => setShowLoginModal(true)} className="px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 mx-auto">
                         <User size={16}/> 登录开启运势
                    </button>
                </>
            )}
        </div>
    </div>
  );
};

export default DailyDivination;
