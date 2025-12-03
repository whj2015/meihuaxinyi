
import React, { useState } from 'react';
import { X, Zap, ArrowUpCircle, Trash2, Star, Shield, Sword, Heart, Activity, HeartPulse, Sparkles, LogOut } from 'lucide-react';
import { Pet } from '../../types';

interface PetListOverlayProps {
    ownedPets: Pet[];
    activePet?: Pet;
    onClose: () => void;
    onSummon: (pet: Pet) => void;
    onRecall?: () => void; // Added onRecall handler
    onEnhance: (pet: Pet) => void;
    onRelease: (pet: Pet) => void;
}

const PetListOverlay: React.FC<PetListOverlayProps> = ({ ownedPets, activePet, onClose, onSummon, onRecall, onEnhance, onRelease }) => {
    const [selectedPet, setSelectedPet] = useState<Pet | null>(activePet || ownedPets[0] || null);

    const renderStars = (count: number) => {
        return Array(5).fill(0).map((_, i) => (
          <Star key={i} size={10} className={i < count ? "fill-yellow-400 text-yellow-400" : "text-gray-700"} />
        ));
    };

    // Helper to calculate percentage based on an arbitrary max for visualization
    const getStatPercent = (val: number, max: number = 100) => Math.min(100, (val / max) * 100);

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center backdrop-blur-md animate-fade-in font-['Noto_Sans_SC'] p-4"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0f172a] border border-purple-500/30 rounded-2xl w-full max-w-4xl h-[85vh] shadow-[0_0_60px_rgba(147,51,234,0.15)] flex flex-col md:flex-row overflow-hidden relative"
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white z-20 bg-black/50 p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                    <X size={20}/>
                </button>
                
                {/* Left: Pet List */}
                <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-purple-500/20 bg-[#0B1120] flex flex-col shrink-0">
                    <div className="p-5 bg-gradient-to-r from-purple-900/20 to-transparent border-b border-purple-500/10">
                        <h2 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                            <Zap size={18} className="text-purple-400"/> 契约兽 ({ownedPets.length})
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {ownedPets.length === 0 && (
                            <div className="text-gray-600 text-sm text-center py-20 flex flex-col items-center gap-2">
                                <Zap size={32} className="opacity-20"/>
                                暂无契约兽
                            </div>
                        )}
                        {ownedPets.map((pet, idx) => {
                            const isDeployed = activePet?.id === pet.id;
                            const isSelected = selectedPet?.id === pet.id;
                            return (
                                <div 
                                    key={idx}
                                    onClick={() => setSelectedPet(pet)}
                                    className={`
                                        p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden group
                                        ${isSelected 
                                            ? 'bg-purple-900/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                                            : 'bg-[#1e293b] border-gray-800 hover:border-purple-500/30 hover:bg-[#253045]'}
                                    `}
                                >
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl border shrink-0 shadow-inner ${isSelected ? 'bg-black/40 border-purple-500/30' : 'bg-black/20 border-gray-700'}`}>
                                        🐲
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{pet.name}</h3>
                                            {isDeployed && (
                                                <span className="text-[9px] bg-green-950/80 text-green-400 px-1.5 py-0.5 rounded border border-green-500/40 flex items-center gap-0.5 animate-pulse">
                                                    <div className="w-1 h-1 rounded-full bg-green-400"></div> 出战
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-0.5 opacity-80">{renderStars(pet.stars)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Detail View */}
                <div className="flex-1 bg-[#0f172a] relative flex flex-col">
                     {/* Decorative Background */}
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-[#0f172a] to-[#0f172a] pointer-events-none"></div>

                     {selectedPet ? (
                         <div className="flex-1 flex flex-col p-6 md:p-10 relative z-10 overflow-y-auto custom-scrollbar">
                            
                            {/* Header Section */}
                            <div className="flex flex-col items-center mb-8 relative">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-800 to-black border-2 border-purple-500/30 flex items-center justify-center text-7xl shadow-[0_0_40px_rgba(168,85,247,0.2)] mb-4 z-10 relative group-hover:scale-105 transition-transform duration-500">
                                        🐲
                                    </div>
                                    {/* Glow behind avatar */}
                                    <div className="absolute inset-0 bg-purple-600 blur-3xl opacity-20 rounded-full -z-10 group-hover:opacity-40 transition-opacity"></div>
                                </div>
                                
                                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-purple-400 mb-1">{selectedPet.name}</h1>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-purple-950/50 border border-purple-500/30 text-[10px] text-purple-300 uppercase tracking-widest font-bold">
                                        {selectedPet.title}
                                    </span>
                                    <div className="flex gap-0.5">{renderStars(selectedPet.stars)}</div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Vital Stats */}
                                <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">基础属性</h4>
                                    <div className="space-y-4">
                                        {/* HP */}
                                        <div>
                                            <div className="flex justify-between items-center text-xs mb-1.5">
                                                <span className="text-gray-300 flex items-center gap-1.5"><Heart size={14} className="text-red-500 fill-red-500"/> 生命值</span>
                                                <span className="font-mono font-bold text-red-300">{selectedPet.hp} <span className="text-gray-600">/ {selectedPet.maxHp}</span></span>
                                            </div>
                                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 transition-all duration-500" style={{width: `${getStatPercent(selectedPet.hp, selectedPet.maxHp)}%`}}></div>
                                            </div>
                                        </div>
                                        
                                        {/* Loyalty */}
                                        <div>
                                            <div className="flex justify-between items-center text-xs mb-1.5">
                                                <span className="text-gray-300 flex items-center gap-1.5"><HeartPulse size={14} className="text-pink-500"/> 忠诚度</span>
                                                <span className="font-mono font-bold text-pink-300">{selectedPet.loyalty}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-pink-500 transition-all duration-500" style={{width: `${selectedPet.loyalty}%`}}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Combat Stats */}
                                <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">战斗数值</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-blue-900/30 flex items-center justify-center border border-blue-500/20"><Sword size={12} className="text-blue-400"/></div>
                                                <span className="text-sm text-gray-300">攻击力</span>
                                            </div>
                                            <div className="flex flex-col items-end w-24">
                                                <span className="text-sm font-bold font-mono text-blue-300">{selectedPet.attack}</span>
                                                <div className="h-1 w-full bg-gray-800 rounded-full mt-1 overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${getStatPercent(selectedPet.attack, 200)}%`}}></div></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-green-900/30 flex items-center justify-center border border-green-500/20"><Shield size={12} className="text-green-400"/></div>
                                                <span className="text-sm text-gray-300">防御力</span>
                                            </div>
                                            <div className="flex flex-col items-end w-24">
                                                <span className="text-sm font-bold font-mono text-green-300">{selectedPet.defense}</span>
                                                <div className="h-1 w-full bg-gray-800 rounded-full mt-1 overflow-hidden"><div className="h-full bg-green-500" style={{width: `${getStatPercent(selectedPet.defense, 150)}%`}}></div></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-yellow-900/30 flex items-center justify-center border border-yellow-500/20"><Activity size={12} className="text-yellow-400"/></div>
                                                <span className="text-sm text-gray-300">速度</span>
                                            </div>
                                            <div className="flex flex-col items-end w-24">
                                                <span className="text-sm font-bold font-mono text-yellow-300">{selectedPet.speed}</span>
                                                <div className="h-1 w-full bg-gray-800 rounded-full mt-1 overflow-hidden"><div className="h-full bg-yellow-500" style={{width: `${getStatPercent(selectedPet.speed, 100)}%`}}></div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Section */}
                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Sparkles size={14}/> 掌握技能</h4>
                                <div className="flex flex-wrap gap-3">
                                    {selectedPet.skills.map((skill, i) => (
                                        <div key={i} className="px-4 py-2 bg-gradient-to-br from-[#1e293b] to-black border border-purple-500/30 rounded-lg text-purple-200 text-xs font-bold shadow-sm flex items-center gap-2 hover:border-purple-400 transition-colors">
                                            <Zap size={10} className="fill-purple-500 text-purple-500"/>
                                            {skill}
                                        </div>
                                    ))}
                                    {selectedPet.skills.length === 0 && <span className="text-xs text-gray-600 italic">暂无技能</span>}
                                </div>
                            </div>
                            
                            {/* Action Bar */}
                            <div className="mt-auto grid grid-cols-4 gap-3 border-t border-gray-800 pt-6">
                                {activePet?.id === selectedPet.id ? (
                                    <>
                                        <button disabled className="col-span-1 bg-green-900/20 border border-green-500/30 text-green-500 py-3 rounded-lg font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 opacity-50">
                                            <Zap size={16}/> 正在出战
                                        </button>
                                        <button 
                                            onClick={onRecall}
                                            className="col-span-1 bg-[#1e293b] hover:bg-gray-700 border border-gray-600 text-gray-200 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 hover:border-gray-400"
                                        >
                                            <LogOut size={16}/> 收回休息
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => onSummon(selectedPet)} 
                                        className="col-span-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                    >
                                        <Zap size={16}/> 召唤出战
                                    </button>
                                )}
                                
                                <button onClick={() => onEnhance(selectedPet)} className="bg-blue-900/20 hover:bg-blue-800/40 border border-blue-500/50 text-blue-300 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                                    <ArrowUpCircle size={16}/> 强化
                                </button>
                                <button onClick={() => onRelease(selectedPet)} className="bg-red-900/10 hover:bg-red-900/30 border border-red-500/30 text-red-400 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 hover:border-red-500/60">
                                    <Trash2 size={16}/> 放生
                                </button>
                            </div>
                         </div>
                     ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                             <div className="w-20 h-20 rounded-full bg-[#1e293b] flex items-center justify-center border border-gray-800">
                                <Zap size={32} className="opacity-20"/>
                             </div>
                             <p>请从左侧列表选择一只契约兽</p>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default PetListOverlay;
