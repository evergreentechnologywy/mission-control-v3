'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import Agent from '@/components/office/Agent';
import { Agent as AgentType } from '@/lib/types';
import { motion } from 'framer-motion';

const initialAgents: AgentType[] = [
  { id: '1', name: 'Henry', emoji: '👨‍💼', status: 'working', position: { x: 80, y: 100 }, currentTask: 'Managing team operations' },
  { id: '2', name: 'Alex', emoji: '👨‍🎨', status: 'working', position: { x: 200, y: 100 }, currentTask: 'Designing new UI components' },
  { id: '3', name: 'Quill', emoji: '✍️', status: 'chatting', position: { x: 320, y: 100 }, currentTask: 'Writing documentation' },
  { id: '4', name: 'Echo', emoji: '🔊', status: 'idle', position: { x: 80, y: 220 }, currentTask: 'Listening for events' },
  { id: '5', name: 'Scout', emoji: '🔭', status: 'working', position: { x: 200, y: 220 }, currentTask: 'Scanning for updates' },
  { id: '6', name: 'Codex', emoji: '📚', status: 'working', position: { x: 320, y: 220 }, currentTask: 'Processing knowledge base' },
  { id: '7', name: 'Pixel', emoji: '🎨', status: 'walking', position: { x: 440, y: 160 }, currentTask: 'Taking a break' },
];

const statusColors = {
  working: { color: 'bg-accent-green', label: 'Working' },
  chatting: { color: 'bg-accent-blue', label: 'Chatting' },
  walking: { color: 'bg-accent-yellow', label: 'Walking' },
  idle: { color: 'bg-dark-muted', label: 'Idle' },
};

export default function OfficePage() {
  const [agents, setAgents] = useState<AgentType[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [liveActivity, setLiveActivity] = useState<string[]>([
    '🤖 Henry started reviewing tasks',
    '✍️ Quill finished draft for documentation',
    '🔭 Scout found 3 new updates',
    '📚 Codex indexed 50 new entries',
  ]);

  // Demo controls
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (!demoMode) return;

    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          const statuses: AgentType['status'][] = ['working', 'chatting', 'walking', 'idle'];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          return { ...agent, status: newStatus };
        })
      );

      // Add random activity
      const activities = [
        `${agents[Math.floor(Math.random() * agents.length)].emoji} ${agents[Math.floor(Math.random() * agents.length)].name} started a new task`,
        `🔔 New notification received`,
        `✅ Task completed by team`,
        `📊 Dashboard updated`,
      ];
      setLiveActivity((prev) => [
        activities[Math.floor(Math.random() * activities.length)],
        ...prev.slice(0, 9),
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [demoMode, agents]);

  return (
    <>
      <TopBar title="Office" subtitle="Watch your agents at work" />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Office Floor */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full bg-dark-card border border-dark-border rounded-xl overflow-hidden relative">
            {/* Floor */}
            <div className="absolute inset-0 checkerboard" />
            
            {/* Decorations */}
            <div className="absolute top-4 left-4 text-4xl opacity-60">🌳</div>
            <div className="absolute top-4 right-4 text-4xl opacity-60">🌳</div>
            <div className="absolute bottom-4 left-4 text-4xl opacity-60">🪴</div>
            <div className="absolute bottom-4 right-4 text-4xl opacity-60">🪴</div>
            
            {/* Meeting Table */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-32 h-16 bg-amber-900/60 rounded-lg border-2 border-amber-800/40" />
            </div>
            
            {/* Desks */}
            {[
              { x: 60, y: 80 },
              { x: 180, y: 80 },
              { x: 300, y: 80 },
              { x: 60, y: 200 },
              { x: 180, y: 200 },
              { x: 300, y: 200 },
              { x: 420, y: 140 },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-16 h-10 bg-stone-700/50 rounded border border-stone-600/30"
                style={{ left: pos.x, top: pos.y + 50 }}
              />
            ))}
            
            {/* Agents */}
            {agents.map((agent) => (
              <Agent
                key={agent.id}
                agent={agent}
                onClick={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        </div>
        
        {/* Side Panel */}
        <div className="w-80 border-l border-dark-border bg-dark-card flex flex-col">
          {/* Status Legend */}
          <div className="p-4 border-b border-dark-border">
            <h3 className="text-sm font-medium text-white mb-3">Status Legend</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusColors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${value.color}`} />
                  <span className="text-xs text-dark-muted">{value.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Demo Controls */}
          <div className="p-4 border-b border-dark-border">
            <h3 className="text-sm font-medium text-white mb-3">Demo Controls</h3>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                demoMode
                  ? 'bg-accent-green text-white'
                  : 'bg-dark-bg border border-dark-border text-dark-muted hover:text-white'
              }`}
            >
              {demoMode ? '⏸️ Stop Demo' : '▶️ Start Demo'}
            </button>
          </div>
          
          {/* Live Activity */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <h3 className="text-sm font-medium text-white mb-3">Live Activity</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {liveActivity.map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-dark-muted bg-dark-bg rounded px-3 py-2"
                >
                  {activity}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedAgent(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-dark-bg rounded-xl flex items-center justify-center text-4xl">
                {selectedAgent.emoji}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedAgent.name}</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[selectedAgent.status].color}`} />
                  <span className="text-sm text-dark-muted capitalize">{selectedAgent.status}</span>
                </div>
              </div>
            </div>
            
            {selectedAgent.currentTask && (
              <div className="bg-dark-bg rounded-lg p-3 mb-4">
                <span className="text-xs text-dark-muted">Current Task</span>
                <p className="text-sm text-white mt-1">{selectedAgent.currentTask}</p>
              </div>
            )}
            
            <button
              onClick={() => setSelectedAgent(null)}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-muted hover:text-white transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
