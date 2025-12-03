
import React from 'react';
import { Quest, QuestType } from '../types';
import { CheckCircle } from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  onClick?: () => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onClick }) => {
  const getBadgeColor = (type: QuestType) => {
    switch (type) {
      case QuestType.MAIN: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case QuestType.SIDE: return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case QuestType.DAILY: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case QuestType.CHALLENGE: return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getBadgeLabel = (type: QuestType) => {
    switch (type) {
      case QuestType.MAIN: return '主线';
      case QuestType.SIDE: return '支线';
      case QuestType.DAILY: return '日常';
      case QuestType.CHALLENGE: return '挑战';
      default: return '任务';
    }
  };

  // Determine if ready to submit
  const isReadyToSubmit = quest.status === 'active' && quest.objectives.every(o => o.current >= o.count);
  
  // Dynamically calculate progress sum to ensure display is sync'd with objectives
  const currentSum = quest.objectives.reduce((acc, o) => acc + o.current, 0);
  const totalSum = quest.objectives.reduce((acc, o) => acc + o.count, 0);
  
  const displayCurrent = currentSum;
  const displayMax = Math.max(quest.maxProgress, totalSum);

  const percentage = Math.min(100, Math.round((displayCurrent / displayMax) * 100));

  return (
    <div 
      onClick={onClick}
      className={`bg-[#121b29] border p-4 rounded-lg transition-colors font-['Noto_Sans_SC'] shadow-sm relative overflow-hidden group cursor-pointer ${isReadyToSubmit ? 'border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'border-teal-500/10 hover:border-teal-500/30 hover:bg-[#1a2333]'}`}
    >
      
      {/* Background glow effect */}
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-10 translate-x-10 transition-all ${isReadyToSubmit ? 'bg-green-500/10' : 'bg-teal-500/5 group-hover:bg-teal-500/10'}`}></div>

      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
              <span className={`self-start text-[10px] px-2 py-0.5 rounded border ${getBadgeColor(quest.type)} font-bold tracking-wider`}>
                {getBadgeLabel(quest.type)}
              </span>
              {isReadyToSubmit && (
                  <span className="text-[10px] bg-green-900/80 text-green-300 px-2 py-0.5 rounded font-bold border border-green-500/50 flex items-center gap-1 animate-pulse">
                      <CheckCircle size={10} /> 可提交
                  </span>
              )}
          </div>
          <h4 className={`font-bold text-sm ${quest.isComplete ? 'text-gray-400 line-through decoration-teal-500/50' : 'text-gray-100'}`}>
            {quest.title}
          </h4>
        </div>
        <span className={`font-mono text-sm font-bold ${isReadyToSubmit ? 'text-green-400' : 'text-yellow-500'}`}>
          {displayCurrent}/{displayMax}
        </span>
      </div>
      
      <p className="text-xs text-gray-500 mb-3 leading-relaxed relative z-10 line-clamp-2">{quest.description}</p>
      
      {/* Progress Bar Container */}
      <div className="relative z-10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-600">任务进度</span>
            <span className="text-[10px] text-gray-500 font-mono">{percentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${isReadyToSubmit ? 'bg-green-500' : 'bg-gradient-to-r from-teal-600 to-teal-400'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
      </div>
    </div>
  );
};

export default QuestCard;
