
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, Zap, MousePointer2, ZoomIn, Layout, Copy } from 'lucide-react';

interface PreviewProps {
  code: string;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onAutofix?: (error: string) => void;
  isFixing?: boolean;
  theme?: string;
  themeColor?: string;
  viewMode?: 'DIAGRAM' | 'SVG';
}

const Preview: React.FC<PreviewProps> = ({ 
  code, 
  zoom, 
  onZoomChange, 
  onAutofix, 
  isFixing,
  theme = 'default',
  themeColor = '#4f46e5',
  viewMode = 'DIAGRAM'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>('');
  
  // Pan state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [exportBg, setExportBg] = useState('#ffffff');
  const [exportPadding, setExportPadding] = useState(60);
  const [showGrid, setShowGrid] = useState(true);

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mermaid-diagram-${new Date().getTime()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(svg);
      // You could add a toast here if available
    } catch (err) {
      console.error('Failed to copy SVG:', err);
    }
  };

  useEffect(() => {
    // @ts-ignore
    if (window.mermaid) {
      const config: any = {
        startOnLoad: false,
        theme: theme,
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
        logLevel: 5,
        suppressErrorConsole: true,
        flowchart: { 
          htmlLabels: false, 
          curve: 'basis',
          nodeSpacing: 50,
          rankSpacing: 70,
          padding: 20,
          useMaxWidth: true,
          defaultRenderer: 'dagre-wrapper'
        },
        sequence: { htmlLabels: false, mirrorActors: true, padding: 35 },
        class: { htmlLabels: false },
        state: { htmlLabels: false },
        gantt: { fontSize: 13, sectionFontSize: 14, barHeight: 25, barGap: 5 },
      };

      if (theme === 'base' || theme === 'layered' || theme === 'gantt' || theme === 'cloud' || theme === 'database') {
        let themeVars: any = {
          primaryColor: themeColor,
          primaryTextColor: '#fff',
          primaryBorderColor: themeColor,
          lineColor: themeColor,
          secondaryColor: themeColor,
          tertiaryColor: '#fff',
          mainBkg: '#fff',
          nodeBorder: themeColor,
          clusterBkg: '#f8fafc',
          clusterBorder: '#e2e8f0',
          titleColor: themeColor,
          edgeLabelBackground: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
        };

        if (theme === 'layered') {
          themeVars = {
            ...themeVars,
            primaryColor: '#3b82f6',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#2563eb',
            lineColor: '#64748b',
            secondaryColor: '#f8fafc',
            tertiaryColor: '#ffffff',
            nodeBorder: '#2563eb',
            clusterBkg: '#f1f5f9',
            clusterBorder: '#cbd5e1',
            titleColor: '#1e3a8a',
            mainBkg: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          };
        } else if (theme === 'gantt') {
          themeVars = {
            ...themeVars,
            primaryColor: '#10b981',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#059669',
            lineColor: '#10b981',
            secondaryColor: '#f0fdf4',
            tertiaryColor: '#ffffff',
            mainBkg: '#ffffff',
            // Gantt specific
            ganttBarBkgColor: '#10b981',
            ganttBarBorderColor: '#059669',
            ganttBarTextColor: '#ffffff',
            ganttLabelColor: '#374151',
            ganttSectionBkgColor: '#f9fafb',
            ganttSectionBkgColor2: '#ffffff',
            ganttGridLineColor: '#e5e7eb',
            ganttTodayLineColor: '#ef4444',
            fontFamily: 'Inter, sans-serif',
          };
        } else if (theme === 'cloud') {
          themeVars = {
            ...themeVars,
            primaryColor: '#4285f4', // Google Blue
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#3367d6',
            lineColor: '#4285f4',
            secondaryColor: '#fbbc04', // Google Yellow
            tertiaryColor: '#34a853', // Google Green
            mainBkg: '#ffffff',
            clusterBkg: '#f8f9fa',
            clusterBorder: '#dadce0',
            fontFamily: 'Google Sans, Inter, sans-serif',
          };
        } else if (theme === 'database') {
          themeVars = {
            ...themeVars,
            primaryColor: '#475569', // Slate 600
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#1e293b',
            lineColor: '#475569',
            secondaryColor: '#f8fafc',
            tertiaryColor: '#ffffff',
            mainBkg: '#ffffff',
            nodeBorder: '#1e293b',
            clusterBkg: '#f1f5f9',
            clusterBorder: '#94a3b8',
            fontFamily: 'JetBrains Mono, monospace',
          };
        }

        config.themeVariables = themeVars;
      }

      // @ts-ignore
      window.mermaid.initialize(config);
      
      // @ts-ignore
      window.mermaid.parseError = (err: any) => {
        console.debug("Mermaid Parse Error Intercepted");
      };
    }
  }, [theme, themeColor]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code || !code.trim()) {
        setSvg('');
        setError(null);
        return;
      }

      // @ts-ignore
      if (!window.mermaid) {
        setError("Mermaid library failed to load. Please refresh the page.");
        return;
      }

      try {
        setError(null);
        const id = `mermaid-render-${Math.random().toString(36).substr(2, 9)}`;
        
        // Use mermaid.parse first to validate before attempting a render
        // @ts-ignore
        await window.mermaid.parse(code);
        
        // @ts-ignore
        const { svg: renderedSvg } = await window.mermaid.render(id, code);
        setSvg(renderedSvg);
      } catch (err: any) {
        console.error("Mermaid Render Error:", err);
        
        // Deep cleaning of the error message to remove Mermaid versioning and other boilerplate
        const rawMsg = err.message || String(err);
        
        // Specifically target and remove "mermaid version X.Y.Z" and any redundant prefixes
        const cleanMsg = rawMsg
          .replace(/mermaid version \d+\.\d+\.\d+/gi, '') // Remove version string
          .split('mermaid version')[0] // Fallback safety split
          .replace(/\n\s*\n/g, '\n') // Remove excessive empty lines
          .trim();
          
        setError(cleanMsg || "Invalid Mermaid syntax. Please check your code.");
      }
    };

    const timeoutId = setTimeout(renderDiagram, 300);
    return () => clearTimeout(timeoutId);
  }, [code, theme, themeColor]);

  // Handle Wheel Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(zoom + delta, 0.1), 5);
      onZoomChange(newZoom);
    } else {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newZoom = Math.min(Math.max(zoom + delta, 0.1), 5);
      onZoomChange(newZoom);
    }
  }, [zoom, onZoomChange]);

  // Handle Mouse Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      className={`h-full w-full flex flex-col items-center justify-center overflow-hidden bg-white rounded-lg shadow-sm border border-slate-200 relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .mermaid-container svg {
          max-width: 100% !important;
          height: auto !important;
        }
        .mermaid-container .node rect,
        .mermaid-container .node circle,
        .mermaid-container .node polygon,
        .mermaid-container .node path {
          stroke-width: 1.5px !important;
        }
        /* Force consistent min-width for nodes if possible via padding */
        .mermaid-container .node .label-container {
          padding: 10px 20px !important;
        }
        /* Better cluster styling */
        .mermaid-container .cluster rect {
          fill: #f8fafc !important;
          stroke: #cbd5e1 !important;
          stroke-width: 1px !important;
          rx: 8px !important;
          ry: 8px !important;
        }
        .mermaid-container .cluster-label span {
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-size: 11px !important;
          color: #64748b !important;
        }
        /* Edge styling */
        .mermaid-container .edgePath .path {
          stroke-width: 1.5px !important;
        }
        .mermaid-container .edgeLabel {
          background-color: rgba(255, 255, 255, 0.9) !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          font-size: 10px !important;
        }
      `}} />
      {error ? (
        <div className="flex flex-col items-center gap-4 text-center max-w-md p-8 z-[100] bg-white rounded-xl shadow-xl border border-red-100 m-4 animate-in fade-in zoom-in duration-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="text-red-700 w-full overflow-hidden">
            <h3 className="font-bold text-lg mb-2">Syntax Error</h3>
            <div className="p-3 bg-red-50 border border-red-100 rounded-md text-xs font-mono break-words max-h-48 overflow-auto custom-scrollbar text-left">
              {error}
            </div>
            
            {onAutofix && (
              <button 
                onClick={() => onAutofix(error)}
                disabled={isFixing}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Zap size={16} className={isFixing ? 'animate-spin' : ''} />
                {isFixing ? 'AI Fixing...' : 'Autofix with Gemini'}
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">Please correct the syntax to refresh preview</p>
        </div>
      ) : svg ? (
        viewMode === 'SVG' ? (
          <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Background</span>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                    {['#ffffff', '#f8fafc', '#f1f5f9', '#0f172a'].map(color => (
                      <button 
                        key={color}
                        onClick={() => setExportBg(color)}
                        className={`w-5 h-5 rounded-md border transition-all ${exportBg === color ? 'border-indigo-500 scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Padding</span>
                  <input 
                    type="range" 
                    min="20" 
                    max="120" 
                    value={exportPadding} 
                    onChange={(e) => setExportPadding(parseInt(e.target.value))}
                    className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-[10px] font-mono text-slate-500 w-6">{exportPadding}px</span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${showGrid ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                  >
                    GRID
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-[11px] font-bold transition-all border border-slate-200 shadow-sm active:scale-95"
                >
                  <Copy size={14} />
                  COPY SVG
                </button>
                <button 
                  onClick={downloadSvg}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[11px] font-bold transition-all shadow-md active:scale-95"
                >
                  <Zap size={14} />
                  DOWNLOAD SVG
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-12 flex flex-col items-center justify-start custom-scrollbar bg-slate-100">
              <div className="flex flex-col gap-6 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Export Preview</h4>
                    <p className="text-[10px] text-slate-500">High-fidelity vector output ready for documentation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded uppercase tracking-wider">
                      {theme}
                    </span>
                  </div>
                </div>

                <div 
                  className="rounded-3xl border border-slate-200 shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300"
                  style={{ 
                    backgroundColor: exportBg,
                    padding: `${exportPadding}px`,
                    minHeight: '500px'
                  }}
                >
                  {showGrid && (
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                  )}
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <img 
                      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
                      alt="Rendered Diagram"
                      className="max-w-full max-h-full object-contain drop-shadow-2xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-8 py-4 border-t border-slate-200 mt-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Format</span>
                    <span className="text-[11px] font-bold text-slate-600">SVG (Vector)</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Resolution</span>
                    <span className="text-[11px] font-bold text-slate-600">Infinite (Lossless)</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Background</span>
                    <span className="text-[11px] font-bold text-slate-600">{exportBg.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="mermaid-container w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
            style={{ 
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              pointerEvents: isDragging ? 'none' : 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: svg }} 
          />
        )
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400 p-8 pointer-events-none">
          <ZoomIn size={48} className="opacity-20" />
          <span className="italic">Type code or use AI to generate a diagram</span>
        </div>
      )}

      {!error && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[9px] text-slate-400 font-medium tracking-wide uppercase pointer-events-none bg-white/50 backdrop-blur px-3 py-1 rounded-full border border-slate-100">
          <span className="flex items-center gap-1"><MousePointer2 size={10} /> Scroll to Zoom</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span className="flex items-center gap-1"><Layout size={10} /> Drag to Pan</span>
        </div>
      )}
    </div>
  );
};

export default Preview;
