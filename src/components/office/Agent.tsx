'use client';

import { motion, TargetAndTransition, Transition } from 'framer-motion';
import { Agent as AgentType } from '@/lib/types';

interface AgentProps {
  agent: AgentType;
  onClick?: () => void;
}

interface AnimationConfig {
  animate: TargetAndTransition;
  transition?: Transition;
}

const statusAnimations: Record<AgentType['status'], AnimationConfig> = {
  working: {
    animate: { 
      y: [0, -4, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  chatting: {
    animate: { 
      rotate: [-3, 3, -3],
      transition: {
        duration: 0.4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  walking: {
    animate: { 
      x: [0, 10, 0, -10, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
  idle: {
    animate: {},
  },
};

const statusColors = {
  working: 'bg-accent-green',
  chatting: 'bg-accent-blue',
  walking: 'bg-accent-yellow',
  idle: 'bg-dark-muted',
};

export default function Agent({ agent, onClick }: AgentProps) {
  const animation = statusAnimations[agent.status];
  
  return (
    <motion.div
      className="absolute cursor-pointer select-none group"
      style={{ left: agent.position.x, top: agent.position.y }}
      animate={animation.animate}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
    >
      {/* Agent Avatar */}
      <div className="relative">
        <div className="w-12 h-12 bg-dark-card border-2 border-dark-border rounded-lg flex items-center justify-center text-2xl pixel-agent shadow-lg">
          {agent.emoji}
        </div>
        
        {/* Status indicator */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${statusColors[agent.status]} border-2 border-dark-bg ${agent.status === 'working' ? 'status-working' : ''}`} />
      </div>
      
      {/* Name label */}
      <div className="mt-1 text-center">
        <span className="text-xs font-medium text-white bg-dark-bg/80 px-2 py-0.5 rounded">
          {agent.name}
        </span>
      </div>
      
      {/* Tooltip on hover */}
      {agent.currentTask && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap shadow-lg">
            {agent.currentTask}
          </div>
        </div>
      )}
    </motion.div>
  );
}
