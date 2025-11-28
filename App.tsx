
import React, { useState } from 'react';
import Roadmap from './components/Roadmap';
import DivinationTool from './components/DivinationTool';
import { BookOpen, Compass } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'learn' | 'practice'>('learn');

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-amber-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
                易
            </div>
            <h1 className="font-serif font-bold text-lg md:text-xl tracking-wide">梅花心易</h1>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-full">
            <button 
                onClick={() => setActiveTab('learn')}
                className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'learn' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <BookOpen size={14} className="md:w-4 md:h-4" />
                心法
            </button>
            <button 
                onClick={() => setActiveTab('practice')}
                className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'practice' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Compass size={14} className="md:w-4 md:h-4" />
                演练
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-4 pb-12 max-w-4xl mx-auto min-h-screen">
        {activeTab === 'learn' ? (
             <div className="animate-in fade-in zoom-in-95 duration-300">
                 <div className="text-center mb-8 md:mb-10">
                     <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-4">万物皆有数，心动即天机</h2>
                     <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed px-4">
                        梅花易数不仅是一门预测术，更是一种观察世界的视角。在这里，我们剥离复杂的迷信，回归纯粹的易理逻辑。
                     </p>
                 </div>
                 <Roadmap />
                 <div className="mt-8 text-center pb-8">
                    <button 
                        onClick={() => setActiveTab('practice')}
                        className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                    >
                        开始起卦实践
                    </button>
                 </div>
             </div>
        ) : (
            <div className="animate-in fade-in zoom-in-95 duration-300">
                <DivinationTool />
            </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-xs border-t border-slate-100 mt-auto bg-[#fdfbf7]">
        <p>梅花心易 © 2024 · 善易者不卜</p>
      </footer>
    </div>
  );
}
