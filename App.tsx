
import React, { useState } from 'react';
import Roadmap from './components/Roadmap';
import DivinationTool from './components/DivinationTool';
import HexagramLib from './components/HexagramLib';
import { BookOpen, Compass, Library } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'library'>('learn');

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-amber-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#fdfbf7]/90 backdrop-blur-md z-50 transition-all duration-300 border-b border-transparent scrolled:border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('learn')}>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-serif font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                易
            </div>
            <div className="flex flex-col">
                <h1 className="font-serif font-bold text-lg md:text-xl tracking-wider text-slate-900 leading-none">梅花心易</h1>
                <span className="text-[10px] text-slate-400 font-medium tracking-widest mt-1 uppercase">Mind I-Ching</span>
            </div>
          </div>
          <nav className="flex gap-1 bg-white/50 p-1.5 rounded-full border border-slate-200/50 shadow-sm backdrop-blur-sm">
            <button 
                onClick={() => setActiveTab('learn')}
                className={`px-3 md:px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'learn' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
                <BookOpen size={14} className="md:w-4 md:h-4" />
                心法
            </button>
            <button 
                onClick={() => setActiveTab('library')}
                className={`px-3 md:px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'library' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
                <Library size={14} className="md:w-4 md:h-4" />
                卦典
            </button>
            <button 
                onClick={() => setActiveTab('practice')}
                className={`px-3 md:px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'practice' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
                <Compass size={14} className="md:w-4 md:h-4" />
                演练
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 md:pt-32 px-4 pb-20 max-w-5xl mx-auto min-h-screen">
        {activeTab === 'learn' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="text-center mb-10 md:mb-16">
                     <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-6">万物皆有数，心动即天机</h2>
                     <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-serif">
                        梅花易数不仅是一门预测术，更是一种观察世界的视角。<br className="hidden md:block"/>在这里，我们剥离复杂的迷信，回归纯粹的易理逻辑。
                     </p>
                 </div>
                 <Roadmap />
                 <div className="mt-12 text-center pb-10">
                    <button 
                        onClick={() => setActiveTab('practice')}
                        className="bg-slate-900 text-white px-10 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 text-lg"
                    >
                        开始起卦实践
                    </button>
                 </div>
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
      
      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200/50 mt-auto bg-[#fdfbf7]">
        <p className="text-slate-400 text-xs font-serif tracking-widest">梅花心易 © 2024 · 善易者不卜</p>
      </footer>
    </div>
  );
}
