import React, { useState, useEffect } from 'react';
import { calculateDivination } from '../utils/meiHuaLogic';
import { DivinationResult, AIProvider, UserProfile } from '../types';
import HexagramVisual from './HexagramVisual';
import { getInterpretation } from '../services/geminiService';
import { getEnvVar } from '../utils/envUtils';
import { Sparkles, ArrowRight, RefreshCcw, BrainCircuit, Settings, X, Check, ArrowDown, ScrollText, LogIn, LogOut, User, KeyRound, Loader2 } from 'lucide-react';

const DivinationTool: React.FC = () => {
  const [inputs, setInputs] = useState<string[]>(['', '', '']);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    deepseek: ''
  });

  // User Auth State
  const [user, setUser] = useState<UserProfile>({ username: '', isLoggedIn: false });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  // Initialize Keys from Env or LocalStorage
  useEffect(() => {
    const savedGemini = localStorage.getItem('gemini_key') || getEnvVar('Gemini_key') || '';
    const savedDeepSeek = localStorage.getItem('deepseek_key') || getEnvVar('DeepSeek_key') || '';
    const savedProvider = (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
    const savedUser = localStorage.getItem('user_profile');

    setApiKeys({ gemini: savedGemini, deepseek: savedDeepSeek });
    setProvider(savedProvider);

    if (savedUser) {
        setUser(JSON.parse(savedUser));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('gemini_key', apiKeys.gemini);
    localStorage.setItem('deepseek_key', apiKeys.deepseek);
    localStorage.setItem('ai_provider', provider);
    setShowSettings(false);
  };

  // --- 真实登录逻辑 (连接 /api/login) ---
  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) return;
    setIsLoggingIn(true);
    setLoginMessage('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newUser = { username: data.username, isLoggedIn: true };
        setUser(newUser);
        localStorage.setItem('user_profile', JSON.stringify(newUser));

        // 自动填充从云端获取的 Key
        setApiKeys(prev => ({
          gemini: data.keys.gemini || prev.gemini,
          deepseek: data.keys.deepseek || prev.deepseek
        }));

        setLoginMessage('登录成功，云端 Key 已同步。');
      } else {
        setLoginMessage(data.message || '登录失败，请检查用户名或密码。');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginMessage('连接服务器失败，请稍后再试。');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser({ username: '', isLoggedIn: false });
    localStorage.removeItem('user_profile');
    setLoginForm({ username: '', password: '' });
    setLoginMessage('');
  };

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
    
    const currentKey = provider === 'gemini' ? apiKeys.gemini : apiKeys.deepseek;
    
    const text = await getInterpretation(result, question, provider, currentKey);
    setAiInterpretation(text);
    setLoadingAI(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 relative">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2">
                <Settings size={18} /> 大师设置
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            
            <div className="max-h-[80vh] overflow-y-auto no-scrollbar">
                {/* Login Section */}
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    {!user.isLoggedIn ? (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <User size={16} /> 会员登录 (同步云端 Key)
                            </h4>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="用户名"
                                    value={loginForm.username}
                                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                                    className="flex-1 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                                />
                                <input 
                                    type="password" 
                                    placeholder="密码"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                                    className="flex-1 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                                />
                            </div>
                             {loginMessage && <p className={`text-xs ${loginMessage.includes('失败') || loginMessage.includes('错误') ? 'text-red-500' : 'text-green-600'}`}>{loginMessage}</p>}
                            <button 
                                onClick={handleLogin}
                                disabled={isLoggingIn}
                                className="w-full py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 transition flex justify-center items-center gap-2"
                            >
                                {isLoggingIn ? <Loader2 size={14} className="animate-spin"/> : <LogIn size={14} />}
                                {isLoggingIn ? '登录中...' : '登录并同步'}
                            </button>
                            <p className="text-[10px] text-slate-400 text-center">
                                需要在 Cloudflare D1 数据库中预设账号
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{user.username}</p>
                                    <p className="text-xs text-green-600 flex items-center gap-1"><Check size={10}/> 云端已连接</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition"
                            >
                                <LogOut size={12} /> 退出
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-6">
                {/* Provider Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">选择解卦模型</label>
                    <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setProvider('gemini')}
                        className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border transition-all ${provider === 'gemini' ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center gap-1 font-bold">Google Gemini {provider === 'gemini' && <Check size={14} />}</div>
                        <span className="text-[10px] opacity-70">速度快 · 免费额度高</span>
                    </button>
                    <button 
                        onClick={() => setProvider('deepseek')}
                        className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border transition-all ${provider === 'deepseek' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center gap-1 font-bold">DeepSeek {provider === 'deepseek' && <Check size={14} />}</div>
                        <span className="text-[10px] opacity-70">中文理解极强 · 深度推理</span>
                    </button>
                    </div>
                </div>

                {/* API Keys */}
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-500">
                    系统优先读取：1. 云端同步 2. 环境变量 3. 手动输入
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                            Gemini API Key 
                            {user.isLoggedIn && apiKeys.gemini && <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded">已同步</span>}
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={apiKeys.gemini}
                                onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                                placeholder="如未配置环境变量，请在此输入..."
                                className="w-full p-3 pl-9 text-sm rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                            />
                            <KeyRound size={14} className="absolute left-3 top-3.5 text-slate-400"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                            DeepSeek API Key
                             {user.isLoggedIn && apiKeys.deepseek && <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded">已同步</span>}
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={apiKeys.deepseek}
                                onChange={(e) => setApiKeys({...apiKeys, deepseek: e.target.value})}
                                placeholder="sk-..."
                                className="w-full p-3 pl-9 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                            />
                            <KeyRound size={14} className="absolute left-3 top-3.5 text-slate-400"/>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={saveSettings}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200 active:scale-[0.98]"
                >
                    保存配置
                </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 relative">
        <button 
          onClick={() => setShowSettings(true)}
          className="absolute top-5 right-5 text-slate-300 hover:text-slate-600 transition p-2 hover:bg-slate-50 rounded-full"
          title="设置 API Key 与模型"
        >
          <Settings size={20} />
          {user.isLoggedIn && <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border border-white"></span>}
        </button>

        <h2 className="text-xl font-serif font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500"/>
            数字起卦
        </h2>
        
        <div className="mb-6">
            <label className="block text-sm font-medium text-slate-500 mb-2">心中所问之事</label>
            <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：今日财运如何？"
                className="w-full p-3 bg-slate-50 border-b-2 border-slate-200 focus:border-amber-500 outline-none transition-colors rounded-t-md text-base"
            />
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
            {inputs.map((val, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                    <label className="text-[10px] md:text-xs text-slate-400 text-center uppercase tracking-wider">数字 {idx + 1}</label>
                    <input 
                        type="number" 
                        value={val}
                        onChange={(e) => handleInputChange(idx, e.target.value)}
                        placeholder="0-999"
                        className="text-center text-xl md:text-2xl font-serif p-3 md:p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all placeholder:text-slate-200"
                    />
                </div>
            ))}
        </div>

        <div className="flex gap-3">
            <button 
                onClick={handleCalculate}
                className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-slate-200"
            >
                起卦 <ArrowRight size={18} />
            </button>
             <button 
                onClick={handleRandom}
                className="px-5 py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition active:scale-[0.98]"
                title="随机数字"
            >
                <RefreshCcw size={18} />
            </button>
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div id="result-section" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-24">
            
            {/* Hexagram Display */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row justify-around items-center gap-8 md:gap-0">
                    <HexagramVisual 
                        hexagram={result.originalHexagram} 
                        label="本卦 (开始)" 
                        highlight={result.tiGua} 
                        movingLine={result.movingLine}
                    />
                    
                    <div className="text-slate-300">
                        <ArrowDown className="block md:hidden" size={24} />
                        <ArrowRight className="hidden md:block" size={24} />
                    </div>

                    <HexagramVisual 
                        hexagram={result.changedHexagram} 
                        label="变卦 (结果)" 
                    />
                </div>
            </div>

            {/* Ancient Text (Original Annotations) */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                    <ScrollText size={150} />
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ScrollText size={18} className="text-slate-500" />
                    古籍原典
                </h3>
                
                {result.originalHexagram.text ? (
                    <div className="space-y-4">
                        <div className="bg-[#fcfaf7] p-4 rounded-lg border-l-2 border-slate-300">
                            <span className="text-xs text-slate-500 font-bold block mb-1">【本卦卦辞】</span>
                            <p className="font-serif text-slate-700 text-base leading-relaxed">
                                {result.originalHexagram.text.guaci}
                            </p>
                        </div>
                        
                        <div className="bg-[#fcfaf7] p-4 rounded-lg border-l-2 border-slate-300">
                             <span className="text-xs text-slate-500 font-bold block mb-1">【大象传】</span>
                            <p className="font-serif text-slate-700 text-base leading-relaxed">
                                {result.originalHexagram.text.xiang}
                            </p>
                        </div>

                        {result.movingLineText && (
                           <div className="bg-[#fff5f5] p-4 rounded-lg border-l-2 border-cinnabar">
                                <span className="text-xs text-cinnabar font-bold block mb-1">【动爻爻辞 · 变数所在】</span>
                                <p className="font-serif text-slate-800 text-lg leading-relaxed font-medium">
                                    {result.movingLineText}
                                </p>
                           </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        <p>该卦象的原典数据暂未录入。</p>
                        <p className="text-xs mt-1">（示例版本仅包含常用卦数据）</p>
                    </div>
                )}
            </div>

            {/* Analysis Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <BrainCircuit size={120} />
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-800 mb-4">体用分析</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between md:block">
                        <span className="text-xs text-slate-500 block mb-1">体卦 (代表自己)</span>
                        <div className="font-bold text-slate-800 text-lg flex items-baseline gap-2">
                            {result.tiGua === 'upper' ? result.originalHexagram.upper.name : result.originalHexagram.lower.name}
                            <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full font-normal text-slate-500">
                                五行属{result.tiGua === 'upper' ? result.originalHexagram.upper.element : result.originalHexagram.lower.element}
                            </span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between md:block">
                        <span className="text-xs text-slate-500 block mb-1">用卦 (代表事物)</span>
                        <div className="font-bold text-slate-800 text-lg flex items-baseline gap-2">
                            {result.yongGua === 'upper' ? result.originalHexagram.upper.name : result.originalHexagram.lower.name}
                             <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full font-normal text-slate-500">
                                五行属{result.yongGua === 'upper' ? result.originalHexagram.upper.element : result.originalHexagram.lower.element}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-amber-900 mb-6 border border-amber-100/50">
                    <span className="font-bold mr-2">关系判定:</span>
                    {result.relation}
                </div>

                {!aiInterpretation ? (
                    <button 
                        onClick={handleAskAI}
                        disabled={loadingAI}
                        className={`w-full py-3.5 bg-gradient-to-r text-white rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${provider === 'deepseek' ? 'from-indigo-600 to-indigo-800 shadow-indigo-200' : 'from-slate-800 to-slate-900 shadow-slate-200'}`}
                    >
                        {loadingAI ? '大师正在推演...' : `请 ${provider === 'deepseek' ? 'DeepSeek' : 'Gemini'} 大师详解`}
                        {loadingAI && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                    </button>
                ) : (
                    <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in duration-500">
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                             <Sparkles size={16} className={provider === 'deepseek' ? 'text-indigo-500' : 'text-amber-500'}/> 
                             {provider === 'deepseek' ? 'DeepSeek' : 'Gemini'} 大师解读
                        </h4>
                        <div className="prose prose-slate prose-sm md:prose-base max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {aiInterpretation}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={() => setAiInterpretation(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 py-2 px-3 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <RefreshCcw size={12}/> 重新解读
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default DivinationTool;