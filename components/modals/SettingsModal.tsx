
import React from 'react';
import { Cpu, RotateCcw, CheckCircle, Info } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialized: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleReset = () => {
        if(confirm("确定要重置游戏进度吗？所有未保存的数据将丢失。")) {
            localStorage.removeItem('pbc_autosave');
            window.location.reload();
        }
    };

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center backdrop-blur-md animate-fade-in font-['Noto_Sans_SC']"
        >
              <div 
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#0f172a] border border-teal-500/50 p-6 rounded-xl w-full max-w-md shadow-[0_0_50px_rgba(20,184,166,0.2)]"
              >
                  <div className="flex items-center gap-3 mb-6 border-b border-teal-500/20 pb-4">
                      <Cpu className="text-teal-400" />
                      <h2 className="text-xl font-bold text-white">系统菜单 / System</h2>
                  </div>
                  
                  <div className="space-y-6 mb-8 text-center">
                      <div className="p-4 bg-teal-900/20 border border-teal-500/30 rounded-lg flex flex-col items-center gap-2">
                          <CheckCircle size={32} className="text-green-500" />
                          <h3 className="text-white font-bold text-lg">离线模式运行中</h3>
                          <p className="text-sm text-gray-400">
                              Offline Mode Active
                          </p>
                          <div className="flex items-start gap-2 text-xs text-gray-500 mt-2 bg-black/20 p-2 rounded text-left w-full">
                              <Info size={14} className="shrink-0 mt-0.5" />
                              <span>游戏逻辑完全在本地运行，无需互联网连接，无需任何配置。您的进度会自动保存在浏览器的本地存储中。</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={handleReset} 
                        className="flex-1 py-3 border border-red-900/50 bg-red-950/20 text-red-400 font-bold rounded hover:bg-red-900/40 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                          <RotateCcw size={16}/> 重置游戏
                      </button>
                      <button onClick={onClose} className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded shadow-[0_0_15px_rgba(20,184,166,0.4)] transition-all flex items-center justify-center gap-2">
                          继续冒险
                      </button>
                  </div>
              </div>
          </div>
    );
};

export default SettingsModal;
