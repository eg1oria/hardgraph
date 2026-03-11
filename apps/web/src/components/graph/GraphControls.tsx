'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = useCallback(() => zoomIn({ duration: 200 }), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut({ duration: 200 }), [zoomOut]);
  const handleFitView = useCallback(() => fitView({ padding: 0.3, duration: 300 }), [fitView]);

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-0.5 bg-surface border border-border rounded-xl p-0.5 z-20 shadow-lg">
      <button
        onClick={handleZoomOut}
        className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-light active:bg-surface-light transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="Zoom out"
        aria-label="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={handleZoomIn}
        className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-light active:bg-surface-light transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="Zoom in"
        aria-label="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-border mx-0.5" />
      <button
        onClick={handleFitView}
        className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-light active:bg-surface-light transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="Fit to screen"
        aria-label="Fit to screen"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}
