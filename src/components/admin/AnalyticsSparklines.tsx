'use client';

import React from 'react';

interface SparklineData {
  label: string;
  value: string;
  points: number[];
  color: 'emerald' | 'amber' | 'indigo';
  change: string;
}

const mockMetrics: SparklineData[] = [
  {
    label: 'Cache Hit Rate (Telemetry)',
    value: '99.4%',
    points: [92, 94, 93, 95, 98, 97, 99, 98.5, 99.4],
    color: 'emerald',
    change: '+0.8% variance'
  },
  {
    label: 'Query Exception Rate',
    value: '0.04%',
    points: [0.15, 0.12, 0.25, 0.08, 0.05, 0.18, 0.06, 0.03, 0.04],
    color: 'amber',
    change: '-0.11% warning boundary'
  },
  {
    label: 'Stitching Pipeline Ingestion',
    value: '2.4 GB/s',
    points: [1.8, 2.0, 1.9, 2.2, 2.1, 2.3, 2.5, 2.2, 2.4],
    color: 'indigo',
    change: 'Baseline stability'
  }
];

export function AnalyticsSparklines() {
  const calculateSvgPath = (points: number[], width: number, height: number, padding: number) => {
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 1;

    const coords = points.map((val, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return { x, y };
    });

    // Create SVG path string with bezier curves mapping coordinate heights
    let path = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${next.x},${next.y}`;
    }

    return path;
  };

  const getColorClasses = (color: SparklineData['color']) => {
    switch (color) {
      case 'emerald':
        return {
          stroke: '#10b981',
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/5',
          border: 'border-emerald-500/10'
        };
      case 'amber':
        return {
          stroke: '#f59e0b',
          text: 'text-amber-400',
          bg: 'bg-amber-500/5',
          border: 'border-amber-500/10'
        };
      case 'indigo':
      default:
        return {
          stroke: '#6366f1',
          text: 'text-indigo-400',
          bg: 'bg-indigo-500/5',
          border: 'border-indigo-500/10'
        };
    }
  };

  return (
    <div className="space-y-4">
      {mockMetrics.map((metric, i) => {
        const colors = getColorClasses(metric.color);
        const pathData = calculateSvgPath(metric.points, 180, 50, 4);

        return (
          <div 
            key={i}
            className={`flex items-center justify-between p-4 rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-md hover:border-slate-800/80 transition duration-300`}
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">
                {metric.label}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white tracking-tight">
                  {metric.value}
                </span>
                <span className={`text-[10px] font-mono ${colors.text}`}>
                  {metric.change}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <svg className="w-[180px] h-[50px]" viewBox="0 0 180 50">
                <path
                  d={pathData}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default AnalyticsSparklines;
