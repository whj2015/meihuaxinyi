
import React, { useState, useEffect } from 'react';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile, CustomAIConfig } from '../types';
import HexagramVisual from './HexagramVisual';
import { getInterpretation } from '../services/geminiService';
import { getEnvVar } from '../utils/envUtils';
import { Sparkles, ArrowRight, RefreshCcw, BrainCircuit, Settings, X, Check, ScrollText, LogIn, LogOut, User, KeyRound, Loader2, Save, Server, Box, Lock } from 'lucide-react';

// 简易 Markdown 渲染
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span className="leading-relaxed">
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
  const [provider, setProvider] = useState<AIProvider>('gemini');
  
  // Local Keys (Guest Only)
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    deepseek: ''
  });

  const [customConfig, setCustomConfig] = useState<CustomAIConfig>({
    apiKey: '',
    baseUrl: '',
    modelName: ''
  });

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
    const savedProvider = (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
    setProvider(savedProvider);

    const savedCustomConfig = localStorage.getItem('custom_ai_config');
    if (savedCustomConfig) {
        try { setCustomConfig(JSON.parse(savedCustomConfig)); } catch(e) {}
    }

    // Guest keys from env or memory
    setApiKeys({
      gemini: getEnvVar('Gemini_key') || '',
      deepseek: getEnvVar('DeepSeek_key') || ''
    });
  }, []);

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
             // Auto login after register
             const loginRes = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authForm)
            });
            const loginData = await loginRes.json();
            if (loginData.success) {
                processLoginSuccess(loginData);
            }
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
    const newUser = { username: data.username, isLoggedIn: true };
    setUser(newUser);
    localStorage.setItem('user_profile', JSON.stringify(newUser));
    // Clear local keys to avoid confusion, now we rely on backend
    setApiKeys({ gemini: '', deepseek: '' });
    setAuthMessage({ text: '登录成功', type: 'success' });
  };

  const handleLogout = () => {
    setUser({ username: '', isLoggedIn: false });
    localStorage.removeItem('user_profile');
    setApiKeys({
      gemini: getEnvVar('Gemini_key') || '',
      deepseek: getEnvVar('DeepSeek_key') || ''
    });
    setAuthForm({ username: '', password: '' });
  };

  const saveSettings = async () => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('custom_ai_config', JSON.stringify(customConfig));

    if (user.isLoggedIn && provider !== 'custom') {
        // Sync to cloud
        setIsSavingKeys(true);
        try {
            const response = await fetch('/api/update-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    password: authForm.password,
                    gemini_key: apiKeys.gemini,    // Send raw key to backend storage
                    deepseek_key: apiKeys.deepseek // Send raw key to backend storage
                })
            });
            const data = await response.json();
            if (data.success) {
                alert("配置已同步至云端。");
                setShowSettings(false);
                // Clear local inputs for security, backend has them now
                setApiKeys({ gemini: '', deepseek: '' }); 
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
    
    // Config logic:
    // If logged in -> send username (backend looks up key)
    // If guest -> send apiKey (local state)
    
    const config = {
        username: user.isLoggedIn ? user.username : undefined,
        apiKey: !user.isLoggedIn ? (provider === 'gemini' ? apiKeys.gemini : apiKeys.deepseek) : undefined,
        customConfig: provider === 'custom' ? customConfig : undefined
    };

    await getInterpretation(
        result, 
        question, 
        provider, 
        config,
        (text) => setAiInterpretation(text)
    );
    
    setLoadingAI(false);
  };

  // Logic to show inputs
  // If logged in, we show placeholder or "Reset Key" UI
  
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

  // UI Helper: Check if ready
  const isReady = user.isLoggedIn || (provider === 'custom' && customConfig.apiKey) || (provider!=='custom' && (apiKeys.gemini || apiKeys.deepseek));

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 pb-24 relative px-0 md:px-0">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
             <div className="md:hidden w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
             </div>
            <div className="px-6 py-3 md:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0 md:rounded-t-2xl">
              <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2 text-lg">
                <Settings size={20} className="text-slate-600" /> 
                {user.isLoggedIn ? '云端同步' : '大师设置'}
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 p-2 -mr-2"><X size={24} /></button>
            </div>
            
            <div className="overflow-y-auto no-scrollbar flex-1 overscroll-contain">
                <div className="p-5 md:p-6 bg-slate-50 border-b border-slate-100">
                    {!user.isLoggedIn ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><User size={16} /> {authMode==='login'?'登录':'注册'}</h4>
                                <button onClick={()=>{setAuthMode(authMode==='login'?'register':'login');setAuthMessage({text:'',type:''})}} className="text-xs text-amber-600 font-medium hover:underline px-2 py-1 bg-amber-50 rounded">
                                    {authMode==='login'?'去注册':'去登录'}
                                </button>
                            </div>
                            <div className="flex flex-col gap-3">
                                <input type="text" placeholder="用户名" value={authForm.username} onChange={e=>setAuthForm({...authForm,username:e.target.value})} className="p-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-amber-400"/>
                                <input type="password" placeholder="密码" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} className="p-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-amber-400"/>
                            </div>
                            {authMessage.text && <div className={`text-xs p-2 rounded ${authMessage.type==='error'?'bg-red-50 text-red-600':'bg-green-50 text-green-600'}`}>{authMessage.text}</div>}
                            <button onClick={handleAuth} disabled={isAuthProcessing} className="w-full py-3 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg shadow-sm">
                                {isAuthProcessing?<Loader2 size={16} className="animate-spin"/>:(authMode==='login'?'登录':'注册')}
                            </button>
                            <p className="text-[10px] text-slate-400 text-center">登录后 Key 将保存在云端，跨设备同步</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-lg border-2 border-white shadow-inner">{user.username.charAt(0).toUpperCase()}</div>
                                <div>
                                    <p className="font-bold text-slate-800">{user.username}</p>
                                    <p className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1"><Lock size={10}/> 云端托管中</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="text-xs border px-3 py-2 rounded-lg bg-white shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center gap-1"><LogOut size={14}/> 退出</button>
                        </div>
                    )}
                </div>

                <div className="p-5 md:p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">选择模型</label>
                        <div className="grid grid-cols-3 gap-2">
                             {['gemini','deepseek','custom'].map(m => (
                                 <button key={m} onClick={()=>setProvider(m as any)} className={`py-3 px-1 rounded-xl border font-bold text-sm relative ${provider===m?'bg-amber-50 border-amber-500 text-amber-900 shadow-sm':'border-slate-200 text-slate-500'}`}>
                                     {m.charAt(0).toUpperCase() + m.slice(1)}
                                     {provider===m && <div className="absolute top-1.5 right-1.5 text-amber-600"><Check size={12}/></div>}
                                 </button>
                             ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {provider === 'gemini' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Gemini Key</label>
                                <div className="relative">
                                    <input type="password" value={apiKeys.gemini} onChange={e=>setApiKeys({...apiKeys, gemini:e.target.value})} placeholder={user.isLoggedIn ? "已托管至云端 (输入可覆盖)" : "输入 API Key"} className="w-full p-3.5 pl-10 text-sm rounded-xl border border-slate-200 outline-none focus:border-amber-500"/>
                                    <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                                </div>
                            </div>
                        )}
                        {provider === 'deepseek' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">DeepSeek Key</label>
                                <div className="relative">
                                    <input type="password" value={apiKeys.deepseek} onChange={e=>setApiKeys({...apiKeys, deepseek:e.target.value})} placeholder={user.isLoggedIn ? "已托管至云端 (输入可覆盖)" : "输入 sk-..."} className="w-full p-3.5 pl-10 text-sm rounded-xl border border-slate-200 outline-none focus:border-amber-500"/>
                                    <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                                </div>
                            </div>
                        )}
                        {provider === 'custom' && (
                            <div className="space-y-3">
                                <input type="text" value={customConfig.baseUrl} onChange={e=>setCustomConfig({...customConfig,baseUrl:e.target.value})} placeholder="Base URL" className="w-full p-3 text-sm border border-slate-200 rounded-xl"/>
                                <input type="text" value={customConfig.modelName} onChange={e=>setCustomConfig({...customConfig,modelName:e.target.value})} placeholder="Model Name" className="w-full p-3 text-sm border border-slate-200 rounded-xl"/>
                                <input type="password" value={customConfig.apiKey} onChange={e=>setCustomConfig({...customConfig,apiKey:e.target.value})} placeholder="API Key" className="w-full p-3 text-sm border border-slate-200 rounded-xl"/>
                                <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded">自定义配置仅保存在本地。</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 border-t border-slate-100 bg-white shrink-0 md:rounded-b-2xl pb-8 md:pb-6">
                <button onClick={saveSettings} disabled={isSavingKeys} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg">
                    {isSavingKeys ? <Loader2 className="animate-spin"/> : <Save size={18}/>} 
                    {user.isLoggedIn && provider !== 'custom' ? '同步至云端' : '保存设置'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="bg-white px-5 py-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative">
        <button onClick={()=>setShowSettings(true)} className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-700 p-2.5 rounded-full hover:bg-slate-50 group">
          <Settings size={22} className="group-hover:rotate-45 transition-transform"/>
          {user.isLoggedIn && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>}
        </button>
        {!isReady && (
           <button onClick={()=>setShowSettings(true)} className="absolute top-16 right-4 md:top-20 md:right-5 z-10 animate-bounce cursor-pointer">
              <div className="bg-amber-600 text-white text-[10px] px-3 py-2 rounded-xl shadow-lg font-bold flex items-center gap-1.5">
                 <Sparkles size={12} className="fill-white" /> 配置 Key 开启详解
              </div>
           </button>
        )}
        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-800 mb-6 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Sparkles size={16} className="text-amber-600"/></div>
            数字起卦
        </h2>
        <div className="mb-6 md:mb-8">
            <input type="text" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="所问何事？" className="w-full p-4 bg-slate-50 border-b-2 border-slate-200 focus:border-amber-500 outline-none rounded-t-xl text-lg"/>
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-8 mb-6 md:mb-8">
            {inputs.map((val,idx)=>(
                <div key={idx} className="flex flex-col gap-2">
                    <label className="text-[10px] text-slate-400 text-center uppercase font-bold">数 {idx+1}</label>
                    <input type="number" value={val} onChange={e=>handleInputChange(idx,e.target.value)} className="text-center text-3xl md:text-4xl font-serif h-20 md:h-24 rounded-2xl border-2 border-slate-100 focus:border-amber-400 outline-none shadow-sm"/>
                </div>
            ))}
        </div>
        <div className="flex gap-3 md:gap-4">
            <button onClick={handleCalculate} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-xl flex justify-center items-center gap-2">起卦推演 <ArrowRight size={20}/></button>
            <button onClick={handleRandom} className="px-5 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 hover:bg-slate-50"><RefreshCcw size={22}/></button>
        </div>
      </div>

      {result && (
        <div id="result-section" className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-28">
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-around items-center">
                    <HexagramVisual hexagram={result.originalHexagram} label="本卦" highlight={result.tiGua} movingLine={result.movingLine}/>
                    <ArrowRight className="text-slate-200" size={32}/>
                    <HexagramVisual hexagram={result.changedHexagram} label="变卦"/>
                </div>
            </div>
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border-l-4 border-amber-500 overflow-hidden relative">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-5 bg-amber-500 rounded-full"></div>
                    <h3 className="text-lg font-serif font-bold text-slate-800">大师详解</h3>
                </div>
                {!aiInterpretation ? (
                    <button onClick={handleAskAI} disabled={loadingAI} className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-2xl font-bold shadow-lg flex justify-center items-center gap-2">
                        {loadingAI ? '推演中...' : 'AI 大师解卦'} {loadingAI && <Loader2 className="animate-spin"/>}
                    </button>
                ) : (
                    <div className="bg-slate-50 p-5 rounded-2xl text-slate-700 leading-relaxed">
                        <SimpleMarkdown text={aiInterpretation}/>
                    </div>
                )}
            </div>
            {/* Ancient text section kept simple for brevity in this update */}
            {result.originalHexagram.text && (
                 <div className="bg-white p-5 rounded-3xl border border-slate-100">
                    <h3 className="font-serif font-bold mb-3">古籍参考</h3>
                    <p className="text-sm text-slate-600">{result.originalHexagram.text.guaci}</p>
                 </div>
            )}
        </div>
      )}
    </div>
  );
};

export default DivinationTool;
