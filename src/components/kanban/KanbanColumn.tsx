'use client';

import { ReactNode } from 'react';

interface KanbanColumnProps {
  title: string;
  count: number;
  color?: string;
  icon?: string;
  children: ReactNode;
  onAdd?: () => void;
}

export default function KanbanColumn({
  title,
  count,
  color = 'bg-dark-muted',
  icon,
  children,
  onAdd,
}: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[340px] bg-dark-card border border-dark-border rounded-xl flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className="font-medium text-white">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color} text-white`}>
            {count}
          </span>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-dark-bg hover:bg-dark-hover text-dark-muted hover:text-white transition-colors"
          >
            +
          </button>
        )}
      </div>
      
      {/* Cards */}
      <div className="flex-1 p-2 overflow-y-auto space-y-2">
        {children}
      </div>
    </div>
  );
}
