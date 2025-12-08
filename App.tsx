
import React, { useState } from 'react';
import Roadmap from './components/Roadmap';
import DivinationTool from './components/DivinationTool';
import HexagramLib from './components/HexagramLib';
import DailyDivination from './components/DailyDivination';
import { BookOpen, Compass, Library, Sun } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'library' | 'daily'>('daily');

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-amber-100 pb-24 md:pb-0">
      
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#fdfbf7]/90 backdrop-blur-md z-40 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-center md:justify-between relative">
          
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('daily')}>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
                易
            </div>
            <div className="flex flex-col items-start">
                <h1 className="font-serif font-bold text-lg text-slate-900 leading-none tracking-widest">梅花心易</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1 bg-white p-1 rounded-full border border-slate-100 shadow-sm">
            <NavButton active={activeTab === 'learn'} onClick={() => setActiveTab('learn')} icon={<BookOpen size={14} />} label="心法" />
            <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Library size={14} />} label="卦典" />
            <NavButton active={activeTab === 'practice'} onClick={() => setActiveTab('practice')} icon={<Compass size={14} />} label="起卦" />
            <NavButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<Sun size={14} />} label="今日" />
          </nav>

        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-4 md:px-6 max-w-5xl mx-auto min-h-[calc(100vh-80px)]">
        {activeTab === 'learn' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <Roadmap />
             </div>
        )}
        
        {activeTab === 'daily' && (
             <div className="animate-in fade-in zoom-in-95 duration-500">
                <DailyDivination />
             </div>
        )}

        {activeTab === 'library' && (
             <div className="animate-in fade-in zoom-in-95 duration-300">
                <HexagramLib />
             </div>
        )}

        {activeTab === 'practice' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
                <DivinationTool />
            </div>
        )}
      </main>
      
      {/* Mobile Bottom Navigation Bar - Floating Style */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-800 flex justify-between items-center px-6 py-4">
            <MobileNavItem active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<Sun size={20} />} label="晨卜" />
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
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
        {icon}
        {label}
    </button>
);

const MobileNavItem = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center space-y-1 active:scale-90 transition-transform ${active ? 'text-amber-400' : 'text-slate-500'}`}
    >
        <div className={`transition-all duration-300`}>
            {icon}
        </div>
        <span className="text-[9px] font-bold">{label}</span>
    </button>
);
