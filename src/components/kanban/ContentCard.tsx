'use client';

import { ContentItem } from '@/lib/types';
import { motion } from 'framer-motion';

interface ContentCardProps {
  item: ContentItem;
  onEdit?: (item: ContentItem) => void;
  onDelete?: (id: number) => void;
}

const platformColors: Record<string, string> = {
  youtube: 'bg-red-500',
  tiktok: 'bg-black border border-white',
  instagram: 'bg-pink-500',
  twitter: 'bg-blue-400',
  podcast: 'bg-purple-500',
};

const ownerEmojis: Record<string, string> = {
  assistant: '🤖',
  henry: '👨‍💼',
  alex: '👨‍🎨',
  quill: '✍️',
};

export default function ContentCard({ item, onEdit, onDelete }: ContentCardProps) {
  const platform = item.notes?.match(/platform:\s*(\w+)/i)?.[1]?.toLowerCase() || '';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="kanban-card bg-dark-bg border border-dark-border rounded-lg overflow-hidden cursor-pointer group relative"
      onClick={() => onEdit?.(item)}
    >
      {/* Thumbnail */}
      {item.image_url && (
        <div className="h-24 bg-dark-hover">
          <img 
            src={item.image_url} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-3">
        <h4 className="text-sm font-medium text-white mb-2 line-clamp-2">{item.title}</h4>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {platform && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${platformColors[platform] || 'bg-dark-muted'} text-white`}>
              {platform}
            </span>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-sm">{ownerEmojis[item.owner.toLowerCase()] || '👤'}</span>
            <span className="text-xs text-dark-muted capitalize">{item.owner}</span>
          </div>
          
          <span className="text-xs text-dark-muted">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(item.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-dark-bg/80 text-dark-muted hover:text-accent-red transition-all"
      >
        ×
      </button>
    </motion.div>
  );
}
