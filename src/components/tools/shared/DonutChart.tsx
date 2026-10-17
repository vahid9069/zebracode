'use client';

/**
 * Pure-SVG donut chart — no chart library, no canvas, no layout thrash.
 * Slices are drawn as `stroke-dasharray` arcs on concentric circles, which keeps
 * the markup tiny and crisp at any DPI.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** any CSS colour, e.g. `#2563eb` */
  color: string;
}

export function DonutChart({
  slices,
  centerValue,
  centerLabel,
  size = 176,
  thickness = 20,
  className,
  valueFormatter,
}: {
  slices: readonly DonutSlice[];
  centerValue: string;
  centerLabel: string;
  size?: number;
  thickness?: number;
  className?: string;
  valueFormatter?: (value: number) => string;
}) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = slices.map((slice) => {
    const share = total > 0 ? Math.max(0, slice.value) / total : 0;
    const length = share * circumference;
    const arc = { ...slice, share, length, offset };
    offset += length;
    return arc;
  });

  return (
    <div className={cn('flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={thickness} className="stroke-surface-inset" />
          {arcs.map((arc) =>
            arc.length <= 0 ? null : (
              <circle
                key={arc.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={thickness}
                strokeLinecap="butt"
                strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                strokeDashoffset={-arc.offset}
              >
                <title>{`${arc.label}: ${valueFormatter ? valueFormatter(arc.value) : arc.value}`}</title>
              </circle>
            ),
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
          <span className="font-sans text-lg font-bold tabular-nums text-text">{centerValue}</span>
          <span className="max-w-[70%] text-[10px] leading-tight text-text-muted">{centerLabel}</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2">
        {arcs.map((arc) => (
          <li key={arc.key} className="flex items-center justify-between gap-2 rounded-md bg-surface-inset px-3 py-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: arc.color }} />
              <span className="truncate text-text-muted">{arc.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-sans font-semibold tabular-nums text-text">
                {valueFormatter ? valueFormatter(arc.value) : arc.value}
              </span>
              <span className="w-10 text-end text-text-subtle tabular-nums">{Math.round(arc.share * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
