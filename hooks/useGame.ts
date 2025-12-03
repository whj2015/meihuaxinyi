
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerStats, Quest, LogEntry, Entity, AISettings, SaveData, Item, CombatState, GameTurnResponse, Pet, Achievement, Title, LocationData, ItemType } from '../types';
import { initializeGame, sendCommand, updateGameConfig, getGameConfig, generateLocationDetails, instantiateEntity } from '../services/geminiService';
import { INITIAL_STATS, TITLE_REGISTRY, DEFAULT_ACHIEVEMENTS } from '../data/player';

// --- Sub-Hook: Player & Inventory Management ---
const usePlayer = (addLog: (text: string, type: LogEntry['type']) => void) => {
    const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
    
    // Check for achievements based on stats
    useEffect(() => {
        if (stats.gold >= 500) unlockAchievement('rich_man');
        if (stats.ownedPets.length > 0) unlockAchievement('pet_owner');
    }, [stats.gold, stats.ownedPets.length]);

    const unlockAchievement = (id: string) => {
        setStats(prev => {
            const achIndex = prev.achievements.findIndex(a => a.id === id);
            if (achIndex === -1 || prev.achievements[achIndex].isUnlocked) return prev;

            const newAch = [...prev.achievements];
            newAch[achIndex] = { ...newAch[achIndex], isUnlocked: true, unlockedAt: Date.now() };
            
            let newTitles = [...prev.unlockedTitles];
            const rewardTitleId = newAch[achIndex].rewardTitleId;
            if (rewardTitleId && TITLE_REGISTRY[rewardTitleId]) {
                newTitles.push(TITLE_REGISTRY[rewardTitleId]);
                addLog(`🏆 解锁成就: [${newAch[achIndex].name}]! 获得称号: [${TITLE_REGISTRY[rewardTitleId].name}]`, 'achievement');
            } else {
                addLog(`🏆 解锁成就: [${newAch[achIndex].name}]!`, 'achievement');
            }

            return { ...prev, achievements: newAch, unlockedTitles: newTitles };
        });
    };

    const equipTitle = (title: Title | undefined) => {
        setStats(prev => {
            let newStats = { ...prev };
            if (prev.activeTitle?.statBonus) {
                if (prev.activeTitle.statBonus.attack) newStats.attack -= prev.activeTitle.statBonus.attack;
                if (prev.activeTitle.statBonus.defense) newStats.defense -= prev.activeTitle.statBonus.defense;
            }
            if (title?.statBonus) {
                if (title.statBonus.attack) newStats.attack += title.statBonus.attack;
                if (title.statBonus.defense) newStats.defense += title.statBonus.defense;
            }
            return { ...newStats, activeTitle: title };
        });
        addLog(title ? `佩戴了称号: [${title.name}]` : `卸下了称号`, 'system');
    };

    const updateStats = (updates: Partial<PlayerStats> | undefined) => {
        if (!updates) return;
        setStats(prev => {
            // 1. Merge Updates
            const newHp = updates.hp === 999 ? prev.maxHp : (updates.hp !== undefined ? updates.hp : prev.hp);
            const newMp = updates.mp === 999 ? prev.maxMp : (updates.mp !== undefined ? updates.mp : prev.mp);

            let newState = {
                ...prev,
                ...updates,
                hp: newHp,
                mp: newMp,
                pet: updates.pet !== undefined ? updates.pet : prev.pet,
                ownedPets: updates.ownedPets || prev.ownedPets,
                inventory: updates.inventory || prev.inventory,
                equipment: updates.equipment || prev.equipment || {},
                achievements: prev.achievements, // Achievements handled separately
                unlockedTitles: prev.unlockedTitles,
                activeTitle: prev.activeTitle
            };
            
            // 2. Process Level Up
            let leveledUp = false;
            while (newState.exp >= newState.maxExp && newState.level < 100) {
                newState.exp -= newState.maxExp;
                newState.level++;
                leveledUp = true;
                
                // Stat Growth
                const hpGrowth = 20 + Math.floor(newState.level * 2);
                const mpGrowth = 10 + Math.floor(newState.level * 1);
                
                newState.maxHp += hpGrowth;
                newState.maxMp += mpGrowth;
                newState.attack += 5 + Math.floor(newState.level * 0.5);
                newState.defense += 2 + Math.floor(newState.level * 0.2);
                newState.speed += 1;
                
                // Full Heal on Level Up
                newState.hp = newState.maxHp;
                newState.mp = newState.maxMp;

                // Exp Curve
                newState.maxExp = Math.floor(newState.maxExp * 1.15);
            }

            if (leveledUp) {
                addLog(`✨ 恭喜！你升级到了 Lv.${newState.level}! (全状态恢复 / HP+${newState.maxHp - prev.maxHp} / ATK+${newState.attack - prev.attack})`, 'levelup');
            }

            return newState;
        });
    };
    
    const gainExp = (amount: number) => {
        setStats(prev => {
            let { exp, maxExp, level, maxHp, maxMp, attack, defense, speed } = prev;
            let newExp = exp + amount;
            let leveledUp = false;
            let currentHp = prev.hp;
            let currentMp = prev.mp;
            
            // Max level 100 for safety
            while (newExp >= maxExp && level < 100) {
                newExp -= maxExp;
                level++;
                leveledUp = true;
                
                // Stat Growth
                const hpGrow = 20 + Math.floor(level * 2);
                const mpGrow = 10 + Math.floor(level * 1);

                maxHp += hpGrow;
                maxMp += mpGrow;
                attack += 5 + Math.floor(level * 0.5);
                defense += 2 + Math.floor(level * 0.2);
                speed += 1;
                
                // Full Heal on Level Up
                currentHp = maxHp;
                currentMp = maxMp;
                
                // Exp Curve
                maxExp = Math.floor(maxExp * 1.15);
            }

            if (leveledUp) {
                addLog(`✨ 恭喜！你升级到了 Lv.${level}! (全状态恢复 / HP+${maxHp - prev.maxHp} / ATK+${attack - prev.attack})`, 'levelup');
                return { ...prev, exp: newExp, maxExp, level, maxHp, maxMp, hp: currentHp, mp: currentMp, attack, defense, speed };
            }
            
            return { ...prev, exp: newExp };
        });
    };

    const addToInventory = (newItem: Item) => {
        setStats(prev => {
            const existingIndex = prev.inventory.findIndex(i => i.id === newItem.id); // Use ID for match
            let newInventory = [...prev.inventory];
            if (existingIndex >= 0) {
                newInventory[existingIndex] = { ...newInventory[existingIndex], quantity: (newInventory[existingIndex].quantity || 1) + (newItem.quantity || 1) };
            } else {
                newInventory.push(newItem);
            }
            return { ...prev, inventory: newInventory };
        });
    };

    const removeFromInventory = (index: number) => {
        setStats(prev => {
            const newInventory = [...prev.inventory];
            newInventory.splice(index, 1);
            return { ...prev, inventory: newInventory };
        });
    };

    // --- Equipment Logic ---
    const calculateStatsWithEquip = (baseStats: PlayerStats, equipment: PlayerStats['equipment']) => {
        return baseStats; 
    };

    const equipItem = (item: Item) => {
        setStats(prev => {
            // Determine slot
            let slot: 'weapon' | 'armor' | 'accessory' = 'accessory';
            if (item.id.includes('sword') || item.id.includes('blade') || item.id.includes('staff')) slot = 'weapon';
            else if (item.id.includes('armor') || item.id.includes('robe')) slot = 'armor';
            
            // Override by item data if exists
            if (item.slot) slot = item.slot;

            const currentEquipped = prev.equipment[slot];
            let newInventory = [...prev.inventory];
            
            // Remove item from inventory (reduce quantity or remove)
            const itemIndex = newInventory.findIndex(i => i.id === item.id);
            if (itemIndex > -1) {
                if (newInventory[itemIndex].quantity > 1) {
                    newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: newInventory[itemIndex].quantity - 1 };
                } else {
                    newInventory.splice(itemIndex, 1);
                }
            }

            // If something was equipped, move it back to inventory
            if (currentEquipped) {
                const existingIdx = newInventory.findIndex(i => i.id === currentEquipped.id);
                if (existingIdx > -1) {
                    newInventory[existingIdx] = { ...newInventory[existingIdx], quantity: newInventory[existingIdx].quantity + 1 };
                } else {
                    newInventory.push(currentEquipped);
                }
            }

            // Apply Stat Changes (Simple parsing of effect string for demo)
            let newStats = { ...prev };
            
            // Remove old stats
            if (currentEquipped && currentEquipped.effect) {
                if (currentEquipped.effect.startsWith('atk_')) newStats.attack -= parseInt(currentEquipped.effect.split('_')[1]);
                if (currentEquipped.effect.startsWith('def_')) newStats.defense -= parseInt(currentEquipped.effect.split('_')[1]);
            }
            
            // Add new stats
            if (item.effect) {
                if (item.effect.startsWith('atk_')) newStats.attack += parseInt(item.effect.split('_')[1]);
                if (item.effect.startsWith('def_')) newStats.defense += parseInt(item.effect.split('_')[1]);
            }

            addLog(`装备了: ${item.name}`, 'system');

            const equippedInstance: Item = { ...item, quantity: 1 };

            return {
                ...newStats,
                inventory: newInventory,
                equipment: {
                    ...prev.equipment,
                    [slot]: equippedInstance
                }
            };
        });
    };

    const unequipItem = (slot: 'weapon' | 'armor' | 'accessory') => {
        setStats(prev => {
            const item = prev.equipment[slot];
            if (!item) return prev;

            let newInventory = [...prev.inventory];
            const existingIdx = newInventory.findIndex(i => i.id === item.id);
            if (existingIdx > -1) {
                newInventory[existingIdx] = { ...newInventory[existingIdx], quantity: newInventory[existingIdx].quantity + 1 };
            } else {
                newInventory.push(item);
            }

            // Remove stats
            let newStats = { ...prev };
            if (item.effect) {
                if (item.effect.startsWith('atk_')) newStats.attack -= parseInt(item.effect.split('_')[1]);
                if (item.effect.startsWith('def_')) newStats.defense -= parseInt(item.effect.split('_')[1]);
            }

            addLog(`卸下了: ${item.name}`, 'system');

            return {
                ...newStats,
                inventory: newInventory,
                equipment: {
                    ...prev.equipment,
                    [slot]: undefined
                }
            };
        });
    };

    return { stats, setStats, updateStats, addToInventory, removeFromInventory, unlockAchievement, equipTitle, gainExp, equipItem, unequipItem };
};

