'use client';

import React, { useState } from 'react';
import { Search, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import manifestData from '@/app/admin/living-manifest.json';

interface SearchItem {
  id: string;
  category: string;
  title: string;
  content: string;
}

export default function KnowledgeHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(manifestData.map(item => item.category)))];

  const filteredItems = manifestData.filter((item: SearchItem) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          📖 Living Knowledge Hub
        </h3>
        <p className="text-slate-500 text-xs leading-relaxed">
          Expose, search, and query active business rules, subscription tier pricing structures, operational playbooks, and user lifecycle states compiled at build-time.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search manifest rules, tiers, playbooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800/80 rounded-xl pl-10 pr-4 h-11 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all outline-none"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 h-11 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-purple-600/20 border-purple-500/30 text-purple-200'
                  : 'bg-slate-900/30 border-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 border border-slate-850 rounded-2xl bg-slate-900/10">
            <p className="text-slate-500 text-xs font-mono">NO COMPILER RULES MATCHED YOUR QUERY</p>
          </div>
        ) : (
          filteredItems.map((item: SearchItem) => (
            <div 
              key={item.id}
              className="bg-slate-900/30 border border-slate-850 hover:border-slate-800/80 rounded-2xl p-5 transition duration-300 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition duration-300" />
              
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                    {item.category === "Subscription Tiers" && <Layers className="w-3 h-3" />}
                    {item.category === "User Lifecycle Matrix" && <ShieldCheck className="w-3 h-3" />}
                    {item.category === "Support Playbooks" && <BookOpen className="w-3 h-3" />}
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition duration-200">{item.title}</h4>
                </div>
                <code className="text-[10px] font-mono text-slate-500 bg-slate-950/40 border border-slate-850 px-2 py-0.5 rounded-md">
                  {item.id}
                </code>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
