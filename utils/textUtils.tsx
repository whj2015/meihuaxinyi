
import React from 'react';

export const formatText = (text: string) => {
    const isSystemLine = text.startsWith('> ');
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return (
      <span className={isSystemLine ? "text-yellow-400 font-mono italic" : ""}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);
            if (!isNaN(Number(content))) {
                 return <span key={i} className="text-red-500 font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] text-lg mx-1">{content}</span>;
            }
            return <span key={i} className="text-orange-400 font-bold mx-0.5">{content}</span>;
          }
          return part;
        })}
      </span>
    );
};
