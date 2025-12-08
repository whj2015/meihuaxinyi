
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, Lock, CheckCircle, XCircle, LogIn, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' as 'success' | 'error' | '' });

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setAuthMode('login');
      setFormData({ username: '', password: '' });
      setMessage({ text: '', type: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateInput = (): string | null => {
    const { username, password } = formData;
    if (!username || !password) return '请输入用户名和密码';
    if (username.length < 3) return '用户名至少 3 个字符';
    if (username.length > 20) return '用户名过长';
    if (authMode === 'register') {
        if (password.length < 6) return '密码至少 6 位';
        const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) return '用户名包含非法字符';
    }
    return null;
  };

  const handleAuth = async () => {
    const errorMsg = validateInput();
    if (errorMsg) {
        setMessage({ text: errorMsg, type: 'error' });
        return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (authMode === 'register') {
             // 注册成功后自动登录
             const loginRes = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const loginData = await loginRes.json();
            if (loginData.success) {
                processLoginSuccess(loginData);
            } else {
                setAuthMode('login');
                setMessage({ text: '注册成功，请登录', type: 'success' });
                setIsLoading(false);
            }
        } else {
            processLoginSuccess(data);
        }
      } else {
        setMessage({ text: data.message || '操作失败', type: 'error' });
        setIsLoading(false);
      }
    } catch (error) {
      setMessage({ text: '网络连接错误', type: 'error' });
      setIsLoading(false);
    }
  };

  const processLoginSuccess = (data: any) => {
    const newUser: UserProfile = { 
        username: data.username, 
        isLoggedIn: true,
        credits: data.credits,
        token: data.token 
    };
    localStorage.setItem('user_profile', JSON.stringify(newUser));
    setMessage({ text: '登录成功', type: 'success' });
    
    setTimeout(() => {
        setIsLoading(false);
        onSuccess(newUser);
        onClose();
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAuth();
  };

  // 使用 createPortal 渲染到 body，避免被父组件的 transform/overflow 裁剪或遮挡
  return createPortal(
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div 
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -z-0 pointer-events-none opacity-50 translate-x-10 -translate-y-10"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <User size={16} />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-slate-800">
                        {authMode === 'login' ? '大师登录' : '注册账号'}
                    </h3>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <X size={18}/>
                </button>
            </div>
            
            <div className="space-y-4 relative z-10">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">用户名</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                        <input 
                            type="text" 
                            value={formData.username} 
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-300"
                            placeholder="请输入用户名"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">密码</label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                        <input 
                            type="password" 
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-300"
                            placeholder={authMode === 'register' ? "设置密码 (至少 6 位)" : "请输入密码"}
                        />
                    </div>
                </div>
                
                {message.text && (
                    <div className={`text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                        {message.type === 'error' && <XCircle size={14} className="shrink-0"/>}
                        {message.type === 'success' && <CheckCircle size={14} className="shrink-0"/>}
                        {message.text}
                    </div>
                )}

                <button 
                    onClick={handleAuth} 
                    disabled={isLoading}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin"/> : (authMode === 'login' ? <LogIn size={18}/> : <ArrowRight size={18}/>)}
                    {authMode === 'login' ? '立即解锁' : '注册并登录'}
                </button>
                
                <div className="text-center pt-2">
                    <button 
                        onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setMessage({text:'', type:''}); }}
                        className="text-xs text-slate-400 hover:text-amber-600 underline underline-offset-4 transition-colors"
                    >
                        {authMode === 'login' ? '没有账号？点击免费注册' : '已有账号？点击登录'}
                    </button>
                </div>
            </div>
        </div>
    </div>,
    document.body
  );
};

export default AuthModal;
