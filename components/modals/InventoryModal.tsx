
import React, { useState, useEffect } from 'react';
import { X, Package, Zap, Trash2, Shield, Sword, Search, ArrowLeft, Star, Heart, Activity } from 'lucide-react';
import { Item, ItemType } from '../../types';

interface InventoryModalProps {
    inventory: Item[];
    onClose: () => void;
    onUse: (item: Item) => void;
    onEquip: (item: Item) => void;
    onDrop: (item: Item) => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, onClose, onUse, onEquip, onDrop }) => {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [filter, setFilter] = useState<'all' | 'consumable' | 'equipment' | 'material'>('all');
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    // Sync selected item with inventory changes (e.g., when quantity decreases or item is removed/equipped)
    useEffect(() => {
        if (selectedItem) {
            const freshItem = inventory.find(i => i.id === selectedItem.id);
            if (!freshItem) {
                // Item removed (consumed, equipped, dropped)
                setSelectedItem(null);
                setShowMobileDetail(false);
            } else {
                // Update reference (e.g. quantity change)
                setSelectedItem(freshItem);
            }
        }
    }, [inventory, selectedItem]);

    const filteredItems = inventory.filter(item => {
        if (filter === 'all') return true;
        return item.type === filter;
    });

    const handleItemClick = (item: Item) => {
        setSelectedItem(item);
        setShowMobileDetail(true);
    };

    const getRarityColor = (rarity: string) => {
        switch(rarity) {
            case 'common': return 'border-gray-700 bg-gray-900/50';
            case 'uncommon': return 'border-green-600/50 bg-green-950/30 text-green-200';
            case 'rare': return 'border-blue-600/50 bg-blue-950/30 text-blue-200 shadow-[0_0_10px_rgba(37,99,235,0.1)]';
            case 'epic': return 'border-purple-600/50 bg-purple-950/30 text-purple-200 shadow-[0_0_10px_rgba(147,51,234,0.1)]';
            case 'legendary': return 'border-yellow-600/50 bg-yellow-950/30 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
            default: return 'border-gray-700 bg-gray-900';
        }
    };

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center backdrop-blur-md animate-fade-in font-['Noto_Sans_SC'] p-0 md:p-6"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0f172a] border border-blue-500/30 rounded-none md:rounded-xl w-full max-w-5xl h-full md:h-[85vh] shadow-[0_0_50px_rgba(59,130,246,0.2)] flex flex-col overflow-hidden relative"
            >
                
                {/* Header */}
                <div className="p-4 border-b border-blue-500/20 bg-[#0B1120] flex items-center justify-between shrink-0 z-30">
                    <div className="flex items-center gap-3">
                        <Package size={24} className="text-blue-400" />
                        <h2 className="text-xl font-bold text-white">背包 ({inventory.length}/50)</h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Desktop Filters */}
                        <div className="hidden md:flex bg-gray-900 rounded p-1 gap-1">
                            {(['all', 'equipment', 'consumable', 'material'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 text-xs rounded transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {f === 'all' ? '全部' : f === 'equipment' ? '装备' : f === 'consumable' ? '消耗品' : '材料'}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-white bg-gray-800/50 p-2 rounded-full hover:bg-red-900/50 transition-colors"
                        >
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Mobile Filters */}
                <div className="md:hidden p-2 bg-[#0B1120] border-b border-gray-800 flex justify-center shrink-0 z-20">
                    <div className="flex bg-gray-900 rounded p-1 gap-1 w-full overflow-x-auto justify-between">
                        {(['all', 'equipment', 'consumable', 'material'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors whitespace-nowrap text-center ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {f === 'all' ? '全部' : f === 'equipment' ? '装备' : f === 'consumable' ? '消耗' : '材料'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Item Grid */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#0f172a] pb-20 md:pb-4">
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 content-start">
                            {filteredItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleItemClick(item)}
                                    className={`
                                        aspect-square rounded-lg border-2 flex flex-col items-center justify-center relative transition-all group
                                        ${getRarityColor(item.rarity)}
                                        ${selectedItem?.id === item.id ? 'ring-2 ring-white scale-105 z-10' : 'hover:scale-105 hover:border-white/30'}
                                    `}
                                >
                                    <span className="text-3xl filter drop-shadow-md">{item.icon || '📦'}</span>
                                    <span className="absolute bottom-1 right-1 text-[10px] font-bold bg-black/60 px-1 rounded text-white backdrop-blur-sm">x{item.quantity}</span>
                                    {item.type === 'equipment' && <div className="absolute top-1 left-1 text-blue-400"><Shield size={10}/></div>}
                                </button>
                            ))}
                             {/* Empty Slots Filler */}
                             {Array(Math.max(0, 32 - filteredItems.length)).fill(0).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square rounded-lg border border-gray-800 bg-[#0B1120]/50"></div>
                            ))}
                        </div>
                    </div>

                    {/* Item Detail Panel (Responsive) */}
                    <div className={`
                        absolute inset-0 md:static md:w-80 bg-[#0B1120] border-l border-blue-500/20 flex flex-col shrink-0 z-40 transition-transform duration-300
                        ${showMobileDetail ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                    `}>
                        {/* Mobile Detail Header */}
                        <div className="md:hidden p-4 border-b border-gray-800 flex items-center justify-between bg-[#0B1120] shrink-0">
                            <button onClick={() => setShowMobileDetail(false)} className="flex items-center gap-2 text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800">
                                <ArrowLeft size={18}/> 返回列表
                            </button>
                            <span className="font-bold text-white">物品详情</span>
                            <div className="w-16"></div> {/* Spacer */}
                        </div>

                        {selectedItem ? (
                            <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
                                <div className="flex flex-col items-center mb-6 shrink-0">
                                    <div className={`w-24 h-24 rounded-lg border-2 flex items-center justify-center text-6xl mb-4 bg-black/30 shadow-lg ${getRarityColor(selectedItem.rarity)}`}>
                                        {selectedItem.icon || '📦'}
                                    </div>
                                    <h3 className="text-xl font-bold text-white text-center leading-tight mb-2">{selectedItem.name}</h3>
                                    <span className={`text-xs px-3 py-1 rounded border uppercase font-bold tracking-wider ${selectedItem.rarity === 'legendary' ? 'text-yellow-400 border-yellow-500/30' : 'text-gray-400 border-gray-700'}`}>
                                        {selectedItem.rarity} · {selectedItem.type}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-4 mb-4">
                                    <div className="bg-gray-900/50 p-4 rounded border border-gray-800 text-sm text-gray-300 leading-relaxed font-serif italic">
                                        "{selectedItem.description}"
                                    </div>
                                    
                                    {selectedItem.effect && (
                                        <div className="text-sm text-blue-300 flex items-center gap-2 bg-blue-900/10 p-3 rounded border border-blue-500/10">
                                            <Zap size={16}/> 
                                            <span className="font-bold">特效:</span> {selectedItem.effect}
                                        </div>
                                    )}

                                    {/* Detailed Stats for Equipment */}
                                    {selectedItem.type === 'equipment' && (
                                         <div className="bg-[#1e293b] p-3 rounded border border-gray-700 space-y-2">
                                            <h4 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">装备属性</h4>
                                            
                                            {/* Explicit Stats from item.stats */}
                                            {selectedItem.stats && (
                                                <>
                                                    {selectedItem.stats.attack && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-red-400 flex items-center gap-1"><Sword size={12}/> 攻击力</span>
                                                            <span className="text-white font-mono">+{selectedItem.stats.attack}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.stats.defense && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-blue-400 flex items-center gap-1"><Shield size={12}/> 防御力</span>
                                                            <span className="text-white font-mono">+{selectedItem.stats.defense}</span>
                                                        </div>
                                                    )}
                                                     {selectedItem.stats.hp && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-green-400 flex items-center gap-1"><Heart size={12}/> 生命值</span>
                                                            <span className="text-white font-mono">+{selectedItem.stats.hp}</span>
                                                        </div>
                                                    )}
                                                     {selectedItem.stats.speed && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-yellow-400 flex items-center gap-1"><Activity size={12}/> 速度</span>
                                                            <span className="text-white font-mono">+{selectedItem.stats.speed}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Fallback parsing for effect strings if stats obj is missing */}
                                            {!selectedItem.stats && selectedItem.effect && (
                                                <>
                                                    {selectedItem.effect.includes('atk') && (
                                                        <div className="text-xs text-red-300 flex items-center gap-2"><Sword size={12}/> 攻击力提升</div>
                                                    )}
                                                    {selectedItem.effect.includes('def') && (
                                                        <div className="text-xs text-blue-300 flex items-center gap-2"><Shield size={12}/> 防御力提升</div>
                                                    )}
                                                </>
                                            )}
                                         </div>
                                    )}

                                    <div className="pt-4 border-t border-gray-800 grid grid-cols-2 gap-2 text-xs text-gray-500">
                                        <div>库存: {selectedItem.quantity}</div>
                                        <div>售价: {selectedItem.price || 0} G</div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-auto shrink-0">
                                    {selectedItem.type === 'consumable' && (
                                        <button 
                                            onClick={() => onUse(selectedItem)}
                                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
                                        >
                                            <Zap size={16}/> 使用物品
                                        </button>
                                    )}
                                    {selectedItem.type === 'equipment' && (
                                        <button 
                                            onClick={() => onEquip(selectedItem)}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                                        >
                                            <Shield size={16}/> 装备
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => onDrop(selectedItem)}
                                        className="w-full py-3 bg-gray-800 hover:bg-red-900/30 hover:text-red-400 text-gray-400 font-bold rounded flex items-center justify-center gap-2 transition-all border border-gray-700 hover:border-red-500/30"
                                    >
                                        <Trash2 size={16}/> 丢弃
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 text-sm">
                                <Search size={48} className="mb-4 opacity-20"/>
                                <p>点击物品查看详情</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;
