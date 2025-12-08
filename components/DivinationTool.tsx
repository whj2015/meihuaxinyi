
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile, CustomAIConfig, HistoryRecord } from '../types';
import HexagramVisual from './HexagramVisual';
import { getInterpretation } from '../services/geminiService';
import AuthModal from './AuthModal';
import { Sparkles, ArrowRight, RefreshCcw, Settings, X, Check, User, LogOut, Gift, RotateCcw, Save, Loader2, Quote, BookOpen, Activity, UserCircle, Briefcase, GitCommit, ChevronRight, ArrowLeft, ArrowUp, ArrowDown, MoveHorizontal, MessageCircle, Hash, History, Clock, CreditCard, Trash2, AlertTriangle, LogIn, Lock, CheckCircle, XCircle, Compass } from 'lucide-react';

// --- Markdown Renderer ---
const FormattedMarkdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-4 font-serif text-slate-700">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0"></div>;
        if (trimmed.startsWith('###') || trimmed.startsWith('【')) {
            const content = trimmed.replace(/^###\s*/, '').replace(/[【】]/g, '');
            return (
                <h4 key={idx} className="text-base md:text-lg font-bold text-slate-800 mt-6 mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                    {content}
                </h4>
            );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            return (
                <div key={idx} className="flex gap-3 ml-1">
                    <span className="text-amber-400 mt-2 text-[10px]">•</span>
                    <p className="flex-1 leading-relaxed text-sm md:text-base text-slate-600">
                        <InlineBold text={content} />
                    </p>
                </div>
            );
        }
        return (
            <p key={idx} className="leading-7 md:leading-8 text-justify text-sm md:text-base text-slate-600">
                <InlineBold text={trimmed} />
            </p>
        );
      })}
    </div>
  );
};

const InlineBold: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="text-slate-900 font-bold bg-amber-50 px-1 rounded mx-0.5 border-b border-amber-100">{part.slice(2, -2)}</strong>;
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
};

