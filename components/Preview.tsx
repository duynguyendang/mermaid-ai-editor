
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PreviewProps {
  code: string;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onAutofix?: (error: string) => void;
  isFixing?: boolean;
}

const Preview: React.FC<PreviewProps> = ({ code, zoom, onZoomChange, onAutofix, isFixing }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>('');
  
  // Pan state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // @ts-ignore
    if (window.mermaid) {
      // @ts-ignore
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter',
        logLevel: 5, // Suppress most logs
        suppressErrorConsole: true,
        flowchart: { htmlLabels: false, curve: 'basis' },
        sequence: { htmlLabels: false },
        class: { htmlLabels: false },
        state: { htmlLabels: false },
      });
      
      // Override the default parse error handler to prevent Mermaid from 
      // injecting its own error div into the body.
      // @ts-ignore
      window.mermaid.parseError = (err: any) => {
        // We handle errors in the catch block of the render process
        console.debug("Mermaid Parse Error Intercepted");
      };
    }
  }, []);

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
  }, [code]);

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
      {error ? (
        <div className="flex flex-col items-center gap-4 text-center max-w-md p-8 z-[100] bg-white rounded-xl shadow-xl border border-red-100 m-4 animate-in fade-in zoom-in duration-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
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
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${isFixing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {isFixing ? 'AI Fixing...' : 'Autofix with Gemini'}
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">Please correct the syntax to refresh preview</p>
        </div>
      ) : svg ? (
        <div 
          className="mermaid-container w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
          style={{ 
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            pointerEvents: isDragging ? 'none' : 'auto'
          }}
          dangerouslySetInnerHTML={{ __html: svg }} 
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400 p-8 pointer-events-none">
          <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="italic">Type code or use AI to generate a diagram</span>
        </div>
      )}

      {!error && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-300 font-medium tracking-wide uppercase pointer-events-none">
          Scroll to Zoom • Drag to Pan
        </div>
      )}
    </div>
  );
};

export default Preview;
