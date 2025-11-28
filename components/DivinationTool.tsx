
import React, { useState, useEffect } from 'react';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile, CustomAIConfig } from '../types';
import HexagramVisual from './HexagramVisual';
import { getInterpretation } from '../services/geminiService';
import { Sparkles, ArrowRight, RefreshCcw, Settings, X, Check, User, LogOut, Gift, RotateCcw, Save, Loader2, Quote, BookOpen, Activity, UserCircle, Briefcase, GitCommit, ChevronRight, ArrowLeft, ArrowUp, ArrowDown, MoveHorizontal } from 'lucide-react';

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
  const [provider, setProvider] = useState<AIProvider>('deepseek'); // Default DeepSeek
  
  const [guestApiKeys, setGuestApiKeys] = useState({ gemini: '', deepseek: '' });
  const [customConfig, setCustomConfig] = useState<CustomAIConfig>({ apiKey: '', baseUrl: '', modelName: '' });

  const [user, setUser] = useState<UserProfile>({ username: '', isLoggedIn: false });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [authMessage, setAuthMessage] = useState({ text: '', type: '' as 'success' | 'error' | '' });
  const [isSavingKeys, setIsSavingKeys] = useState(false);

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
        setProvider('deepseek'); 
    }
    const savedCustomConfig = localStorage.getItem('custom_ai_config');
    if (savedCustomConfig) {
        try { setCustomConfig(JSON.parse(savedCustomConfig)); } catch(e) {}
    }
  }, []);

  // Auth Logic
  const handleAuth = async () => {
    if (!authForm.username || !authForm.password) {
        setAuthMessage({ text: '请输入完整', type: 'error' });
        return;
    }
    setIsAuthProcessing(true);
    setAuthMessage({ text: '', type: '' });

    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (authMode === 'register') {
             const loginRes = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authForm)
            });
            const loginData = await loginRes.json();
            if (loginData.success) processLoginSuccess(loginData);
        } else {
            processLoginSuccess(data);
        }
      } else {
        setAuthMessage({ text: data.message || '失败', type: 'error' });
      }
    } catch (error) {
      setAuthMessage({ text: '网络错误', type: 'error' });
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const processLoginSuccess = (data: any) => {
    const newUser = { 
        username: data.username, 
        isLoggedIn: true,
        usageCount: data.usageCount 
    };
    setUser(newUser);
    localStorage.setItem('user_profile', JSON.stringify(newUser));
    setAuthMessage({ text: '登录成功', type: 'success' });
    setGuestApiKeys({ gemini: '', deepseek: '' });
  };

  const handleLogout = () => {
    setUser({ username: '', isLoggedIn: false });
    localStorage.removeItem('user_profile');
    setAuthForm({ username: '', password: '' });
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
                    'x-gemini-token': encodeKey(guestApiKeys.gemini),
                    'x-deepseek-token': encodeKey(guestApiKeys.deepseek)
                },
                body: JSON.stringify({
                    username: user.username,
                    password: authForm.password,
                })
            });
            const data = await response.json();
            if (data.success) {
                alert("配置已同步至云端。");
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

  const handleAskAI = async () => {
    if (!result) return;
    setLoadingAI(true);
    setAiInterpretation("");
    
    const config = {
        username: user.isLoggedIn ? user.username : undefined,
        apiKey: !user.isLoggedIn ? (provider === 'gemini' ? guestApiKeys.gemini : guestApiKeys.deepseek) : undefined,
        customConfig: provider === 'custom' ? customConfig : undefined
    };

    const resText = await getInterpretation(
        result, 
        question, 
        provider, 
        config,
        (text) => setAiInterpretation(text)
    );
    
    setLoadingAI(false);
    
    if (user.isLoggedIn && !resText.includes("错误")) {
        const updatedUser = { ...user, usageCount: (user.usageCount || 0) + 1 };
        setUser(updatedUser);
        localStorage.setItem('user_profile', JSON.stringify(updatedUser));
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 3) return; 
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };
  
  const handleCalculate = () => {
     const nums = inputs.map(i => parseInt(i, 10));
     if (nums.some(isNaN)) { alert("请输入数字"); return; }
     const res = calculateDivination(nums[0], nums[1], nums[2]);
     setResult(res);
     setAiInterpretation(null);
     setTimeout(() => document.getElementById('result-start')?.scrollIntoView({behavior:'smooth'}), 100);
  };
  
  const handleRandom = () => {
      setInputs([
          Math.floor(Math.random()*99+1).toString(),
          Math.floor(Math.random()*99+1).toString(),
          Math.floor(Math.random()*99+1).toString()
      ]);
      setResult(null);
      setAiInterpretation(null);
  };

  const remainingFree = 5 - (user.usageCount || 0);
  const isFreeTierAvailable = user.isLoggedIn && remainingFree > 0 && provider !== 'custom';
  // Subtle indicator: Show only if NOT logged in, or logged in and using free tier.
  const shouldShowSettingsDot = !user.isLoggedIn; 

  const getScoreColor = (score: string) => {
      if (score.includes('Great Auspicious') || score.includes('大吉')) return 'text-red-600 bg-red-50 border-red-100';
      if (score.includes('Auspicious') || score.includes('小吉')) return 'text-amber-600 bg-amber-50 border-amber-100';
      if (score.includes('Great Bad') || score.includes('大凶')) return 'text-slate-600 bg-slate-100 border-slate-200';
      return 'text-slate-500 bg-slate-50 border-slate-100';
  };
  
  const getScoreLabel = (score: string) => {
      if (score.includes('Great Auspicious')) return '大吉';
      if (score === 'Auspicious') return '吉';
      if (score.includes('Minor Auspicious')) return '小吉';
      if (score.includes('Great Bad')) return '大凶';
      if (score.includes('Minor Bad')) return '小凶';
      return '平';
  };

  const tiTrigram = result ? (result.tiGua === 'upper' ? result.originalHexagram.upper : result.originalHexagram.lower) : null;
  const yongTrigram = result ? (result.yongGua === 'upper' ? result.originalHexagram.upper : result.originalHexagram.lower) : null;

  // Visual helper for relation arrow
  const renderRelationVisual = () => {
      if (!result) return null;
      const { relation } = result;
      
      let arrow = <MoveHorizontal size={20} className="text-slate-300" />;
      let desc = "比和 (平等)";

      if (relation.includes("用生体")) {
          arrow = <div className="flex flex-col items-center"><ArrowLeft size={20} className="text-red-500 animate-pulse"/><span className="text-[9px] text-red-500 font-bold mt-1">生</span></div>;
          desc = "大吉：外界环境全力助你";
      } else if (relation.includes("体生用")) {
          arrow = <div className="flex flex-col items-center"><ArrowRight size={20} className="text-slate-400"/><span className="text-[9px] text-slate-400 font-bold mt-1">生</span></div>;
          desc = "小凶：你在消耗精力付出";
      } else if (relation.includes("体克用")) {
          arrow = <div className="flex flex-col items-center"><ArrowRight size={20} className="text-amber-500"/><span className="text-[9px] text-amber-500 font-bold mt-1">克</span></div>;
          desc = "小吉：努力克服就能掌控";
      } else if (relation.includes("用克体")) {
          arrow = <div className="flex flex-col items-center"><ArrowLeft size={20} className="text-slate-600"/><span className="text-[9px] text-slate-600 font-bold mt-1">克</span></div>;
          desc = "大凶：外界压力巨大难扛";
      } else if (relation.includes("比和")) {
          arrow = <div className="flex flex-col items-center"><span className="text-xl font-bold text-amber-500">=</span><span className="text-[9px] text-amber-500 font-bold mt-1">同</span></div>;
          desc = "大吉：同心协力顺水推舟";
      }

      return { arrow, desc };
  };

  const relationVisual = renderRelationVisual();

  return (
    <div className="w-full space-y-8 relative">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 duration-200">
             <div className="md:hidden w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
             </div>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 md:rounded-t-2xl">
              <h3 className="font-serif font-bold text-slate-800 text-lg">设置与同步</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto no-scrollbar flex-1 overscroll-contain bg-slate-50/50">
                <div className="p-6 bg-white m-4 rounded-xl shadow-sm border border-slate-100">
                    {!user.isLoggedIn ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><User size={16} /> 账号登录</h4>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button onClick={()=>setAuthMode('login')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${authMode==='login'?'bg-white text-slate-900 shadow-sm':'text-slate-400'}`}>登录</button>
                                    <button onClick={()=>setAuthMode('register')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${authMode==='register'?'bg-white text-slate-900 shadow-sm':'text-slate-400'}`}>注册</button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <input type="text" placeholder="用户名" value={authForm.username} onChange={e=>setAuthForm({...authForm,username:e.target.value})} className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all"/>
                                <input type="password" placeholder="密码" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all"/>
                            </div>
                            <button onClick={handleAuth} disabled={isAuthProcessing} className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all">
                                {isAuthProcessing?<Loader2 size={16} className="animate-spin mx-auto"/>:(authMode==='login'?'立即登录':'注册并登录')}
                            </button>
                            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg flex items-center gap-2 border border-amber-100">
                                <Gift size={14}/> 注册登录即可免费获赠 5 次大师解卦
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">{user.username.charAt(0).toUpperCase()}</div>
                                <div>
                                    <p className="font-bold text-slate-900">{user.username}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${remainingFree>0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                            免费额度: {remainingFree}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="text-xs border border-slate-200 px-3 py-2 rounded-lg bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center gap-2 font-medium"><LogOut size={14}/> 退出</button>
                        </div>
                    )}
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
                                <input type="text" value={customConfig.baseUrl} onChange={e=>setCustomConfig({...customConfig,baseUrl:e.target.value})} placeholder="API Base URL (e.g. https://api.openai.com/v1)" className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"/>
                                <input type="text" value={customConfig.modelName} onChange={e=>setCustomConfig({...customConfig,modelName:e.target.value})} placeholder="Model Name (e.g. gpt-4)" className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"/>
                                <input type="password" value={customConfig.apiKey} onChange={e=>setCustomConfig({...customConfig,apiKey:e.target.value})} placeholder="API Key" className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"/>
                            </div>
                        )}
                    </div>
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
      )}

      {/* Main Input Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100/60 p-6 md:p-10 relative overflow-hidden transition-all hover:shadow-md">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -z-10 opacity-60"></div>

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8 md:mb-10">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                数字起卦
            </h2>
            <button onClick={()=>setShowSettings(true)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-all relative">
               <Settings size={20}/>
               {shouldShowSettingsDot && (
                   <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
               )}
            </button>
        </div>

        {/* Inputs */}
        <div className="space-y-6 md:space-y-8">
            <div className="relative group">
                <input type="text" value={question} onChange={e=>setQuestion(e.target.value)} placeholder=" " className="peer w-full py-3 bg-transparent border-b-2 border-slate-100 focus:border-slate-900 outline-none text-lg transition-colors z-10 relative"/>
                <label className="absolute left-0 top-3 text-slate-400 text-lg transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-slate-500 peer-focus:font-bold peer-[&:not(:placeholder-shown)]:-top-4 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-slate-500 pointer-events-none">所问何事？(可选)</label>
            </div>

            <div className="flex gap-3 md:gap-6">
                {inputs.map((val,idx)=>(
                    <div key={idx} className="flex-1 relative group">
                         <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] text-slate-400 font-mono z-10">NO.{idx+1}</div>
                        <input 
                            type="number" 
                            value={val} 
                            onChange={e=>handleInputChange(idx,e.target.value)} 
                            className="w-full text-center text-2xl md:text-3xl font-serif h-20 md:h-24 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all placeholder:text-slate-200"
                            placeholder="0"
                        />
                    </div>
                ))}
            </div>

            <div className="flex gap-4 pt-2">
                <button onClick={handleRandom} className="w-16 h-14 md:h-16 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all" title="随机生成">
                    <RefreshCcw size={22}/>
                </button>
                <button onClick={handleCalculate} className="flex-1 h-14 md:h-16 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all flex justify-center items-center gap-3">
                    开始起卦 <ArrowRight size={20} className="opacity-80"/>
                </button>
            </div>
        </div>
      </div>

      {/* Result Section */}
      {result && tiTrigram && yongTrigram && relationVisual && (
        <div id="result-start" className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-28">
            
            {/* 1. Hexagram Visuals (Horizontal on PC, Vertical Stack on Mobile) */}
            <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100/60">
                <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 md:gap-12">
                    
                    {/* Item: Original */}
                    <div className="flex-1 flex flex-col items-center group">
                        <HexagramVisual hexagram={result.originalHexagram} label="本卦 · 初始" highlight={result.tiGua} movingLine={result.movingLine}/>
                        <div className="mt-4 text-xs text-slate-400 font-mono group-hover:text-amber-600 transition-colors">Start</div>
                    </div>

                    {/* Arrow / Connector */}
                    <div className="flex md:flex-col items-center justify-center opacity-30">
                        <div className="h-px w-full md:w-px md:h-20 bg-slate-400"></div>
                        <ChevronRight className="md:rotate-90 text-slate-400 -ml-1 md:ml-0 md:-mt-1" size={16}/>
                    </div>

                    {/* Item: Mutual */}
                    <div className="flex-1 flex flex-col items-center group">
                         <div className="relative">
                            <HexagramVisual hexagram={result.huHexagram} label="互卦 · 过程"/>
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-white shadow-sm text-slate-300">
                                <GitCommit size={14}/>
                            </div>
                         </div>
                         <div className="mt-4 text-xs text-slate-400 font-mono group-hover:text-amber-600 transition-colors">Process</div>
                    </div>

                    {/* Arrow / Connector */}
                    <div className="flex md:flex-col items-center justify-center opacity-30">
                        <div className="h-px w-full md:w-px md:h-20 bg-slate-400"></div>
                        <ChevronRight className="md:rotate-90 text-slate-400 -ml-1 md:ml-0 md:-mt-1" size={16}/>
                    </div>

                    {/* Item: Changed */}
                    <div className="flex-1 flex flex-col items-center group">
                        <HexagramVisual hexagram={result.changedHexagram} label="变卦 · 结果"/>
                        <div className="mt-4 text-xs text-slate-400 font-mono group-hover:text-amber-600 transition-colors">End</div>
                    </div>
                </div>
            </div>

            {/* 2. Core Conclusion Card */}
            <div className="grid md:grid-cols-2 gap-4">
                 <div className={`p-6 md:p-8 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between min-h-[160px] ${getScoreColor(result.relationScore)}`}>
                     <div className="relative z-10">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">吉凶速断</div>
                        <div className="text-3xl md:text-4xl font-serif font-bold">{getScoreLabel(result.relationScore)}</div>
                        <div className="mt-2 font-medium opacity-80">{result.relation}</div>
                     </div>
                     <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12">
                         <Activity size={120} />
                     </div>
                 </div>

                 <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                     <div className="flex items-center justify-between gap-4 h-full relative">
                         {/* Ti (Left) */}
                         <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 relative">
                             <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wider">自己 (体)</span>
                             <span className="font-serif font-bold text-xl text-slate-800">{tiTrigram.name} <span className="text-sm font-normal text-slate-500">({tiTrigram.element})</span></span>
                         </div>
                         
                         {/* Relation Arrow */}
                         <div className="flex flex-col items-center gap-1 shrink-0 z-10">
                            {relationVisual.arrow}
                         </div>

                         {/* Yong (Right) */}
                         <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 relative">
                             <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wider">事物 (用)</span>
                             <span className="font-serif font-bold text-xl text-slate-800">{yongTrigram.name} <span className="text-sm font-normal text-slate-500">({yongTrigram.element})</span></span>
                         </div>
                     </div>
                     <div className="text-center mt-3 text-xs text-slate-500 font-medium">
                        {relationVisual.desc}
                     </div>
                 </div>
            </div>

            {/* 3. Ancient Text */}
            <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <BookOpen size={20}/>
                    </div>
                    <h3 className="font-serif font-bold text-xl text-slate-800">古籍断语</h3>
                </div>
                
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">本卦</div>
                        <div className="font-serif font-bold text-lg text-slate-800">{result.originalHexagram.name}</div>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify bg-slate-50 p-3 rounded-xl">
                            {result.originalHexagram.text?.guaci}
                        </p>
                    </div>

                    <div className="space-y-2 relative">
                        <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12}/> 动爻 (关键)
                        </div>
                        <div className="font-serif font-bold text-lg text-amber-700">
                            {result.movingLineText ? result.movingLineText.split('：')[0] : '无'}
                        </div>
                        <p className="text-sm text-amber-900 leading-relaxed text-justify bg-amber-50 p-3 rounded-xl border border-amber-100 shadow-sm">
                            {result.movingLineText ? result.movingLineText.substring(result.movingLineText.indexOf('：')+1) : '无动爻变化，事态平稳。'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">变卦</div>
                        <div className="font-serif font-bold text-lg text-slate-800">{result.changedHexagram.name}</div>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify bg-slate-50 p-3 rounded-xl">
                            {result.changedHexagram.text?.guaci}
                        </p>
                    </div>
                </div>
            </div>

            {/* 4. AI Analysis */}
            <div className="bg-[#fdfbf7] p-6 md:p-10 rounded-[2rem] shadow-sm border border-slate-200/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/3 -translate-y-1/3"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <Quote size={20}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-serif font-bold text-slate-900">大师详解</h3>
                            <p className="text-xs text-slate-400">AI Master Interpretation</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {isFreeTierAvailable && !aiInterpretation && (
                             <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                                免费额度: {remainingFree}
                             </span>
                        )}
                        {aiInterpretation && !loadingAI && (
                            <button onClick={handleAskAI} className="p-2 text-slate-400 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-full transition-all shadow-sm">
                                <RotateCcw size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {!aiInterpretation ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Sparkles className="text-slate-300" size={32}/>
                        </div>
                        <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
                            AI 国学大师将综合本卦、互卦与变卦，<br/>结合五行生克为您进行深度推演。
                        </p>
                        <button onClick={handleAskAI} disabled={loadingAI} className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2">
                            {loadingAI ? '大师正在推演...' : '请求大师解卦'} 
                            {loadingAI ? <Loader2 className="animate-spin" size={18}/> : <ArrowRight size={18}/>}
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
    </div>
  );
};

export default DivinationTool;