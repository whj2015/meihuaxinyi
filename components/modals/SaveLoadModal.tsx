
import React from 'react';
import { X, Save, HardDrive, Upload, Package, Download } from 'lucide-react';
import { PlayerStats } from '../../types';

interface SaveLoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: PlayerStats;
    onQuickSave: () => void;
    onQuickLoad: () => void;
    onExportSave: () => void;
    onImportSave: (e: React.ChangeEvent<HTMLInputElement>) => void;
    initialized: boolean;
}

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ 
    isOpen, onClose, stats, onQuickSave, onQuickLoad, onExportSave, onImportSave, initialized 
}) => {
    if (!isOpen) return null;

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center backdrop-blur-xl animate-fade-in"
        >
              <div 
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#0f172a] border border-teal-500/50 p-6 rounded-xl w-full max-w-2xl shadow-[0_0_50px_rgba(20,184,166,0.3)] relative"
              >
                  <button 
                      onClick={onClose}
                      className="absolute top-4 right-4 text-gray-500 hover:text-white p-2"
                  >
                      <X size={24} />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-8 border-b border-teal-500/20 pb-4">
                      <Save className="text-teal-400" size={24} />
                      <h2 className="text-2xl font-bold text-white tracking-widest">系统存档 / ARCHIVE SYSTEM</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Local Storage Section */}
                      <div className="space-y-4 bg-black/20 p-4 rounded-lg border border-gray-800">
                           <div className="flex items-center gap-2 text-teal-300 font-bold mb-2">
                               <HardDrive size={18}/> 本地存储 (Local Browser)
                           </div>
                           <p className="text-xs text-gray-500 mb-4">快速保存到当前浏览器的缓存中。清除浏览器缓存会丢失此存档。</p>
                           
                           <div className="flex flex-col gap-3">
                               <button 
                                  onClick={onQuickSave}
                                  className="py-3 px-4 bg-teal-900/30 border border-teal-500/50 text-teal-100 rounded hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center gap-2 font-bold"
                               >
                                   <Save size={16}/> 保存到浏览器
                               </button>
                               <button 
                                  onClick={onQuickLoad}
                                  className="py-3 px-4 bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-all flex items-center justify-center gap-2 font-bold"
                               >
                                   <Upload size={16}/> 从浏览器读取
                               </button>
                           </div>
                      </div>

                      {/* File Import/Export Section */}
                      <div className="space-y-4 bg-black/20 p-4 rounded-lg border border-gray-800">
                           <div className="flex items-center gap-2 text-blue-300 font-bold mb-2">
                               <Package size={18}/> 文件备份 (File Backup)
                           </div>
                           <p className="text-xs text-gray-500 mb-4">导出为 JSON 文件永久保存，或从文件导入进度。</p>
                           
                           <div className="flex flex-col gap-3">
                               <button 
                                  onClick={onExportSave}
                                  className="py-3 px-4 bg-blue-900/30 border border-blue-500/50 text-blue-100 rounded hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 font-bold"
                               >
                                   <Download size={16}/> 导出存档文件
                               </button>
                               <label className="py-3 px-4 bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-all flex items-center justify-center gap-2 font-bold cursor-pointer">
                                   <Upload size={16}/> 导入存档文件
                                   <input 
                                      type="file" 
                                      onChange={onImportSave}
                                      accept=".json"
                                      className="hidden"
                                   />
                               </label>
                           </div>
                      </div>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-gray-800 text-center">
                       <p className="text-[10px] text-gray-600 font-mono">
                           CURRENT SESSION ID: {initialized ? stats.location : 'NOT_INITIALIZED'} - LV.{stats.level}
                       </p>
                  </div>
              </div>
          </div>
    );
};

export default SaveLoadModal;
