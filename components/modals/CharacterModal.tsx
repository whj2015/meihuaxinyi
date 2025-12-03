
import React from 'react';
import { X, Shield, Sword, User, Zap, Activity, Star } from 'lucide-react';
import { PlayerStats, Item } from '../../types';

interface CharacterModalProps {
    stats: PlayerStats;
    onClose: () => void;
    onUnequip: (slot: 'weapon' | 'armor' | 'accessory') => void;
}

const CharacterModal: React.FC<CharacterModalProps> = ({ stats, onClose, onUnequip }) => {
    
    // Helper to render an equipment slot
    const renderEquipSlot = (slotName: string, slotKey: 'weapon' | 'armor' | 'accessory', icon: React.ReactNode) => {
        const item = stats.equipment?.[slotKey];
        
        return (
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{slotName}</span>
                <div 
                    onClick={() => item ? onUnequip(slotKey) : null}
                    className={`
                        h-20 w-full rounded-lg border-2 flex items-center gap-3 p-3 transition-all relative group cursor-pointer
                        ${item 
                            ? 'bg-[#1e293b] border-teal-500/50 hover:bg-teal-900/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]' 
                            : 'bg-gray-900/50 border-gray-800 border-dashed hover:border-gray-600'}
                    `}
                >
                    <div className={`w-12 h-12 rounded flex items-center justify-center text-2xl shrink-0 ${item ? 'bg-black/40' : 'text-gray-700'}`}>
                        {item ? item.icon : icon}
                    </div>
                    
                    {item ? (
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-teal-200 truncate">{item.name}</div>
                            <div className="text-[10px] text-gray-400 truncate">{item.effect || item.description}</div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-1 rounded">卸下</div>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-600">未装备</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center backdrop-blur-md animate-fade-in font-['Noto_Sans_SC']"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0f172a] border border-teal-500/30 rounded-xl w-full max-w-4xl h-[85vh] shadow-[0_0_50px_rgba(20,184,166,0.2)] flex flex-col md:flex-row overflow-hidden relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"><X/></button>

                {/* Left: Avatar & Base Info */}
                <div className="w-full md:w-1/3 bg-[#0B1120] border-b md:border-b-0 md:border-r border-teal-500/20 p-6 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full border-4 border-teal-500/30 p-1 mb-4 shadow-[0_0_20px_rgba(20,184,166,0.3)] relative">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-6xl overflow-hidden">
                             🧑‍🚀
                        </div>
                        <div className="absolute -bottom-2 bg-teal-950 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/50">
                            Lv.{stats.level}
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-1">冒险者</h2>
                    <p className="text-teal-500/70 text-sm mb-6 uppercase tracking-widest">{stats.activeTitle?.name || '无称号'}</p>

                    <div className="w-full space-y-4">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-400"><span>EXP</span><span>{stats.exp} / {stats.maxExp}</span></div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 transition-all" style={{width: `${Math.min(100, (stats.exp/stats.maxExp)*100)}%`}}></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                             <div className="bg-gray-900/50 p-2 rounded border border-gray-800 flex items-center gap-2">
                                 <Activity size={16} className="text-green-500"/>
                                 <div className="flex flex-col">
                                     <span className="text-[10px] text-gray-500">生命值</span>
                                     <span className="font-mono text-gray-200">{stats.hp}/{stats.maxHp}</span>
                                 </div>
                             </div>
                             <div className="bg-gray-900/50 p-2 rounded border border-gray-800 flex items-center gap-2">
                                 <Zap size={16} className="text-blue-500"/>
                                 <div className="flex flex-col">
                                     <span className="text-[10px] text-gray-500">灵气值</span>
                                     <span className="font-mono text-gray-200">{stats.mp}/{stats.maxMp}</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Right: Stats & Equipment */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-lg font-bold text-teal-400 mb-4 flex items-center gap-2 border-b border-teal-500/20 pb-2">
                        <User size={18}/> 属性详情
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-[#1e293b] p-3 rounded border border-gray-700">
                            <span className="text-xs text-gray-500 block mb-1">攻击力 (ATK)</span>
                            <span className="text-xl font-mono font-bold text-red-400">{stats.attack}</span>
                        </div>
                        <div className="bg-[#1e293b] p-3 rounded border border-gray-700">
                            <span className="text-xs text-gray-500 block mb-1">防御力 (DEF)</span>
                            <span className="text-xl font-mono font-bold text-blue-400">{stats.defense}</span>
                        </div>
                        <div className="bg-[#1e293b] p-3 rounded border border-gray-700">
                            <span className="text-xs text-gray-500 block mb-1">速度 (SPD)</span>
                            <span className="text-xl font-mono font-bold text-yellow-400">{stats.speed}</span>
                        </div>
                         <div className="bg-[#1e293b] p-3 rounded border border-gray-700">
                            <span className="text-xs text-gray-500 block mb-1">金币 (Gold)</span>
                            <span className="text-xl font-mono font-bold text-yellow-600">{stats.gold}</span>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-teal-400 mb-4 flex items-center gap-2 border-b border-teal-500/20 pb-2">
                        <Shield size={18}/> 装备槽位
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {renderEquipSlot('主武器', 'weapon', <Sword size={20}/>)}
                        {renderEquipSlot('护甲', 'armor', <Shield size={20}/>)}
                        {renderEquipSlot('饰品', 'accessory', <Star size={20}/>)}
                    </div>
                    
                    <div className="mt-8 bg-blue-900/10 p-4 rounded border border-blue-500/20 text-xs text-blue-300">
                        提示: 点击装备槽位可以卸下装备。在背包中点击装备可以进行穿戴。
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterModal;
