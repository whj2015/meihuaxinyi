
import React from 'react';
import { X, Trophy, Medal, Lock, Unlock } from 'lucide-react';
import { Achievement, Title } from '../../types';

interface AchievementOverlayProps {
    achievements: Achievement[];
    unlockedTitles: Title[];
    activeTitle?: Title;
    onClose: () => void;
    onEquipTitle: (title: Title | undefined) => void;
}

const AchievementOverlay: React.FC<AchievementOverlayProps> = ({ achievements, unlockedTitles, activeTitle, onClose, onEquipTitle }) => {
    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center backdrop-blur-md animate-fade-in font-['Noto_Sans_SC']"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0f172a] border border-yellow-500/30 rounded-xl w-full max-w-4xl h-[80vh] shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col md:flex-row overflow-hidden relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"><X/></button>
                
                {/* Left: Achievements */}
                <div className="w-full md:w-2/3 border-b md:border-b-0 md:border-r border-yellow-500/20 bg-[#0B1120] flex flex-col">
                    <div className="p-4 bg-yellow-900/20 border-b border-yellow-500/20">
                        <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                            <Trophy size={20}/> 成就记录 (Achievements)
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                        {achievements.map((ach) => (
                            <div key={ach.id} className={`p-3 rounded border flex flex-col gap-1 relative overflow-hidden ${ach.isUnlocked ? 'bg-yellow-900/10 border-yellow-500/40' : 'bg-gray-900/50 border-gray-800 grayscale opacity-60'}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold ${ach.isUnlocked ? 'text-yellow-200' : 'text-gray-400'}`}>{ach.name}</h3>
                                    {ach.isUnlocked ? <Unlock size={14} className="text-yellow-500"/> : <Lock size={14} className="text-gray-600"/>}
                                </div>
                                <p className="text-xs text-gray-400">{ach.description}</p>
                                {ach.rewardTitleId && ach.isUnlocked && (
                                    <div className="mt-2 text-[10px] bg-yellow-950/50 text-yellow-500 px-2 py-1 rounded inline-block border border-yellow-500/20 self-start">
                                        奖励称号: {ach.rewardTitleId}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Titles */}
                <div className="w-full md:w-1/3 bg-[#0f172a] flex flex-col">
                    <div className="p-4 bg-blue-900/20 border-b border-blue-500/20">
                        <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                            <Medal size={20}/> 称号 (Titles)
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                        {/* Unequip Option */}
                        <div 
                            onClick={() => onEquipTitle(undefined)}
                            className={`p-3 rounded border cursor-pointer transition-all ${!activeTitle ? 'bg-gray-700 border-gray-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                        >
                            <span className="text-sm font-bold text-white">无称号</span>
                        </div>

                        {unlockedTitles.length === 0 && <div className="text-gray-500 text-xs text-center py-4">完成成就以解锁称号</div>}

                        {unlockedTitles.map((title) => (
                            <div 
                                key={title.id}
                                onClick={() => onEquipTitle(title)}
                                className={`p-3 rounded border cursor-pointer transition-all group relative ${activeTitle?.id === title.id ? 'bg-blue-900/30 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-[#1e293b] border-gray-700 hover:border-blue-500/50'}`}
                            >
                                <h4 className={`font-bold text-sm ${activeTitle?.id === title.id ? 'text-blue-200' : 'text-gray-300'}`}>{title.name}</h4>
                                <p className="text-xs text-gray-400 mt-1">{title.description}</p>
                                <div className="mt-2 text-[10px] text-teal-400 font-mono">
                                    效果: {title.effect}
                                </div>
                                {activeTitle?.id === title.id && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AchievementOverlay;
