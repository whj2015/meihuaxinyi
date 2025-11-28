
import React, { useState, useEffect } from 'react';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile, CustomAIConfig } from '../types';
import HexagramVisual from './HexagramVisual';
import { getInterpretation } from '../services/geminiService';
import { getEnvVar } from '../utils/envUtils';
import { Sparkles, ArrowRight, RefreshCcw, BrainCircuit, Settings, X, Check, ScrollText, LogIn, LogOut, User, KeyRound, Loader2, Save, Cloud, UserPlus, AlertCircle, Server, Box } from 'lucide-react';

// 简单 Base64 编码/解码，防止 Key 明文直接暴露在 LocalStorage
const encodeData = (data: any) => {
  try {
    return btoa(JSON.stringify(data));
  } catch (e) {
    return '';
  }
};

const decodeData = (str: string) => {
  try {
    return JSON.parse(atob(str));
  } catch (e) {
    return null;
  }
};

const DivinationTool: React.FC = () => {
  const [inputs, setInputs] = useState<string[]>(['', '', '']);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('gemini');
  
  // Standard Keys (Cloud Sync Supported)
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    deepseek: ''
  });

  // Custom Config (Local Only)
  const [customConfig, setCustomConfig] = useState<CustomAIConfig>({
    apiKey: '',
    baseUrl: '',
    modelName: ''
  });

  // User Auth State
  const [user, setUser] = useState<UserProfile>({ username: '', isLoggedIn: false });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [authMessage, setAuthMessage] = useState({ text: '', type: '' as 'success' | 'error' | '' });
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  // Initialization
  useEffect(() => {
    // 1. Load User Profile
    const savedUserStr = localStorage.getItem('user_profile');
    let isLoggedIn = false;
    if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        setUser(savedUser);
        isLoggedIn = savedUser.isLoggedIn;
    }
    
    // 2. Load Provider Preference
    const savedProvider = (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
    setProvider(savedProvider);

    // 3. Load Custom Config (Local Only)
    const savedCustomConfig = localStorage.getItem('custom_ai_config');
    if (savedCustomConfig) {
        try {
            setCustomConfig(JSON.parse(savedCustomConfig));
        } catch(e) {}
    }

    // 4. Initialize Keys logic
    // 默认从环境变量读取
    let initialKeys = {
      gemini: getEnvVar('Gemini_key') || '',
      deepseek: getEnvVar('DeepSeek_key') || ''
    };

    // 如果用户已登录，尝试从本地缓存恢复 Key (解决刷新丢失问题)
    if (isLoggedIn) {
      const cachedKeysStr = localStorage.getItem('user_keys_cache');
      if (cachedKeysStr) {
        const cachedKeys = decodeData(cachedKeysStr);
        if (cachedKeys) {
          initialKeys = {
            gemini: cachedKeys.gemini || initialKeys.gemini,
            deepseek: cachedKeys.deepseek || initialKeys.deepseek
          };
        }
      }
    }

    setApiKeys(initialKeys);
  }, []);

  // --- Auth Logic ---

  const handleAuth = async () => {
    if (!authForm.username || !authForm.password) {
        setAuthMessage({ text: '请输入用户名和密码', type: 'error' });
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
            setAuthMessage({ text: '注册成功，正在登录...', type: 'success' });
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
        setAuthMessage({ text: data.message || '操作失败', type: 'error' });
      }
    } catch (error) {
      setAuthMessage({ text: '网络连接错误', type: 'error' });
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const processLoginSuccess = (data: any) => {
    const newUser = { username: data.username, isLoggedIn: true };
    setUser(newUser);
    localStorage.setItem('user_profile', JSON.stringify(newUser));

    // Keys Logic:
    // 1. Merge cloud keys with current env keys if cloud is empty
    const newKeys = {
        gemini: data.keys.gemini || apiKeys.gemini,
        deepseek: data.keys.deepseek || apiKeys.deepseek
    };
    
    setApiKeys(newKeys);
    
    // 2. Cache keys locally for persistence across refresh
    localStorage.setItem('user_keys_cache', encodeData(newKeys));

    setAuthMessage({ text: '登录成功', type: 'success' });
  };

  const handleLogout = () => {
    setUser({ username: '', isLoggedIn: false });
    localStorage.removeItem('user_profile');
    localStorage.removeItem('user_keys_cache'); // Clear cached keys
    
    // Reset Keys to Env or Empty (Memory Wipe)
    setApiKeys({
      gemini: getEnvVar('Gemini_key') || '',
      deepseek: getEnvVar('DeepSeek_key') || ''
    });
    setAuthForm({ username: '', password: '' });
    setAuthMessage({ text: '', type: '' });
  };

  // --- Settings & Key Management ---

  const saveSettings = async () => {
    // 1. Save Provider Preference & Custom Config (Local)
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('custom_ai_config', JSON.stringify(customConfig));

    // 2. Handle Cloud Sync (Only for Standard Keys)
    if (user.isLoggedIn) {
        // A. Update Local Cache first
        localStorage.setItem('user_keys_cache', encodeData(apiKeys));

        // B. Sync to Cloud
        setIsSavingKeys(true);
        try {
            const response = await fetch('/api/update-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    password: authForm.password, // In real app use token
                    gemini_key: apiKeys.gemini,
                    deepseek_key: apiKeys.deepseek
                })
            });
            const data = await response.json();
            if (data.success) {
                setShowSettings(false);
            } else {
                alert(`保存至云端失败: ${data.message} (请尝试重新登录)`);
            }
        } catch (e) {
            alert("网络连接失败，Key 已暂存本地，但未同步至云端。");
            setShowSettings(false);
        } finally {
            setIsSavingKeys(false);
        }
    } else {
        // Guest: Just close. Keys are in State (Memory).
        // NOT saving standard keys to localStorage so they are lost on refresh (security feature).
        // Custom keys ARE saved to localStorage (convenience feature).
        setShowSettings(false);
    }
  };

  // --- Divination Logic ---

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 3) return; 
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleRandom = () => {
    const r1 = Math.floor(Math.random() * 99) + 1;
    const r2 = Math.floor(Math.random() * 99) + 1;
    const r3 = Math.floor(Math.random() * 99) + 1;
    setInputs([r1.toString(), r2.toString(), r3.toString()]);
    setResult(null);
    setAiInterpretation(null);
  };

  const handleCalculate = () => {
    const nums = inputs.map(i => parseInt(i, 10));
    if (nums.some(isNaN)) {
        alert("请输入三个有效数字");
        return;
    }
    const res = calculateDivination(nums[0], nums[1], nums[2]);
    setResult(res);
    setAiInterpretation(null); 
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAskAI = async () => {
    if (!result) return;
    setLoadingAI(true);
    
    let apiKey = '';
    if (provider === 'gemini') apiKey = apiKeys.gemini;
    else if (provider === 'deepseek') apiKey = apiKeys.deepseek;
    else apiKey = customConfig.apiKey; // Custom

    const text = await getInterpretation(result, question, provider, {
        apiKey,
        customConfig
    });
    setAiInterpretation(text);
    setLoadingAI(false);
  };

  const hasConfiguredKey = 
    (provider === 'gemini' && !!apiKeys.gemini) || 
    (provider === 'deepseek' && !!apiKeys.deepseek) ||
    (provider === 'custom' && !!customConfig.apiKey && !!customConfig.baseUrl);

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 pb-24 relative px-0 md:px-0">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
             {/* Mobile Drag Handle Visual */}
             <div className="md:hidden w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
             </div>

            <div className="px-6 py-3 md:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0 md:rounded-t-2xl">
              <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2 text-lg">
                <Settings size={20} className="text-slate-600" /> 
                {user.isLoggedIn ? '云端同步' : '大师设置'}
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 p-2 -mr-2">
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto overflow-x-hidden no-scrollbar flex-1 overscroll-contain">
                {/* Auth Section */}
                <div className="p-5 md:p-6 bg-slate-50 border-b border-slate-100">
                    {!user.isLoggedIn ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <User size={16} /> 
                                    {authMode === 'login' ? '会员登录' : '注册账号'}
                                </h4>
                                <button 
                                    onClick={() => {
                                        setAuthMode(authMode === 'login' ? 'register' : 'login');
                                        setAuthMessage({text:'', type:''});
                                    }}
                                    className="text-xs text-amber-600 font-medium hover:underline px-2 py-1 bg-amber-50 rounded"
                                >
                                    {authMode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
                                </button>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="用户名"
                                        value={authForm.username}
                                        onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                                        className="flex-1 p-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all bg-white"
                                    />
                                </div>
                                <div className="flex gap-2">
                                     <input 
                                        type="password" 
                                        placeholder="密码"
                                        value={authForm.password}
                                        onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                                        className="flex-1 p-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all bg-white"
                                    />
                                </div>
                            </div>
                            
                             {authMessage.text && (
                                <div className={`text-xs p-2 rounded flex items-center gap-1.5 ${authMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    <AlertCircle size={12} /> {authMessage.text}
                                </div>
                             )}

                            <button 
                                onClick={handleAuth}
                                disabled={isAuthProcessing}
                                className="w-full py-3 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 hover:border-slate-400 transition active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm"
                            >
                                {isAuthProcessing ? <Loader2 size={16} className="animate-spin"/> : (authMode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />)}
                                {isAuthProcessing ? '处理中...' : (authMode === 'login' ? '登录并同步 Key' : '立即注册')}
                            </button>
                            <p className="text-[10px] text-slate-400 text-center leading-tight">
                                登录后配置的 API Key 将加密保存至云端<br/>未登录状态下刷新页面 Key 将丢失
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center text-amber-800 font-bold text-lg shadow-inner border-2 border-white">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{user.username}</p>
                                    <p className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1 border border-green-100">
                                        <Cloud size={10}/> 云端已连接
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 border border-slate-200 px-3 py-2 rounded-lg hover:bg-white transition bg-white shadow-sm"
                            >
                                <LogOut size={14} /> 退出
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-5 md:p-6 space-y-6">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">选择解卦模型</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => setProvider('gemini')}
                                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl border transition-all relative ${provider === 'gemini' ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-1 font-bold text-sm">Gemini</div>
                                {provider === 'gemini' && <div className="absolute top-1.5 right-1.5 text-amber-600"><Check size={12} /></div>}
                            </button>
                            <button 
                                onClick={() => setProvider('deepseek')}
                                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl border transition-all relative ${provider === 'deepseek' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-1 font-bold text-sm">DeepSeek</div>
                                {provider === 'deepseek' && <div className="absolute top-1.5 right-1.5 text-indigo-600"><Check size={12} /></div>}
                            </button>
                            <button 
                                onClick={() => setProvider('custom')}
                                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl border transition-all relative ${provider === 'custom' ? 'bg-slate-100 border-slate-500 text-slate-900 ring-1 ring-slate-500 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-1 font-bold text-sm">自定义</div>
                                {provider === 'custom' && <div className="absolute top-1.5 right-1.5 text-slate-600"><Check size={12} /></div>}
                            </button>
                        </div>
                    </div>

                    {/* API Keys (Dynamic Render) */}
                    <div className="space-y-4 min-h-[100px]">
                        {provider === 'gemini' && (
                             <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center justify-between">
                                    <span>Gemini API Key</span>
                                    {user.isLoggedIn && apiKeys.gemini && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 rounded flex items-center gap-1"><Check size={10}/> 已同步</span>}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        value={apiKeys.gemini}
                                        onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                                        placeholder="输入 Google Gemini Key..."
                                        className="w-full p-3.5 pl-10 text-sm rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
                                    />
                                    <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                                    推荐使用，速度快且免费额度高。
                                </p>
                            </div>
                        )}

                        {provider === 'deepseek' && (
                             <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center justify-between">
                                    <span>DeepSeek API Key</span>
                                    {user.isLoggedIn && apiKeys.deepseek && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 rounded flex items-center gap-1"><Check size={10}/> 已同步</span>}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        value={apiKeys.deepseek}
                                        onChange={(e) => setApiKeys({...apiKeys, deepseek: e.target.value})}
                                        placeholder="输入 DeepSeek Key (sk-...)"
                                        className="w-full p-3.5 pl-10 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                    />
                                    <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                                    中文理解能力极强，擅长易理推演。
                                </p>
                            </div>
                        )}

                        {provider === 'custom' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Base URL (API 地址)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={customConfig.baseUrl}
                                            onChange={(e) => setCustomConfig({...customConfig, baseUrl: e.target.value})}
                                            placeholder="例如: http://localhost:11434/v1"
                                            className="w-full p-3 pl-10 text-sm rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none transition-all"
                                        />
                                        <Server size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Model Name (模型名称)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={customConfig.modelName}
                                            onChange={(e) => setCustomConfig({...customConfig, modelName: e.target.value})}
                                            placeholder="例如: llama3, qwen-turbo..."
                                            className="w-full p-3 pl-10 text-sm rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none transition-all"
                                        />
                                        <Box size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">API Key</label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            value={customConfig.apiKey}
                                            onChange={(e) => setCustomConfig({...customConfig, apiKey: e.target.value})}
                                            placeholder="sk-..."
                                            className="w-full p-3 pl-10 text-sm rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none transition-all"
                                        />
                                        <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                                    </div>
                                </div>
                                <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 mt-2">
                                    注：自定义配置仅保存在本地浏览器中，不会同步至云端。
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 border-t border-slate-100 bg-white shrink-0 md:rounded-b-2xl pb-8 md:pb-6">
                <button 
                    onClick={saveSettings}
                    disabled={isSavingKeys}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                >
                    {isSavingKeys ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {user.isLoggedIn && provider !== 'custom' ? '保存并同步至云端' : '保存设置 (本地)'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="bg-white px-5 py-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative">
        <button 
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-700 transition p-2.5 hover:bg-slate-50 rounded-full active:bg-slate-100 group"
          title="设置"
        >
          <Settings size={22} className="group-hover:rotate-45 transition-transform duration-300"/>
          {user.isLoggedIn && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>}
        </button>

        {/* Missing Key Indicator Bubble */}
        {!hasConfiguredKey && (
           <button 
             onClick={() => setShowSettings(true)}
             className="absolute top-16 right-4 md:top-20 md:right-5 z-10 animate-bounce cursor-pointer"
           >
              <div className="bg-amber-600 text-white text-[10px] md:text-xs px-3 py-2 rounded-xl shadow-lg relative font-bold tracking-wide flex items-center gap-1.5">
                 <div className="absolute -top-1.5 right-3 w-3 h-3 bg-amber-600 rotate-45"></div>
                 <Sparkles size={12} className="fill-white" />
                 点此配置 AI Key
              </div>
           </button>
        )}

        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-800 mb-6 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles size={16} className="text-amber-600"/>
            </div>
            数字起卦
        </h2>
        
        <div className="mb-6 md:mb-8">
            <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">心中所问之事</label>
            <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：事业发展、今日运势..."
                className="w-full p-4 bg-slate-50 border-b-2 border-slate-200 focus:border-amber-500 outline-none transition-colors rounded-t-xl text-base md:text-lg text-slate-800 placeholder:text-slate-400"
            />
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-8 mb-6 md:mb-8">
            {inputs.map((val, idx) => (
                <div key={idx} className="flex flex-col gap-2 relative group">
                    <label className="text-[10px] md:text-xs text-slate-400 text-center uppercase tracking-wider font-bold">数 {idx + 1}</label>
                    <input 
                        type="number" 
                        value={val}
                        onChange={(e) => handleInputChange(idx, e.target.value)}
                        placeholder="0-999"
                        className="text-center text-3xl md:text-4xl font-serif h-20 md:h-24 rounded-2xl border-2 border-slate-100 focus:border-amber-400 focus:bg-amber-50/30 outline-none transition-all placeholder:text-slate-200 text-slate-800 shadow-sm"
                    />
                </div>
            ))}
        </div>

        <div className="flex gap-3 md:gap-4">
            <button 
                onClick={handleCalculate}
                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold text-base md:text-lg hover:bg-slate-800 transition active:scale-[0.98] flex justify-center items-center gap-2 shadow-xl shadow-slate-200/50"
            >
                起卦推演 <ArrowRight size={20} />
            </button>
             <button 
                onClick={handleRandom}
                className="px-5 md:px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-700 transition active:scale-[0.96]"
                title="随机生成"
            >
                <RefreshCcw size={22} />
            </button>
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div id="result-section" className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-28">
            
            {/* Hexagram Display */}
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex flex-row justify-between md:justify-around items-center px-1 md:px-10">
                    <HexagramVisual 
                        hexagram={result.originalHexagram} 
                        label="本卦" 
                        highlight={result.tiGua} 
                        movingLine={result.movingLine}
                    />
                    
                    <div className="text-slate-200 flex flex-col items-center gap-1">
                        <ArrowRight className="hidden md:block" size={32} />
                        <ArrowRight className="block md:hidden" size={24} />
                        <span className="text-[10px] text-slate-400 md:hidden">变</span>
                    </div>

                    <HexagramVisual 
                        hexagram={result.changedHexagram} 
                        label="变卦" 
                    />
                </div>
            </div>

            {/* Analysis Card */}
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border-l-4 border-amber-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-[0.04] pointer-events-none">
                    <BrainCircuit size={160} />
                </div>
                <div className="flex items-center gap-2 mb-4 md:mb-5">
                    <div className="w-1.5 h-5 bg-amber-500 rounded-full"></div>
                    <h3 className="text-lg font-serif font-bold text-slate-800">体用分析</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3 md:gap-5 mb-4 md:mb-5">
                    <div className="p-3 md:p-4 bg-slate-50/80 rounded-2xl border border-slate-100/50">
                        <span className="text-[10px] md:text-xs text-slate-400 block mb-1 uppercase tracking-wide">体卦 (自己)</span>
                        <div className="font-bold text-slate-800 text-sm md:text-lg flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
                            {result.tiGua === 'upper' ? result.originalHexagram.upper.name : result.originalHexagram.lower.name}
                            <span className="text-[10px] w-fit px-2 py-0.5 bg-white border border-slate-200 rounded-full font-medium text-slate-500">
                                属{result.tiGua === 'upper' ? result.originalHexagram.upper.element : result.originalHexagram.lower.element}
                            </span>
                        </div>
                    </div>
                    <div className="p-3 md:p-4 bg-slate-50/80 rounded-2xl border border-slate-100/50">
                        <span className="text-[10px] md:text-xs text-slate-400 block mb-1 uppercase tracking-wide">用卦 (事物)</span>
                        <div className="font-bold text-slate-800 text-sm md:text-lg flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
                            {result.yongGua === 'upper' ? result.originalHexagram.upper.name : result.originalHexagram.lower.name}
                             <span className="text-[10px] w-fit px-2 py-0.5 bg-white border border-slate-200 rounded-full font-medium text-slate-500">
                                属{result.yongGua === 'upper' ? result.originalHexagram.upper.element : result.originalHexagram.lower.element}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={`p-3 md:p-4 rounded-2xl mb-5 md:mb-6 border flex items-center gap-3 ${
                    result.relationScore.includes('Auspicious') ? 'bg-amber-50 text-amber-900 border-amber-100' : 
                    result.relationScore.includes('Bad') ? 'bg-stone-100 text-stone-700 border-stone-200' : 'bg-slate-50 text-slate-700 border-slate-100'
                }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${result.relationScore.includes('Auspicious') ? 'bg-amber-500' : 'bg-stone-400'}`}></div>
                    <span className="font-bold text-sm md:text-base">{result.relation}</span>
                </div>

                {!aiInterpretation ? (
                    <button 
                        onClick={handleAskAI}
                        disabled={loadingAI}
                        className={`w-full py-3.5 md:py-4 bg-gradient-to-r text-white rounded-2xl font-bold text-sm md:text-base tracking-wide shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 ${provider === 'deepseek' ? 'from-indigo-600 to-indigo-800 shadow-indigo-200' : provider === 'custom' ? 'from-slate-700 to-slate-900 shadow-slate-200' : 'from-amber-600 to-amber-800 shadow-amber-200'}`}
                    >
                        {loadingAI ? '大师正在推演天机...' : `请 ${provider === 'deepseek' ? 'DeepSeek' : provider === 'custom' ? customConfig.modelName || '自定义模型' : 'Gemini'} 大师详解`}
                        {loadingAI && <Loader2 size={18} className="animate-spin text-white/80"/>}
                    </button>
                ) : (
                    <div className="mt-6 md:mt-8 pt-6 border-t border-slate-100 animate-in fade-in duration-700">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <div className={`p-1.5 rounded-lg ${provider === 'deepseek' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                <Sparkles size={14}/> 
                             </div>
                             {provider === 'deepseek' ? 'DeepSeek' : provider === 'custom' ? '自定义模型' : 'Gemini'} 大师解读
                        </h4>
                        <div className="prose prose-slate prose-sm md:prose-base max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100/80">
                            {aiInterpretation}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={() => setAiInterpretation(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 py-2 px-3 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <RefreshCcw size={12}/> 重新解读
                            </button>
                        </div>
                    </div>
                )}
            </div>

             {/* Ancient Text */}
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <ScrollText size={140} />
                </div>
                <div className="flex items-center gap-2 mb-5 md:mb-6">
                    <div className="w-1.5 h-5 bg-slate-300 rounded-full"></div>
                    <h3 className="text-lg font-serif font-bold text-slate-800">古籍原典</h3>
                </div>
                
                {result.originalHexagram.text ? (
                    <div className="space-y-3 md:space-y-4">
                        <div className="bg-[#f9f8f6] p-3 md:p-4 rounded-xl border-l-[3px] border-slate-300">
                            <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase tracking-wider">本卦卦辞</span>
                            <p className="font-serif text-slate-700 text-sm md:text-base leading-relaxed">
                                {result.originalHexagram.text.guaci}
                            </p>
                        </div>
                        
                        <div className="bg-[#f9f8f6] p-3 md:p-4 rounded-xl border-l-[3px] border-slate-300">
                             <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase tracking-wider">大象传</span>
                            <p className="font-serif text-slate-700 text-sm md:text-base leading-relaxed">
                                {result.originalHexagram.text.xiang}
                            </p>
                        </div>

                        {result.movingLineText && (
                           <div className="bg-red-50/50 p-3 md:p-4 rounded-xl border-l-[3px] border-cinnabar/60">
                                <span className="text-[10px] text-cinnabar/80 font-bold block mb-1.5 uppercase tracking-wider">动爻 (变数)</span>
                                <p className="font-serif text-slate-800 text-base md:text-lg leading-relaxed font-medium">
                                    {result.movingLineText}
                                </p>
                           </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-2xl">
                        <p>该卦象的原典数据暂未录入</p>
                    </div>
                )}
            </div>

        </div>
      )}
    </div>
  );
};

export default DivinationTool;
