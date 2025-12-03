
import React, { useState } from 'react';
import { X, Zap, Trash2, Grab, Eye, Sword, Footprints, MessageCircle, ShoppingBag, ScrollText, CheckCircle, HelpCircle, ArrowLeft, MapPin } from 'lucide-react';
import { Entity, Quest, QuestType } from '../../types';
import { getQuestDefinition, getNpcDefinition } from '../../services/geminiService';

interface InteractionOverlayProps {
    target: Entity;
    source: 'world' | 'inventory';
    quests: Quest[]; // Player's current quests
    onClose: () => void;
    // Item Actions
    onUse: (item: Entity) => void;
    onDrop: () => void;
    onPickup: (item: Entity) => void;
    onObserveItem: (item: Entity) => void;
    // Monster Actions
    onFight: (entity: Entity) => void;
    onObserveMonster: (entity: Entity) => void;
    onSneak: (entity: Entity) => void;
    // NPC Actions
    onTalk: (entity: Entity) => void;
    onTrade: (entity: Entity) => void;
    onAcceptQuest: (questId: string) => void;
    onSubmitQuest: (questId: string) => void;
    onObserveNpc: (entity: Entity) => void;
}

// Helper to get Quest Status relative to player
const getQuestStatus = (questId: string, playerQuests: Quest[]): 'available' | 'active' | 'completed' | 'turned_in' => {
    const pq = playerQuests.find(q => q.id === questId);
    if (!pq) return 'available'; 
    if (pq.status === 'turned_in') return 'turned_in';
    
    // Check if ready to turn in (Completed but not submitted)
    const allDone = pq.objectives.every(o => o.current >= o.count);
    if (allDone && pq.status === 'active') return 'completed'; 
    
    return pq.status;
};

