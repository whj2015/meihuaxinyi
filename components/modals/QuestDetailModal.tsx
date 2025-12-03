
import React from 'react';
import { X, CheckCircle, ScrollText, MapPin } from 'lucide-react';
import { Quest, QuestType } from '../../types';
import { getNpcDefinition, getQuestDefinition } from '../../services/geminiService';

interface QuestDetailModalProps {
    quest: Quest;
    onClose: () => void;
}

const QuestDetailModal: React.FC<QuestDetailModalProps> = ({ quest, onClose }) => {
    
    // Resolve NPC Names
    const giverName = quest.giverNpcId ? getNpcDefinition(quest.giverNpcId)?.name || '未知发布者' : '系统';
    const turnInName = quest.turnInNpcId ? getNpcDefinition(quest.turnInNpcId)?.name || '未知' : '自动提交';

    const getBadgeColor = (type: QuestType) => {
        switch (type) {
            case QuestType.MAIN: return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40';
            case QuestType.SIDE: return 'bg-teal-500/20 text-teal-400 border-teal-500/40';
            case QuestType.DAILY: return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
            case QuestType.CHALLENGE: return 'bg-red-500/20 text-red-500 border-red-500/40';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getBadgeLabel = (type: QuestType) => {
        switch (type) {
            case QuestType.MAIN: return '主线任务';
            case QuestType.SIDE: return '支线任务';
            case QuestType.DAILY: return '日常任务';
            case QuestType.CHALLENGE: return '挑战任务';
            default: return '任务';
        }
    };

    const isReadyToSubmit = quest.status === 'active' && quest.objectives.every(o => o.current >= o.count);

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center backdrop-blur-md animate-fade-in font-['Noto_Sans_SC'] p-4"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0f172a] border border-teal-500/30 rounded-xl w-full max-w-md shadow-[0_0_50px_rgba(20,184,166,0.2)] flex flex-col relative overflow-hidden"
            >
                
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-20 hover:bg-white/10 p-1 rounded-full"><X size={20}/></button>
                
                {/* Header */}
                <div className="p-6 bg-[#0B1120] border-b border-teal-500/20 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded border font-bold tracking-wider ${getBadgeColor(quest.type)}`}>
                            {getBadgeLabel(quest.type)}
                        </span>
                        {isReadyToSubmit && (
                            <span className="text-xs bg-green-900/80 text-green-300 px-2 py-0.5 rounded font-bold border border-green-500/50 flex items-center gap-1 animate-pulse">
                                <CheckCircle size={12} /> 可提交
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-white leading-tight">{quest.title}</h2>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* Description */}
                    <div className="bg-gray-900/50 p-4 rounded border border-gray-800 text-sm text-gray-300 leading-relaxed font-serif italic relative">
                         <span className="absolute -top-3 left-3 bg-[#0f172a] px-2 text-xs text-gray-500">委托内容</span>
                         {quest.description}
                    </div>

                    {/* NPC Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#1e293b] p-3 rounded border border-gray-700 flex flex-col gap-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <MapPin size={10}/> 发布者 (From)
                            </span>
                            <span className="text-sm font-bold text-teal-200">{giverName}</span>
                        </div>
                        <div className="bg-[#1e293b] p-3 rounded border border-gray-700 flex flex-col gap-1">
                             <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle size={10}/> 提交给 (To)
                            </span>
                            <span className="text-sm font-bold text-yellow-200">{turnInName}</span>
                        </div>
                    </div>

                    {/* Objectives */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <ScrollText size={14}/> 任务目标
                        </h4>
                        <div className="space-y-2">
                             {quest.objectives.map((obj, i) => (
                                 <div key={i} className="flex justify-between items-center text-sm bg-[#1e293b] p-3 rounded border border-gray-800">
                                     <span className="text-gray-300 flex items-center gap-2">
                                         <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                         {obj.type === 'kill' && '击败'}
                                         {obj.type === 'collect' && '收集'}
                                         {obj.type === 'talk' && '交谈'}
                                         {' '}<span className="font-bold text-white">{obj.targetName}</span>
                                     </span>
                                     <span className={`font-mono font-bold ${obj.current >= obj.count ? 'text-green-400' : 'text-gray-500'}`}>
                                         {obj.current}/{obj.count}
                                     </span>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Rewards */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">任务奖励</h4>
                        <div className="flex flex-wrap gap-2 text-xs">
                             {quest.rewards.exp && <span className="bg-blue-900/30 text-blue-300 px-3 py-1.5 rounded border border-blue-500/20 font-bold">EXP +{quest.rewards.exp}</span>}
                             {quest.rewards.gold && <span className="bg-yellow-900/30 text-yellow-300 px-3 py-1.5 rounded border border-yellow-500/20 font-bold">Gold +{quest.rewards.gold}</span>}
                             {quest.rewards.items?.map((item, i) => (
                                 <span key={i} className="bg-purple-900/30 text-purple-300 px-3 py-1.5 rounded border border-purple-500/20 font-bold">
                                     {getQuestDefinition(quest.id)?.rewards.items?.[i]?.itemId ? (
                                         `物品: ${item.itemId} x${item.count}`
                                     ) : '未知物品'}
                                 </span>
                             ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default QuestDetailModal;
