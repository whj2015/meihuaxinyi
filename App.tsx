
import React, { useState } from 'react';
import { Menu, MapPin, ShieldAlert, Sparkles } from 'lucide-react'; 
import Sidebar from './components/Sidebar';
import SettingsModal from './components/modals/SettingsModal';
import SaveLoadModal from './components/modals/SaveLoadModal';
import CombatOverlay from './components/overlays/CombatOverlay';
import InteractionOverlay from './components/overlays/InteractionOverlay';
import PetListOverlay from './components/overlays/PetListOverlay';
import AchievementOverlay from './components/overlays/AchievementOverlay';
import CharacterModal from './components/modals/CharacterModal';
import InventoryModal from './components/modals/InventoryModal';
import LogViewer from './components/game/LogViewer';
import EntityGrid from './components/game/EntityGrid';
import ActionPanel from './components/game/ActionPanel';
import { useGame } from './hooks/useGame';
import { ActionCategory, Entity, LocationData } from './types';

const App: React.FC = () => {
  const {
    logs, isLoading, stats, quests, entities, initialized, streamText,
    showSettings, setShowSettings, showSaveModal, setShowSaveModal, showPetList, setShowPetList, 
    showAchievementModal, setShowAchievementModal,
    showCharacterModal, setShowCharacterModal, showInventoryModal, setShowInventoryModal,
    aiConfig, setAiConfig,
    combatTarget, combatState, combatLog, combatEndingRef, combatResult, lastAction,
    interactionTarget, interactionSource, knownLocations,
    worldRegistry, // Grab registry to find exits
    handleSend, handleSaveSettings,
    handleQuickSave, handleQuickLoad, handleExportSave, handleImportSave,
    handleEntityClick, handleInventoryItemClick, closeInteraction,
    handlePickup, handleDropItem, handleUseItem, startCombatFromOverlay, handleObserveItem, handleObserveMonster,
    closeCombat, handlePlayerAttack, handlePlayerSkill, handlePlayerDefend, handleContract, handlePlayerEscape,
    handlePetAttack, handlePetSkill, handlePetDefend,
    handleSwitchPet, handleRecallPet, handleEnhancePet, handleReleasePet,
    equipTitle, equipItem, unequipItem
  } = useGame();

  const [activeActionCategory, setActiveActionCategory] = useState<ActionCategory>('explore');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false); // Mobile Drawer State

  // Get current location data for exits
  const currentLocationData = worldRegistry[stats.locationId] || Object.values(worldRegistry).find((l: LocationData) => l.name === stats.location);

  return (
    // Fixed inset-0 for app-like experience on mobile (no scrolling the body)
    <div className="fixed inset-0 bg-[#050b14] flex flex-col font-['Noto_Sans_SC'] selection:bg-teal-500/30 overflow-hidden">
      
      <SettingsModal 
         isOpen={showSettings} onClose={() => setShowSettings(false)} config={aiConfig} setConfig={setAiConfig} onSave={handleSaveSettings} initialized={initialized}
      />
      <SaveLoadModal 
         isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} stats={stats} onQuickSave={handleQuickSave} onQuickLoad={handleQuickLoad} onExportSave={handleExportSave} onImportSave={handleImportSave} initialized={initialized}
      />
      {showPetList && (
          <PetListOverlay 
             ownedPets={stats.ownedPets || []} 
             activePet={stats.pet} 
             onClose={() => setShowPetList(false)} 
             onSummon={handleSwitchPet} 
             onRecall={handleRecallPet}
             onEnhance={handleEnhancePet} 
             onRelease={handleReleasePet}
          />
      )}
      {showAchievementModal && (
          <AchievementOverlay achievements={stats.achievements || []} unlockedTitles={stats.unlockedTitles || []} activeTitle={stats.activeTitle} onClose={() => setShowAchievementModal(false)} onEquipTitle={equipTitle} />
      )}
      {showCharacterModal && (
          <CharacterModal stats={stats} onClose={() => setShowCharacterModal(false)} onUnequip={unequipItem} />
      )}
      {showInventoryModal && (
          <InventoryModal inventory={stats.inventory} onClose={() => setShowInventoryModal(false)} onUse={handleUseItem} onEquip={equipItem} onDrop={handleDropItem} />
      )}

      {combatTarget && (
        <CombatOverlay 
            combatTarget={combatTarget} 
            combatState={combatState} 
            stats={stats} 
            combatLog={combatLog} 
            onClose={closeCombat} 
            onAttack={handlePlayerAttack} 
            onSkill={handlePlayerSkill} 
            onDefend={handlePlayerDefend} 
            onContract={handleContract} 
            onEscape={handlePlayerEscape} 
            onPetAttack={handlePetAttack} 
            onPetSkill={handlePetSkill} 
            onPetDefend={handlePetDefend} 
            combatEnding={combatEndingRef.current}
            combatResult={combatResult}
            lastAction={lastAction}
        />
      )}

      {interactionTarget && (
        <InteractionOverlay 
            target={interactionTarget} source={interactionSource} onClose={closeInteraction} quests={quests}
            onUse={(e: Entity) => { handleSend(`使用物品 ${e.name}`); closeInteraction(); }} 
            onDrop={() => handleDropItem()} 
            onPickup={handlePickup} 
            onObserveItem={handleObserveItem} 
            onFight={startCombatFromOverlay} 
            onObserveMonster={handleObserveMonster} 
            onSneak={(e: Entity) => { handleSend(`尝试绕过 ${e.name}`); closeInteraction(); }} 
            onTalk={(e: Entity) => { handleSend(`与 ${e.name} 交谈`); }} 
            onTrade={(e: Entity) => { handleSend(`与 ${e.name} 交易`); closeInteraction(); }} 
            onAcceptQuest={(qid) => { handleSend(`accept_quest ${qid}`); }} 
            onSubmitQuest={(qid) => { handleSend(`submit_quest ${qid}`); }} 
            onObserveNpc={(e: Entity) => { handleSend(`观察 ${e.name}`); closeInteraction(); }}
        />
      )}

      {/* --- Main Layout --- */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto relative min-h-0">
        
        {/* Header */}
        <header className="shrink-0 p-2 md:p-3 text-center relative border-b border-teal-900/30 bg-[#050b14] z-20 flex items-center justify-between">
            {/* Left Spacer or Logo */}
            <div className="w-10 md:w-0"></div>

            <div className="flex flex-col items-center">
                <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-200 neon-text tracking-widest font-['Noto_Sans_SC']" style={{ textShadow: '0 0 20px rgba(20,184,166,0.5)'}}>
                    幻兽战记
                </h1>
                <div className="flex justify-center items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono">OFFLINE MODE</span>
                    {stats.activeTitle && (
                        <span className="text-[9px] bg-blue-900/50 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-bold">
                            [{stats.activeTitle.name}]
                        </span>
                    )}
                </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
                onClick={() => setShowMobileSidebar(true)}
                className="lg:hidden text-teal-500 p-2 hover:bg-teal-900/20 rounded"
            >
                <Menu size={24} />
            </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0 relative">
          
          {/* Main Game Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0B1120] lg:border-r border-teal-500/30 relative">
            
            {/* Location Header (New) */}
            <div className="w-full bg-[#0f172a] border-b border-teal-500/30 p-4 relative overflow-hidden shrink-0">
                 {/* Decorative background element */}
                 <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-teal-900/10 to-transparent pointer-events-none"></div>
                 <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                    <MapPin size={120} />
                 </div>
                 
                 <div className="relative z-10 flex flex-col">
                     <div className="flex items-end gap-3 mb-2">
                         <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400 font-['Noto_Sans_SC'] shadow-black drop-shadow-lg leading-none">
                             {stats.location}
                         </h2>
                         {currentLocationData?.dangerLevel && (
                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 border border-red-500/30 rounded backdrop-blur-sm self-center">
                                 <ShieldAlert size={12} className="text-red-500" />
                                 <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                     {currentLocationData.dangerLevel}
                                 </span>
                             </div>
                         )}
                     </div>
                     <div className="flex items-start gap-2">
                        <Sparkles size={12} className="text-teal-500/60 mt-0.5 shrink-0"/>
                        <p className="text-xs text-gray-400 max-w-2xl line-clamp-2">
                            {currentLocationData?.description || "区域信息加载中..."}
                        </p>
                     </div>
                 </div>
            </div>

            {/* Entity Grid */}
            <div className="p-2 border-b border-teal-500/10 bg-[#0f172a]/50">
               <EntityGrid entities={entities} onEntityClick={handleEntityClick} />
            </div>

            {/* Logs */}
            <LogViewer logs={logs} isLoading={isLoading} streamText={streamText} />

            {/* Actions (Now contains Map) */}
            <ActionPanel 
                activeCategory={activeActionCategory} setActiveCategory={setActiveActionCategory} onAction={handleSend} onShowSettings={() => setShowSettings(true)} 
                currentExits={currentLocationData?.visibleExits} 
                currentLocation={stats.location} 
                isLoading={isLoading} 
                worldRegistry={worldRegistry}
                currentLocationId={currentLocationData?.id || stats.locationId}
                onOpenPetList={() => setShowPetList(true)} onQuickSummon={() => setShowPetList(true)}
                onOpenAchievements={() => setShowAchievementModal(true)}
                onOpenCharacter={() => setShowCharacterModal(true)}
                onOpenInventory={() => setShowInventoryModal(true)}
            />
          </div>

          {/* Desktop Sidebar (Visible on Large Screens) */}
          <div className="hidden lg:block w-80 bg-[#050b14] border-l border-teal-500/20 p-4 overflow-y-auto custom-scrollbar">
            <Sidebar stats={stats} quests={quests} onItemClick={handleInventoryItemClick} />
          </div>

          {/* Mobile Sidebar Overlay (Drawer) */}
          {showMobileSidebar && (
              <div className="fixed inset-0 z-40 lg:hidden">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowMobileSidebar(false)}></div>
                  <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[80%] bg-[#0B1120] border-l border-teal-500/30 shadow-2xl animate-slide-in-right">
                      <Sidebar stats={stats} quests={quests} onItemClick={(item) => { handleInventoryItemClick(item); setShowMobileSidebar(false); }} onClose={() => setShowMobileSidebar(false)} />
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default App;
