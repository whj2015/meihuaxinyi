
import React, { useState } from 'react';
import Roadmap from './components/Roadmap';
import DivinationTool from './components/DivinationTool';
import HexagramLib from './components/HexagramLib';
import DailyDivination from './components/DailyDivination';
import { BookOpen, Compass, Library, Sun, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'library' | 'daily'>('daily'); // 默认进今日，增加粘性

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-amber-100 pb-24 md:pb-0">
      
      {/* Top Header (Mobile & Desktop) - Simplified */}
      <header className="fixed top-0 left-0 right-0 bg-[#fdfbf7]/90 backdrop-blur-md z-40 border-b border-slate-100/50 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 h-14 md:h-20 flex items-center justify-center md:justify-between relative">
          
          {/* Brand - Center on Mobile, Left on Desktop */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('learn')}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-serif font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                易
            </div>
            <div className="flex flex-col items-start">
                <h1 className="font-serif font-bold text-lg md:text-xl tracking-wider text-slate-900 leading-none">梅花心易</h1>
                <span className="hidden md:block text-[10px] text-slate-400 font-medium tracking-widest mt-1 uppercase">Mind I-Ching</span>
            </div>
          </div>

          {/* Desktop Navigation (Hidden on Mobile) */}
          <nav className="hidden md:flex gap-1 bg-white/50 p-1.5 rounded-full border border-slate-200/50 shadow-sm backdrop-blur-sm">
            <NavButton active={activeTab === 'learn'} onClick={() => setActiveTab('learn')} icon={<BookOpen size={16} />} label="心法" />
            <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Library size={16} />} label="卦典" />
            <NavButton active={activeTab === 'practice'} onClick={() => setActiveTab('practice')} icon={<Compass size={16} />} label="起卦" />
            <NavButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<Sun size={16} />} label="今日" />
          </nav>

        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 md:px-6 max-w-5xl mx-auto min-h-[calc(100vh-80px)]">
        {activeTab === 'learn' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="text-center mb-8 md:mb-16 pt-4 md:pt-10">
                     <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 mb-4 md:mb-6">万物皆有数，心动即天机</h2>
                     <p className="text-slate-500 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-serif px-4">
                        梅花易数不仅是一门预测术，更是一种观察世界的视角。<br className="hidden md:block"/>剥离复杂的迷信，回归纯粹的易理逻辑。
                     </p>
                 </div>
                 <Roadmap />
                 <div className="mt-12 text-center pb-10">
                    <button 
                        onClick={() => setActiveTab('practice')}
                        className="bg-slate-900 text-white px-8 py-3 md:px-10 md:py-4 rounded-full font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 text-base md:text-lg flex items-center gap-2 mx-auto"
                    >
                        <Compass size={20}/> 开始起卦实践
                    </button>
                 </div>
             </div>
        )}
        
        {activeTab === 'daily' && (
             <div className="animate-in fade-in zoom-in-95 duration-300 pt-2 md:pt-6">
                <DailyDivination />
             </div>
        )}

        {activeTab === 'library' && (
             <div className="animate-in fade-in zoom-in-95 duration-300 pt-2 md:pt-6">
                <HexagramLib />
             </div>
        )}

        {activeTab === 'practice' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 pt-2 md:pt-6">
                <DivinationTool />
            </div>
        )}
      </main>
      
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/60 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
            <MobileNavItem active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<Sun size={20} />} label="今日" />
            <MobileNavItem active={activeTab === 'practice'} onClick={() => setActiveTab('practice')} icon={<Compass size={20} />} label="起卦" />
            <MobileNavItem active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Library size={20} />} label="卦典" />
            <MobileNavItem active={activeTab === 'learn'} onClick={() => setActiveTab('learn')} icon={<BookOpen size={20} />} label="心法" />
        </div>
      </div>

    </div>
  );
}

// Helper Components
const NavButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 shrink-0 ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
    >
        {icon}
        {label}
    </button>
);

const MobileNavItem = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-90 transition-transform ${active ? 'text-slate-900' : 'text-slate-400'}`}
    >
        <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-amber-100 text-slate-900' : 'bg-transparent'}`}>
            {icon}
        </div>
        <span className={`text-[10px] font-bold ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
    </button>
);
