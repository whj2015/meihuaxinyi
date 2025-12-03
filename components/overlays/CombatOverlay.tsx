
import React, { useEffect, useState, useRef } from 'react';
import { X, Sword, Flame, Zap, Shield, Footprints, Grab, Crosshair, Skull, Heart, Star, CheckCircle } from 'lucide-react';
import { Entity, PlayerStats, CombatState, Pet } from '../../types';
import { formatText } from '../../utils/textUtils';

interface CombatOverlayProps {
    combatTarget: Entity;
    combatState: CombatState;
    stats: PlayerStats;
    combatLog: string;
    onClose: () => void;
    // Player Actions
    onAttack: () => void;
    onSkill: () => void;
    onDefend: () => void;
    onEscape: () => void;
    onContract: () => void;
    // Pet Actions
    onPetAttack: () => void;
    onPetSkill: () => void;
    onPetDefend: () => void;
    combatEnding: boolean;
    // Results
    combatResult: {victory: boolean, items?: Entity[], exp?: number, capturedPet?: Pet} | null;
    lastAction: {type: 'damage' | 'heal' | 'miss', value: number, target: 'player' | 'enemy' | 'pet'} | null;
}

const CombatOverlay: React.FC<CombatOverlayProps> = ({
    combatTarget, combatState, stats, combatLog, onClose, 
    onAttack, onSkill, onDefend, onEscape, onContract,
    onPetAttack, onPetSkill, onPetDefend, combatEnding,
    combatResult, lastAction
}) => {
    const [enemyShake, setEnemyShake] = useState(false);
    const [playerShake, setPlayerShake] = useState(false);
    const [petShake, setPetShake] = useState(false);
    const [floatingTexts, setFloatingTexts] = useState<{id: number, text: string, x: number, y: number, color: string}[]>([]);
    
    // Animation triggers based on lastAction
    useEffect(() => {
        if (!lastAction) return;

        // Shake effects
        if (lastAction.target === 'enemy') {
            setEnemyShake(true);
            setTimeout(() => setEnemyShake(false), 300);
            addFloatingText(`-${lastAction.value}`, 50, 20, 'text-red-500');
        } else if (lastAction.target === 'player') {
            setPlayerShake(true);
            setTimeout(() => setPlayerShake(false), 300);
             addFloatingText(`-${lastAction.value}`, 20, 70, 'text-red-500');
        } else if (lastAction.target === 'pet') {
            setPetShake(true);
            setTimeout(() => setPetShake(false), 300);
             addFloatingText(`-${lastAction.value}`, 80, 70, 'text-red-500');
        }

    }, [lastAction]);

    const addFloatingText = (text: string, xPercent: number, yPercent: number, color: string) => {
        const id = Date.now();
        setFloatingTexts(prev => [...prev, { id, text, x: xPercent, y: yPercent, color }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
        }, 1000);
    };

    const getAvatar = (entity: Entity) => entity.avatar || '👾';

    // -- Result Screen --
    if (combatResult) {
        return (
            <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-fade-in font-['Noto_Sans_SC'] p-4">
                <div className="bg-[#0f172a] border border-gray-700 rounded-xl max-w-md w-full p-6 text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    {/* Background Glow */}
                    <div className={`absolute top-0 left-0 right-0 h-1/2 opacity-20 blur-3xl ${combatResult.victory ? 'bg-yellow-500' : 'bg-red-900'}`}></div>
                    
                    <div className="relative z-10">
                        {combatResult.victory ? (
                            <>
                                <div className="text-5xl mb-2 animate-bounce-slow">🏆</div>
                                <h2 className="text-3xl font-black text-yellow-400 mb-6 drop-shadow-md">战斗胜利!</h2>
                                
                                <div className="space-y-4 mb-8">
                                    {combatResult.exp && (
                                        <div className="bg-gray-900/50 p-3 rounded border border-gray-700 flex justify-between items-center animate-slide-in-right delay-100">
                                            <span className="text-gray-400">获得经验</span>
                                            <span className="text-yellow-300 font-bold font-mono">+{combatResult.exp} EXP</span>
                                        </div>
                                    )}
                                    {combatResult.capturedPet && (
                                        <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30 flex items-center gap-3 animate-slide-in-right delay-200">
                                            <div className="text-2xl">🐲</div>
                                            <div className="text-left">
                                                <div className="text-xs text-purple-400 uppercase font-bold">契约成功</div>
                                                <div className="text-purple-200 font-bold">{combatResult.capturedPet.name}</div>
                                            </div>
                                        </div>
                                    )}
                                    {combatResult.items && combatResult.items.length > 0 && (
                                        <div className="bg-blue-900/10 p-3 rounded border border-blue-500/20 text-left animate-slide-in-right delay-300">
                                            <div className="text-xs text-blue-400 mb-2 uppercase font-bold">战利品</div>
                                            <div className="flex flex-wrap gap-2">
                                                {combatResult.items.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded text-xs text-gray-300 border border-gray-700">
                                                        <span>{item.avatar || '📦'}</span> {item.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl mb-2 animate-pulse">💀</div>
                                <h2 className="text-3xl font-black text-red-600 mb-6 tracking-widest">战斗失败</h2>
                                <p className="text-gray-400 mb-8">你已身负重伤，请回村休息。</p>
                            </>
                        )}
                        
                        <button 
                            onClick={onClose}
                            className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${
                                combatResult.victory 
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-yellow-900/20' 
                                : 'bg-gray-800 hover:bg-gray-700 text-white'
                            }`}
                        >
                            {combatResult.victory ? '收取战利品' : '撤退'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between font-['Noto_Sans_SC'] overflow-hidden">
            
            {/* --- Background / Atmosphere --- */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-[#0a0505] to-black pointer-events-none"></div>
            
            {/* --- Floating Texts Layer --- */}
            <div className="absolute inset-0 pointer-events-none z-40">
                {floatingTexts.map(ft => (
                    <div 
                        key={ft.id}
                        className={`absolute text-2xl font-black ${ft.color} animate-float-up drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]`}
                        style={{ left: `${ft.x}%`, top: `${ft.y}%` }}
                    >
                        {ft.text}
                    </div>
                ))}
            </div>

            {/* --- Top Bar --- */}
            <div className="w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                    <Sword className="text-red-500 animate-pulse" size={18}/>
                    <span className="text-red-500 font-bold tracking-[0.2em] text-sm">COMBAT</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24}/></button>
            </div>

            {/* --- Battle Area --- */}
            <div className="flex-1 w-full relative flex flex-col z-10 max-w-2xl mx-auto">
                
                {/* 1. ENEMY SECTION (Top Center) */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Enemy HP Bar (Floating above) */}
                    <div className="w-48 mb-4">
                        <div className="flex justify-between text-xs text-red-300 font-bold mb-1 px-1">
                            <span className="text-shadow-sm">{combatTarget.name}</span>
                            <span>Lv.{combatTarget.level}</span>
                        </div>
                        <div className="h-3 bg-black/60 rounded-full border border-red-900/50 overflow-hidden relative">
                             <div className="absolute inset-0 bg-red-900/30"></div>
                             <div 
                                className="h-full bg-gradient-to-r from-red-600 to-orange-600 transition-all duration-300 ease-out" 
                                style={{width: `${(combatState.localEnemyHp / combatState.localEnemyMaxHp) * 100}%`}}
                             />
                        </div>
                         {/* AP Gauge Small */}
                        <div className="h-1 w-full bg-gray-900 mt-0.5 rounded-full overflow-hidden opacity-80">
                            <div className="h-full bg-white transition-all duration-100" style={{width: `${combatState.enemyAp}%`}}></div>
                        </div>
                    </div>

                    {/* Enemy Avatar */}
                    <div className={`relative transition-transform duration-100 ${enemyShake ? 'animate-shake' : 'animate-float'}`}>
                        <div className="w-32 h-32 md:w-48 md:h-48 flex items-center justify-center text-[80px] md:text-[120px] filter drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                            {getAvatar(combatTarget)}
                        </div>
                        {/* Hit Effect Overlay */}
                        {enemyShake && <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>}
                    </div>
                </div>

                {/* 2. LOG & MESSAGES (Middle Overlay) */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-center pointer-events-none z-30">
                     {/* Log Stream as a toast/banner */}
                     {combatLog && (
                         <div className="bg-black/70 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-700 text-sm text-gray-200 shadow-xl max-w-[90%] text-center animate-fade-in">
                             {combatLog.split('\n').pop()}
                         </div>
                     )}
                </div>

                {/* 3. PLAYER & PET SECTION (Bottom Split) */}
                <div className="flex justify-between items-end px-4 pb-20 w-full gap-4">
                    
                    {/* Player (Left) */}
                    <div className={`flex flex-col items-center transition-transform ${playerShake ? 'animate-shake' : ''} ${combatState.isPlayerTurn ? 'scale-105 brightness-110' : 'brightness-75 grayscale-[0.3]'}`}>
                        <div className="relative">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-gray-800 to-black border-2 border-teal-500/50 flex items-center justify-center text-3xl shadow-lg z-10 relative">
                                🧑‍🚀
                            </div>
                            {combatState.isPlayerTurn && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-teal-400 bg-black/80 px-2 py-0.5 rounded border border-teal-500 animate-bounce">YOUR TURN</div>}
                        </div>
                        
                        {/* Player Bars */}
                        <div className="w-24 mt-2 space-y-1">
                             <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                                 <div className="h-full bg-teal-500 transition-all duration-300" style={{width: `${(combatState.localPlayerHp / stats.maxHp) * 100}%`}}></div>
                             </div>
                             <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                                 <div className="h-full bg-blue-500 transition-all duration-100" style={{width: `${combatState.playerAp}%`}}></div>
                             </div>
                             <div className="text-[10px] text-center text-gray-400 font-mono">{combatState.localPlayerHp} HP</div>
                        </div>
                    </div>

                    {/* Pet (Right) - Only if exists */}
                    {stats.pet ? (
                        <div className={`flex flex-col items-center transition-transform ${petShake ? 'animate-shake' : ''} ${combatState.isPetTurn ? 'scale-105 brightness-110' : 'brightness-75 grayscale-[0.3]'}`}>
                            <div className="relative">
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-purple-900/30 to-black border-2 border-purple-500/50 flex items-center justify-center text-3xl shadow-lg z-10 relative">
                                    🐲
                                </div>
                                {combatState.isPetTurn && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-purple-400 bg-black/80 px-2 py-0.5 rounded border border-purple-500 animate-bounce">PET TURN</div>}
                            </div>
                             {/* Pet Bars */}
                             <div className="w-24 mt-2 space-y-1">
                                 <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                                     <div className="h-full bg-purple-500 transition-all duration-300" style={{width: `${(combatState.localPetHp / stats.pet.maxHp) * 100}%`}}></div>
                                 </div>
                                 <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                                     <div className="h-full bg-yellow-500 transition-all duration-100" style={{width: `${combatState.petAp}%`}}></div>
                                 </div>
                                 <div className="text-[10px] text-center text-gray-400 font-mono">{combatState.localPetHp} HP</div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-24 opacity-20 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center">
                                <Zap/>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Control Panel (Bottom) --- */}
            <div className="w-full bg-[#0B1120] border-t border-gray-800 p-4 z-30 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                <div className="max-w-2xl mx-auto flex gap-3 h-28">
                    
                    {/* Player Controls Group */}
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <button 
                           onClick={onAttack} disabled={!combatState.isPlayerTurn || combatEnding} 
                           className={`flex flex-col items-center justify-center gap-1 rounded-lg border bg-gradient-to-b transition-all active:scale-95 ${combatState.isPlayerTurn ? 'from-red-900/50 to-red-950/80 border-red-500/50 text-red-200 hover:brightness-125' : 'from-gray-900 to-black border-gray-800 text-gray-600 opacity-50'}`}
                        >
                            <Sword size={20}/>
                            <span className="text-xs font-bold">攻击</span>
                        </button>
                        <button 
                           onClick={onSkill} disabled={!combatState.isPlayerTurn || combatEnding} 
                           className={`flex flex-col items-center justify-center gap-1 rounded-lg border bg-gradient-to-b transition-all active:scale-95 ${combatState.isPlayerTurn ? 'from-blue-900/50 to-blue-950/80 border-blue-500/50 text-blue-200 hover:brightness-125' : 'from-gray-900 to-black border-gray-800 text-gray-600 opacity-50'}`}
                        >
                            <Flame size={20}/>
                            <span className="text-xs font-bold">技能</span>
                        </button>
                        <button 
                           onClick={onContract} disabled={!combatState.isPlayerTurn || combatEnding} 
                           className={`flex flex-col items-center justify-center gap-1 rounded-lg border bg-gradient-to-b transition-all active:scale-95 ${combatState.isPlayerTurn ? 'from-teal-900/50 to-teal-950/80 border-teal-500/50 text-teal-200 hover:brightness-125' : 'from-gray-900 to-black border-gray-800 text-gray-600 opacity-50'}`}
                        >
                            <Grab size={20}/>
                            <span className="text-xs font-bold">契约</span>
                        </button>
                         <div className="flex gap-2">
                            <button 
                                onClick={onDefend} disabled={!combatState.isPlayerTurn || combatEnding} 
                                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg border bg-gradient-to-b transition-all active:scale-95 ${combatState.isPlayerTurn ? 'from-yellow-900/50 to-yellow-950/80 border-yellow-500/50 text-yellow-200 hover:brightness-125' : 'from-gray-900 to-black border-gray-800 text-gray-600 opacity-50'}`}
                            >
                                <Shield size={16}/>
                            </button>
                            <button 
                                onClick={onEscape} disabled={!combatState.isPlayerTurn || combatEnding} 
                                className="w-10 flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800 active:scale-95"
                            >
                                <Footprints size={16}/>
                            </button>
                        </div>
                    </div>

                    {/* Pet Controls Group (Now Larger!) */}
                    {stats.pet ? (
                        <div className="flex-1 border-l border-gray-800 pl-3">
                             <div className="h-full grid grid-cols-2 gap-2">
                                <button 
                                    onClick={onPetAttack} disabled={!combatState.isPetTurn} 
                                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border transition-all active:scale-95 ${combatState.isPetTurn ? 'bg-gradient-to-b from-purple-900/50 to-purple-950/80 border-purple-500/50 text-purple-200 hover:brightness-125 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-gray-900 border-gray-800 text-gray-600 opacity-50'}`}
                                >
                                    <Crosshair size={20}/>
                                    <span className="text-xs font-bold">幻兽攻击</span>
                                </button>
                                <button 
                                    onClick={onPetSkill} disabled={!combatState.isPetTurn} 
                                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border transition-all active:scale-95 ${combatState.isPetTurn ? 'bg-gradient-to-b from-purple-900/50 to-purple-950/80 border-purple-500/50 text-purple-200 hover:brightness-125 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-gray-900 border-gray-800 text-gray-600 opacity-50'}`}
                                >
                                    <Zap size={20}/>
                                    <span className="text-xs font-bold">幻兽技能</span>
                                </button>
                                <button 
                                    onClick={onPetDefend} disabled={!combatState.isPetTurn} 
                                    className={`col-span-2 flex items-center justify-center gap-2 rounded-lg border transition-all active:scale-95 ${combatState.isPetTurn ? 'bg-gradient-to-b from-purple-900/50 to-purple-950/80 border-purple-500/50 text-purple-200 hover:brightness-125' : 'bg-gray-900 border-gray-800 text-gray-600 opacity-50'}`}
                                >
                                    <Shield size={16}/>
                                    <span className="text-xs font-bold">幻兽防御</span>
                                </button>
                             </div>
                        </div>
                    ) : (
                        <div className="flex-1 border-l border-gray-800 pl-3 flex items-center justify-center text-gray-700 text-xs italic">
                            无幻兽出战
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default CombatOverlay;
