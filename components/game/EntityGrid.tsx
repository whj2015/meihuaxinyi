
import React from 'react';
import { Users, Eye, Grab, MessageCircle } from 'lucide-react';
import { Entity } from '../../types';

interface EntityGridProps {
    entities: Entity[];
    onEntityClick: (entity: Entity) => void;
}

const EntityGrid: React.FC<EntityGridProps> = ({ entities, onEntityClick }) => {
    
    const getAvatar = (entity: Entity) => {
        if (entity.avatar && entity.avatar.trim().length > 0) return entity.avatar;
        // Fallback if AI didn't return a valid emoji
        const type = entity.type?.toLowerCase();
        if (type === 'monster' || type === 'boss') return '👾';
        if (type === 'item') return entity.itemData?.icon || '📦';
        return '👤';
    };

    return (
        <div>
             <div className="flex items-center gap-2 mb-2">
                <Users size={12} className="text-gray-500"/>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">区域对象 / Entities</span>
             </div>
             
             {/* Entity Grid */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto max-h-[140px] custom-scrollbar pr-1">
                {entities.length === 0 && (
                    <div className="col-span-full text-gray-600 text-xs italic flex items-center justify-center py-4 border border-dashed border-gray-800 rounded">
                        四周寂静无声，似乎没有任何生物...
                    </div>
                )}
                
                {entities.map((entity, idx) => {
                    const normalizedType = entity.type?.toLowerCase() || 'npc';

                    // --- Monster Card ---
                    if (normalizedType === 'monster' || normalizedType === 'boss') {
                        const hpPercent = entity.hp && entity.maxHp && entity.maxHp > 0 
                            ? Math.min(100, Math.max(0, (entity.hp / entity.maxHp) * 100)) 
                            : 100;

                        return (
                            <button 
                                key={idx} 
                                onClick={() => onEntityClick(entity)}
                                className="bg-red-950/20 border border-red-500/30 hover:bg-red-900/40 hover:border-red-400 p-2 rounded flex flex-col gap-1 transition-all group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{getAvatar(entity)}</span>
                                        <span className="text-red-200 text-xs font-bold truncate">{entity.name}</span>
                                    </div>
                                    <span className="text-[10px] bg-red-950 text-red-400 px-1 rounded border border-red-500/30">Lv.{entity.level}</span>
                                </div>
                                {/* HP Bar for Monster */}
                                <div className="w-full bg-gray-900 h-1.5 rounded-full mt-1 border border-red-900/50 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-red-700 to-red-500" 
                                        style={{width: `${hpPercent}%`}}
                                    ></div>
                                </div>
                                <div className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye size={12} className="text-red-500"/>
                                </div>
                            </button>
                        );
                    }
                    
                    // --- Item/Drop Card ---
                    if (normalizedType === 'item') {
                        return (
                            <button 
                                key={idx} 
                                onClick={() => onEntityClick(entity)}
                                className="bg-yellow-950/20 border border-yellow-500/30 hover:bg-yellow-900/40 hover:border-yellow-400 p-2 rounded flex items-center gap-2 transition-all group"
                            >
                                <div className="w-8 h-8 rounded bg-yellow-900/30 flex items-center justify-center text-lg border border-yellow-500/20">
                                    {getAvatar(entity)}
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-yellow-200 text-xs font-bold truncate w-full text-left">{entity.name}</span>
                                    <span className="text-[10px] text-yellow-500/70 flex items-center gap-1">
                                        <Grab size={10}/> 点击互动
                                    </span>
                                </div>
                            </button>
                        );
                    }

                    // --- NPC Card (Default) ---
                    return (
                        <button 
                            key={idx} 
                            onClick={() => onEntityClick(entity)}
                            className="bg-teal-950/20 border border-teal-500/30 hover:bg-teal-900/40 hover:border-teal-400 p-2 rounded flex items-center gap-2 transition-all group relative"
                        >
                            <div className="w-8 h-8 rounded bg-teal-900/30 flex items-center justify-center text-lg border border-teal-500/20 shrink-0">
                                {getAvatar(entity)}
                            </div>
                            <div className="flex flex-col items-start min-w-0 overflow-hidden w-full">
                                <span className="text-teal-200 text-xs font-bold truncate w-full text-left">{entity.name}</span>
                                {entity.status && (
                                    <span className="text-[9px] text-teal-400/70 bg-teal-900/40 px-1 rounded border border-teal-500/10 truncate max-w-full">
                                        {entity.status}
                                    </span>
                                )}
                            </div>
                            <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MessageCircle size={14} className="text-teal-400"/>
                            </div>
                        </button>
                    );
                })}
             </div>
        </div>
    );
};

export default EntityGrid;
