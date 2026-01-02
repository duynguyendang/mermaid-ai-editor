
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import { DEFAULT_DIAGRAM, TEMPLATES } from './constants';
import { generateDiagramFromText, fixMermaidSyntax } from './services/geminiService';

const App: React.FC = () => {
  const [code, setCode] = useState<string>(DEFAULT_DIAGRAM);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  
  // UI State
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // Percentage
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isResizing, setIsResizing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with local storage
  useEffect(() => {
    const saved = localStorage.getItem('mermaid_code');
    if (saved) setCode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('mermaid_code', code);
  }, [code]);

  const handleAiAction = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!aiPrompt.trim() || isAiLoading) return;
    
    const userMsg = aiPrompt;
    setAiPrompt('');
    setIsAiLoading(true);

    try {
      const generatedCode = await generateDiagramFromText(userMsg, code);
      setCode(generatedCode);
    } catch (err) {
      console.error(err);
      alert('AI failed to process. Try a different prompt.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAutofix = async (errorMsg: string) => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      const fixedCode = await fixMermaidSyntax(code, errorMsg);
      setCode(fixedCode);
    } catch (err) {
      console.error(err);
      alert('AI could not fix the syntax automatically. Please check the code.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExportSvg = () => {
    const svgElement = document.querySelector('.mermaid-container svg');
    if (!svgElement) return;
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    });
  };

  // Resize Handler
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const onResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const newWidth = (e.clientX / containerWidth) * 100;
    if (newWidth > 15 && newWidth < 85) {
      setLeftPanelWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', onResize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', onResize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [onResize, stopResizing]);

  const toggleEditor = () => {
    setIsEditorVisible(!isEditorVisible);
  };

  const adjustZoom = (delta: number) => {
    setPreviewZoom(prev => Math.min(Math.max(prev + delta, 0.1), 5));
  };

  const resetZoom = () => setPreviewZoom(1);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 select-none">
      {/* Sleek Header */}
      <header className="h-14 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <h1 className="text-sm font-bold text-slate-100 tracking-tight hidden sm:block">MermaidAI Pro</h1>
          <button 
            onClick={toggleEditor}
            className={`ml-4 px-3 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 ${
              isEditorVisible ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isEditorVisible ? 'Hide Editor' : 'Show Editor'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            Templates
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1"></div>
          <button 
            onClick={copyToClipboard}
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-all"
          >
            Copy
          </button>
          <button 
            onClick={handleExportSvg}
            className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-all shadow-lg active:scale-95"
          >
            Export SVG
          </button>
        </div>
      </header>

      <main ref={containerRef} className="flex flex-1 overflow-hidden relative">
        {/* Templates Overlay */}
        {showTemplates && (
          <div className="absolute top-2 right-4 w-60 bg-slate-800 shadow-2xl rounded-lg border border-slate-700 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1">Sample Diagrams</h3>
            <div className="space-y-0.5">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setCode(t.code); setShowTemplates(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white rounded flex items-center gap-3 transition-colors group"
                >
                  <span className="text-base">{t.icon}</span>
                  <span className="font-medium">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Left: Editor and AI (only if visible) */}
        {isEditorVisible && (
          <div 
            className="flex flex-col min-w-0 border-r border-slate-800 shrink-0" 
            style={{ width: `${leftPanelWidth}%` }}
          >
            <div className="flex-1 overflow-hidden relative">
               <Editor code={code} onChange={setCode} />
               {isAiLoading && (
                 <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-none">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse text-center px-4">AI Processing...</span>
                    </div>
                 </div>
               )}
            </div>

            {/* AI Magic Bar (stays with editor) */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
              <form onSubmit={handleAiAction} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-100"></div>
                <div className="relative flex items-center bg-slate-800 rounded-full overflow-hidden border border-slate-700 transition-all focus-within:border-indigo-500/50">
                  <div className="pl-4 text-indigo-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="AI modify diagram..."
                    className="flex-1 bg-transparent text-slate-100 text-xs sm:text-sm px-3 py-3 outline-none placeholder:text-slate-500 min-w-0"
                    disabled={isAiLoading}
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className={`px-4 py-3 text-[10px] font-bold transition-all shrink-0 ${
                      aiPrompt.trim() && !isAiLoading 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500' 
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Resizer Handle */}
        {isEditorVisible && (
          <div 
            className={`w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20 shrink-0 ${isResizing ? 'bg-indigo-500' : 'bg-slate-800'}`}
            onMouseDown={startResizing}
          ></div>
        )}

        {/* Right: Modern Preview Area */}
        <div className="flex-1 bg-slate-50 overflow-hidden flex flex-col relative">
          {/* Zoom & Control Tools */}
          <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
            <div className="flex bg-white/90 backdrop-blur border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              <button 
                onClick={() => adjustZoom(0.1)}
                className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Zoom In"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
              <div className="w-px bg-slate-200"></div>
              <button 
                onClick={() => adjustZoom(-0.1)}
                className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Zoom Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
              </button>
              <div className="w-px bg-slate-200"></div>
              <button 
                onClick={resetZoom}
                className="px-3 text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                {Math.round(previewZoom * 100)}%
              </button>
            </div>
            
            {!isEditorVisible && (
               <div className="p-4 bg-slate-900/10 backdrop-blur rounded-xl border border-slate-200 shadow-xl max-w-sm animate-in slide-in-from-right-2">
                  <form onSubmit={handleAiAction} className="flex gap-2">
                     <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="AI quick modify..."
                        className="flex-1 bg-white px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                     />
                     <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                     </button>
                  </form>
               </div>
            )}
          </div>

          <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
            <span className="px-2 py-1 bg-white/80 backdrop-blur border border-slate-200 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
              Live Render
            </span>
            {isResizing && <span className="text-[10px] font-bold text-indigo-500 animate-pulse">RESIZING...</span>}
          </div>

          <div className="flex-1 p-4 md:p-8 overflow-hidden select-text">
             <Preview 
                code={code} 
                zoom={previewZoom} 
                onZoomChange={setPreviewZoom} 
                onAutofix={handleAutofix}
                isFixing={isAiLoading}
             />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
