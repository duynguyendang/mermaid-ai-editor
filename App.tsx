import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import ApiSettings, { ApiConfig, AIProvider } from './components/ApiSettings';
import { DEFAULT_DIAGRAM, TEMPLATES } from './constants';
import { generateDiagramFromText as generateFromGemini, fixMermaidSyntax as fixWithGemini } from './services/geminiService';
import { generateDiagramFromText as generateFromOpenAI, fixMermaidSyntax as fixWithOpenAI } from './services/openaiService';

const DEFAULT_API_CONFIG: ApiConfig = {
  provider: 'gemini',
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  gemini: {
    apiKey: '',
  },
};

const App: React.FC = () => {
  const [code, setCode] = useState<string>(DEFAULT_DIAGRAM);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  
  // UI State
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // Percentage
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isResizing, setIsResizing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);
  const templatesButtonRef = useRef<HTMLButtonElement>(null);

  // Load API config from local storage
  useEffect(() => {
    const savedConfig = localStorage.getItem('mermaid_api_config');
    if (savedConfig) {
      try {
        setApiConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse API config:', e);
      }
    }
  }, []);

  // Save API config to local storage
  useEffect(() => {
    localStorage.setItem('mermaid_api_config', JSON.stringify(apiConfig));
  }, [apiConfig]);

  // Sync code with local storage
  useEffect(() => {
    const saved = localStorage.getItem('mermaid_code');
    if (saved) setCode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('mermaid_code', code);
  }, [code]);

  // Handle click outside for templates
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showTemplates &&
        templatesRef.current &&
        !templatesRef.current.contains(event.target as Node) &&
        templatesButtonRef.current &&
        !templatesButtonRef.current.contains(event.target as Node)
      ) {
        setShowTemplates(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTemplates]);

  const handleAiAction = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!aiPrompt.trim() || isAiLoading) return;
    
    const userMsg = aiPrompt;
    setAiPrompt('');
    setIsAiLoading(true);

    try {
      let generatedCode: string;
      
      if (apiConfig.provider === 'openai') {
        if (!apiConfig.openai.apiKey) {
          throw new Error('Please configure your OpenAI API key in settings.');
        }
        generatedCode = await generateFromOpenAI(userMsg, code, apiConfig.openai);
      } else {
        if (!apiConfig.gemini.apiKey) {
          throw new Error('Please configure your Gemini API key in settings.');
        }
        generatedCode = await generateFromGemini(userMsg, code);
      }
      
      setCode(generatedCode);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'AI failed to process. Try a different prompt.';
      alert(errorMessage);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAutofix = async (errorMsg: string) => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      let fixedCode: string;
      
      if (apiConfig.provider === 'openai') {
        if (!apiConfig.openai.apiKey) {
          throw new Error('Please configure your OpenAI API key in settings.');
        }
        fixedCode = await fixWithOpenAI(code, errorMsg, apiConfig.openai);
      } else {
        if (!apiConfig.gemini.apiKey) {
          throw new Error('Please configure your Gemini API key in settings.');
        }
        fixedCode = await fixWithGemini(code, errorMsg);
      }
      
      setCode(fixedCode);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'AI could not fix the syntax automatically. Please check the code.';
      alert(errorMessage);
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

  const handleExportMd = () => {
    const mdContent = `# Mermaid Diagram\n\n\`\`\`mermaid\n${code}\n\`\`\``;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    const svgElement = document.querySelector('.mermaid-container svg') as SVGSVGElement;
    if (!svgElement) {
      alert("No diagram found to export.");
      return;
    }

    // Capture precise SVG dimensions
    const width = svgElement.viewBox.baseVal.width || svgElement.width.baseVal.value || 800;
    const height = svgElement.viewBox.baseVal.height || svgElement.height.baseVal.value || 600;

    // Use a high scale for sharp PNG output
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Standard serialization with explicit namespaces
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);
    
    // Ensure the SVG string has a proper XML declaration and dimensions
    if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    // Use crossOrigin to help prevent tainting if external resources were somehow included
    img.crossOrigin = 'anonymous'; 

    img.onload = () => {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width * scale, height * scale);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'diagram.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } catch (err) {
        console.error("Export Error:", err);
        alert("Failed to export PNG. This usually happens when the diagram contains complex HTML labels. Try reducing label complexity or using SVG export.");
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      console.error("Image loading failed for PNG export.");
      URL.revokeObjectURL(url);
      alert("Failed to process diagram for PNG export.");
    };

    img.src = url;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    });
  };

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

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

  const toggleEditor = () => setIsEditorVisible(!isEditorVisible);
  const adjustZoom = (delta: number) => setPreviewZoom(prev => Math.min(Math.max(prev + delta, 0.1), 5));
  const resetZoom = () => setPreviewZoom(1);

  const getProviderLabel = () => {
    switch (apiConfig.provider) {
      case 'openai':
        return apiConfig.openai.baseUrl.includes('openai.com') ? 'OpenAI' : 'OpenAI Compatible';
      case 'gemini':
        return 'Gemini';
      default:
        return 'AI';
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 select-none">
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
          <span className="px-2 py-1 bg-slate-800 text-[10px] font-semibold text-slate-400 rounded">
            {getProviderLabel()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowApiSettings(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-all flex items-center gap-1.5"
            title="API Settings"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543-.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-1.756.426-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Settings</span>
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1"></div>
          <button 
            ref={templatesButtonRef}
            onClick={() => setShowTemplates(!showTemplates)}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all flex items-center gap-1.5 ${
              showTemplates ? 'text-slate-100 bg-slate-800' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
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
            onClick={handleExportMd}
            className="px-4 py-1.5 text-xs font-bold text-indigo-300 bg-slate-800 hover:bg-slate-700 border border-indigo-500/20 rounded transition-all shadow-lg active:scale-95"
          >
            Export MD
          </button>
          <button 
            onClick={handleExportPng}
            className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-all shadow-lg active:scale-95"
          >
            Export PNG
          </button>
          <button 
            onClick={handleExportSvg}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded transition-all shadow-lg active:scale-95"
          >
            Export SVG
          </button>
        </div>
      </header>

      <main ref={containerRef} className="flex flex-1 overflow-hidden relative">
        {showTemplates && (
          <div 
            ref={templatesRef}
            className="absolute top-2 right-4 w-60 bg-slate-800 shadow-2xl rounded-lg border border-slate-700 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200"
          >
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

        {isEditorVisible && (
          <div className="flex flex-col min-w-0 border-r border-slate-800 shrink-0" style={{ width: `${leftPanelWidth}%` }}>
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

        {isEditorVisible && (
          <div 
            className={`w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20 shrink-0 ${isResizing ? 'bg-indigo-500' : 'bg-slate-800'}`}
            onMouseDown={startResizing}
          ></div>
        )}

        <div className="flex-1 bg-slate-50 overflow-hidden flex flex-col relative">
          <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
            <div className="flex bg-white/90 backdrop-blur border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              <button onClick={() => adjustZoom(0.1)} className="p-2 hover:bg-slate-100 text-slate-600 transition-colors" title="Zoom In">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
              <div className="w-px bg-slate-200"></div>
              <button onClick={() => adjustZoom(-0.1)} className="p-2 hover:bg-slate-100 text-slate-600 transition-colors" title="Zoom Out">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
              </button>
              <div className="w-px bg-slate-200"></div>
              <button onClick={resetZoom} className="px-3 text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                {Math.round(previewZoom * 100)}%
              </button>
            </div>
          </div>

          <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
            <span className="px-2 py-1 bg-white/80 backdrop-blur border border-slate-200 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
              Live Render
            </span>
          </div>

          <div className="flex-1 p-4 md:p-8 overflow-hidden select-text">
             <Preview code={code} zoom={previewZoom} onZoomChange={setPreviewZoom} onAutofix={handleAutofix} isFixing={isAiLoading} />
          </div>
        </div>
      </main>

      <ApiSettings
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
        onSave={setApiConfig}
        currentConfig={apiConfig}
      />
    </div>
  );
};

export default App;
