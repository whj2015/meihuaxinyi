

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile, CustomAIConfig, HistoryRecord, TransactionRecord } from '../types';
import HexagramVisual from './HexagramVisual';
import { getInterpretation } from '../services/geminiService';
import AuthModal from './AuthModal';
import DailyDivination from './DailyDivination';
import { Sparkles, ArrowLeft, RefreshCcw, Settings, X, Check, User, LogOut, RotateCcw, Loader2, Quote, BookOpen, Activity, History, ChevronRight, Lock, Hash, Calendar, ArrowRight, Wallet, ReceiptText, PlusCircle, MinusCircle } from 'lucide-react';

// --- Markdown Renderer ---
const FormattedMarkdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-4 font-serif text-slate-700 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2"></div>;
        if (trimmed.startsWith('###') || trimmed.startsWith('【')) {
            const content = trimmed.replace(/^###\s*/, '').replace(/[【】]/g, '');
            return (
                <div key={idx} className="mt-6 mb-3 flex items-center gap-3">
                    <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                    <h4 className="text-base font-bold text-slate-900">{content}</h4>
                </div>
            );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
                <div key={idx} className="flex gap-3 ml-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-2 shrink-0"></div>
                    <p className="flex-1 text-sm text-slate-600"><InlineBold text={trimmed.substring(2)} /></p>
                </div>
            );
        }
        return <p key={idx} className="text-sm text-slate-600 text-justify"><InlineBold text={trimmed} /></p>;
      })}
    </div>
  );
};

const InlineBold: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>{parts.map((p, i) => p.startsWith('**') ? <strong key={i} className="font-bold text-slate-900 bg-slate-100 px-1 mx-0.5 rounded text-[0.95em]">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>)}</>
    );
};

const NumberSlot: React.FC<{ value: string; label: string; subLabel: string; onChange: (val: string) => void; isFocused: boolean; onFocus: () => void }> = ({ value, label, subLabel, onChange, isFocused, onFocus }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    return (
        <div 
            onClick={() => { onFocus(); inputRef.current?.focus(); }}
            className={`relative h-28 md:h-32 rounded-2xl transition-all duration-300 cursor-text group flex flex-col items-center justify-center overflow-hidden
                ${isFocused 
                    ? 'bg-slate-900 text-white shadow-xl scale-[1.02] ring-2 ring-amber-400 ring-offset-2' 
                    : 'bg-white border border-slate-100 text-slate-800 shadow-sm hover:border-slate-300 hover:shadow-md'
                }`}
        >
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isFocused ? 'text-amber-400' : 'text-slate-400'}`}>{label}</div>
            
            <input 
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={value}
                onChange={(e) => {
                    const val = e.target.value.slice(0, 3);
                    onChange(val);
                }}
                className={`w-full text-center bg-transparent border-none outline-none font-serif text-4xl md:text-5xl font-bold p-0 ${isFocused ? 'text-white placeholder:text-slate-700' : 'text-slate-900 placeholder:text-slate-100'}`}
                placeholder="000"
            />
            
            <div className={`text-[10px] font-medium mt-2 px-2 py-0.5 rounded-full ${isFocused ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-400'}`}>
                {subLabel}
            </div>
            
            {/* Corner Accents */}
            {isFocused && (
                <>
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-amber-400/50"></div>
                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-amber-400/50"></div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-amber-400/50"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-amber-400/50"></div>
                </>
            )}
        </div>
    );
};

