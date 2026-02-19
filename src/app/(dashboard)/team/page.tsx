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

// Default team data with categories and skills
const defaultTeam: Omit<TeamMember, 'id'>[] = [
  {
    name: 'Henry',
    role: 'Chief of Staff',
    status: 'active',
    emoji: '👨‍💼',
    category: 'chief',
    skills: ['Leadership', 'Strategy', 'Coordination'],
  },
  {
    name: 'Scout',
    role: 'Information Gatherer',
    status: 'active',
    emoji: '🔭',
    category: 'input',
    skills: ['Web Search', 'Research', 'Data Mining'],
  },
  {
    name: 'Echo',
    role: 'Listener',
    status: 'active',
    emoji: '🔊',
    category: 'input',
    skills: ['Event Monitoring', 'Notifications', 'Alerts'],
  },
  {
    name: 'Quill',
    role: 'Writer',
    status: 'active',
    emoji: '✍️',
    category: 'output',
    skills: ['Documentation', 'Content', 'Communication'],
  },
  {
    name: 'Pixel',
    role: 'Designer',
    status: 'active',
    emoji: '🎨',
    category: 'output',
    skills: ['UI Design', 'Graphics', 'Visuals'],
  },
  {
    name: 'Codex',
    role: 'Knowledge Base',
    status: 'active',
    emoji: '📚',
    category: 'meta',
    skills: ['Memory', 'Indexing', 'Retrieval'],
  },
  {
    name: 'Alex',
    role: 'Executor',
    status: 'active',
    emoji: '👨‍🎨',
    category: 'output',
    skills: ['Automation', 'Tasks', 'Integration'],
  },
];

const categoryLabels: Record<string, string> = {
  chief: 'Leadership',
  input: 'Input Signal',
  output: 'Output Action',
  meta: 'Meta Layer',
};

const skillColors = [
  'bg-accent-blue',
  'bg-accent-green',
  'bg-accent-purple',
  'bg-accent-pink',
  'bg-accent-yellow',
  'bg-accent-orange',
  'bg-accent-cyan',
];

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        // Merge with default data for display properties
        const merged = data.data.map((member: TeamMember) => {
          const defaults = defaultTeam.find(
            (d) => d.name.toLowerCase() === member.name.toLowerCase()
          );
          return { ...defaults, ...member };
        });
        setTeam(merged);
      } else {
        // Use default team
        setTeam(defaultTeam.map((m, i) => ({ ...m, id: i + 1 })));
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeam(defaultTeam.map((m, i) => ({ ...m, id: i + 1 })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const chief = team.find((m) => m.category === 'chief');
  const inputTeam = team.filter((m) => m.category === 'input');
  const outputTeam = team.filter((m) => m.category === 'output');
  const metaTeam = team.filter((m) => m.category === 'meta');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-dark-muted">Loading team...</div>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Team" subtitle="Meet your agent team" />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Meet the Team</h2>
          <p className="text-dark-muted">Your AI-powered workforce, always ready to help</p>
        </div>
        
        {/* Chief of Staff */}
        {chief && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-8"
          >
            <TeamCard member={chief} featured />
          </motion.div>
        )}
        
        {/* Team Groups */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Input Signal */}
          <TeamGroup title={categoryLabels.input} members={inputTeam} delay={0.1} />
          
          {/* Output Action */}
          <TeamGroup title={categoryLabels.output} members={outputTeam} delay={0.2} />
          
          {/* Meta Layer */}
          <TeamGroup title={categoryLabels.meta} members={metaTeam} delay={0.3} />
        </div>
      </div>
    </>
  );
}

function TeamGroup({ title, members, delay }: { title: string; members: TeamMember[]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent-blue" />
        {title}
      </h3>
      <div className="space-y-4">
        {members.map((member) => (
          <TeamCard key={member.id} member={member} />
        ))}
      </div>
    </motion.div>
  );
}

function TeamCard({ member, featured }: { member: TeamMember; featured?: boolean }) {
  return (
    <div
      className={`bg-dark-card border border-dark-border rounded-xl p-4 transition-all hover:border-dark-hover ${
        featured ? 'border-accent-blue/50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`${
            featured ? 'w-16 h-16 text-4xl' : 'w-12 h-12 text-2xl'
          } bg-dark-bg rounded-xl flex items-center justify-center shrink-0`}
        >
          {member.emoji || '🤖'}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white">{member.name}</h4>
            <span
              className={`w-2 h-2 rounded-full ${
                member.status === 'active'
                  ? 'bg-accent-green'
                  : member.status === 'idle'
                  ? 'bg-accent-yellow'
                  : 'bg-dark-muted'
              }`}
            />
          </div>
          <p className="text-sm text-dark-muted mb-2">{member.role}</p>
          
          {/* Skills */}
          {member.skills && member.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {member.skills.map((skill, i) => (
                <span
                  key={skill}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    skillColors[i % skillColors.length]
                  } text-white`}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
