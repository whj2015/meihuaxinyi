import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Scan, Footprints, Move, Lock, MapPin } from 'lucide-react';
import { LocationExit, LocationData } from '../../types';

interface LocationMapProps {
    exits: LocationExit[];
    currentLocationName: string;
    currentLocationId?: string;
    worldRegistry?: Record<string, LocationData>;
    onMove: (direction: string) => void;
    onExplore: () => void;
}

// Layout Configuration
const GRID_SIZE = 140; // Distance between nodes

const getVector = (cardinal: string) => {
    switch(cardinal) {
        case 'N': return { x: 0, y: -1 };
        case 'S': return { x: 0, y: 1 };
        case 'E': return { x: 1, y: 0 };
        case 'W': return { x: -1, y: 0 };
        case 'NE': return { x: 0.8, y: -0.8 };
        case 'NW': return { x: -0.8, y: -0.8 };
        case 'SE': return { x: 0.8, y: 0.8 };
        case 'SW': return { x: -0.8, y: 0.8 };
        case 'UP': return { x: 0.4, y: -0.4 }; 
        case 'DOWN': return { x: -0.4, y: 0.4 };
        default: return { x: 0.5, y: 0.5 };
    }
};

interface GraphNode {
    id: string;
    name: string;
    x: number;
    y: number;
    visited: boolean;
    isCurrent: boolean;
    data?: LocationData;
}

interface GraphEdge {
    from: string;
    to: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label: string;
    direction: string; // Command to move
    isDiscovered: boolean; // If false, target is unknown/hidden
}

