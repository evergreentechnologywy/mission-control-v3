'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { motion } from 'framer-motion';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  status: string;
  emoji?: string;
  category?: string;
  skills?: string[];
}

interface SubagentMember {
  id: string;
  name: string;
  status: string;
  summary: string;
  lastActivity?: string | null;
  raw?: any;
}

const defaultTeam: Omit<TeamMember, 'id'>[] = [
  { name: 'Henry', role: 'Chief of Staff', status: 'active', emoji: '👨‍💼', category: 'chief', skills: ['Leadership', 'Strategy', 'Coordination'] },
  { name: 'Scout', role: 'Information Gatherer', status: 'active', emoji: '🔭', category: 'input', skills: ['Web Search', 'Research', 'Data Mining'] },
  { name: 'Echo', role: 'Listener', status: 'active', emoji: '🔊', category: 'input', skills: ['Event Monitoring', 'Notifications', 'Alerts'] },
  { name: 'Quill', role: 'Writer', status: 'active', emoji: '✍️', category: 'output', skills: ['Documentation', 'Content', 'Communication'] },
  { name: 'Pixel', role: 'Designer', status: 'active', emoji: '🎨', category: 'output', skills: ['UI Design', 'Graphics', 'Visuals'] },
  { name: 'Codex', role: 'Knowledge Base', status: 'active', emoji: '📚', category: 'meta', skills: ['Memory', 'Indexing', 'Retrieval'] },
  { name: 'Alex', role: 'Executor', status: 'active', emoji: '👨‍🎨', category: 'output', skills: ['Automation', 'Tasks', 'Integration'] },
];

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [subagents, setSubagents] = useState<SubagentMember[]>([]);
  const [subagentMessage, setSubagentMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSubagent, setSelectedSubagent] = useState<SubagentMember | null>(null);
  const [subagentError, setSubagentError] = useState('');

  const fetchTeam = useCallback(async () => {
    try {
      const [teamRes, subagentRes] = await Promise.all([fetch('/api/team'), fetch('/api/subagents')]);
      const teamData = await teamRes.json();
      if (teamData.success && teamData.data.length > 0) {
        const merged = teamData.data.map((member: TeamMember) => {
          const defaults = defaultTeam.find((d) => d.name.toLowerCase() === member.name.toLowerCase());
          return { ...defaults, ...member };
        });
        setTeam(merged);
      } else {
        setTeam(defaultTeam.map((m, i) => ({ ...m, id: i + 1 })));
      }

      const subagentData = await subagentRes.json();
      if (subagentData.success && Array.isArray(subagentData.data)) setSubagents(subagentData.data);
      else setSubagents([]);
      setSubagentMessage(subagentData.message || '');
      setSubagentError('');
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeam(defaultTeam.map((m, i) => ({ ...m, id: i + 1 })));
      setSubagents([]);
      setSubagentMessage('Active subagents are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const runSubagentAction = async (action: 'steer' | 'kill', subagent: SubagentMember) => {
    setSubagentError('');
    const msg = action === 'kill' ? `Kill subagent ${subagent.name}?` : `Steer subagent ${subagent.name}?`;
    if (!confirm(msg)) return;

    const message = action === 'steer' ? prompt('Steer message to send:') : undefined;
    if (action === 'steer' && !message) return;

    try {
      const res = await fetch('/api/subagents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, target: subagent.id, message }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Action failed');
      await fetchTeam();
    } catch (error: any) {
      setSubagentError(error.message || 'Failed to run subagent action');
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-dark-muted">Loading team...</div>;

  const chief = team.find((m) => m.category === 'chief');
  const grouped = {
    input: team.filter((m) => m.category === 'input'),
    output: team.filter((m) => m.category === 'output'),
    meta: team.filter((m) => m.category === 'meta'),
  };

  return (
    <>
      <TopBar title="Team" subtitle="Meet your agent team" />
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {chief ? <TeamCard member={chief} featured /> : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(grouped).map(([key, members]) => (
            <div key={key}>
              <h3 className="text-white font-semibold capitalize mb-3">{key}</h3>
              <div className="space-y-3">{members.map((m) => <TeamCard key={m.id} member={m} />)}</div>
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Subagents</h3>
            <button onClick={fetchTeam} className="px-3 py-1.5 rounded bg-dark-card border border-dark-border text-sm text-dark-muted hover:text-white">Refresh</button>
          </div>

          {subagentError ? <div className="mb-3 text-xs text-red-400">{subagentError}</div> : null}
          {subagents.length > 0 ? (
            <div className="space-y-3">
              {subagents.map((s) => (
                <div key={s.id} className="bg-dark-card border border-dark-border rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-white font-medium">{s.name} <span className="text-xs text-dark-muted">({s.status})</span></div>
                      <div className="text-sm text-dark-muted">{s.summary}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedSubagent(s)} className="px-2 py-1 text-xs rounded bg-dark-bg border border-dark-border text-dark-muted hover:text-white">Details</button>
                      <button onClick={() => runSubagentAction('steer', s)} className="px-2 py-1 text-xs rounded bg-accent-blue/20 text-accent-blue">Steer</button>
                      <button onClick={() => runSubagentAction('kill', s)} className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300">Kill</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-dark-card border border-dark-border rounded-xl p-5 text-sm text-dark-muted">{subagentMessage || 'No active subagents detected right now.'}</div>
          )}
        </motion.div>
      </div>

      {selectedSubagent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedSubagent(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-white font-semibold mb-2">{selectedSubagent.name}</div>
            <pre className="text-xs text-dark-muted bg-dark-bg rounded p-3 overflow-auto max-h-[60vh]">{JSON.stringify(selectedSubagent.raw || selectedSubagent, null, 2)}</pre>
            <button onClick={() => setSelectedSubagent(null)} className="mt-3 px-3 py-1.5 rounded bg-dark-bg border border-dark-border text-dark-muted">Close</button>
          </div>
        </div>
      )}
    </>
  );
}

function TeamCard({ member, featured }: { member: TeamMember; featured?: boolean }) {
  return (
    <div className={`bg-dark-card border border-dark-border rounded-xl p-4 ${featured ? 'border-accent-blue/50' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`${featured ? 'w-14 h-14 text-3xl' : 'w-11 h-11 text-2xl'} bg-dark-bg rounded-xl flex items-center justify-center`}>{member.emoji || '🤖'}</div>
        <div>
          <h4 className="font-semibold text-white">{member.name}</h4>
          <p className="text-sm text-dark-muted">{member.role}</p>
        </div>
      </div>
    </div>
  );
}
