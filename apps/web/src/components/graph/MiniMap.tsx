'use client';

import { MiniMap as RFMiniMap } from '@xyflow/react';

export function MiniMap() {
  return (
    <RFMiniMap
      pannable
      zoomable
      nodeColor="#6366F1"
      maskColor="hsl(var(--background) / 0.6)"
      aria-label="Graph minimap"
      style={{
        background: 'hsl(var(--surface))',
        borderRadius: 8,
        border: '1px solid hsl(var(--border))',
        cursor: 'grab',
      }}
    />
  );
}