// --- Sub-Hook: World & Registry Management ---
const useWorld = (addLog: (text: string, type?: LogEntry['type']) => void) => {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [worldRegistry, setWorldRegistry] = useState<Record<string, LocationData>>({});
    const [knownLocations, setKnownLocations] = useState<string[]>(['起始之村']);
    const [quests, setQuests] = useState<Quest[]>([]);
    const slainEntityNamesRef = useRef<Set<string>>(new Set());

    const saveLocationState = (locationName: string) => {
        // Find by name or ID
        const key = Object.keys(worldRegistry).find(k => worldRegistry[k].name === locationName || k === locationName);
        if (!key || !worldRegistry[key]) return;

        setWorldRegistry(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                activeEntities: entities, 
                // Exits are updated by reference in `sendCommand` usually, but good to ensure sync
            }
        }));
    };

    const loadOrGenerateLocation = async (locationName: string, playerLevel: number): Promise<boolean> => {
        // Find if we have this location in registry (by Name or ID)
        const registryKey = Object.keys(worldRegistry).find(k => worldRegistry[k].name === locationName) || locationName;
        let currentLocData: LocationData;

        // Pass existing data if available to preserve discovery state (exits)
        const existing = worldRegistry[registryKey];

        if (existing) {
            // LOAD EXISTING (Regenerate transient entities if needed, but keep structure)
            addLog(`进入了 ${existing.name} (已探索)。`, 'system');
            currentLocData = await generateLocationDetails(existing.id, playerLevel, existing);
            addLog(`[记忆场景] ${currentLocData.description}`, 'narrative');
        } else {
            // GENERATE NEW
            addLog(`加载 ${locationName} 数据...`, 'system');
            try {
                currentLocData = await generateLocationDetails(locationName, playerLevel);
                addLog(`[新环境] ${currentLocData.description}`, 'narrative');
            } catch (e) {
                console.error("Gen Fail", e);
                return false;
            }
        }

        // Merge Quests
        if (currentLocData.availableQuests.length > 0) {
            // Only purely purely informative here, active quests are in player state
        }

        let finalEntities = [...(currentLocData.activeEntities || [])];
        setEntities(finalEntities);
        // Use ID as key if available
        const key = currentLocData.id || locationName;
        setWorldRegistry(prev => ({
            ...prev,
            [key]: { ...currentLocData, activeEntities: finalEntities }
        }));
        return true;
    };

    return { 
        entities, setEntities, 
        worldRegistry, setWorldRegistry, 
        knownLocations, setKnownLocations, 
        quests, setQuests, 
        slainEntityNamesRef, 
        saveLocationState, 
        loadOrGenerateLocation 
    };
};

