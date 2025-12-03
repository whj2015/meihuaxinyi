
import React, { useState } from 'react';
import { PlayerStats, Quest, Item } from '../types';
import QuestCard from './QuestCard';
import QuestDetailModal from './modals/QuestDetailModal';
import { User, Coins, Zap, Star, X, Shield } from 'lucide-react';

interface SidebarProps {
  stats: PlayerStats;
  quests: Quest[];
  onItemClick?: (item: Item) => void;
  onClose?: () => void; // New prop for mobile
}

const Sidebar: React.FC<SidebarProps> = ({ stats, quests, onItemClick, onClose }) => {
  const activeQuests = quests.filter(q => q.status !== 'turned_in');
  const [activeTab, setActiveTab] = useState<'status' | 'quests'>('status');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const renderStars = (count: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={10} 
        className={i < count ? "fill-gray-200 text-gray-200" : "text-gray-700"} 
      />
    ));
  };

  // Helper for equipment slot
  const renderSidebarEquipSlot = (label: string, item?: Item) => (
      <div className="bg-[#0f172a] p-2 rounded border border-gray-800 flex flex-col items-center justify-center gap-1 h-20 text-center relative group">
          <span className="text-[9px] text-gray-600 uppercase absolute top-1 left-1">{label}</span>
          {item ? (
              <>
                  <div className="text-xl">{item.icon || '🛡️'}</div>
                  <span className="text-[10px] text-teal-300 truncate w-full px-1">{item.name}</span>
                  {/* Tooltip */}
                  <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-black/90 text-white text-[10px] p-2 rounded whitespace-nowrap pointer-events-none z-50 border border-gray-700">
                      {item.name}
                      <div className="text-gray-400">{item.effect}</div>
                  </div>
              </>
          ) : (
               <span className="text-gray-700 text-xs">-</span>
          )}
      </div>
  );

  return (
    <>
    {selectedQuest && <QuestDetailModal quest={selectedQuest} onClose={() => setSelectedQuest(null)} />}
    
    <div className="h-full flex flex-col border border-teal-500/30 rounded-lg bg-[#0B1120] neon-border overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)] relative">
      
      {/* Mobile Close Button */}
      {onClose && (
        <button 
            onClick={onClose}
            className="absolute top-3 right-3 z-20 text-gray-400 hover:text-white p-1 bg-black/50 rounded-full md:hidden"
        >
            <X size={20} />
        </button>
      )}

      {/* Header */}
      <div className="p-4 border-b border-teal-500/20 flex items-center gap-2 bg-[#080c14] shrink-0">
        <User size={18} className="text-yellow-400" />
        <span className="font-bold text-yellow-400 font-['Noto_Sans_SC'] tracking-wider">玩家数据 (Player Data)</span>
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-2 bg-[#080c14] border-b border-teal-500/10 shrink-0">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all font-['Noto_Sans_SC'] tracking-widest ${
            activeTab === 'status'
              ? 'bg-teal-600 text-white shadow-[0_0_10px_rgba(20,184,166,0.4)]'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          状态
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all font-['Noto_Sans_SC'] tracking-widest ${
            activeTab === 'quests'
              ? 'bg-teal-600 text-white shadow-[0_0_10px_rgba(20,184,166,0.4)]'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          任务
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'quests' && (
          <div className="space-y-3">
            {activeQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onClick={() => setSelectedQuest(quest)} />
            ))}
            {activeQuests.length === 0 && (
              <div className="text-center text-gray-500 py-10 font-['Noto_Sans_SC'] text-sm">
                {quests.some(q => q.status === 'turned_in') 
                    ? "当前无进行中的任务" 
                    : "暂无任务"}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'status' && (
          <div className="space-y-6 font-['Noto_Sans_SC']">
             {/* Main Stats Block */}
             <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                   <span className="text-teal-200 font-bold text-sm">等级: <span className="text-white ml-2 text-lg font-mono">Lv.{stats.level}</span></span>
                   <span className="text-yellow-400 flex items-center gap-1 text-sm font-mono"><Coins size={14}/> {stats.gold} <span className="w-4 h-4 rounded-full bg-yellow-500/20 text-[8px] flex items-center justify-center border border-yellow-500 text-yellow-500 ml-1">金</span></span>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs text-gray-400">
                    <div className="flex justify-between items-center border-b border-gray-800/50 pb-1">
                        <span>生命值:</span>
                        <span className="text-green-400 font-mono font-bold text-sm">{stats.hp} / {stats.maxHp}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-800/50 pb-1">
                        <span>灵气值:</span>
                        <span className="text-cyan-400 font-mono font-bold text-sm">{stats.mp} / {stats.maxMp}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-800/50 pb-1">
                        <span>攻击力:</span>
                        <span className="text-gray-200 font-mono font-bold text-sm">{stats.attack}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-800/50 pb-1">
                        <span>防御力:</span>
                        <span className="text-gray-200 font-mono font-bold text-sm">{stats.defense}</span>
                    </div>
                     <div className="flex justify-between items-center border-b border-gray-800/50 pb-1">
                        <span>速度:</span>
                        <span className="text-blue-400 font-mono font-bold text-sm">{stats.speed}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-800/50 pb-1">
                        <span>声望:</span>
                        <span className="text-purple-400 font-mono font-bold text-sm">{stats.reputation}</span>
                    </div>
                     <div className="flex justify-between items-center border-b border-gray-800/50 pb-1 col-span-2">
                        <span>元素属性:</span>
                        <span className="text-teal-400 font-bold text-sm border border-teal-500/30 px-2 rounded bg-teal-900/20">{stats.element}</span>
                    </div>
                </div>

                {/* Bars */}
                <div className="space-y-4 mt-4">
                    {/* HP Bar */}
                    <div>
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                             <span>HP</span>
                             <span>{Math.round((stats.hp / stats.maxHp) * 100)}%</span>
                        </div>
                        <div className="relative h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                             <div className="absolute inset-0 bg-red-900/30"></div>
                            <div className="bg-gradient-to-r from-red-600 to-rose-500 h-full transition-all duration-500" style={{width: `${(stats.hp / stats.maxHp) * 100}%`}}></div>
                        </div>
                    </div>
                    
                    {/* EXP Bar */}
                    <div>
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                             <span>EXP</span>
                             <span className="text-yellow-500 font-mono">{stats.exp} / {stats.maxExp}</span>
                        </div>
                        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                             <div className="absolute inset-0 bg-yellow-900/30"></div>
                            <div className="bg-gradient-to-r from-yellow-600 to-amber-500 h-full transition-all duration-500" style={{width: `${Math.min(100, (stats.exp / stats.maxExp) * 100)}%`}}></div>
                        </div>
                    </div>
                </div>

                 {/* Equipment Section */}
                 <div className="mt-4 pt-4 border-t border-gray-800">
                      <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2"><Shield size={12}/> 当前装备 / Equipment</h4>
                      <div className="grid grid-cols-3 gap-2">
                          {renderSidebarEquipSlot('武器', stats.equipment?.weapon)}
                          {renderSidebarEquipSlot('护甲', stats.equipment?.armor)}
                          {renderSidebarEquipSlot('饰品', stats.equipment?.accessory)}
                      </div>
                 </div>
             </div>

             {/* Pet Card Section */}
             {stats.pet ? (
                 <div className="mt-6 pt-4 border-t border-dashed border-gray-700">
                     <div className="flex items-center gap-2 mb-3">
                        <span className="bg-[#0f172a] text-teal-300 px-3 py-1 rounded-full text-xs font-bold border border-teal-500/50 flex items-center gap-1 shadow-[0_0_10px_rgba(20,184,166,0.2)]">
                            <Zap size={12} className="fill-teal-300" /> 携带幻兽
                        </span>
                     </div>
                     
                     <div className="bg-[#0f172a] p-4 rounded-lg border border-teal-500/30 relative overflow-hidden group">
                        {/* Decorative Background */}
                        <div className="absolute -right-4 -bottom-4 text-teal-900/10 text-9xl select-none pointer-events-none">🐉</div>
                        
                        <div className="flex gap-4 mb-4 relative z-10">
                            {/* Pet Icon/Avatar */}
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center border border-teal-700/50 text-yellow-500 shadow-lg shrink-0">
                                <span className="text-4xl filter drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">🐉</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-yellow-400 font-bold text-lg leading-tight mb-1 truncate">{stats.pet.name}</h4>
                                <div className="text-xs text-gray-400 mb-1.5">{stats.pet.title}</div>
                                <div className="flex gap-0.5">{renderStars(stats.pet.stars)}</div>
                            </div>
                        </div>

                        {/* Pet Stats */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4 relative z-10 border-t border-gray-800 pt-3">
                             <div className="flex justify-between"><span className="text-gray-500">HP:</span> <span className="text-gray-300 font-mono font-bold">{stats.pet.hp}/{stats.pet.maxHp}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500">攻击:</span> <span className="text-gray-300 font-mono font-bold">{stats.pet.attack}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500">防御:</span> <span className="text-gray-300 font-mono font-bold">{stats.pet.defense}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500">忠诚度:</span> <span className="text-green-400 font-mono font-bold">{stats.pet.loyalty}%</span></div>
                        </div>
                        
                        {/* Skills */}
                        <div className="grid grid-cols-2 gap-2 relative z-10">
                            {stats.pet.skills.map((skill, idx) => (
                                <div key={idx} className="bg-teal-900/30 border border-teal-500/30 text-teal-300 text-[10px] text-center py-1.5 px-1 rounded hover:bg-teal-800/50 hover:border-teal-400/50 cursor-help transition-all truncate">
                                    {skill}
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>
             ) : (
                 <div className="mt-6 pt-6 border-t border-dashed border-gray-800 text-center">
                    <div className="w-12 h-12 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-2 text-gray-600">
                        <Zap size={20} />
                    </div>
                    <p className="text-xs text-gray-500">尚未契约任何幻兽</p>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Sidebar;
