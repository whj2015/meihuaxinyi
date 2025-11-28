
import React, { useState, useEffect } from 'react';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile, CustomAIConfig } from '../types';
import HexagramVisual from './HexagramVisual';
import { getInterpretation } from '../services/geminiService';
import { Sparkles, ArrowRight, RefreshCcw, Settings, X, Check, User, LogOut, Gift, RotateCcw, Save, Loader2 } from 'lucide-react';

// 简易 Markdown 渲染
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span className="leading-relaxed break-words text-justify">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="text-slate-900 font-bold">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

const DivinationTool: React.FC = () => {
  const [inputs, setInputs] = useState<string[]>(['', '', '']);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  // Default provider is now deepseek
  const [provider, setProvider] = useState<AIProvider>('deepseek');
  
  // Local Keys (Guest Only)
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
            const response = await fetch('/api/update-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    password: authForm.password,
                    gemini_key: guestApiKeys.gemini,    
                    deepseek_key: guestApiKeys.deepseek 
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
     setTimeout(() => document.getElementById('result-section')?.scrollIntoView({behavior:'smooth'}), 100);
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
  // 简化提示：只要没登录，或者登录了但没配置Key且有免费次数，都显示红点引导去设置/查看
  // 但用户要求“不要过分明显”。
  // 我们只在确实需要用户操作时显示（例如完全没Key，或者想告知有免费额度）
  const shouldShowSettingsDot = !user.isLoggedIn || (user.isLoggedIn && remainingFree > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24 relative px-2 md:px-0">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 duration-200">
             <div className="md:hidden w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
             </div>
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0 md:rounded-t-2xl">
              <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2">
                <Settings size={18} className="text-slate-600" /> 
                {user.isLoggedIn ? '云端同步' : '大师设置'}
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 p-2"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto no-scrollbar flex-1 overscroll-contain">
                <div className="p-5 bg-slate-50 border-b border-slate-100">
                    {!user.isLoggedIn ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><User size={16} /> 账号服务</h4>
                                <div className="flex bg-slate-200 p-0.5 rounded-lg">
                                    <button onClick={()=>setAuthMode('login')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${authMode==='login'?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>登录</button>
                                    <button onClick={()=>setAuthMode('register')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${authMode==='register'?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>注册</button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <input type="text" placeholder="用户名" value={authForm.username} onChange={e=>setAuthForm({...authForm,username:e.target.value})} className="p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-amber-400"/>
                                <input type="password" placeholder="密码" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} className="p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-amber-400"/>
                            </div>
                            <button onClick={handleAuth} disabled={isAuthProcessing} className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50">
                                {isAuthProcessing?<Loader2 size={16} className="animate-spin mx-auto"/>:(authMode==='login'?'登录':'注册并登录')}
                            </button>
                            <p className="text-[10px] text-amber-600 flex items-center gap-1 justify-center"><Gift size={12}/> 注册即送 5 次 AI 大师解卦</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold border-2 border-white shadow-sm">{user.username.charAt(0).toUpperCase()}</div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{user.username}</p>
                                    {remainingFree > 0 ? (
                                        <p className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">剩余免费: {remainingFree}次</p>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 mt-0.5">免费额度已用完</p>
                                    )}
                                </div>
                            </div>
                            <button onClick={handleLogout} className="text-xs border px-3 py-1.5 rounded-lg bg-white shadow-sm hover:bg-red-50 hover:text-red-600 flex items-center gap-1"><LogOut size={12}/> 退出</button>
                        </div>
                    )}
                </div>

                <div className="p-5 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">AI 模型</label>
                        <div className="grid grid-cols-3 gap-2">
                             {['deepseek', 'gemini', 'custom'].map(m => (
                                 <button key={m} onClick={()=>setProvider(m as any)} className={`py-2.5 px-1 rounded-xl border font-bold text-xs relative ${provider===m?'bg-amber-50 border-amber-500 text-amber-900':'border-slate-200 text-slate-500'}`}>
                                     {m.charAt(0).toUpperCase() + m.slice(1)}
                                     {provider===m && <div className="absolute top-1 right-1 text-amber-600"><Check size={10}/></div>}
                                 </button>
                             ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {provider === 'gemini' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Gemini Key</label>
                                <input type="password" value={guestApiKeys.gemini} onChange={e=>setGuestApiKeys({...guestApiKeys, gemini:e.target.value})} placeholder={user.isLoggedIn ? "留空则自动调用账户配置" : "输入 Key"} className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:border-amber-500"/>
                            </div>
                        )}
                        {provider === 'deepseek' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">DeepSeek Key</label>
                                <input type="password" value={guestApiKeys.deepseek} onChange={e=>setGuestApiKeys({...guestApiKeys, deepseek:e.target.value})} placeholder={user.isLoggedIn ? "留空则自动调用账户配置" : "输入 sk-..."} className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:border-amber-500"/>
                            </div>
                        )}
                        {provider === 'custom' && (
                            <div className="space-y-2">
                                <input type="text" value={customConfig.baseUrl} onChange={e=>setCustomConfig({...customConfig,baseUrl:e.target.value})} placeholder="Base URL" className="w-full p-3 text-sm border border-slate-200 rounded-xl"/>
                                <input type="text" value={customConfig.modelName} onChange={e=>setCustomConfig({...customConfig,modelName:e.target.value})} placeholder="Model Name" className="w-full p-3 text-sm border border-slate-200 rounded-xl"/>
                                <input type="password" value={customConfig.apiKey} onChange={e=>setCustomConfig({...customConfig,apiKey:e.target.value})} placeholder="API Key" className="w-full p-3 text-sm border border-slate-200 rounded-xl"/>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shrink-0 md:rounded-b-2xl">
                <button onClick={saveSettings} disabled={isSavingKeys} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                    {isSavingKeys ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                    {user.isLoggedIn && provider !== 'custom' ? '保存并同步' : '保存本地设置'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Top Bar */}
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Sparkles size={16} className="text-amber-600"/></div>
                数字起卦
            </h2>
            <button onClick={()=>setShowSettings(true)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-50 relative group">
               <Settings size={22}/>
               {/* 优化后的标识：温和的红点 */}
               {shouldShowSettingsDot && (
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
               )}
            </button>
        </div>

        {/* Question Input */}
        <div className="mb-6">
            <input type="text" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="所问何事？(可留空)" className="w-full p-4 bg-slate-50/50 border-b border-slate-200 focus:border-amber-500 outline-none text-base md:text-lg transition-colors placeholder:text-slate-400"/>
        </div>

        {/* Number Inputs - Mobile Optimized */}
        <div className="flex gap-2 md:gap-6 mb-6">
            {inputs.map((val,idx)=>(
                <div key={idx} className="flex-1">
                    <input 
                        type="number" 
                        placeholder={(idx+1).toString()}
                        value={val} 
                        onChange={e=>handleInputChange(idx,e.target.value)} 
                        className="w-full text-center text-2xl md:text-4xl font-serif h-16 md:h-24 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 outline-none shadow-sm transition-all"
                    />
                </div>
            ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
            <button onClick={handleCalculate} className="flex-[2] bg-slate-900 text-white py-3.5 rounded-xl font-bold text-base md:text-lg shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
                起卦 <ArrowRight size={18}/>
            </button>
            <button onClick={handleRandom} className="flex-1 bg-white border border-slate-200 text-slate-500 py-3.5 rounded-xl font-bold active:bg-slate-50 active:scale-95 transition-all flex justify-center items-center">
                <RefreshCcw size={20}/>
            </button>
        </div>
      </div>

      {result && (
        <div id="result-section" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-24">
            {/* Hexagram Cards - Stack on mobile, row on desktop */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-around gap-6 md:gap-0">
                <HexagramVisual hexagram={result.originalHexagram} label="本卦" highlight={result.tiGua} movingLine={result.movingLine}/>
                <div className="rotate-90 md:rotate-0 text-slate-200"><ArrowRight size={24}/></div>
                <HexagramVisual hexagram={result.changedHexagram} label="变卦"/>
            </div>

            {/* AI Analysis Card */}
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border-l-4 border-amber-500 overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-serif font-bold text-slate-800">大师详解</h3>
                        {isFreeTierAvailable && !aiInterpretation && (
                             <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">免费额度: {remainingFree}</span>
                        )}
                    </div>
                    {/* Re-interpret Button */}
                    {aiInterpretation && !loadingAI && (
                        <button onClick={handleAskAI} className="text-slate-400 hover:text-amber-600 transition-colors p-1" title="再次解读">
                            <RotateCcw size={18} />
                        </button>
                    )}
                </div>

                {!aiInterpretation ? (
                    <button onClick={handleAskAI} disabled={loadingAI} className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold shadow-md active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                        {loadingAI ? '大师推演中...' : 'AI 大师解卦'} {loadingAI && <Loader2 className="animate-spin" size={18}/>}
                    </button>
                ) : (
                    <div className="bg-slate-50/80 p-4 md:p-6 rounded-2xl text-slate-700 text-sm md:text-base leading-relaxed border border-slate-100/50">
                        <SimpleMarkdown text={aiInterpretation}/>
                        <div className="h-4 w-1 bg-amber-500 animate-pulse inline-block ml-1 align-middle"></div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default DivinationTool;
