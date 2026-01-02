
import React from 'react';

interface EditorProps {
  code: string;
  onChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ code, onChange }) => {
  const lineCount = code.split('\n').length;
  
  return (
    <div className="flex h-full w-full bg-slate-900 overflow-hidden">
      <div className="hidden sm:flex flex-col items-end pt-4 pr-2 pl-3 bg-slate-900/50 text-slate-600 font-mono text-xs select-none border-r border-slate-800 w-10 shrink-0">
        {Array.from({ length: Math.max(lineCount, 30) }).map((_, i) => (
          <div key={i} className="leading-6 h-6">{i + 1}</div>
        ))}
      </div>
      <textarea
        className="flex-1 bg-transparent text-slate-100 font-mono text-sm leading-6 p-4 focus:outline-none resize-none overflow-auto custom-scrollbar"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Type your mermaid code here..."
      />
    </div>
  );
};

export default Editor;