const LocationMap: React.FC<LocationMapProps> = ({ 
    exits, currentLocationName, currentLocationId, worldRegistry, onMove, onExplore 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialOffset = useRef({ x: 0, y: 0 });
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

    // Clean name helper
    const cleanName = (label: string) => label.replace(/[^\u4e00-\u9fa5]/g, '') || label;

    // --- Build Graph Logic ---
    const { nodes, edges } = useMemo(() => {
        const tempNodes = new Map<string, GraphNode>();
        const tempEdges: GraphEdge[] = [];
        const queue: { id: string, x: number, y: number }[] = [];
        const processed = new Set<string>();

        // Start with current location at (0,0)
        const startId = currentLocationId || 'start';
        queue.push({ id: startId, x: 0, y: 0 });
        
        // Initial node (even if not in registry fully, we create a placeholder)
        tempNodes.set(startId, {
            id: startId,
            name: currentLocationName,
            x: 0,
            y: 0,
            visited: true,
            isCurrent: true,
            data: worldRegistry?.[startId]
        });

        // BFS to generate layout
        while (queue.length > 0) {
            const curr = queue.shift()!;
            if (processed.has(curr.id)) continue;
            processed.add(curr.id);

            // Get Data (Exits)
            // 1. Try WorldRegistry
            let currentExits: LocationExit[] = [];
            
            if (worldRegistry && worldRegistry[curr.id]) {
                // If we have visited this place, we know all its exits
                // Use visibleExits if available (dynamic discovery), else config exits
                currentExits = worldRegistry[curr.id].visibleExits || [];
            } else if (curr.id === startId) {
                // Fallback for current location if registry sync issue
                currentExits = exits;
            }

            // Process Exits
            for (const exit of currentExits) {
                const vec = getVector(exit.cardinal);
                const targetX = curr.x + (vec.x * GRID_SIZE);
                const targetY = curr.y + (vec.y * GRID_SIZE);
                const targetId = exit.targetId;

                // Add Edge
                tempEdges.push({
                    from: curr.id,
                    to: targetId,
                    x1: curr.x,
                    y1: curr.y,
                    x2: targetX,
                    y2: targetY,
                    label: exit.directionLabel,
                    direction: exit.direction,
                    isDiscovered: true
                });

                // Add Node if not exists
                if (!tempNodes.has(targetId)) {
                    const isVisited = worldRegistry ? !!worldRegistry[targetId] : false;
                    const targetName = worldRegistry?.[targetId]?.name || cleanName(exit.directionLabel);
                    
                    tempNodes.set(targetId, {
                        id: targetId,
                        name: targetName,
                        x: targetX,
                        y: targetY,
                        visited: isVisited,
                        isCurrent: targetId === startId,
                        data: worldRegistry?.[targetId]
                    });

                    // Only continue traversing if we have visited this node (Fog of War logic)
                    // If we haven't visited, we display it but don't branch out from it
                    if (isVisited) {
                        queue.push({ id: targetId, x: targetX, y: targetY });
                    }
                }
            }
        }

        return { nodes: Array.from(tempNodes.values()), edges: tempEdges };
    }, [currentLocationId, worldRegistry, exits, currentLocationName]);

    // Initialize & Handle Resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                setContainerSize({ w: offsetWidth, h: offsetHeight });
                // Only set initial offset if it's 0,0 (first load)
                if (offset.x === 0 && offset.y === 0) {
                     setOffset({ x: offsetWidth / 2, y: offsetHeight / 2 });
                }
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Center view when location changes (Graph rebuilds, 0,0 becomes new center)
    useEffect(() => {
        if (containerSize.w > 0 && containerSize.h > 0) {
             setOffset({ x: containerSize.w / 2, y: containerSize.h / 2 });
        }
    }, [currentLocationId, containerSize]);

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        dragStart.current = { x: clientX, y: clientY };
        initialOffset.current = { ...offset };
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - dragStart.current.x;
        const dy = clientY - dragStart.current.y;

        setOffset({
            x: initialOffset.current.x + dx,
            y: initialOffset.current.y + dy
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleNodeClick = (e: React.MouseEvent, node: GraphNode) => {
        e.stopPropagation(); 
        
        // 1. Center this node visually immediately
        if (containerSize.w > 0) {
             setOffset({
                 x: (containerSize.w / 2) - node.x,
                 y: (containerSize.h / 2) - node.y
             });
        }

        // 2. Perform Move Logic
        if (node.isCurrent) return; // Already here

        const startId = currentLocationId || 'start';
        const edgeToHere = edges.find(edge => edge.from === startId && edge.to === node.id);

        if (edgeToHere) {
            onMove(edgeToHere.direction);
        } else {
            // Can't move directly (not a neighbor)
            // But we already centered the view on it, which is good UX for inspecting.
        }
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-full relative font-['Noto_Sans_SC'] bg-[#0B1120] rounded-xl border border-teal-500/20 shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] overflow-hidden cursor-move group/map"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            {/* Grid Pattern Background */}
            <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#14b8a6 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    transform: `translate(${offset.x % 20}px, ${offset.y % 20}px)`
                }}
            ></div>

            {/* Explore Button (Fixed Top Left) */}
            <button
                onClick={(e) => { e.stopPropagation(); onExplore(); }}
                className="absolute top-3 left-3 z-40 bg-teal-950/90 hover:bg-teal-900 border border-teal-500/50 text-teal-300 px-3 py-2 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(20,184,166,0.3)] flex items-center gap-2 transition-all active:scale-95 font-bold text-xs uppercase tracking-wider group"
            >
                <Footprints size={14} className="group-hover:animate-bounce"/> 探索区域
            </button>
            
            {/* Legend / Hint */}
            <div className="absolute bottom-2 right-2 z-30 flex items-center gap-2 pointer-events-none opacity-50">
                 <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded text-[9px] text-gray-400">
                     <Move size={10} /> 拖动视角
                 </div>
            </div>

            {/* Canvas Content with Smooth Transition */}
            <div 
                className="absolute top-0 left-0 w-full h-full pointer-events-none transition-transform duration-500 ease-out"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            >
                {/* 1. Edges (Lines) */}
                <svg className="absolute overflow-visible" style={{ left: 0, top: 0 }}>
                    <defs>
                        <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.3" />
                            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.3" />
                        </linearGradient>
                    </defs>
                    {edges.map((edge, i) => (
                        <g key={`edge-${i}`}>
                            <line 
                                x1={edge.x1} y1={edge.y1} 
                                x2={edge.x2} y2={edge.y2} 
                                stroke="url(#edgeGradient)" 
                                strokeWidth="2"
                                className="opacity-50"
                            />
                            {/* Animated Flow Line */}
                            <line 
                                x1={edge.x1} y1={edge.y1} 
                                x2={edge.x2} y2={edge.y2} 
                                stroke="#5eead4" 
                                strokeWidth="1"
                                strokeDasharray="6,6"
                                className="animate-dash-flow opacity-40"
                            />
                        </g>
                    ))}
                </svg>

                {/* 2. Nodes */}
                {nodes.map((node) => {
                    // Logic: If node is visited, show full card. 
                    // If not visited (but is a neighbor), show mini "hidden" node attached to line.
                    if (!node.visited) {
                         // Unvisited Node Style (Small label on line end)
                         return (
                            <div 
                                key={node.id}
                                className="absolute flex items-center justify-center z-10 pointer-events-auto cursor-pointer group"
                                style={{ transform: `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)` }}
                                onClick={(e) => handleNodeClick(e, node)}
                            >
                                <div className="flex flex-col items-center transition-transform group-hover:scale-110">
                                    <div className="w-3 h-3 rounded-full bg-gray-600 border-2 border-gray-400 mb-1 shadow-[0_0_5px_rgba(107,114,128,0.5)] group-hover:bg-teal-500 group-hover:border-teal-300 transition-colors"></div>
                                    <div className="bg-black/80 border border-gray-600 text-gray-400 px-2 py-0.5 rounded text-[10px] backdrop-blur-sm whitespace-nowrap flex items-center gap-1 group-hover:text-white group-hover:border-teal-500 transition-colors">
                                        <Lock size={8} /> {cleanName(node.name)}
                                    </div>
                                </div>
                            </div>
                         );
                    }

                    // Visited Node Style (Full Card)
                    return (
                        <div 
                            key={node.id}
                            className={`absolute flex flex-col items-center justify-center pointer-events-auto transition-all duration-300 cursor-pointer ${node.isCurrent ? 'z-30 scale-110' : 'z-20 hover:scale-105'}`}
                            style={{ transform: `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)` }}
                            onClick={(e) => handleNodeClick(e, node)}
                        >
                            {/* Current Location Ping Effect */}
                            {node.isCurrent && (
                                <div className="absolute inset-0 rounded-lg bg-teal-500/20 animate-ping-slow pointer-events-none"></div>
                            )}

                            {/* Node Body */}
                            <div 
                                className={`
                                    relative flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border backdrop-blur-md min-w-[80px] justify-center
                                    ${node.isCurrent 
                                        ? 'bg-teal-950/80 border-teal-400 text-teal-100 shadow-[0_0_20px_rgba(20,184,166,0.4)]' 
                                        : 'bg-[#1e293b]/90 border-gray-600 text-gray-300 hover:border-teal-500/50 hover:text-white'}
                                `}
                            >
                                {node.isCurrent ? <Scan size={14} className="animate-pulse text-teal-400"/> : <MapPin size={12} className="text-gray-500"/>}
                                <span className="text-xs font-bold whitespace-nowrap">{cleanName(node.name)}</span>
                            </div>

                            {/* Danger Level Tag (if available in data) */}
                            {node.data?.dangerLevel && node.isCurrent && (
                                <div className="absolute -bottom-4 bg-red-950/80 text-[8px] text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 whitespace-nowrap">
                                    {node.data.dangerLevel}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LocationMap;