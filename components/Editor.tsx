
import React, { useRef, useEffect } from 'react';

interface EditorProps {
  code: string;
  onChange: (value: string) => void;
}

/**
 * A robust tokenizer for Mermaid syntax.
 * It processes the raw text and generates sanitized HTML with spans for highlighting.
 */
const highlightMermaid = (code: string) => {
  const tokens = [
    { name: 'comment', regex: /%%.*/, class: 'text-slate-500 italic' },
    { name: 'string', regex: /".*?"/, class: 'text-emerald-400 font-medium' },
    { name: 'pipe-label', regex: /\|.*?\|/, class: 'text-sky-400' },
    { name: 'keyword', regex: /\b(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|gantt|pie|gitGraph|stateDiagram|journey|info|TD|LR|TB|BT|RL|subgraph|end|participant|actor|as|loop|alt|else|opt|rect|note|over|left of|right of|activate|deactivate|title|section|class|style|linkStyle|click|callback|direction)\b/, class: 'text-indigo-400 font-bold' },
    { name: 'arrow', regex: /(-->|--|-->>|->|->>|--\)|-\)|-x|--x|==>|==|~~|~|<--|<-|<==|<-->)/, class: 'text-amber-500 font-medium' },
    { name: 'bracket', regex: /(\[|\]|\(|\)|\{|\}|>)/, class: 'text-purple-400 font-bold' },
  ];

  // Create a combined regex with capturing groups for each token type
  const combinedRegex = new RegExp(
    tokens.map(t => `(${t.regex.source})`).join('|'),
    'g'
  );

  let html = '';
  let lastIndex = 0;
  let match;

  // Manual iteration to ensure every piece of text is handled correctly
  while ((match = combinedRegex.exec(code)) !== null) {
    // 1. Handle non-matched text before this match
    const before = code.substring(lastIndex, match.index);
    html += before
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Determine which group matched and apply class
    let matchedText = match[0];
    let appliedClass = '';
    
    // Find which index in match array is defined (index 1 to tokens.length)
    for (let i = 0; i < tokens.length; i++) {
      if (match[i + 1] !== undefined) {
        appliedClass = tokens[i].class;
        break;
      }
    }

    const escapedMatch = matchedText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (appliedClass) {
      html += `<span class="${appliedClass}">${escapedMatch}</span>`;
    } else {
      html += escapedMatch;
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // 3. Handle remaining text after the last match
  const remaining = code.substring(lastIndex);
  html += remaining
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return html;
};

const Editor: React.FC<EditorProps> = ({ code, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineCount = code.split('\n').length;

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    handleScroll();
  }, [code]);

  // Shared styles for perfect pixel alignment across layers
  const sharedStyles: React.CSSProperties = {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '14px',
    lineHeight: '24px',
    padding: '16px',
    tabSize: 4,
    whiteSpace: 'pre',
    wordBreak: 'keep-all',
    overflowWrap: 'normal',
    boxSizing: 'border-box',
    letterSpacing: 'normal',
    fontVariantLigatures: 'none',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  return (
    <div className="flex h-full w-full bg-slate-900 overflow-hidden relative">
      {/* Line Numbers */}
      <div className="hidden sm:flex flex-col items-end pt-4 pr-2 pl-3 bg-slate-950 text-slate-700 font-mono text-[10px] select-none border-r border-slate-800 w-10 shrink-0 z-10">
        {Array.from({ length: Math.max(lineCount, 50) }).map((_, i) => (
          <div key={i} className="leading-6 h-6">{i + 1}</div>
        ))}
      </div>

      <div className="relative flex-1 h-full overflow-hidden">
        {/* Highlighted Layer (Visuals) */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="absolute inset-0 m-0 pointer-events-none text-slate-300 overflow-hidden"
          style={sharedStyles}
          dangerouslySetInnerHTML={{ __html: highlightMermaid(code) + '\n' }}
        />

        {/* Interaction Layer (Input) */}
        <textarea
          ref={textareaRef}
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white outline-none resize-none overflow-auto custom-scrollbar selection:bg-indigo-500/30"
          style={sharedStyles}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          placeholder="Type your mermaid code here..."
        />
      </div>
    </div>
  );
};

export default Editor;
