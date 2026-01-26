"use client";

import { RecordedMemory } from "@/types/studio";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play, Share2, Trash2 } from "lucide-react";

export default function ReviewPage() {
  // In a real scenario, we'd fetch this from a URL param or Global State
  // For now, we are restoring the Type Definition
  const memory: RecordedMemory = {
    id: "temp-id",
    videoUrl: "", // This will be the URL from STU-10
    duration: 0,
    timestamp: Date.now(),
    mode: 'solo'
  };

  return (
    <main className="min-h-screen bg-studio-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-prompter">Review Memory</h1>
          <div className="flex gap-4">
            <Button variant="outline" className="border-white/10 hover:bg-white/5">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
            <Button className="bg-studio-red hover:bg-red-600">
              <Share2 className="w-4 h-4 mr-2" /> Save to Timeline
            </Button>
          </div>
        </header>

        <div className="aspect-video bg-studio-gray rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden">
          {/* Video Player Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Play className="w-16 h-16 text-white/50" />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <StatCard label="Duration" value={`${memory.duration}s`} />
          <StatCard label="Mode" value={memory.mode} />
          <StatCard label="Status" value="Ready to Sync" icon={<CheckCircle className="text-green-500 w-4 h-4" />} />
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-studio-gray p-4 rounded-2xl border border-white/5">
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg font-medium">{value}</span>
        {icon}
      </div>
    </div>
  );
}