// --- Main Component ---
const DivinationTool: React.FC = () => {
  const [inputs, setInputs] = useState<string[]>(['', '', '']);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false); 
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [provider, setProvider] = useState<AIProvider>('deepseek'); 
  
  const [guestApiKeys, setGuestApiKeys] = useState({ gemini: '', deepseek: '' });
  const [customConfig, setCustomConfig] = useState<CustomAIConfig>({ apiKey: '', baseUrl: '', modelName: '' });

  const [user, setUser] = useState<UserProfile>({ username: '', isLoggedIn: false });
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  // History State
  const [historyList, setHistoryList] = useState<HistoryRecord[]>([]);
  const [currentRecordId, setCurrentRecordId] = useState<number | string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // Derived Values
  const credits = user.credits || 0;
  const isFreeTierAvailable = user.isLoggedIn && credits > 0;
  const numLabels = ['上卦数', '下卦数', '动爻数'];
  
  const shouldShowSettingsDot = !user.isLoggedIn && (
      (provider === 'gemini' && !guestApiKeys.gemini) ||
      (provider === 'deepseek' && !guestApiKeys.deepseek)
  );

  // Init
  useEffect(() => {
    const savedUserStr = localStorage.getItem('user_profile');
    if (savedUserStr) {
        setUser(JSON.parse(savedUserStr));
    }
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    if (savedProvider) {
        setProvider(savedProvider);
    } else {
        setProvider('deepseek'); // Default to DeepSeek
    }
    const savedCustomConfig = localStorage.getItem('custom_ai_config');
    if (savedCustomConfig) {
        try { setCustomConfig(JSON.parse(savedCustomConfig)); } catch(e) {}
    }
  }, []);

  // Fetch History when User changes
  useEffect(() => {
      if (user.isLoggedIn && user.token) {
          fetchHistory();
      } else {
          setHistoryList([]); 
      }
  }, [user.isLoggedIn, user.token]);

  const fetchHistory = async () => {
      try {
          const res = await fetch(`/api/history`, {
              method: 'GET',
              headers: { 
                  'Authorization': `Bearer ${user.token}`,
                  'Content-Type': 'application/json'
              }
          });
          const data = await res.json();
          if (data.success) {
              setHistoryList(data.data);
          }
      } catch (e) {
          console.error("Failed to fetch history", e);
      }
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
      setUser(newUser);
      setGuestApiKeys({ gemini: '', deepseek: '' });
  };

  const handleLogout = () => {
    setUser({ username: '', isLoggedIn: false });
    localStorage.removeItem('user_profile');
  };

  const handleRecharge = async () => {
      if (!user.isLoggedIn) return;
      try {
        const res = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: 10, username: user.username })
        });
        const data = await res.json();
        alert(data.message);
      } catch (e) {
          alert("服务连接失败");
      }
  };

  const saveSettings = async () => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('custom_ai_config', JSON.stringify(customConfig));

    if (user.isLoggedIn && provider !== 'custom') {
        setIsSavingKeys(true);
        try {
            const encodeKey = (k: string) => k ? btoa(encodeURIComponent(k)) : "";
            
            const response = await fetch('/api/update-keys', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                    'x-gemini-token': encodeKey(guestApiKeys.gemini),
                    'x-deepseek-token': encodeKey(guestApiKeys.deepseek)
                },
                body: JSON.stringify({}) 
            });
            const data = await response.json();
            if (data.success) {
                alert("配置已加密同步至云端。");
                setShowSettings(false);
                setGuestApiKeys({ gemini: '', deepseek: '' }); 
            } else {
                alert(`同步失败: ${data.message}`);
            }
        } catch (e) {
            alert("网络错误");
        } finally {
            setIsSavingKeys(false);
        }
    } else {
        setShowSettings(false);
    }
  };

  const saveHistory = async (q: string, n1: number, n2: number, n3: number) => {
      if (!user.isLoggedIn) return;
      const timestamp = Date.now();
      
      try {
          const res = await fetch('/api/history', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
              },
              body: JSON.stringify({ question: q, n1, n2, n3, timestamp })
          });
          const data = await res.json();
          if (data.success) {
              setCurrentRecordId(data.id);
              const newRecord: HistoryRecord = { id: data.id, username: user.username, question: q, n1, n2, n3, timestamp };
              setHistoryList(prev => [newRecord, ...prev]);
          }
      } catch (e) { console.error("Save history failed", e); }
  };

  const updateHistoryAI = async (text: string) => {
      if (!currentRecordId || !user.isLoggedIn) return;
      setHistoryList(prev => prev.map(item => item.id === currentRecordId ? { ...item, ai_response: text } : item));
       try {
          await fetch('/api/history', {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
              },
              body: JSON.stringify({ id: currentRecordId, ai_response: text })
          });
       } catch(e) { console.error("Update AI history failed", e); }
  };

  const handleDeleteHistory = async (id: number | string) => {
      if (!user.isLoggedIn) return;

      try {
          const res = await fetch('/api/history', {
              method: 'DELETE',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
              },
              body: JSON.stringify({ id })
          });
          const data = await res.json();
          if (data.success) {
              setHistoryList(prev => prev.filter(item => item.id !== id));
          } else {
              alert("删除失败");
          }
      } catch (e) {
          alert("网络错误");
      } finally {
          setDeletingId(null);
      }
  };

  const restoreHistory = (record: HistoryRecord) => {
      setInputs([record.n1.toString(), record.n2.toString(), record.n3.toString()]);
      setQuestion(record.question || "");
      const res = calculateDivination(record.n1, record.n2, record.n3);
      setResult(res);
      setAiInterpretation(record.ai_response || null);
      setCurrentRecordId(record.id || null);
      setShowHistory(false);
      setTimeout(() => document.getElementById('result-start')?.scrollIntoView({behavior:'smooth'}), 100);
  };

  // --- Handlers for Input/Action ---
  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    if (value.length > 3) return; // Limit to 3 chars
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleRandom = () => {
    // Generate new numbers directly to avoid UI flickering
    const n1 = Math.floor(Math.random() * 800) + 100;
    const n2 = Math.floor(Math.random() * 800) + 100;
    const n3 = Math.floor(Math.random() * 800) + 100;
    
    setQuestion('');
    setResult(null);
    setAiInterpretation(null);
    setCurrentRecordId(null);
    
    setInputs([n1.toString(), n2.toString(), n3.toString()]);
  };

  const handleCalculate = async () => {
    const n1 = parseInt(inputs[0]);
    const n2 = parseInt(inputs[1]);
    const n3 = parseInt(inputs[2]);

    if (isNaN(n1) || isNaN(n2) || isNaN(n3)) {
        alert("请输入有效的数字 (1-999)");
        return;
    }
    
    (document.activeElement as HTMLElement)?.blur();

    const res = calculateDivination(n1, n2, n3);
    setResult(res);
    setAiInterpretation(null); 
    
    await saveHistory(question, n1, n2, n3);

    setTimeout(() => {
        const element = document.getElementById('result-start');
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleAskAI = async () => {
    if (!result) return;
    setLoadingAI(true);
    setAiInterpretation("");
    
    let currentKey = '';
    if (provider === 'gemini') currentKey = guestApiKeys.gemini;
    if (provider === 'deepseek') currentKey = guestApiKeys.deepseek;

    await getInterpretation(
        result,
        question,
        provider,
        {
            token: user.token,
            apiKey: currentKey,
            customConfig
        },
        (text) => {
            setAiInterpretation(text); 
        }
    ).then((finalText) => {
        setAiInterpretation(finalText);
        updateHistoryAI(finalText);
        // Refresh credits if logged in
        if (user.isLoggedIn && !currentKey && provider !== 'custom') {
             setUser(prev => ({...prev, credits: Math.max(0, (prev.credits || 0) - 1)}));
        }
    }).finally(() => {
        setLoadingAI(false);
    });
  };

  // --- Helper Functions for Rendering ---
  const getScoreColor = (score: string) => {
      switch (score) {
          case 'Great Auspicious': return 'bg-red-50 text-red-800 border-red-100';
          case 'Minor Auspicious': return 'bg-orange-50 text-orange-800 border-orange-100';
          case 'Auspicious': return 'bg-red-50 text-red-800 border-red-100';
          case 'Minor Bad': return 'bg-slate-50 text-slate-600 border-slate-200';
          case 'Great Bad': return 'bg-green-50 text-green-800 border-green-100';
          default: return 'bg-slate-50';
      }
  };

  const getScoreLabel = (score: string) => {
      switch (score) {
          case 'Great Auspicious': return '大吉';
          case 'Minor Auspicious': return '小吉';
          case 'Auspicious': return '吉';
          case 'Minor Bad': return '小凶';
          case 'Great Bad': return '大凶';
          default: return '平';
      }
  };

  // Derived Result Visuals
  let tiTrigram, yongTrigram, relationVisual;
  if (result) {
      tiTrigram = result.tiGua === 'upper' ? result.originalHexagram.upper : result.originalHexagram.lower;
      yongTrigram = result.yongGua === 'upper' ? result.originalHexagram.upper : result.originalHexagram.lower;

      const getRelationVisual = (score: string) => {
          switch (score) {
              case 'Great Auspicious': return { arrow: <ArrowUp size={24} className="text-red-500" />, desc: '大吉 · 生助' };
              case 'Minor Auspicious': return { arrow: <ArrowUp size={24} className="text-orange-500" />, desc: '小吉 · 比和/克用' };
              case 'Auspicious': return { arrow: <ArrowUp size={24} className="text-red-500" />, desc: '吉 · 比和' };
              case 'Minor Bad': return { arrow: <ArrowDown size={24} className="text-slate-400" />, desc: '小凶 · 生用' };
              case 'Great Bad': return { arrow: <ArrowDown size={24} className="text-green-700" />, desc: '大凶 · 克体' };
              default: return { arrow: <MoveHorizontal size={24} className="text-slate-300" />, desc: '平' };
          }
      };
      relationVisual = getRelationVisual(result.relationScore);
  }
  
  // --- Render Auth Guard for Unlogged Users (Unified UI Style) ---
  if (!user.isLoggedIn) {
      return (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 animate-in fade-in zoom-in-95 duration-500 px-4">
             {/* Unified Auth Modal */}
             <AuthModal 
                isOpen={showLoginModal} 
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
             />

            <div className="relative group cursor-pointer" onClick={() => setShowLoginModal(true)}>
                <div className="absolute inset-0 bg-slate-200 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                
                <button className="relative w-48 h-48 md:w-56 md:h-56 bg-white rounded-full border-4 border-slate-100 shadow-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 group-hover:border-slate-200">
                    
                    {/* Locked Overlay */}
                    <div className="absolute top-3 right-3 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-200 z-10">
                        <Lock size={14}/>
                    </div>

                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shadow-inner mb-2 transition-colors group-hover:bg-slate-200 group-hover:text-slate-600">
                        <Compass size={32} />
                    </div>
                    <div className="text-center px-4">
                        <div className="font-serif font-bold text-slate-800 text-lg md:text-xl group-hover:text-slate-900">
                            登录开启
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans tracking-widest uppercase mt-1 group-hover:text-slate-500 transition-colors">
                            Digital Divination
                        </div>
                    </div>
                </button>
            </div>
            
            <div className="mt-12 text-center max-w-sm mx-auto px-4">
                <h3 className="text-slate-800 font-serif font-bold mb-2">万物皆数，感而遂通</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    心诚则灵，数字中蕴含着当下的天机。<br/>
                    登录后即可开启起卦功能，并保存您的专属档案。
                </p>
                
                <div className="flex flex-col items-center gap-2">
                    <button onClick={() => setShowLoginModal(true)} className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                         <User size={14}/> 账号登录 / 注册
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2">云端同步 · 隐私加密</p>
                </div>
            </div>
        </div>
      );
  }

  // --- Render Main Tool (Logged In) ---
  return (
      <div className="w-full space-y-8 relative">
           {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 duration-300">
             <div className="md:hidden w-full flex justify-center pt-3 pb-1"><div className="w-12 h-1.5 bg-slate-200 rounded-full"></div></div>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 md:rounded-t-2xl">
              <h3 className="font-serif font-bold text-slate-800 text-lg">设置与同步</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto no-scrollbar flex-1 overscroll-contain bg-slate-50/50">
                <div className="p-6 bg-white m-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">{user.username.charAt(0).toUpperCase()}</div>
                            <div>
                                <p className="font-bold text-slate-900">{user.username}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${credits>0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                        解卦点数: {credits}
                                    </span>
                                    <button onClick={handleRecharge} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                                        <CreditCard size={10}/> 充值
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-xs border border-slate-200 px-3 py-2 rounded-lg bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center gap-2 font-medium"><LogOut size={14}/> 退出</button>
                    </div>
                </div>

                <div className="p-6 m-4 mt-0 bg-white rounded-xl shadow-sm border border-slate-100 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-3">选择 AI 模型</label>
                        <div className="grid grid-cols-3 gap-3">
                             {['deepseek', 'gemini', 'custom'].map(m => (
                                 <button key={m} onClick={()=>setProvider(m as any)} className={`py-3 px-2 rounded-xl border text-xs font-bold relative transition-all ${provider===m?'bg-slate-900 border-slate-900 text-white shadow-md':'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}>
                                     {m === 'deepseek' ? 'DeepSeek' : (m === 'gemini' ? 'Gemini' : '自定义')}
                                     {provider===m && <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white"><Check size={10}/></div>}
                                 </button>
                             ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {provider === 'gemini' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gemini API Key</label>
                                <input type="password" value={guestApiKeys.gemini} onChange={e=>setGuestApiKeys({...guestApiKeys, gemini:e.target.value})} placeholder={user.isLoggedIn ? "已登录，留空自动使用云端配置" : "请输入您的 Key"} className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all"/>
                            </div>
                        )}
                        {provider === 'deepseek' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">DeepSeek API Key</label>
                                <input type="password" value={guestApiKeys.deepseek} onChange={e=>setGuestApiKeys({...guestApiKeys, deepseek:e.target.value})} placeholder={user.isLoggedIn ? "已登录，留空自动使用云端配置" : "请输入 sk-..."} className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all"/>
                            </div>
                        )}
                        {provider === 'custom' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <input type="text" value={customConfig.baseUrl} onChange={e=>setCustomConfig({...customConfig,baseUrl:e.target.value})} placeholder="API Base URL" className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"/>
                                <input type="text" value={customConfig.modelName} onChange={e=>setCustomConfig({...customConfig,modelName:e.target.value})} placeholder="Model Name" className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"/>
                                <input type="password" value={customConfig.apiKey} onChange={e=>setCustomConfig({...customConfig,apiKey:e.target.value})} placeholder="API Key" className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"/>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white shrink-0 md:rounded-b-2xl">
                    <button onClick={saveSettings} disabled={isSavingKeys} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 active:scale-95 transition-all">
                        {isSavingKeys ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} 
                        {user.isLoggedIn && provider !== 'custom' ? '保存并同步至云端' : '保存设置 (本地)'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Input Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100/60 p-6 md:p-10 relative overflow-hidden transition-all hover:shadow-md">
         <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -z-10 opacity-60"></div>
        <div className="flex justify-between items-center mb-8 md:mb-10">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">数字起卦</h2>
            <div className="flex gap-2">
                <button onClick={()=>setShowHistory(true)} className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm">
                    <History size={18} /><span className="text-xs font-bold hidden md:inline">起卦记录</span>
                </button>
                <button onClick={()=>setShowSettings(true)} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all shadow-sm group ${shouldShowSettingsDot ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                   <div className="relative">
                       <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500"/>
                       {shouldShowSettingsDot && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                   </div>
                   <span className="text-xs font-bold">配置 AI</span>
                </button>
            </div>
        </div>
        <div className="space-y-8">
            <div className="bg-slate-50/50 p-1.5 rounded-2xl border border-slate-200 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-50 transition-all">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0"><MessageCircle size={20}/></div>
                    <div className="flex-1">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">所测何事 (可选)</label>
                         <input type="text" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="例如：今日财运如何？/ 丢失的钥匙在哪里？" className="w-full bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-300 text-base md:text-lg"/>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-6">
                {inputs.map((val,idx)=>(
                    <div key={idx} className="flex flex-col gap-2">
                        <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1"><Hash size={12}/> {numLabels[idx]}</div>
                        <div className="relative group">
                            <div className="absolute top-2 left-2 text-[10px] text-slate-300 font-mono pointer-events-none">#{idx+1}</div>
                            <input inputMode="numeric" type="number" value={val} onChange={e=>handleInputChange(idx,e.target.value)} className="w-full text-center text-3xl md:text-4xl font-serif h-20 md:h-24 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all placeholder:text-slate-200 text-slate-800" placeholder="0-999"/>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-100/50">
                <button onClick={handleRandom} className="w-14 h-14 md:h-16 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all" title="随机生成"><RefreshCcw size={22}/></button>
                <button onClick={handleCalculate} className="flex-1 h-14 md:h-16 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all flex justify-center items-center gap-3">开始起卦 <ArrowRight size={20} className="opacity-80"/></button>
            </div>
        </div>
      </div>

      {/* Result Section */}
      {result && tiTrigram && yongTrigram && relationVisual && (
        <div id="result-start" className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-28">
            <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100/60">
                <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 md:gap-12">
                    <div className="flex-1 flex flex-col items-center group">
                        <HexagramVisual hexagram={result.originalHexagram} label="本卦 · 初始" highlight={result.tiGua} movingLine={result.movingLine}/>
                        <div className="mt-4 text-xs text-slate-400 font-mono group-hover:text-amber-600 transition-colors">Start</div>
                    </div>
                    <div className="flex md:flex-col items-center justify-center opacity-30">
                        <div className="h-px w-full md:w-px md:h-20 bg-slate-400"></div>
                        <ChevronRight className="md:rotate-90 text-slate-400 -ml-1 md:ml-0 md:-mt-1" size={16}/>
                    </div>
                    <div className="flex-1 flex flex-col items-center group">
                         <div className="relative">
                            <HexagramVisual hexagram={result.huHexagram} label="互卦 · 过程"/>
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-white shadow-sm text-slate-300"><GitCommit size={14}/></div>
                         </div>
                         <div className="mt-4 text-xs text-slate-400 font-mono group-hover:text-amber-600 transition-colors">Process</div>
                    </div>
                    <div className="flex md:flex-col items-center justify-center opacity-30">
                        <div className="h-px w-full md:w-px md:h-20 bg-slate-400"></div>
                        <ChevronRight className="md:rotate-90 text-slate-400 -ml-1 md:ml-0 md:-mt-1" size={16}/>
                    </div>
                    <div className="flex-1 flex flex-col items-center group">
                        <HexagramVisual hexagram={result.changedHexagram} label="变卦 · 结果"/>
                        <div className="mt-4 text-xs text-slate-400 font-mono group-hover:text-amber-600 transition-colors">End</div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                 <div className={`p-6 md:p-8 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between min-h-[160px] ${getScoreColor(result.relationScore)}`}>
                     <div className="relative z-10">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">吉凶速断</div>
                        <div className="text-3xl md:text-4xl font-serif font-bold">{getScoreLabel(result.relationScore)}</div>
                        <div className="mt-2 font-medium opacity-80">{result.relation}</div>
                     </div>
                     <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12"><Activity size={120} /></div>
                 </div>
                 <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                     <div className="flex items-center justify-between gap-4 h-full relative">
                         <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 relative">
                             <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wider">自己 (体)</span>
                             <span className="font-serif font-bold text-xl text-slate-800">{tiTrigram.name} <span className="text-sm font-normal text-slate-500">({tiTrigram.element})</span></span>
                         </div>
                         <div className="flex flex-col items-center gap-1 shrink-0 z-10">{relationVisual.arrow}</div>
                         <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 relative">
                             <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wider">事物 (用)</span>
                             <span className="font-serif font-bold text-xl text-slate-800">{yongTrigram.name} <span className="text-sm font-normal text-slate-500">({yongTrigram.element})</span></span>
                         </div>
                     </div>
                     <div className="text-center mt-3 text-xs text-slate-500 font-medium">{relationVisual.desc}</div>
                 </div>
            </div>

            <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><BookOpen size={20}/></div>
                    <h3 className="font-serif font-bold text-xl text-slate-800">古籍断语</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">本卦</div>
                        <div className="font-serif font-bold text-lg text-slate-800">{result.originalHexagram.name}</div>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify bg-slate-50 p-3 rounded-xl">{result.originalHexagram.text?.guaci}</p>
                    </div>
                    <div className="space-y-2 relative">
                        <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1"><Sparkles size={12}/> 动爻 (关键)</div>
                        <div className="font-serif font-bold text-lg text-amber-700">{result.movingLineText ? result.movingLineText.split('：')[0] : '无'}</div>
                        <p className="text-sm text-amber-900 leading-relaxed text-justify bg-amber-50 p-3 rounded-xl border border-amber-100 shadow-sm">{result.movingLineText ? result.movingLineText.substring(result.movingLineText.indexOf('：')+1) : '无动爻变化，事态平稳。'}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">变卦</div>
                        <div className="font-serif font-bold text-lg text-slate-800">{result.changedHexagram.name}</div>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify bg-slate-50 p-3 rounded-xl">{result.changedHexagram.text?.guaci}</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#fdfbf7] p-6 md:p-10 rounded-[2rem] shadow-sm border border-slate-200/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/3 -translate-y-1/3"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Quote size={20}/></div>
                        <div>
                            <h3 className="text-xl font-serif font-bold text-slate-900">大师详解</h3>
                            <p className="text-xs text-slate-400">AI Master Interpretation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isFreeTierAvailable && !aiInterpretation && (
                             <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                                解卦点数: {credits}
                             </span>
                        )}
                        {aiInterpretation && !loadingAI && (
                            <button onClick={handleAskAI} className="p-2 text-slate-400 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-full transition-all shadow-sm"><RotateCcw size={18} /></button>
                        )}
                    </div>
                </div>

                {!aiInterpretation ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><Sparkles className="text-slate-300" size={32}/></div>
                        <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">AI 国学大师将综合本卦、互卦与变卦，<br/>结合五行生克为您进行深度推演。</p>
                        <button onClick={handleAskAI} disabled={loadingAI} className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2">
                            {loadingAI ? '大师正在推演...' : '请求大师解卦'} {loadingAI ? <Loader2 className="animate-spin" size={18}/> : <ArrowRight size={18}/>}
                        </button>
                    </div>
                ) : (
                    <div className="prose prose-slate max-w-none">
                        <FormattedMarkdown text={aiInterpretation}/>
                        <div className="h-5 w-1.5 bg-amber-500 animate-pulse inline-block ml-1 align-middle rounded-full"></div>
                    </div>
                )}
            </div>
            
            <div className="h-12"></div>
        </div>
      )}

      {/* History Sidebar */}
      {showHistory && createPortal(
          <>
            <div 
                className="fixed inset-0 z-[140] bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setShowHistory(false)}
            />
            <div className="fixed inset-y-0 right-0 z-[150] w-full md:w-96 bg-white shadow-2xl border-l border-slate-100 flex flex-col h-[100dvh] animate-in slide-in-from-right duration-300 sm:duration-500">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                      <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2">
                          <History size={18}/> 起卦记录
                      </h3>
                      <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                          <X size={18} className="text-slate-400"/>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar overscroll-contain pb-20">
                      {historyList.length === 0 ? (
                          <div className="text-center py-20 text-slate-400 text-sm">
                              <History size={32} className="mx-auto mb-3 opacity-30"/>
                              <p>暂无记录</p>
                              <p className="text-xs text-slate-300 mt-1">起卦后将自动保存</p>
                          </div>
                      ) : (
                          historyList.map((record) => (
                              <div key={record.id} onClick={() => restoreHistory(record)} className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-amber-200 cursor-pointer transition-all group relative overflow-hidden">
                                  {deletingId === record.id ? (
                                      <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                                          <div className="text-red-600 font-bold text-sm flex items-center gap-2 mb-3">
                                              <AlertTriangle size={16}/> 确定删除此记录?
                                          </div>
                                          <div className="flex gap-2 w-full">
                                              <button onClick={() => setDeletingId(null)} className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">取消</button>
                                              <button onClick={() => handleDeleteHistory(record.id)} className="flex-1 py-2 bg-red-600 rounded-lg text-xs font-bold text-white hover:bg-red-700 shadow-sm">删除</button>
                                          </div>
                                      </div>
                                  ) : null}
                                  
                                  <div className="flex justify-between items-start mb-2.5">
                                      <div className="font-serif font-bold text-slate-800 text-sm line-clamp-1 flex-1 pr-3">{record.question || "无题测算"}</div>
                                      <div className="text-[10px] text-slate-400 font-mono shrink-0 bg-slate-50 px-1.5 py-0.5 rounded">{new Date(record.timestamp).toLocaleDateString()}</div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100/50">
                                          <Hash size={10}/>
                                          <span className="font-mono tracking-widest">{record.n1}-{record.n2}-{record.n3}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          {record.ai_response && <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100"><Sparkles size={10}/> 已解</div>}
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); setDeletingId(record.id); }} 
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 -mr-1"
                                            title="删除记录"
                                          >
                                              <Trash2 size={14}/>
                                          </button>
                                      </div>
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

export default DivinationTool;
