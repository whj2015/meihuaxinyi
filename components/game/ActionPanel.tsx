
import React from 'react';
import { Terminal, Compass, Zap, Settings, Cpu, Trophy, User, Package, HelpCircle, Save, Scan, Eye, Tent } from 'lucide-react';
import { ActionCategory, QuickAction, LocationExit, LocationData } from '../../types';
import LocationMap from './LocationMap'; // Import the map component

interface ActionPanelProps {
    activeCategory: ActionCategory;
    setActiveCategory: (category: ActionCategory) => void;
    onAction: (command: string) => void;
    onShowSettings: () => void;
    currentExits?: LocationExit[]; 
    currentLocation: string;
    currentLocationId?: string;
    worldRegistry?: Record<string, LocationData>;
    isLoading: boolean;
    onOpenPetList: () => void;
    onQuickSummon: () => void;
    onOpenAchievements: () => void;
    onOpenCharacter: () => void;
    onOpenInventory: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ 
    activeCategory, setActiveCategory, onAction, onShowSettings, currentExits, currentLocation, isLoading,
    worldRegistry, currentLocationId,
    onOpenPetList, onQuickSummon, onOpenAchievements, onOpenCharacter, onOpenInventory
}) => {
    
    // Quick Actions Configuration
    const getQuickActions = (): Record<string, { label: string, actions: QuickAction[], icon: React.ReactNode }> => {
        return {
          explore: {
            label: '探索', icon: <Compass size={14}/>,
            actions: [
                { label: '探索区域', command: '探索', icon: <Scan size={16}/> },
                // Removed Observe and Rest as requested
            ]
          },
          character: {
              label: '角色', icon: <User size={14}/>,
              actions: [] // Direct Open
          },
          inventory: {
              label: '背包', icon: <Package size={14}/>,
              actions: [] // Direct Open
          },
          pet: {
            label: '幻兽', icon: <Zap size={14}/>,
            actions: [] // Empty as it triggers modal directly
          },
          achievement: {
            label: '成就', icon: <Trophy size={14}/>,
            actions: [] // Empty as it triggers modal directly
          },
          system: {
            label: '系统', icon: <Settings size={14}/>,
            actions: [
              { label: '存档/读取', command: 'save_menu', icon: <Save size={16}/> },
              { label: '帮助', command: 'help', icon: <HelpCircle size={16}/> }
            ]
          }
        };
      };

    const quickActionsData = getQuickActions();
    const currentCategoryKey = activeCategory === 'status' ? 'explore' : activeCategory;

    return (
        <div className="bg-[#0f172a] border-t border-teal-500/30 flex flex-col h-[230px] md:h-[250px] shrink-0 safe-area-pb transition-all">
               {/* Tab Bar */}
               <div className="flex items-center justify-between bg-[#080c14] border-b border-teal-500/10 px-2">
                  <span className="text-[10px] font-bold text-teal-600 px-2 flex items-center gap-1 uppercase tracking-wider py-2">
                      <Terminal size={12}/> 指令
                  </span>
                  <div className="flex gap-1 overflow-x-auto custom-scrollbar no-scrollbar">
                    {Object.keys(quickActionsData).map((key) => {
                      const k = key as ActionCategory;
                      return (
                      <button
                        key={k}
                        onClick={() => {
                            if (k === 'pet') {
                                onOpenPetList();
                            } else if (k === 'achievement') {
                                onOpenAchievements();
                            } else if (k === 'character') {
                                onOpenCharacter();
                            } else if (k === 'inventory') {
                                onOpenInventory();
                            } else {
                                setActiveCategory(k);
                            }
                        }}
                        className={`
                          flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2
                          ${currentCategoryKey === k ? 'bg-[#1e293b] text-teal-300 border-teal-500' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1e293b]/50 border-transparent'}
                        `}
                      >
                        {quickActionsData[k].icon}
                        <span className="hidden md:inline">{quickActionsData[k].label}</span>
                      </button>
                    )})}
                  </div>
               </div>

               {/* Content Area */}
               <div className="flex-1 bg-[#0f172a] overflow-hidden relative">
                  
                  {/* EXPLORE MODE: Map Only */}
                  {currentCategoryKey === 'explore' ? (
                      <div className="w-full h-full p-2">
                          <LocationMap 
                              exits={currentExits || []}
                              currentLocationName={currentLocation}
                              currentLocationId={currentLocationId}
                              worldRegistry={worldRegistry}
                              onMove={onAction}
                              onExplore={() => onAction('探索')}
                          />
                      </div>
                  ) : (
                      /* OTHER MODES: Show Grid */
                      <div className="p-2 md:p-4 grid grid-cols-3 md:grid-cols-5 gap-2 h-full overflow-y-auto custom-scrollbar content-start">
                          {quickActionsData[currentCategoryKey]?.actions.map((action, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => { if (action.action) action.action(); else if (action.command) onAction(action.command); }}
                                  disabled={isLoading}
                                  className="relative overflow-hidden group flex flex-col items-center justify-center gap-1 p-2 h-12 md:h-14 bg-[#1e293b] hover:bg-teal-900/30 border border-gray-700 hover:border-teal-500/50 text-gray-300 hover:text-white rounded transition-all shadow-md active:scale-95"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  {action.icon && <div className="text-gray-400 group-hover:text-teal-400 transition-colors">{action.icon}</div>}
                                  <span className="text-xs font-bold relative z-10 truncate w-full text-center px-1">
                                      {action.label}
                                  </span>
                                </button>
                          ))}
                          
                          {currentCategoryKey === 'system' && (
                             <button onClick={onShowSettings} className="relative overflow-hidden group flex flex-col items-center justify-center gap-1 p-2 h-12 md:h-14 bg-teal-900/20 hover:bg-teal-900/30 border border-teal-700/50 hover:border-teal-400 text-teal-300 hover:text-white rounded transition-all shadow-md active:scale-95">
                              <Cpu size={16} className="mb-1" /><span className="text-xs font-bold relative z-10 truncate w-full text-center">系统设置</span>
                            </button>
                          )}
                      </div>
                  )}
               </div>
        </div>
    );
};
export default ActionPanel;
