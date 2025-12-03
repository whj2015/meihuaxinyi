
import { GameTurnResponse, QuestType, AISettings, Item, Entity, Quest, LocationData, PlayerStats, LocationConfig } from "../types";
import { ITEMS_DB } from "../data/items";
import { MONSTERS_DB } from "../data/monsters";
import { NPCS_DB } from "../data/npcs";
import { QUESTS_DB } from "../data/quests";
import { WORLD_DB } from "../data/locations";
import { INITIAL_STATS } from "../data/player";

// ==========================================
// 引擎逻辑 (Engine Logic)
// ==========================================

// Export helper for UI
export const getQuestDefinition = (id: string): Quest | undefined => {
    return QUESTS_DB[id];
};

export const getNpcDefinition = (id: string): Partial<Entity> | undefined => {
    return NPCS_DB[id];
};

export const updateGameConfig = (settings: AISettings) => {
  console.log("Config updated (Local Mode)");
};

export const getGameConfig = () => ({ provider: 'local', apiKey: 'offline', model: 'offline' } as AISettings);

// Helper: Instantiate Entity from Template (Exported for Drops)
export const instantiateEntity = (templateId: string, levelOverride?: number): Entity => {
    const isItem = ITEMS_DB[templateId] !== undefined;
    
    if (isItem) {
        const item = ITEMS_DB[templateId];
        return {
            uid: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            id: item.id,
            name: item.name,
            type: 'item',
            level: 1,
            status: 'Found',
            avatar: item.icon,
            description: item.description,
            itemData: { ...item } // Clone to prevent mutation of DB
        };
    } else {
        const template = NPCS_DB[templateId] || MONSTERS_DB[templateId];
        if (!template) throw new Error(`Entity template ${templateId} not found`);
        const level = levelOverride || 1;
        // Simple scaling
        const scale = (val: number | undefined) => val ? Math.floor(val * (1 + (level - 1) * 0.1)) : 10;
        
        return {
            uid: `${template.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            id: templateId,
            name: template.name || 'Unknown',
            type: (template.type as any) || 'monster',
            level: level,
            hp: scale(template.hp),
            maxHp: scale(template.maxHp),
            attack: scale(template.attack),
            defense: scale(template.defense),
            speed: scale(template.speed),
            expReward: scale(template.expReward), // Scale EXP with level
            status: template.status || 'Normal',
            avatar: template.avatar,
            description: template.description,
            lootTable: template.lootTable,
            questsGiven: template.questsGiven,
            dialogue: template.dialogue,
            isAggressive: template.isAggressive
        };
    }
};

// 1. Generate Location Data (Updated for Exits)
export const generateLocationDetails = async (locationName: string, playerLevel: number, existingData?: LocationData): Promise<LocationData> => {
    // Lookup via Name or ID
    const locationEntry = Object.values(WORLD_DB).find(l => l.name === locationName || l.id === locationName) || WORLD_DB['village_start'];
    const config = locationEntry;

    // Preserve existing visible exits if we are just reloading/visiting, otherwise init with non-hidden ones
    let visibleExits = existingData?.visibleExits || [];
    
    if (visibleExits.length === 0) {
        visibleExits = config.exits.filter(e => !e.isHidden);
    } else {
        // Merge logic: Ensure all non-hidden from config are present (in case of updates), plus any discovered ones
        const staticExits = config.exits.filter(e => !e.isHidden);
        const discovered = visibleExits.filter(e => e.isHidden); // Keep previously discovered hidden exits
        
        // De-dupe based on ID
        const combined = [...staticExits, ...discovered];
        const uniqueExits = new Map();
        combined.forEach(e => uniqueExits.set(e.id, e));
        visibleExits = Array.from(uniqueExits.values());
    }

    // Instantiate Static NPCs
    const npcs = config.staticNpcs.map(id => instantiateEntity(id, 50)); 

    // Random Ambience Monsters (Passive)
    const activeEntities = [...npcs];
    if (config.monsterTable.length > 0 && Math.random() > 0.6) {
        const spawn = config.monsterTable[Math.floor(Math.random() * config.monsterTable.length)];
        const level = Math.floor(Math.random() * (spawn.levelRange[1] - spawn.levelRange[0] + 1)) + spawn.levelRange[0];
        activeEntities.push(instantiateEntity(spawn.entityId, level));
    }

    // Check for Available Quests from these NPCs
    const locationQuests: Quest[] = [];
    npcs.forEach(npc => {
        if (npc.questsGiven) {
            npc.questsGiven.forEach(qid => {
                locationQuests.push({ ...QUESTS_DB[qid] });
            });
        }
    });

    return {
        id: config.id,
        name: config.name,
        description: config.description,
        dangerLevel: config.dangerLevel,
        npcs: npcs,
        monsters: [], 
        activeEntities: activeEntities,
        availableQuests: locationQuests,
        visibleExits: visibleExits,
        isVisited: true,
        visitedAt: Date.now()
    };
};

// 2. Initialize Game
export const initializeGame = async (onStream?: (text: string) => void): Promise<GameTurnResponse> => {
    const introText = "欢迎来到《幻兽战记》(离线版)。\n你在一阵微风中醒来，发现自己身处【起始之村】。\n这似乎是一个充满魔法与危险的世界，而你，作为一名初出茅庐的召唤师，即将踏上征程。";
    if (onStream) onStream(introText);

    return {
        narrative: introText,
        location: WORLD_DB['village_start'].name,
        locationId: 'village_start',
        entities: [],
        isCombat: false,
        updatedStats: { ...INITIAL_STATS },
        updatedQuests: []
    };
};

// 3. Send Command (The Engine)
export const sendCommand = async (
    command: string, 
    context?: { existingNPCs?: string[], currentInventory?: Item[], ownedPets?: any[], locationContext?: LocationData, playerStats?: PlayerStats, currentQuests?: Quest[] }, 
    onStream?: (text: string) => void
): Promise<GameTurnResponse> => {
  
  // -- Parse Context --
  const currentLocationId = context?.playerStats?.locationId || 'village_start';
  const locationConfig = WORLD_DB[currentLocationId] || WORLD_DB['village_start'];
  const currentLocationData = context?.locationContext;
  const currentHp = context?.playerStats?.hp || 0;
  
  // Use exits from context if available (to support discovered paths), otherwise default to config
  const availableExits = currentLocationData?.visibleExits || locationConfig.exits.filter(e => !e.isHidden);

  let currentEntities = context?.locationContext?.activeEntities || [];
  let playerQuests = context?.currentQuests ? [...context.currentQuests] : []; // Copy to avoid direct mutation
  let inventory = context?.currentInventory || [];
  let statsUpdates: Partial<PlayerStats> = {};
  
  let narrative = "";
  let isCombat = false;
  let newLocationStr = locationConfig.name;
  let newLocationId = currentLocationId;

  // -- Command Logic --

  // 1. Movement Logic
  // Check if command matches any exit direction or target name
  const matchedExit = availableExits.find(e => 
      command === e.direction || 
      command === e.directionLabel ||
      (command.startsWith("前往") && command.includes(WORLD_DB[e.targetId]?.name))
  );

  if (matchedExit) {
      // Check Requirements
      if (matchedExit.reqLevel && (context?.playerStats?.level || 1) < matchedExit.reqLevel) {
          narrative = `🚫 你的等级不足 (需要 Lv.${matchedExit.reqLevel})，无法前往 ${matchedExit.directionLabel}。`;
      } else if (matchedExit.reqItem && !inventory.some(i => i.id === matchedExit.reqItem)) {
          const reqItemName = ITEMS_DB[matchedExit.reqItem]?.name || "未知物品";
          narrative = `🔒 需要 [${reqItemName}] 才能通过。`;
      } else {
          // Success Move
          const targetConfig = WORLD_DB[matchedExit.targetId];
          newLocationStr = targetConfig.name;
          newLocationId = targetConfig.id;
          narrative = `${matchedExit.description}\n\n你来到了 **${targetConfig.name}**。`;
          
          // Heal logic when returning to village
          if (newLocationId === 'village_start') {
              statsUpdates.hp = context?.playerStats?.maxHp || 100;
              statsUpdates.mp = context?.playerStats?.maxMp || 50;
              // Also heal pet
              if (context?.playerStats?.pet) {
                  const healedPet = { ...context.playerStats.pet, hp: context.playerStats.pet.maxHp };
                  statsUpdates.pet = healedPet;
                  if (context.ownedPets) {
                      statsUpdates.ownedPets = context.ownedPets.map(p => p.id === healedPet.id ? healedPet : p);
                  }
              }
              narrative += `\n\n(在村庄中休息片刻，你的体力和灵气已完全恢复！)`;
          }

          currentEntities = []; // Reset entities, will be regenerated by hook
          statsUpdates.locationId = targetConfig.id;
      }
  }

  // 2. Exploration: "探索" / "explore"
  else if (command.includes("探索") || command.includes("explore")) {
      // Check HP Barrier
      if (currentHp <= 0) {
          narrative = `🚫 你已经身负重伤，无法继续探索！请立即使用药水或返回村庄治疗。`;
      } else {
          const roll = Math.random();
          
          // A. Discovery Logic (Hidden Exits) - 20% Chance if hidden exits exist
          const hiddenExits = locationConfig.exits.filter(e => e.isHidden);
          // Filter out already visible ones from the current context
          const undiscoveredExits = hiddenExits.filter(he => !availableExits.some(ae => ae.id === he.id));
          
          if (undiscoveredExits.length > 0 && roll < 0.2) {
              const discovered = undiscoveredExits[0];
              if (currentLocationData) {
                  currentLocationData.visibleExits.push(discovered);
              }
              narrative = `✨ 你在探索中发现了一条新的路径: **${discovered.directionLabel}**!`;
          }

          // B. Resource Logic - 30% Find Item
          else if (roll < 0.3 && locationConfig.resourceTable.length > 0) {
              const spawn = locationConfig.resourceTable[Math.floor(Math.random() * locationConfig.resourceTable.length)];
              const entity = instantiateEntity(spawn.entityId);
              currentEntities = [...currentEntities, entity];
              narrative = `你在探索中发现了一个: **${entity.name}**! (请点击拾取)`;
          } 
          // C. Combat Logic - 40% Combat
          else if (roll < 0.7 && locationConfig.monsterTable.length > 0) {
              const spawn = locationConfig.monsterTable[Math.floor(Math.random() * locationConfig.monsterTable.length)];
              const level = Math.floor(Math.random() * (spawn.levelRange[1] - spawn.levelRange[0] + 1)) + spawn.levelRange[0];
              const monster = instantiateEntity(spawn.entityId, level);
              currentEntities = [...currentEntities, monster];
              narrative = `你感觉到了杀气！一只 **${monster.name}** (Lv.${level}) 出现了！`;
          } 
          // D. Flavor Text
          else {
              const flavors = ["四周静悄悄的。", "风吹过树梢的声音。", "你发现了一些足迹，但已经模糊了。", "这里似乎没什么特别的。"];
              narrative = flavors[Math.floor(Math.random() * flavors.length)];
          }
      }
  }

  // 3. Status - REMOVED REST (User Requested) - Keep handler for legacy but no button
  else if (command.includes("修炼") || command.includes("休息")) {
      narrative = `这里并不适合修炼，还是抓紧时间冒险吧。 (请前往客栈或特定地点恢复)`;
  }

  // 4. Use Item: "使用物品 [Name]"
  else if (command.startsWith("使用物品")) {
      const itemName = command.replace("使用物品", "").trim();
      const itemIndex = inventory.findIndex(i => i.name === itemName);
      if (itemIndex > -1) {
          const item = inventory[itemIndex];
          narrative = `使用了 ${item.name}。`;
          // Simple effect parsing
          if (item.effect?.startsWith('heal_')) {
              const val = parseInt(item.effect.split('_')[1]);
              const curHp = context?.playerStats?.hp || 0;
              const maxHp = context?.playerStats?.maxHp || 100;
              statsUpdates.hp = Math.min(maxHp, curHp + val);
              narrative += ` 恢复了 ${val} 点生命值。`;
          }
          
          // Remove 1 item using Immutable update to prevent stale state issues
          let newInv = [...inventory];
          const targetItem = newInv[itemIndex];
          
          if (targetItem.quantity > 1) {
             // Create new object for the modified item
             newInv[itemIndex] = { ...targetItem, quantity: targetItem.quantity - 1 };
          } else {
             // Remove item completely
             newInv.splice(itemIndex, 1);
          }
          statsUpdates.inventory = newInv;
      } else {
          narrative = "你没有这个物品。";
      }
  }

  // 5. Interaction / Talk: "与 [Name] 交谈"
  else if (command.startsWith("与") && command.includes("交谈")) {
      const targetName = command.replace("与", "").replace("交谈", "").trim();
      const npc = currentEntities.find(e => e.name === targetName && e.type === 'npc');
      
      if (npc) {
        const dialogues = npc.dialogue || ["你好啊。", "今天天气不错。"];
        narrative = `[${npc.name}]: "${dialogues[Math.floor(Math.random() * dialogues.length)]}"`;
        
        // Hint at quests
        if (npc.questsGiven && npc.questsGiven.length > 0) {
            // Check if player has any quests available or active from this NPC
            const hasNewQuest = npc.questsGiven.some(qid => !playerQuests.find(pq => pq.id === qid));
            if (hasNewQuest) {
                narrative += `\n\n(此人似乎有事情想委托你，点击【任务委托】查看详情。)`;
            }
        }
      } else {
          narrative = "找不到目标。";
      }
  }

  // 6. Quest: Accept "accept_quest [questId]"
  else if (command.startsWith("accept_quest")) {
      const questId = command.replace("accept_quest", "").trim();
      const questTemplate = QUESTS_DB[questId];
      if (questTemplate) {
          const existing = playerQuests.find(q => q.id === questId);
          if (!existing) {
              // FIX: Deep copy objectives array to avoid reference issues
              const newQuest = { 
                  ...questTemplate, 
                  objectives: questTemplate.objectives.map(o => ({...o})),
                  status: 'active' as const, 
                  currentProgress: 0 
              };
              
              // FIX: Check inventory for collect objectives immediately
              if (inventory.length > 0) {
                  newQuest.objectives = newQuest.objectives.map(o => {
                     if (o.type === 'collect') {
                         const item = inventory.find(i => i.id === o.targetId);
                         if (item) {
                             return { ...o, current: Math.min(o.count, item.quantity) }; // Max out at count? Or item.quantity? Let's cap at count for simple progress logic.
                         }
                     }
                     return o;
                 });
                 // Recalc progress
                 newQuest.currentProgress = newQuest.objectives.reduce((a,b) => a + b.current, 0);
              }

              playerQuests.push(newQuest);
              narrative = `[系统]: 你接受了任务 【${newQuest.title}】。\n\n"${newQuest.dialogueStart?.[0] || '拜托你了。'}"`;
          } else {
              narrative = "你已经接受过这个任务了。";
          }
      } else {
          narrative = "任务不存在。";
      }
  }

  // 7. Quest: Submit "submit_quest [questId]"
  else if (command.startsWith("submit_quest")) {
      const questId = command.replace("submit_quest", "").trim();
      const questIndex = playerQuests.findIndex(q => q.id === questId);
      
      if (questIndex > -1) {
          const q = playerQuests[questIndex];
          // Double check conditions
          const allDone = q.objectives.every(o => o.current >= o.count);
          if (q.status === 'active' && allDone) {
              // Grant Rewards
              if (q.rewards.exp) {
                   statsUpdates.exp = (context?.playerStats?.exp || 0) + q.rewards.exp;
              }
              if (q.rewards.gold) statsUpdates.gold = (context?.playerStats?.gold || 0) + q.rewards.gold;
              
              if (q.rewards.items) {
                  const currentInv = statsUpdates.inventory || inventory;
                  const newItems = [...currentInv];
                  q.rewards.items.forEach(r => {
                      const dbItem = ITEMS_DB[r.itemId];
                      if (dbItem) {
                          const existingIndex = newItems.findIndex(i => i.id === dbItem.id);
                          if (existingIndex > -1) {
                              newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + r.count };
                          }
                          else {
                              newItems.push({ ...dbItem, quantity: r.count });
                          }
                      }
                  });
                  statsUpdates.inventory = newItems;
              }

              // Update status
              playerQuests[questIndex] = { ...q, status: 'turned_in', isComplete: true };
              
              narrative = `[系统]: 任务 【${q.title}】 完成！\n获得奖励: ${q.rewards.exp || 0} EXP, ${q.rewards.gold || 0} Gold.\n\n"${q.dialogueEnd?.[0] || '谢谢你！'}"`;
          } else {
              narrative = "任务目标尚未完成。";
          }
      } else {
          narrative = "找不到该任务。";
      }
  }

  // Fallback for movement if no exit matched but user typed "前往"
  else if (command.startsWith("前往")) {
      narrative = "前方没有路，或者你需要先【探索】发现隐藏的路径。";
  }
  else {
      narrative = `你尝试 "${command}"，但似乎没有什么效果。`;
  }

  if (onStream) onStream(narrative);

  return {
    narrative,
    location: newLocationStr,
    locationId: newLocationId,
    entities: currentEntities,
    updatedStats: statsUpdates,
    updatedQuests: playerQuests,
    isCombat: isCombat
  };
};
