'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import ContentCard from '@/components/kanban/ContentCard';
import { ContentItem } from '@/lib/types';
import { AnimatePresence } from 'framer-motion';

type ContentStage = 'idea' | 'scripting' | 'thumbnail' | 'filming' | 'editing' | 'done';

const columns: { key: ContentStage; title: string; icon: string; color: string }[] = [
  { key: 'idea', title: 'Ideas', icon: '💡', color: 'bg-accent-yellow' },
  { key: 'scripting', title: 'Scripting', icon: '✍️', color: 'bg-accent-purple' },
  { key: 'thumbnail', title: 'Thumbnail', icon: '🖼️', color: 'bg-accent-pink' },
  { key: 'filming', title: 'Filming', icon: '🎬', color: 'bg-accent-blue' },
  { key: 'editing', title: 'Editing', icon: '✂️', color: 'bg-accent-orange' },
];

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [newItemStage, setNewItemStage] = useState<ContentStage>('idea');

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleAdd = (stage: ContentStage) => {
    setEditingItem(null);
    setNewItemStage(stage);
    setShowModal(true);
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this content item?')) return;
    
    try {
      await fetch(`/api/content?id=${id}`, { method: 'DELETE' });
      setItems(items.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleSave = async (itemData: Partial<ContentItem>) => {
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem 
        ? { ...itemData, id: editingItem.id }
        : { ...itemData, stage: newItemStage };

      const res = await fetch('/api/content', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        if (editingItem) {
          setItems(items.map(i => i.id === editingItem.id ? data.data : i));
        } else {
          setItems([data.data, ...items]);
        }
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const itemsByStage = (stage: ContentStage) => items.filter(i => i.stage === stage);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-dark-muted">Loading content...</div>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Content Pipeline" subtitle="Track your content creation workflow" />
      
      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((col) => (
            <KanbanColumn
              key={col.key}
              title={col.title}
              count={itemsByStage(col.key).length}
              color={col.color}
              icon={col.icon}
              onAdd={() => handleAdd(col.key)}
            >
              <AnimatePresence mode="popLayout">
                {itemsByStage(col.key).map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </KanbanColumn>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ContentModal
          item={editingItem}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

interface ContentModalProps {
  item: ContentItem | null;
  onSave: (data: Partial<ContentItem>) => void;
  onClose: () => void;
}

function ContentModal({ item, onSave, onClose }: ContentModalProps) {
  const [title, setTitle] = useState(item?.title || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [owner, setOwner] = useState(item?.owner || 'assistant');
  const [stage, setStage] = useState(item?.stage || 'idea');
  const [platform, setPlatform] = useState('');

  // Extract platform from notes
  useEffect(() => {
    if (item?.notes) {
      const match = item.notes.match(/platform:\s*(\w+)/i);
      if (match) {
        setPlatform(match[1].toLowerCase());
        setNotes(item.notes.replace(/platform:\s*\w+\n?/i, '').trim());
      }
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullNotes = platform ? `platform: ${platform}\n${notes}` : notes;
    onSave({ title, notes: fullNotes, image_url: imageUrl || null, owner, stage });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">
          {item ? 'Edit Content' : 'New Content'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-muted mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-dark-muted mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
            >
              <option value="">None</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="podcast">Podcast</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-dark-muted mb-1">Thumbnail URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              placeholder="https://..."
            />
          </div>
          
          <div>
            <label className="block text-sm text-dark-muted mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue h-24 resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Owner</label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              >
                <option value="assistant">🤖 Assistant</option>
                <option value="henry">👨‍💼 Henry</option>
                <option value="alex">👨‍🎨 Alex</option>
                <option value="quill">✍️ Quill</option>
              </select>
            </div>
            
            {item && (
              <div>
                <label className="block text-sm text-dark-muted mb-1">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ContentItem['stage'])}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
                >
                  <option value="idea">Ideas</option>
                  <option value="scripting">Scripting</option>
                  <option value="thumbnail">Thumbnail</option>
                  <option value="filming">Filming</option>
                  <option value="editing">Editing</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
