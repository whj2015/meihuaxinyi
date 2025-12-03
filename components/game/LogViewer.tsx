
import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { LogEntry } from '../../types';
import { formatText } from '../../utils/textUtils';

interface LogViewerProps {
    logs: LogEntry[];
    isLoading: boolean;
    streamText?: string | null; // Added streamText prop
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, isLoading, streamText }) => {
    const logsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs, streamText]); // Scroll on new stream text

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-[#0B1120] to-[#080c14]">
              {logs.length === 0 && !isLoading && !streamText && (
                 <div className="text-center text-gray-600 mt-20 font-light tracking-widest animate-pulse">正在初始化全息幻境...</div>
              )}
              
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className={`
                    p-3 rounded leading-relaxed text-sm md:text-base animate-fade-in border-l-2
                    ${log.type === 'command' ? 'border-orange-500/50 bg-orange-900/10 text-orange-200 pl-4 text-xs' : 'border-transparent'}
                    ${log.type === 'narrative' ? 'text-teal-50' : ''}
                    ${log.type === 'combat' ? 'bg-red-950/20 border-red-500/50 text-red-100 pl-4 py-4 my-2 shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]' : ''}
                    ${log.type === 'system' ? 'text-gray-400 text-xs py-1 border-gray-700' : ''}
                    ${log.type === 'levelup' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-200 py-6 text-center font-bold text-lg shadow-[0_0_30px_rgba(234,179,8,0.2)]' : ''}
                  `}
                >
                    {log.type === 'command' && <span className="text-orange-500 mr-2 font-bold uppercase tracking-wider">PLAYER &gt;&gt;</span>}
                    {formatText(log.text)}
                </div>
              ))}
              
              {/* Streaming Content Area */}
              {streamText && (
                  <div className="p-3 rounded leading-relaxed text-sm md:text-base border-l-2 border-teal-500/30 text-teal-50 bg-[#0f172a]/50">
                      {formatText(streamText)}
                      <span className="inline-block w-2 h-4 bg-teal-500 ml-1 animate-pulse align-middle"></span>
                  </div>
              )}

              {isLoading && !streamText && (
                 <div className="flex items-center gap-2 text-teal-500/50 p-2 animate-pulse">
                    <Activity size={16} className="animate-spin" />
                    <span className="text-xs">GM 正在演算世界线...</span>
                 </div>
              )}
              <div ref={logsEndRef} />
        </div>
    );
};

export default LogViewer;
