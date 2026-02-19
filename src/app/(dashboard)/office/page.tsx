'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import Agent from '@/components/office/Agent';
import { Agent as AgentType } from '@/lib/types';
import { motion } from 'framer-motion';

const initialAgents: AgentType[] = [
  { id: 'henry', name: 'Henry', emoji: '👨‍💼', status: 'working', position: { x: 80, y: 100 }, currentTask: 'Managing team operations' },
  { id: 'alex', name: 'Alex', emoji: '👨‍🎨', status: 'working', position: { x: 200, y: 100 }, currentTask: 'Designing new UI components' },
  { id: 'quill', name: 'Quill', emoji: '✍️', status: 'chatting', position: { x: 320, y: 100 }, currentTask: 'Writing documentation' },
  { id: 'echo', name: 'Echo', emoji: '🔊', status: 'idle', position: { x: 80, y: 220 }, currentTask: 'Listening for events' },
  { id: 'scout', name: 'Scout', emoji: '🔭', status: 'working', position: { x: 200, y: 220 }, currentTask: 'Scanning for updates' },
  { id: 'codex', name: 'Codex', emoji: '📚', status: 'working', position: { x: 320, y: 220 }, currentTask: 'Processing knowledge base' },
  { id: 'pixel', name: 'Pixel', emoji: '🎨', status: 'walking', position: { x: 440, y: 160 }, currentTask: 'Taking a break' },
];

const statusColors = {
  working: { color: 'bg-accent-green', label: 'Working' },
  chatting: { color: 'bg-accent-blue', label: 'Chatting' },
  walking: { color: 'bg-accent-yellow', label: 'Walking' },
  idle: { color: 'bg-dark-muted', label: 'Idle' },
};

function mapSubagentStatus(status: string): AgentType['status'] {
  const s = (status || '').toLowerCase();
  if (['running', 'active', 'busy', 'working'].includes(s)) return 'working';
  if (['chatting', 'awaiting_input', 'steered'].includes(s)) return 'chatting';
  if (['transitioning', 'starting'].includes(s)) return 'walking';
  return 'idle';
}

export default function OfficePage() {
  const [agents, setAgents] = useState<AgentType[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [liveActivity, setLiveActivity] = useState<string[]>([]);

  const refreshLiveState = useCallback(async () => {
    try {
      const [subagentRes, runRes] = await Promise.all([fetch('/api/subagents'), fetch('/api/task-runs?limit=10')]);
      const subagentData = await subagentRes.json();
      const runData = await runRes.json();

      if (subagentData.success && Array.isArray(subagentData.data)) {
        const subMap = new Map<string, any>();
        subagentData.data.forEach((s: any) => subMap.set(String(s.id).toLowerCase(), s));

        setAgents((prev) =>
          prev.map((a) => {
            const match = subMap.get(a.id.toLowerCase()) || subMap.get(a.name.toLowerCase());
            if (!match) return a;
            return {
              ...a,
              status: mapSubagentStatus(match.status),
              currentTask: match.summary || a.currentTask,
            };
          })
        );
      }

      const activity: string[] = [];
      if (runData.success && Array.isArray(runData.data)) {
        for (const r of runData.data.slice(0, 6)) {
          activity.push(`📌 ${r.title} • ${r.status} • ${r.assignedToType}:${r.assignee}`);
        }
      }
      if (subagentData.success && Array.isArray(subagentData.data)) {
        for (const s of subagentData.data.slice(0, 4)) {
          activity.push(`🤖 ${s.name} is ${s.status}${s.summary ? ` — ${s.summary}` : ''}`);
        }
      }
      setLiveActivity(activity.slice(0, 12));
    } catch (error) {
      console.error('Failed to refresh office live state', error);
    }
  }, []);

  useEffect(() => {
    refreshLiveState();
    const interval = setInterval(refreshLiveState, 12000);
    return () => clearInterval(interval);
  }, [refreshLiveState]);

  return (
    <>
      <TopBar title="Office" subtitle="Watch your agents at work" />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full bg-dark-card border border-dark-border rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 checkerboard" />
            {[{ x: 60, y: 80 }, { x: 180, y: 80 }, { x: 300, y: 80 }, { x: 60, y: 200 }, { x: 180, y: 200 }, { x: 300, y: 200 }, { x: 420, y: 140 }].map((pos, i) => (
              <div key={i} className="absolute w-16 h-10 bg-stone-700/50 rounded border border-stone-600/30" style={{ left: pos.x, top: pos.y + 50 }} />
            ))}
            {agents.map((agent) => <Agent key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />)}
          </div>
        </div>

        <div className="w-80 border-l border-dark-border bg-dark-card flex flex-col">
          <div className="p-4 border-b border-dark-border">
            <h3 className="text-sm font-medium text-white mb-3">Status Legend</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusColors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${value.color}`} /><span className="text-xs text-dark-muted">{value.label}</span></div>
              ))}
            </div>
          </div>
          <div className="p-4 border-b border-dark-border"><button onClick={refreshLiveState} className="w-full px-4 py-2 rounded-lg text-sm bg-dark-bg border border-dark-border text-dark-muted hover:text-white">Refresh Live State</button></div>
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <h3 className="text-sm font-medium text-white mb-3">Live Activity</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {liveActivity.map((activity, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-dark-muted bg-dark-bg rounded px-3 py-2">{activity}</motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAgent(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4"><div className="w-16 h-16 bg-dark-bg rounded-xl flex items-center justify-center text-4xl">{selectedAgent.emoji}</div><div><h2 className="text-xl font-semibold text-white">{selectedAgent.name}</h2><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${statusColors[selectedAgent.status].color}`} /><span className="text-sm text-dark-muted capitalize">{selectedAgent.status}</span></div></div></div>
            {selectedAgent.currentTask && <div className="bg-dark-bg rounded-lg p-3 mb-4"><span className="text-xs text-dark-muted">Current Task</span><p className="text-sm text-white mt-1">{selectedAgent.currentTask}</p></div>}
            <button onClick={() => setSelectedAgent(null)} className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-muted hover:text-white">Close</button>
          </motion.div>
        </div>
      )}
    </>
  );
}