const InteractionOverlay: React.FC<InteractionOverlayProps> = ({
    target, source, quests, onClose,
    onUse, onDrop, onPickup, onObserveItem,
    onFight, onObserveMonster, onSneak,
    onTalk, onTrade, onAcceptQuest, onSubmitQuest, onObserveNpc
}) => {
    const [view, setView] = useState<'main' | 'quest_list' | 'quest_detail'>('main');
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

    const getAvatar = (entity: Entity) => {
        if (entity.avatar && entity.avatar.trim().length > 0) return entity.avatar;
        if (entity.type === 'monster' || entity.type === 'boss') return '👾';
        if (entity.type === 'item') return entity.itemData?.icon || '📦';
        return '👤';
    };

    // Calculate Relevant Quests:
    // 1. Quests this NPC gives.
    // 2. Quests the player has that are active/completed and turned in to THIS NPC.
    const givenQuestIds = target.questsGiven || [];
    const returnableQuests = quests.filter(q => q.turnInNpcId === target.id).map(q => q.id);
    
    // Unique union of IDs
    const relevantQuestIds = Array.from(new Set([...givenQuestIds, ...returnableQuests]));
    
    // Helper to get quest data (merged player state + template)
    const getQuestData = (id: string) => {
        const playerQuest = quests.find(q => q.id === id);
        if (playerQuest) return playerQuest;
        return getQuestDefinition(id);
    };

    // Render Quest List View
    const renderQuestList = () => (
        <div className="animate-fade-in h-full flex flex-col font-['Noto_Sans_SC']">
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <button onClick={() => setView('main')} className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded transition-colors"><ArrowLeft size={18}/></button>
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><ScrollText size={18} className="text-yellow-500"/> 任务委托</h3>
            </div>
            
            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                {relevantQuestIds.length === 0 && <div className="text-gray-500 text-sm text-center py-10">此人没有相关委托。</div>}
                
                {relevantQuestIds.map(qid => {
                    const status = getQuestStatus(qid, quests);
                    const quest = getQuestData(qid);
                    if (!quest) return null;
                    
                    // Calc progress for quick view
                    const currentSum = quest.objectives.reduce((a, b) => a + b.current, 0);
                    const totalSum = quest.objectives.reduce((a, b) => a + b.count, 0);

                    let statusBadge = <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">未知</span>;
                    let borderColor = "border-gray-700";

                    if (status === 'available') {
                        statusBadge = <span className="text-[10px] bg-yellow-900/50 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30">可接取</span>;
                        borderColor = "border-yellow-500/20 hover:border-yellow-500/50";
                    }
                    if (status === 'active') {
                         statusBadge = <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1">进行中 <span className="text-blue-300 font-mono">({currentSum}/{totalSum})</span></span>;
                         borderColor = "border-blue-500/20 hover:border-blue-500/50";
                    }
                    if (status === 'completed') {
                         statusBadge = <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-500/30 animate-pulse flex items-center gap-1">可提交 <CheckCircle size={10}/></span>;
                         borderColor = "border-green-500/40 hover:border-green-500/70";
                    }
                    if (status === 'turned_in') {
                         statusBadge = <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded line-through">已完成</span>;
                         borderColor = "border-gray-800 opacity-60";
                    }

                    return (
                        <div 
                            key={qid} 
                            onClick={() => { setSelectedQuestId(qid); setView('quest_detail'); }}
                            className={`bg-[#1e293b] border ${borderColor} p-3 rounded cursor-pointer group transition-all`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`font-bold text-sm transition-colors ${status === 'turned_in' ? 'text-gray-500' : 'text-gray-200 group-hover:text-yellow-400'}`}>{quest.title}</h4>
                                {statusBadge}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">{quest.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // Render Quest Detail View
    const renderQuestDetail = () => {
        if (!selectedQuestId) return null;
        const quest = getQuestData(selectedQuestId);
        if (!quest) return <div>Error loading quest</div>;
        const status = getQuestStatus(selectedQuestId, quests);
        
        // Resolve NPC Names
        const giverName = quest.giverNpcId ? getNpcDefinition(quest.giverNpcId)?.name || '未知' : '系统';
        const turnInName = quest.turnInNpcId ? getNpcDefinition(quest.turnInNpcId)?.name || '未知' : '自动';

        return (
            <div className="animate-fade-in h-full flex flex-col font-['Noto_Sans_SC']">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                    <button onClick={() => setView('quest_list')} className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded transition-colors"><ArrowLeft size={18}/></button>
                    <h3 className="text-lg font-bold text-white truncate">{quest.title}</h3>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                    <div className="bg-[#0f172a] p-3 rounded border border-gray-700 text-sm text-gray-300 leading-relaxed">
                        {quest.description}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#1e293b] p-2 rounded border border-gray-700">
                             <span className="text-gray-500 block flex items-center gap-1 mb-1"><MapPin size={10}/> 发布者</span>
                             <span className="text-teal-300 font-bold">{giverName}</span>
                        </div>
                        <div className="bg-[#1e293b] p-2 rounded border border-gray-700">
                             <span className="text-gray-500 block flex items-center gap-1 mb-1"><CheckCircle size={10}/> 提交给</span>
                             <span className="text-yellow-300 font-bold">{turnInName}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">任务目标</h4>
                        <div className="space-y-2">
                             {quest.objectives.map((obj, i) => (
                                 <div key={i} className="flex justify-between items-center text-sm bg-[#1e293b] p-2 rounded border border-gray-800">
                                     <span className="text-gray-300">
                                         {obj.type === 'kill' && '击败'}
                                         {obj.type === 'collect' && '收集'}
                                         {obj.type === 'talk' && '交谈'}
                                         {' '}{obj.targetName}
                                     </span>
                                     <span className={`font-mono ${obj.current >= obj.count ? 'text-green-500' : 'text-gray-500'}`}>
                                         {obj.current}/{obj.count}
                                     </span>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">奖励</h4>
                        <div className="flex flex-wrap gap-2 text-xs">
                             {quest.rewards.exp && <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-500/20">Exp +{quest.rewards.exp}</span>}
                             {quest.rewards.gold && <span className="bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded border border-yellow-500/20">Gold +{quest.rewards.gold}</span>}
                             {quest.rewards.items?.map((item, i) => (
                                 <span key={i} className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-500/20">
                                     物品: {getQuestDefinition(quest.id)?.rewards.items?.[i]?.itemId || 'Unknown'} x{item.count}
                                 </span>
                             ))}
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800 shrink-0">
                    {status === 'available' && (
                        <button 
                            onClick={() => { onAcceptQuest(quest.id); /* No close for feedback */ }}
                            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18}/> 接受任务
                        </button>
                    )}
                    {status === 'active' && (
                        <button disabled className="w-full py-3 bg-gray-700 text-gray-400 font-bold rounded cursor-not-allowed flex items-center justify-center gap-2">
                           <ScrollText size={18}/> 进行中...
                        </button>
                    )}
                    {status === 'completed' && (
                        <button 
                             onClick={() => { onSubmitQuest(quest.id); /* No close for feedback */ }}
                             className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse"
                        >
                            <CheckCircle size={18}/> 完成任务
                        </button>
                    )}
                    {status === 'turned_in' && (
                        <button disabled className="w-full py-3 bg-gray-800 text-gray-600 font-bold rounded cursor-not-allowed border border-gray-700">
                            已完成
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center backdrop-blur-sm animate-fade-in font-['Noto_Sans_SC']"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0B1120] border border-teal-500/30 rounded-xl w-full max-w-md min-h-[400px] max-h-[80vh] shadow-[0_0_50px_rgba(20,184,166,0.2)] flex flex-col relative overflow-hidden"
            >
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 z-20 text-gray-500 hover:text-white p-1 hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Avatar Header */}
                <div className="p-6 pb-0 flex flex-col items-center shrink-0">
                     <div className="w-20 h-20 rounded-full bg-[#0f172a] border-2 border-teal-500 flex items-center justify-center shadow-lg relative mb-3">
                         <span className="text-4xl">{getAvatar(target)}</span>
                         <div className="absolute -bottom-2 bg-teal-950 px-2 py-0.5 rounded text-xs border border-teal-500/50 text-teal-300 font-bold">
                            {target.type === 'npc' ? 'NPC' : target.type === 'monster' ? `Lv.${target.level}` : 'Item'}
                         </div>
                     </div>
                     <h2 className="text-xl font-bold text-white mb-1">{target.name}</h2>
                     <p className="text-xs text-gray-400 max-w-[80%] text-center line-clamp-2">{target.description}</p>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col">
                    
                    {/* View Switching */}
                    {view === 'main' && (
                        <div className="flex flex-col gap-3 mt-4 animate-fade-in">
                            {/* Contextual Actions */}
                            {target.type === 'npc' && (
                                <>
                                    <button onClick={() => onTalk(target)} className="py-3 px-4 bg-[#1e293b] hover:bg-teal-900/30 border border-gray-700 hover:border-teal-500/50 text-gray-200 rounded flex items-center justify-center gap-2 transition-all font-bold">
                                        <MessageCircle size={18} className="text-teal-400"/> 交谈
                                    </button>
                                    <button onClick={() => setView('quest_list')} className="py-3 px-4 bg-[#1e293b] hover:bg-yellow-900/30 border border-gray-700 hover:border-yellow-500/50 text-gray-200 rounded flex items-center justify-center gap-2 transition-all font-bold relative group">
                                        <ScrollText size={18} className="text-yellow-400"/> 
                                        任务委托
                                        {/* Notification Dot - Check relevantQuestIds status */}
                                        {relevantQuestIds.some(qid => getQuestStatus(qid, quests) === 'available' || getQuestStatus(qid, quests) === 'completed') && (
                                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                        )}
                                    </button>
                                    <button onClick={() => onTrade(target)} className="py-3 px-4 bg-[#1e293b] hover:bg-blue-900/30 border border-gray-700 hover:border-blue-500/50 text-gray-200 rounded flex items-center justify-center gap-2 transition-all font-bold">
                                        <ShoppingBag size={18} className="text-blue-400"/> 交易
                                    </button>
                                    <button onClick={() => onObserveNpc(target)} className="py-3 px-4 bg-[#1e293b] hover:bg-gray-700 border border-gray-700 text-gray-400 rounded flex items-center justify-center gap-2 transition-all font-bold">
                                        <Eye size={18}/> 观察
                                    </button>
                                </>
                            )}

                            {target.type === 'monster' && (
                                <>
                                    <button onClick={() => onFight(target)} className="py-4 bg-red-900/20 hover:bg-red-800/40 border border-red-500/50 text-red-400 hover:text-red-200 rounded flex items-center justify-center gap-2 transition-all font-bold shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                                        <Sword size={20}/> 开始战斗
                                    </button>
                                    <div className="flex gap-3">
                                        <button onClick={() => onObserveMonster(target)} className="flex-1 py-3 bg-[#1e293b] hover:bg-gray-700 border border-gray-700 text-gray-300 rounded flex items-center justify-center gap-2 font-bold">
                                            <Eye size={16}/> 观察
                                        </button>
                                        <button onClick={() => onSneak(target)} className="flex-1 py-3 bg-[#1e293b] hover:bg-gray-700 border border-gray-700 text-gray-300 rounded flex items-center justify-center gap-2 font-bold">
                                            <Footprints size={16}/> 绕行
                                        </button>
                                    </div>
                                </>
                            )}

                            {target.type === 'item' && (
                                <>
                                    {source === 'world' ? (
                                        <button onClick={() => onPickup(target)} className="py-3 bg-yellow-900/20 hover:bg-yellow-800/40 border border-yellow-500/50 text-yellow-400 rounded flex items-center justify-center gap-2 transition-all font-bold">
                                            <Grab size={18}/> 拾取
                                        </button>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => onUse(target)} className="py-3 bg-green-900/20 hover:bg-green-800/40 border border-green-500/50 text-green-400 rounded flex items-center justify-center gap-2 transition-all font-bold">
                                                <Zap size={18}/> 使用
                                            </button>
                                            <button onClick={() => onDrop()} className="py-3 bg-red-900/20 hover:bg-red-800/40 border border-red-500/50 text-red-400 rounded flex items-center justify-center gap-2 transition-all font-bold">
                                                <Trash2 size={18}/> 丢弃
                                            </button>
                                        </div>
                                    )}
                                    <button onClick={() => onObserveItem(target)} className="py-3 bg-[#1e293b] hover:bg-gray-700 border border-gray-700 text-gray-300 rounded flex items-center justify-center gap-2 font-bold">
                                        <Eye size={18}/> 查看详情
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {view === 'quest_list' && renderQuestList()}
                    {view === 'quest_detail' && renderQuestDetail()}

                </div>
            </div>
        </div>
    );
};

export default InteractionOverlay;
