'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Database, 
  Cpu, 
  Zap, 
  Clock 
} from 'lucide-react';

type TimeRange = '24H' | '7D' | '30D';

interface MetricData {
  value: string;
  change: string;
  isPositive: boolean;
  sparkline: number[];
  label: string;
}

const mockMetrics: Record<TimeRange, Record<string, MetricData>> = {
  '24H': {
    throughput: {
      label: 'System Throughput',
      value: '1.24 GB/s',
      change: '+12.3%',
      isPositive: true,
      sparkline: [30, 45, 35, 60, 50, 75, 80, 70, 95]
    },
    prompts: {
      label: 'Prompt Executions',
      value: '42,912',
      change: '+8.4%',
      isPositive: true,
      sparkline: [40, 35, 50, 45, 60, 55, 70, 65, 80]
    },
    latency: {
      label: 'Transaction Speed',
      value: '84 ms',
      change: '-14.2%',
      isPositive: true,
      sparkline: [95, 90, 80, 85, 75, 78, 70, 68, 64]
    }
  },
  '7D': {
    throughput: {
      label: 'System Throughput',
      value: '8.92 GB/s',
      change: '+4.1%',
      isPositive: true,
      sparkline: [50, 55, 52, 58, 62, 60, 65, 63, 68]
    },
    prompts: {
      label: 'Prompt Executions',
      value: '294,801',
      change: '-2.1%',
      isPositive: false,
      sparkline: [80, 78, 75, 76, 73, 75, 72, 70, 68]
    },
    latency: {
      label: 'Transaction Speed',
      value: '91 ms',
      change: '+5.3%',
      isPositive: false,
      sparkline: [60, 62, 65, 68, 70, 72, 75, 78, 81]
    }
  },
  '30D': {
    throughput: {
      label: 'System Throughput',
      value: '34.81 GB/s',
      change: '+22.5%',
      isPositive: true,
      sparkline: [20, 30, 25, 45, 40, 60, 55, 80, 90]
    },
    prompts: {
      label: 'Prompt Executions',
      value: '1,284,092',
      change: '+18.7%',
      isPositive: true,
      sparkline: [30, 40, 38, 55, 50, 70, 68, 85, 95]
    },
    latency: {
      label: 'Transaction Speed',
      value: '95 ms',
      change: '-8.9%',
      isPositive: true,
      sparkline: [85, 82, 80, 78, 76, 74, 72, 70, 68]
    }
  }
};

export function BusinessAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const metrics = mockMetrics[timeRange];

  const renderSparkline = (points: number[], isPositive: boolean) => {
    const width = 120;
    const height = 40;
    const padding = 4;
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 1;

    const coords = points.map((val, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    const pathData = `M ${coords.join(' L ')}`;
    const strokeColor = isPositive ? '#10b981' : '#f43f5e';

    return (
      <svg className="w-[120px] h-[40px]" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">Operational Telemetry</h3>
          <p className="text-xs text-slate-500 mt-1">Live infrastructure resource ingestion analytics</p>
        </div>
        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg">
          {(['24H', '7D', '30D'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 font-mono text-xs rounded transition-all duration-200 ${
                timeRange === range
                  ? 'bg-slate-900 text-white border border-slate-800/80 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Throughput */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 hover:border-slate-800 transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">
                {metrics.throughput.label}
              </span>
              <Database className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {metrics.throughput.value}
              </span>
              <span className={`text-xs font-mono flex items-center gap-0.5 ${
                metrics.throughput.isPositive ? 'text-emerald-400' : 'text-rose-500'
              }`}>
                {metrics.throughput.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {metrics.throughput.change}
              </span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            {renderSparkline(metrics.throughput.sparkline, metrics.throughput.isPositive)}
          </div>
        </div>

        {/* Card 2: Prompts */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 hover:border-slate-800 transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">
                {metrics.prompts.label}
              </span>
              <Cpu className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {metrics.prompts.value}
              </span>
              <span className={`text-xs font-mono flex items-center gap-0.5 ${
                metrics.prompts.isPositive ? 'text-emerald-400' : 'text-rose-500'
              }`}>
                {metrics.prompts.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {metrics.prompts.change}
              </span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            {renderSparkline(metrics.prompts.sparkline, metrics.prompts.isPositive)}
          </div>
        </div>

        {/* Card 3: Latency */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 hover:border-slate-800 transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">
                {metrics.latency.label}
              </span>
              <Clock className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {metrics.latency.value}
              </span>
              <span className={`text-xs font-mono flex items-center gap-0.5 ${
                metrics.latency.isPositive ? 'text-emerald-400' : 'text-rose-500'
              }`}>
                {metrics.latency.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {metrics.latency.change}
              </span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            {renderSparkline(metrics.latency.sparkline, metrics.latency.isPositive)}
          </div>
        </div>
      </div>
    </div>
  );
}
