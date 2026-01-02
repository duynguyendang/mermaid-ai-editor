
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
        flowchart: { htmlLabels: true, curve: 'basis' },
      });
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
        // @ts-ignore
        const { svg: renderedSvg } = await window.mermaid.render(id, code);
        setSvg(renderedSvg);
      } catch (err: any) {
        console.error("Mermaid Rendering Error:", err);
        setError(err.message || "Invalid Mermaid syntax. Check your code or try a template.");
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
        <div className="flex flex-col items-center gap-4 text-center max-w-md p-8 z-10">
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium shadow-sm">
            <p className="font-bold mb-1">Syntax Error</p>
            <p className="line-clamp-3 opacity-80 mb-3">{error}</p>
            {onAutofix && (
              <button 
                onClick={() => onAutofix(error)}
                disabled={isFixing}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${isFixing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {isFixing ? 'Fixing...' : 'Autofix with AI'}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">Diagram will update automatically as you fix the code.</p>
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

      {/* Helper text for interactions */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-300 font-medium tracking-wide uppercase pointer-events-none">
        Scroll to Zoom • Drag to Pan
      </div>
    </div>
  );
};

export default Preview;