// --- Main Hook ---
export const useGame = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [streamText, setStreamText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [aiConfig, setAiConfig] = useState<AISettings>({ provider: 'local', apiKey: 'offline', model: 'local' } as any);

  const [showSettings, setShowSettings] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPetList, setShowPetList] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  
  // New Modals State
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'narrative') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), text, type, timestamp: Date.now() }]);
  }, []);

  const { stats, setStats, updateStats, addToInventory, removeFromInventory, unlockAchievement, equipTitle, gainExp, equipItem, unequipItem } = usePlayer(addLog);
  const { entities, setEntities, worldRegistry, setWorldRegistry, knownLocations, setKnownLocations, quests, setQuests, slainEntityNamesRef, saveLocationState, loadOrGenerateLocation } = useWorld(addLog);

  // Combat & Interaction
  const [combatTarget, setCombatTarget] = useState<Entity | null>(null);
  const [combatLog, setCombatLog] = useState<string>(""); 
  const [combatState, setCombatState] = useState<CombatState>({ playerAp: 0, enemyAp: 0, petAp: 0, round: 1, isPlayerTurn: false, isPetTurn: false, localPlayerHp: 0, localPetHp: 0, localEnemyHp: 0, localEnemyMaxHp: 0 });
  const [combatResult, setCombatResult] = useState<{victory: boolean, items?: Entity[], exp?: number, capturedPet?: Pet} | null>(null); // For UI result screen

  const [interactionTarget, setInteractionTarget] = useState<Entity | null>(null);
  const [interactionSource, setInteractionSource] = useState<'world' | 'inventory'>('world');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);

  const combatTargetRef = useRef<Entity | null>(null);
  const interactionTargetRef = useRef<Entity | null>(null);
  const combatLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const combatEndingRef = useRef<boolean>(false);
  const initRan = useRef(false);

  // New Ref for Combat Feedback
  // State for last action to trigger animations in UI
  const [lastAction, setLastAction] = useState<{type: 'damage' | 'heal' | 'miss', value: number, target: 'player' | 'enemy' | 'pet'} | null>(null);

  const [forceLocGen, setForceLocGen] = useState(0);
  const forceLocGenRef = useRef(0);

  // --- Initialization ---
  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;
    startGame();
  }, []);

  // --- Location Change Effect ---
  const prevLocationRef = useRef<string>(stats.location);
  useEffect(() => {
      const handleLocationChange = async () => {
          if (stats.location !== prevLocationRef.current || forceLocGen !== forceLocGenRef.current) {
              if (stats.location !== prevLocationRef.current) {
                  // Save prev state if it exists in registry
                  saveLocationState(prevLocationRef.current);
              }
              setIsLoading(true);
              await loadOrGenerateLocation(stats.location, stats.level);
              prevLocationRef.current = stats.location;
              forceLocGenRef.current = forceLocGen;
              slainEntityNamesRef.current.clear();
              setIsLoading(false);
          }
      };
      if (initialized) {
          handleLocationChange();
      }
  }, [stats.location, forceLocGen, initialized]);

  // --- Combat Logic ---
  useEffect(() => {
    if (combatTarget && !combatLoopRef.current) {
        combatLoopRef.current = setInterval(() => {
            setCombatState(prev => {
                if (prev.isPlayerTurn || prev.isPetTurn || combatEndingRef.current) return prev;
                if (prev.localEnemyHp <= 0 || prev.localPlayerHp <= 0) return prev;
                let newPlayerAp = prev.playerAp + (stats.speed * 0.1); 
                let newEnemyAp = prev.enemyAp + ((combatTarget.speed || 10) * 0.1);
                let newPetAp = prev.petAp + (stats.pet ? (stats.pet.speed || 10) * 0.1 : 0);
                if (newPlayerAp > 100) newPlayerAp = 100;
                if (newEnemyAp > 100) newEnemyAp = 100;
                if (newPetAp > 100) newPetAp = 100;
                let newState = { ...prev, playerAp: newPlayerAp, enemyAp: newEnemyAp, petAp: newPetAp };
                if (newState.enemyAp >= 100) {
                     let targetIsPet = stats.pet && newState.localPetHp > 0 && Math.random() < 0.3;
                     const dmg = Math.max(1, Math.round((combatTarget.attack || 15) - (targetIsPet ? (stats.pet?.defense || 0) : stats.defense) + (Math.random() * 5)));
                     
                     // Feedback Trigger
                     setLastAction({ type: 'damage', value: dmg, target: targetIsPet ? 'pet' : 'player' });

                     if (targetIsPet) {
                         newState.localPetHp = Math.max(0, newState.localPetHp - dmg);
                         setCombatLog(l => `\n**${combatTarget.name}** 攻击了幻兽, 造成 **${dmg}** 伤害!`);
                     } else {
                         newState.localPlayerHp = Math.max(0, newState.localPlayerHp - dmg);
                         setCombatLog(l => `\n**${combatTarget.name}** 对你造成 **${dmg}** 伤害!`);
                     }
                     newState.enemyAp = 0;
                     if (newState.localPlayerHp <= 0 && !combatEndingRef.current) endCombat(false, combatTarget, 0);
                } 
                else if (newState.playerAp >= 100) newState.isPlayerTurn = true;
                else if (newState.petAp >= 100 && stats.pet && newState.localPetHp > 0) newState.isPetTurn = true;
                return newState;
            });
        }, 50);
    }
    return () => { if (combatLoopRef.current) { clearInterval(combatLoopRef.current); combatLoopRef.current = null; } };
  }, [combatTarget, stats.speed, stats.defense, stats.pet]);

  // --- Core Handlers ---
  const handleGameResponse = (data: GameTurnResponse) => {
    if (data.updatedStats && data.updatedStats.level && data.updatedStats.level > stats.level) addLog(`✨ 等级提升至 Lv.${data.updatedStats.level}!`, 'levelup');
    
    if (data.narrative) addLog(data.narrative, data.isCombat ? 'combat' : 'narrative');
    
    updateStats(data.updatedStats);
    
    // Update Quests
    if (data.updatedQuests) {
        setQuests(prev => {
            // Merge logic: replace existing quests with updated ones, add new ones
            const nextQuests = [...prev];
            data.updatedQuests.forEach(uq => {
                const idx = nextQuests.findIndex(q => q.id === uq.id);
                if (idx >= 0) nextQuests[idx] = uq;
                else nextQuests.push(uq);
            });
            return nextQuests;
        });
    }

    if (data.location && data.location !== stats.location) {
        setStats(prev => ({ ...prev, location: data.location, locationId: data.locationId }));
    } else {
        if (data.entities && data.entities.length > 0) {
             setEntities(prev => {
                const uniqueNew = data.entities.filter(ne => !prev.some(oe => oe.uid === ne.uid));
                return [...prev, ...uniqueNew];
             });
        }
    }
  };

  const startGame = async (config?: AISettings) => {
    if (initialized) return;
    setIsLoading(true);
    setStreamText("");
    try {
      const data = await initializeGame((text) => setStreamText(text));
      setStreamText(null);
      handleGameResponse(data);
      setInitialized(true);
      await loadOrGenerateLocation('起始之村', 1);
    } catch (e: any) {
      console.error(e);
      addLog(`游戏初始化失败: ${e.message}`, "system");
    } finally { setIsLoading(false); }
  };

  const handleSend = async (cmd: string) => {
    if (cmd === 'save_menu') { setShowSaveModal(true); return; }
    if (cmd === 'character_menu') { setShowCharacterModal(true); return; }
    if (cmd === 'inventory_menu') { setShowInventoryModal(true); return; }
    
    if (!combatTargetRef.current && !interactionTargetRef.current) addLog(`>> ${cmd}`, 'command');

    setIsLoading(true);
    setStreamText(""); 
    try {
      const currentLocationId = stats.locationId || Object.keys(worldRegistry).find(k => worldRegistry[k].name === stats.location) || 'village_start';
      const currentLocData = worldRegistry[currentLocationId];
      
      const data = await sendCommand(
          cmd, 
          { 
              existingNPCs: entities.filter(e => e.type === 'npc').map(n => n.name), 
              currentInventory: stats.inventory, 
              ownedPets: stats.ownedPets,
              locationContext: currentLocData,
              playerStats: stats,
              currentQuests: quests 
          },
          (text) => setStreamText(text)
      );
      setStreamText(null);
      handleGameResponse(data);
    } catch (error: any) {
      setStreamText(null);
      addLog(`指令错误: ${error?.message}`, "system");
    } finally { setIsLoading(false); }
  };

  // --- Interaction Logic ---
  const handlePickup = (itemEntity: Entity) => {
      // Use itemData from DB if available
      const newItem: Item = itemEntity.itemData || { 
          id: Math.random().toString(36), name: itemEntity.name, description: "Item", type: 'material', rarity: 'common', quantity: 1, icon: itemEntity.avatar 
      };
      addToInventory(newItem);
      if (itemEntity.uid) setEntities(prev => prev.filter(e => e.uid !== itemEntity.uid));
      else setEntities(prev => prev.filter(e => e.name !== itemEntity.name));
      addLog(`获得了: ${newItem.name} x${newItem.quantity}`, 'system');
      
      // Update Collect Quests via sendCommand simulation or direct check?
      setQuests(prev => prev.map(q => {
          if (q.status !== 'active') return q;
          let changed = false;
          const newObjectives = q.objectives.map(obj => {
                  if (obj.type === 'collect' && (obj.targetId === newItem.id || obj.targetName === newItem.name) && obj.current < obj.count) {
                      changed = true;
                      return { ...obj, current: obj.current + newItem.quantity };
                  }
                  return obj;
              });
              
              if (changed) {
                  // Recalculate total progress
                  const newCurrent = newObjectives.reduce((acc, o) => acc + o.current, 0);
                  return { ...q, objectives: newObjectives, currentProgress: newCurrent };
              }
              return q;
          }));

      setInteractionTarget(null);
      interactionTargetRef.current = null;
  };

  const handleDropItem = (item?: Item) => {
      // If item passed directly (from InventoryModal), find its index
      let targetItem = item;
      let index = -1;
      
      if (targetItem) {
          index = stats.inventory.findIndex(i => i.id === targetItem!.id);
      } else if (selectedItemIndex !== -1) {
          index = selectedItemIndex;
          targetItem = stats.inventory[index];
      }

      if (index === -1 || !targetItem) return;

      removeFromInventory(index);
      setEntities(prev => [...prev, { uid: `drop-${Date.now()}`, id: targetItem!.id, name: targetItem!.name, type: 'item', level: 1, status: 'Dropped', avatar: targetItem!.icon || '📦', description: targetItem!.description, itemData: targetItem }]);
      addLog(`丢弃了: ${targetItem.name}`, 'system');
      setInteractionTarget(null);
      interactionTargetRef.current = null;
      setSelectedItemIndex(-1);
  };

  const handleUseItem = (item: Item) => {
      handleSend(`使用物品 ${item.name}`);
      // Close modal if open? Optional.
  };

  const startCombatFromOverlay = (entity: Entity) => {
      if (stats.hp <= 0) {
          addLog("你已身负重伤，无法进行战斗！请回村或使用药水。", "system");
          setInteractionTarget(null);
          interactionTargetRef.current = null;
          return;
      }
      setInteractionTarget(null);
      interactionTargetRef.current = null;
      setCombatTarget(entity);
      combatTargetRef.current = entity;
      combatEndingRef.current = false;
      setCombatResult(null);
      setCombatLog(`遭遇了 ${entity.name}!`);
      setCombatState({ playerAp: 0, enemyAp: 0, petAp: 0, round: 1, isPlayerTurn: false, isPetTurn: false, localPlayerHp: stats.hp, localPetHp: stats.pet?.hp || 0, localEnemyHp: entity.hp || 100, localEnemyMaxHp: entity.maxHp || 100 });
      setLastAction(null);
  };

  // Combat Core Actions
  const updateCombatHp = (dmg: number, isPet: boolean) => {
      setCombatState(prev => {
          const newHp = Math.max(0, prev.localEnemyHp - dmg);
          setLastAction({ type: 'damage', value: dmg, target: 'enemy' });
          if (newHp <= 0 && !combatEndingRef.current) endCombat(true, combatTargetRef.current!, prev.localPlayerHp);
          return { ...prev, localEnemyHp: newHp, [isPet ? 'petAp' : 'playerAp']: 0, [isPet ? 'isPetTurn' : 'isPlayerTurn']: false };
      });
  };
  const handlePlayerAttack = () => {
       const dmg = Math.max(1, Math.round(stats.attack - (combatTargetRef.current!.defense || 0) + (Math.random() * 5)));
       setCombatLog(p => `\n你攻击造成 **${dmg}** 伤害!`);
       updateCombatHp(dmg, false);
  };
  const handlePlayerSkill = () => {
       const dmg = Math.max(1, Math.round((stats.attack * 1.5) - (combatTargetRef.current!.defense || 0)));
       setCombatLog(p => `\n技能暴击造成 **${dmg}** 伤害!`);
       updateCombatHp(dmg, false);
  };
  const handlePetAttack = () => {
       const dmg = Math.max(1, Math.round((stats.pet!.attack) - (combatTargetRef.current!.defense || 0) + (Math.random() * 5)));
       setCombatLog(p => `\n${stats.pet!.name} 攻击造成 **${dmg}** 伤害!`);
       updateCombatHp(dmg, true);
  };
  const handleContract = () => {
      const chance = (combatState.localEnemyHp/combatState.localEnemyMaxHp < 0.2) ? 0.6 : 0.15;
      setCombatLog(p => `\n尝试契约...`);
      setCombatState(p => ({ ...p, playerAp: 0, isPlayerTurn: false }));
      if (Math.random() < chance) {
          setTimeout(() => { if (!combatEndingRef.current) { setCombatLog(p => `\n✨ 契约成功!`); endCombat(true, combatTargetRef.current!, combatState.localPlayerHp, true); } }, 1000);
      } else {
          setTimeout(() => { if (!combatEndingRef.current) setCombatLog(p => `\n契约失败!`); }, 1000);
      }
  };
  const endCombat = (victory: boolean, target: Entity, remainingHp: number, isCapture: boolean = false) => {
      combatEndingRef.current = true;
      if (combatLoopRef.current) { clearInterval(combatLoopRef.current); combatLoopRef.current = null; }
      
      let resultData: any = { victory };

      if (victory) {
          slainEntityNamesRef.current.add(target.name);
          
          // Remove entity from world (Fixes duplicate contract/attack issue)
          setEntities(p => p.filter(e => e.uid !== target.uid));

          // EXP Calculation
          if (target.expReward && target.expReward > 0) {
              gainExp(target.expReward);
              resultData.exp = target.expReward;
          }

          // Quest Updates: Kill
          setQuests(prev => prev.map(q => {
              if (q.status !== 'active') return q;
              let changed = false;
              const newObjectives = q.objectives.map(obj => {
                  if (obj.type === 'kill' && (obj.targetId === target.id || obj.targetName === target.name) && obj.current < obj.count) {
                      changed = true;
                      return { ...obj, current: obj.current + 1 };
                  }
                  return obj;
              });
              
              if (changed) {
                  const newCurrent = newObjectives.reduce((acc, o) => acc + o.current, 0);
                  return { ...q, objectives: newObjectives, currentProgress: newCurrent };
              }
              return q;
          }));

          if (isCapture) {
              unlockAchievement('first_blood'); 
              const newPet: Pet = {
                  id: `pet-${Date.now()}`,
                  name: target.name,
                  title: '野生',
                  stars: 1,
                  hp: target.maxHp || 100, maxHp: target.maxHp || 100,
                  attack: target.attack || 10, defense: target.defense || 5,
                  speed: target.speed || 10,
                  loyalty: 50,
                  skills: ['撞击']
              };
              setStats(prev => ({ ...prev, ownedPets: [...prev.ownedPets, newPet] }));
              addLog(`获得了新的幻兽伙伴: ${target.name}!`, 'system');
              resultData.capturedPet = newPet;
          } else {
              if (remainingHp < stats.maxHp * 0.05) unlockAchievement('survivor');
              unlockAchievement('first_blood');
              
              let drops: Entity[] = [];
              if (target.lootTable) {
                  target.lootTable.forEach(d => {
                      if (Math.random() <= d.chance) {
                          const qty = Math.floor(Math.random() * (d.max - d.min + 1)) + d.min;
                          if (qty > 0) {
                             const dropEntity = instantiateEntity(d.itemId);
                             if (dropEntity.itemData) dropEntity.itemData.quantity = qty;
                             drops.push(dropEntity);
                             addToInventory(dropEntity.itemData!); 
                             // Auto-loot logic
                          }
                      }
                  });
              }
              resultData.items = drops;
              if(drops.length > 0) addLog(`获得了战利品。`, 'system');
          }
      } else {
          addLog(`你被 ${target.name} 击败了。`, 'combat');
          // Update stats to 0 HP on defeat
          setStats(prev => ({ ...prev, hp: 0 }));
      }
      
      setCombatResult(resultData);
  };

  // Save/Load
  const generateSaveData = (): SaveData => ({ version: 2, timestamp: Date.now(), stats, quests, worldRegistry, currentEntities: entities, logs, knownLocations });
  const loadSaveData = (data: SaveData) => {
      if (!data.version || !data.stats) return alert("无效存档");
      setStats({ ...INITIAL_STATS, ...data.stats });
      setQuests(data.quests || []); 
      setWorldRegistry(data.worldRegistry || ((data as any).npcRegistry ? {} : {})); 
      setKnownLocations(data.knownLocations || []); 
      setEntities(data.currentEntities || []); 
      setLogs(data.logs || []);
      setInitialized(true); 
      slainEntityNamesRef.current.clear();
      setShowSaveModal(false);
      addLog("存档读取成功", "system");
  };

  return {
    logs, isLoading, stats, quests, entities, initialized, streamText,
    showSettings, setShowSettings, showSaveModal, setShowSaveModal, showPetList, setShowPetList, 
    showAchievementModal, setShowAchievementModal,
    showCharacterModal, setShowCharacterModal, showInventoryModal, setShowInventoryModal,
    aiConfig, setAiConfig,
    combatTarget, combatState, combatLog, combatEndingRef, combatResult,
    lastAction,
    interactionTarget, interactionSource, knownLocations,
    worldRegistry,
    handleSend, handlePickup, handleDropItem, handleUseItem, startCombatFromOverlay, equipItem, unequipItem,
    handleEntityClick: (e: Entity) => { setInteractionSource('world'); setSelectedItemIndex(-1); setInteractionTarget(e); interactionTargetRef.current = e; },
    handleInventoryItemClick: (item: Item) => { setSelectedItemIndex(stats.inventory.findIndex(i=>i.id===item.id)); setInteractionSource('inventory'); setInteractionTarget({ id: item.id, name: item.name, type: 'item', level: 1, status: 'In Bag', avatar: item.icon, description: item.description, itemData: item }); interactionTargetRef.current = null; },
    closeInteraction: () => { setInteractionTarget(null); interactionTargetRef.current = null; },
    handleQuickSave: () => localStorage.setItem('pbc_autosave', JSON.stringify(generateSaveData())),
    handleQuickLoad: () => { const r = localStorage.getItem('pbc_autosave'); if(r) loadSaveData(JSON.parse(r)); },
    handleExportSave: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(generateSaveData())], {type:'json'})); a.download='save.json'; a.click(); },
    handleImportSave: (e: React.ChangeEvent<HTMLInputElement>) => { 
        const f = e.target.files?.[0]; 
        if(f) { 
            const r = new FileReader(); 
            r.onload = ev => {
                if (ev.target?.result) {
                    loadSaveData(JSON.parse(ev.target.result as string));
                }
            }; 
            r.readAsText(f); 
        } 
    },
    handleSaveSettings: () => { updateGameConfig(aiConfig); setShowSettings(false); }, // simplified
    // Pet
    handleSwitchPet: (p: Pet) => { setStats(s => ({...s, pet: p})); setShowPetList(false); addLog(`召唤了 ${p.name}`, 'system'); },
    handleRecallPet: () => { setStats(s => ({...s, pet: undefined})); setShowPetList(false); addLog(`收回了幻兽。`, 'system'); },
    handleEnhancePet: (p: Pet) => { handleSend(`强化幻兽 ${p.name}`); setShowPetList(false); },
    handleReleasePet: (p: Pet) => { if(confirm("确定?")) { setStats(s=>({...s, ownedPets: s.ownedPets.filter(x=>x.id!==p.id), pet: s.pet?.id===p.id?undefined:s.pet})); } },
    // Combat
    closeCombat: () => { if(combatLoopRef.current) clearInterval(combatLoopRef.current); setCombatTarget(null); setCombatLog(""); combatEndingRef.current = false; setCombatResult(null); },
    handlePlayerAttack, handlePlayerSkill, handleContract, 
    handlePlayerDefend: () => setCombatState(s=>({...s, playerAp: 0, isPlayerTurn: false})),
    handlePlayerEscape: () => { combatEndingRef.current=true; setCombatLog("\n逃跑成功"); setTimeout(() => { setCombatTarget(null); handleSend("逃跑"); }, 1000); },
    handlePetAttack, 
    handlePetSkill: () => { const dmg = Math.round(stats.pet!.attack * 1.3); setCombatLog(`\n${stats.pet!.name} 技能造成 ${dmg}`); updateCombatHp(dmg, true); },
    handlePetDefend: () => setCombatState(s=>({...s, petAp: 0, isPetTurn: false})),
    equipTitle,
    handleObserveItem: (e: Entity) => addLog(`🔍 ${e.name}: ${e.description}`, 'narrative'),
    handleObserveMonster: (e: Entity) => addLog(`🔍 ${e.name} (HP:${e.hp})`, 'narrative'),
  };
};
