'use client';

import { Task } from '@/lib/types';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: number) => void;
  onAssign?: (id: number) => void;
  onDispatch?: (id: number) => void;
}

const priorityColors = {
  low: 'bg-gray-500',
  normal: 'bg-accent-blue',
  high: 'bg-accent-orange',
  urgent: 'bg-accent-red',
};

const assigneeEmojis: Record<string, string> = {
  me: '🙋',
  assistant: '🤖',
  friday: '🧠',
  veronica: '💬',
  karen: '💻',
  tadashi: '🖥️',
  henry: '👨‍💼',
  alex: '👨‍🎨',
  quill: '✍️',
  echo: '🔊',
  scout: '🔭',
  codex: '📚',
  pixel: '🎨',
};

export default function TaskCard({ task, onEdit, onDelete, onAssign, onDispatch }: TaskCardProps) {
  const timeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="kanban-card bg-dark-bg border border-dark-border rounded-lg p-3 cursor-pointer group relative"
      onClick={() => onEdit?.(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-white flex-1 line-clamp-2">{task.title}</h4>
        <span className={`w-2 h-2 rounded-full ${priorityColors[task.priority]} shrink-0 mt-1.5`} />
      </div>

      {task.automation?.assignedAgent && (
        <div className="mb-2">
          <span
            className="inline-flex text-[10px] bg-accent-blue/20 text-accent-blue border border-accent-blue/40 px-1.5 py-0.5 rounded"
            title={`${task.automation.matchedRuleName || 'No rule'} • ${task.automation.reason}`}
          >
            Auto: {task.automation.assignedAgent}
          </span>
        </div>
      )}

      {task.description && (
        <p className="text-xs text-dark-muted mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm" title={task.assignee}>
            {assigneeEmojis[task.assignee.toLowerCase()] || '👤'}
          </span>
          <span className="text-xs text-dark-muted capitalize">{task.assignee}</span>
        </div>

        <span className="text-xs text-dark-muted">{timeAgo(task.created_at)}</span>
      </div>

      {task.due_at && (
        <div className="mt-2 text-xs text-accent-yellow">
          📅 Due: {new Date(task.due_at).toLocaleDateString()}
        </div>
      )}

      <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onAssign?.(task.id); }} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-hover text-dark-muted hover:text-white">Assign</button>
        <button onClick={(e) => { e.stopPropagation(); onDispatch?.(task.id); }} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-hover text-dark-muted hover:text-white">Dispatch</button>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(task.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-dark-hover text-dark-muted hover:text-accent-red transition-all"
      >
        ×
      </button>
    </motion.div>
  );
}