// --- Profile / Settings Modal ---
const ProfileModal: React.FC<{ user: UserProfile; onClose: () => void; onLogout: () => void; onRecharge: () => void }> = ({ user, onClose, onLogout, onRecharge }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    useEffect(() => {
        if (activeTab === 'history') {
            setIsLoadingLogs(true);
            fetch('/api/wallet/transactions', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) setTransactions(data.data);
            })
            .finally(() => setIsLoadingLogs(false));
        }
    }, [activeTab, user.token]);

    return createPortal(
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                 
                 {/* Header */}
                 <div className="p-6 pb-4 bg-white relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold font-serif shadow-lg">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{user.username}</h3>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Member</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                            <X size={18}/>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${activeTab === 'overview' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <span className="flex items-center justify-center gap-2"><User size={14}/> 账户概览</span>
                            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${activeTab === 'history' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <span className="flex items-center justify-center gap-2"><ReceiptText size={14}/> 交易记录</span>
                            {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
                        </button>
                    </div>
                 </div>

                 {/* Content Area */}
                 <div className="p-6 pt-2 overflow-y-auto flex-1">
                     {activeTab === 'overview' ? (
                         <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -z-0 pointer-events-none opacity-50 translate-x-10 -translate-y-10"></div>
                             
                             <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative z-10">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Credits</span>
                                     <span className="text-amber-600 font-bold flex items-center gap-1 text-sm"><Sparkles size={12}/> 灵力点数</span>
                                 </div>
                                 <div className="flex items-end gap-2">
                                     <span className="text-4xl font-bold text-slate-900 font-serif">{user.credits || 0}</span>
                                     <span className="text-xs text-slate-400 mb-1.5">pts</span>
                                 </div>
                                 <button 
                                    onClick={onRecharge}
                                    className="mt-4 w-full py-2.5 bg-white border border-amber-200 text-amber-700 rounded-lg text-sm font-bold shadow-sm hover:shadow-md hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                                 >
                                     <Wallet size={16}/> 充值点数 (模拟)
                                 </button>
                             </div>
                             
                             <button onClick={onLogout} className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2">
                                 <LogOut size={16}/> 退出登录
                             </button>
                         </div>
                     ) : (
                         <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 min-h-[200px]">
                             {isLoadingLogs ? (
                                 <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300"/></div>
                             ) : transactions.length === 0 ? (
                                 <div className="text-center py-8 text-slate-400 text-xs">暂无交易记录</div>
                             ) : (
                                 transactions.map((tx) => (
                                     <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-50 bg-slate-50/50">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'usage' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                 {tx.type === 'usage' ? <MinusCircle size={14}/> : <PlusCircle size={14}/>}
                                             </div>
                                             <div>
                                                 <div className="text-sm font-bold text-slate-700">{tx.description}</div>
                                                 <div className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleString()}</div>
                                             </div>
                                         </div>
                                         <div className={`font-mono font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                                             {tx.amount > 0 ? '+' : ''}{tx.amount}
                                         </div>
                                     </div>
                                 ))
                             )}
                         </div>
                     )}
                 </div>
            </div>
        </div>,
        document.body
    );
};

// --- Main Component ---
const DivinationTool: React.FC = () => {
  // Mode Selection: 'menu', 'digital', 'daily'
  const [mode, setMode] = useState<'menu' | 'digital' | 'daily'>('menu');

  const [inputs, setInputs] = useState<string[]>(['', '', '']);
  const [focusedSlot, setFocusedSlot] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false); 
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [provider, setProvider] = useState<AIProvider>('deepseek'); 
  const [guestApiKeys, setGuestApiKeys] = useState({ gemini: '', deepseek: '' });
  const [customConfig, setCustomConfig] = useState<CustomAIConfig>({ apiKey: '', baseUrl: '', modelName: '' });

  const [user, setUser] = useState<UserProfile>({ username: '', isLoggedIn: false });
  const [historyList, setHistoryList] = useState<HistoryRecord[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  // Init
  useEffect(() => {
    const savedUserStr = localStorage.getItem('user_profile');
    if (savedUserStr) setUser(JSON.parse(savedUserStr));
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    if (savedProvider) setProvider(savedProvider);
  }, []);

  // Fetch History
  useEffect(() => {
      if (user.isLoggedIn && user.token && mode === 'digital') fetchHistory();
  }, [user.isLoggedIn, user.token, mode]);

  const fetchHistory = async () => {
      try {
          const res = await fetch(`/api/history`, { headers: { 'Authorization': `Bearer ${user.token}` } });
          const data = await res.json();
          if (data.success) setHistoryList(data.data);
      } catch (e) { console.error("History fetch error", e); }
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
      setUser(newUser);
      setGuestApiKeys({ gemini: '', deepseek: '' });
  };

  const handleLogout = () => {
    setUser({ username: '', isLoggedIn: false });
    localStorage.removeItem('user_profile');
    setMode('menu');
    setShowProfile(false);
  };
  
  const handleRecharge = async () => {
      if (!user.token) return;
      try {
          const res = await fetch('/api/wallet/recharge', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
              },
              body: JSON.stringify({ amount: 10 })
          });
          const data = await res.json();
          if (data.success) {
              const updatedUser = { ...user, credits: data.credits };
              setUser(updatedUser);
              localStorage.setItem('user_profile', JSON.stringify(updatedUser));
              alert("充值成功！点数 +10");
          } else {
              alert("充值失败: " + data.message);
          }
      } catch (e) {
          console.error(e);
          alert("网络错误");
      }
  };

  const handleCalculate = async () => {
    const n1 = parseInt(inputs[0]);
    const n2 = parseInt(inputs[1]);
    const n3 = parseInt(inputs[2]);

    if (isNaN(n1) || isNaN(n2) || isNaN(n3)) {
        alert("请完整输入三个数字");
        return;
    }
    
    (document.activeElement as HTMLElement)?.blur();
    setFocusedSlot(null);
    const res = calculateDivination(n1, n2, n3);
    setResult(res);
    setAiInterpretation(null); 
    
    if (user.isLoggedIn) {
        try {
            await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ question, n1, n2, n3, timestamp: Date.now() })
            });
            fetchHistory();
        } catch (e) {}
    }

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleAskAI = async () => {
    if (!result) return;
    setLoadingAI(true);
    setAiInterpretation("");
    
    let currentKey = provider === 'gemini' ? guestApiKeys.gemini : guestApiKeys.deepseek;

    await getInterpretation(
        result,
        question,
        provider,
        { token: user.token, apiKey: currentKey, customConfig },
        (text) => setAiInterpretation(text)
    ).finally(() => {
        setLoadingAI(false);
        // 如果是 DeepSeek 或 Gemini 系统扣费，需要更新前端显示的 Credits
        // 简单起见，重新获取一次用户信息或者手动减1 (这里手动减1以即时反馈，实际应以服务器为准)
        // 最好是加一个 checkBalance 的函数，这里简化处理
        if (!guestApiKeys.gemini && !guestApiKeys.deepseek && user.credits && user.credits > 0) {
            const newCredits = user.credits - 1;
            const updatedUser = { ...user, credits: newCredits };
            setUser(updatedUser);
            localStorage.setItem('user_profile', JSON.stringify(updatedUser));
        }
    });
  };

  const handleRandom = () => {
    setInputs([
        (Math.floor(Math.random() * 800) + 100).toString(),
        (Math.floor(Math.random() * 800) + 100).toString(),
        (Math.floor(Math.random() * 800) + 100).toString()
    ]);
  };

  // --- Auth Guard (Common) ---
  if (!user.isLoggedIn) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500 px-4">
             <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess}/>
            <button onClick={() => setShowLoginModal(true)} className="group relative w-full max-w-xs aspect-square bg-white rounded-[2rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
                    <Lock size={32} />
                </div>
                <div className="text-center">
                    <h3 className="font-serif font-bold text-xl text-slate-800">开启探索</h3>
                    <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold">Sign in to Start</p>
                </div>
            </button>
        </div>
      );
  }

  // --- RENDER: Menu Mode ---
  if (mode === 'menu') {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
             {showProfile && <ProfileModal user={user} onClose={()=>setShowProfile(false)} onLogout={handleLogout} onRecharge={handleRecharge}/>}
             
             <div className="flex justify-between items-center mb-12">
                 <div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-1">易学实践</h2>
                    <p className="text-slate-500 text-sm">选择一种方式，探索未知的指引</p>
                 </div>
                 <button onClick={() => setShowProfile(true)} className="flex flex-col items-center gap-1 group">
                     <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold font-serif shadow-lg group-hover:bg-amber-500 transition-colors">
                        {user.username.charAt(0).toUpperCase()}
                     </div>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-amber-600">Profile</span>
                 </button>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
                 {/* Card 1: Digital Divination */}
                 <button 
                    onClick={() => setMode('digital')}
                    className="group relative bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-amber-200 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                 >
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                         <Hash size={120} />
                     </div>
                     <div className="relative z-10">
                         <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:bg-amber-500 transition-colors duration-300">
                             <Sparkles size={28} />
                         </div>
                         <h3 className="text-2xl font-serif font-bold text-slate-900 mb-3">灵数起卦</h3>
                         <p className="text-slate-500 text-sm leading-relaxed mb-6 pr-8">
                             心念所至，数由心生。输入三个数字，推演具体事宜的吉凶、过程与结果。
                         </p>
                         <div className="flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-amber-600 transition-colors">
                             Start <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                         </div>
                     </div>
                 </button>

                 {/* Card 2: Daily Fortune */}
                 <button 
                    onClick={() => setMode('daily')}
                    className="group relative bg-[#fffcf5] p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-red-200 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                 >
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                         <Calendar size={120} />
                     </div>
                     <div className="relative z-10">
                         <div className="w-14 h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:border-red-500 group-hover:text-red-600 transition-colors duration-300">
                             <Quote size={28} />
                         </div>
                         <h3 className="text-2xl font-serif font-bold text-slate-900 mb-3">今日一卦</h3>
                         <p className="text-slate-500 text-sm leading-relaxed mb-6 pr-8">
                             晨起卜运，一日之计。获取今日的能量指引、宜忌建议与运势评分。
                         </p>
                         <div className="flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-red-600 transition-colors">
                             Open <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                         </div>
                     </div>
                 </button>
             </div>
        </div>
      );
  }

  // --- RENDER: Daily Mode ---
  if (mode === 'daily') {
      return (
          <div className="animate-in fade-in zoom-in-95 duration-300">
              <DailyDivination onBack={() => setMode('menu')} />
          </div>
      );
  }

  // --- RENDER: Digital Divination Mode (Existing Logic) ---
  return (
      <div className="w-full space-y-8 pb-32 animate-in slide-in-from-right-8 fade-in duration-300">
        {/* --- The Input Engine --- */}
        <div className="bg-[#fcfbf9] p-2 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] border border-slate-200/60 relative overflow-hidden max-w-2xl mx-auto">
            <div className="bg-white rounded-[1.5rem] p-6 md:p-8 space-y-6 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMode('menu')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-slate-900">灵数起卦</h2>
                            <p className="text-xs text-slate-400 mt-1">请输入三个数字，或随机生成</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleRandom} className="p-3 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors" title="随机生成">
                            <RefreshCcw size={18} />
                        </button>
                        <button onClick={()=>setShowHistory(true)} className="p-3 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                            <History size={18} />
                        </button>
                    </div>
                </div>

                {/* Question Input */}
                <input 
                    type="text" 
                    value={question} 
                    onChange={e=>setQuestion(e.target.value)} 
                    placeholder="心中所问何事？(可留空)" 
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400 text-slate-800 transition-all"
                />

                {/* The "Slot Machines" */}
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                    <NumberSlot 
                        value={inputs[0]} label="天" subLabel="上卦" 
                        onChange={v=>setInputs([v, inputs[1], inputs[2]])} 
                        isFocused={focusedSlot === 0} onFocus={()=>setFocusedSlot(0)}
                    />
                    <NumberSlot 
                        value={inputs[1]} label="地" subLabel="下卦" 
                        onChange={v=>setInputs([inputs[0], v, inputs[2]])} 
                        isFocused={focusedSlot === 1} onFocus={()=>setFocusedSlot(1)}
                    />
                    <NumberSlot 
                        value={inputs[2]} label="人" subLabel="动爻" 
                        onChange={v=>setInputs([inputs[0], inputs[1], v])} 
                        isFocused={focusedSlot === 2} onFocus={()=>setFocusedSlot(2)}
                    />
                </div>

                {/* Action Button */}
                <button 
                    onClick={handleCalculate} 
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-base shadow-lg shadow-slate-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 hover:bg-slate-800"
                >
                    <Sparkles size={18} className="text-amber-300"/> 开始排盘推演
                </button>
            </div>
        </div>

        {/* --- Result Stream --- */}
        {result && (
            <div ref={resultRef} className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
                
                {/* 1. Destiny Timeline (Hexagrams) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-gradient-to-b from-transparent via-amber-200 to-transparent"></div>
                    
                    <div className="space-y-8 relative z-10">
                        {/* Start */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 text-right">
                                <div className="font-serif font-bold text-lg text-slate-800">{result.originalHexagram.name}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Present</div>
                            </div>
                            <div className="w-12 h-12 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center shrink-0 shadow-md z-10 relative">
                                <div className="font-serif font-bold text-xs">本</div>
                            </div>
                            <div className="flex-1 pl-2">
                                <div className="scale-75 origin-left"><HexagramVisual hexagram={result.originalHexagram} highlight={result.tiGua}/></div>
                            </div>
                        </div>

                        {/* Middle */}
                        <div className="flex items-center gap-4 opacity-70">
                            <div className="flex-1 text-right">
                                <div className="font-serif font-bold text-base text-slate-600">{result.huHexagram.name}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Process</div>
                            </div>
                            <div className="w-8 h-8 bg-white border border-slate-300 rounded-full flex items-center justify-center shrink-0 z-10">
                                <div className="font-serif text-[10px] text-slate-400">互</div>
                            </div>
                            <div className="flex-1 pl-2 grayscale">
                                <div className="scale-[0.6] origin-left"><HexagramVisual hexagram={result.huHexagram}/></div>
                            </div>
                        </div>

                        {/* End */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 text-right">
                                <div className="font-serif font-bold text-lg text-slate-800">{result.changedHexagram.name}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Future</div>
                            </div>
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shrink-0 shadow-md z-10 ring-4 ring-slate-100">
                                <div className="font-serif font-bold text-xs">变</div>
                            </div>
                            <div className="flex-1 pl-2">
                                <div className="scale-75 origin-left"><HexagramVisual hexagram={result.changedHexagram}/></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Judgement Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#fffcf5] p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><Activity size={48}/></div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Judgment</div>
                        <div>
                            <div className="text-2xl font-serif font-bold text-slate-900">{result.relationScore.replace('Great', '大').replace('Minor', '小').replace('Auspicious', '吉').replace('Bad', '凶')}</div>
                            <div className="text-xs text-slate-500 mt-1">{result.relation}</div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><Quote size={48}/></div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ancient</div>
                        <div className="text-xs leading-relaxed text-slate-600 line-clamp-3 font-serif">
                            {result.originalHexagram.text?.guaci}
                        </div>
                    </div>
                </div>

                {/* 3. AI Master Chat */}
                <div className="bg-white rounded-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100">
                    <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg">
                                <Sparkles size={14} className="text-white"/>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">AI 大师详解</h3>
                                <div className="text-[10px] text-slate-400">Powered by {provider === 'custom' ? 'Custom' : (provider === 'gemini' ? 'Gemini' : 'DeepSeek')}</div>
                            </div>
                        </div>
                        {aiInterpretation && !loadingAI && (
                            <button onClick={handleAskAI} className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg transition-colors"><RotateCcw size={12}/> 重解</button>
                        )}
                    </div>
                    
                    <div className="p-6 md:p-8 min-h-[200px] bg-slate-50/50">
                        {!aiInterpretation ? (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                                <p className="text-sm text-slate-500 mb-6 font-serif max-w-xs">
                                    大师将综合本卦、互卦、变卦及五行生克，为您推演事情的来龙去脉。
                                </p>
                                <button 
                                    onClick={handleAskAI} 
                                    disabled={loadingAI}
                                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-full text-slate-800 text-sm font-bold shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex items-center gap-2"
                                >
                                    {loadingAI ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} className="text-amber-500"/>}
                                    {loadingAI ? '正在推演天机...' : '请求大师解卦'}
                                </button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-500">
                                <FormattedMarkdown text={aiInterpretation} />
                                <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                                     <span className="text-[10px] text-slate-300 font-serif">此结果仅供参考，命运掌握在自己手中</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      
        {/* History Sidebar */}
        {showHistory && createPortal(
            <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex justify-end">
                <div className="w-full max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">历史记录</h3>
                        <button onClick={() => setShowHistory(false)}><X size={20}/></button>
                    </div>
                    <div className="space-y-3">
                        {historyList.map((record) => (
                            <div 
                                key={record.id} 
                                onClick={() => { 
                                    setInputs([record.n1.toString(), record.n2.toString(), record.n3.toString()]);
                                    setQuestion(record.question);
                                    
                                    // 重新计算并恢复结果
                                    const res = calculateDivination(record.n1, record.n2, record.n3);
                                    setResult(res);
                                    
                                    // 恢复 AI 解读（如果有）
                                    setAiInterpretation(record.ai_response || null);
                                    
                                    setShowHistory(false);
                                    // 滚动到结果区域
                                    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                                }} 
                                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="font-bold text-slate-800 mb-1">{record.question || "无题"}</div>
                                <div className="text-xs text-slate-400 flex justify-between">
                                    <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                                    <span className="font-mono">{record.n1}-{record.n2}-{record.n3}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>,
            document.body
        )}
      </div>
  );
};

export default DivinationTool;
