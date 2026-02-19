'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';

interface MemoryFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: MemoryFile[];
}

type SourceFilter = 'system' | 'vault' | 'all';

export default function MemoryPage() {
  const [systemTree, setSystemTree] = useState<MemoryFile[]>([]);
  const [vaultTree, setVaultTree] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<'system' | 'vault'>('system');
  const [content, setContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const fetchTrees = useCallback(async () => {
    try {
      const [memoryRes, vaultRes] = await Promise.all([fetch('/api/memory'), fetch('/api/vault')]);
      const memoryData = await memoryRes.json();
      const vaultData = await vaultRes.json();
      if (memoryData.success) setSystemTree(memoryData.data);
      if (vaultData.success) setVaultTree(vaultData.data);
      setExpandedDirs(new Set(['memory']));
    } catch (error) {
      console.error('Error fetching trees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  const fetchFile = async (path: string, source: 'system' | 'vault') => {
    setContentLoading(true);
    try {
      const base = source === 'system' ? '/api/memory' : '/api/vault';
      const res = await fetch(`${base}?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.success) {
        setContent(data.data.content);
        setSelectedFile(path);
        setSelectedSource(source);
      }
    } catch (error) {
      console.error('Error fetching file:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) newExpanded.delete(path);
    else newExpanded.add(path);
    setExpandedDirs(newExpanded);
  };

  const renderTree = (items: MemoryFile[], source: 'system' | 'vault', depth = 0): React.ReactNode => {
    return items.map((item) => {
      const key = `${source}:${item.path}`;
      const isExpanded = expandedDirs.has(key) || expandedDirs.has(item.path);
      const isSelected = selectedFile === item.path && selectedSource === source;
      const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch && item.type === 'file') return null;

      return (
        <div key={key}>
          <button
            onClick={() => (item.type === 'directory' ? toggleDir(key) : fetchFile(item.path, source))}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors rounded-lg ${
              isSelected ? 'bg-accent-blue/20 text-accent-blue' : 'text-dark-muted hover:bg-dark-hover hover:text-white'
            }`}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
          >
            <span>{item.type === 'directory' ? (isExpanded ? '📂' : '📁') : '📄'}</span>
            <span className="truncate">{item.name}</span>
          </button>
          {item.type === 'directory' && isExpanded && item.children && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {renderTree(item.children, source, depth + 1)}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      );
    });
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-dark-muted">Loading memory...</div>;

  return (
    <>
      <TopBar title="Memory" subtitle="Browse system memory + Obsidian notes" />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-dark-border bg-dark-card flex flex-col">
          <div className="p-3 border-b border-dark-border space-y-2">
            <div className="flex gap-2">
              {(['all', 'system', 'vault'] as SourceFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setSourceFilter(f)}
                  className={`px-2 py-1 text-xs rounded ${sourceFilter === f ? 'bg-accent-blue text-white' : 'bg-dark-bg text-dark-muted'}`}
                >
                  {f === 'all' ? 'All' : f === 'system' ? 'System' : 'Vault'}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {(sourceFilter === 'all' || sourceFilter === 'system') && (
              <>
                <div className="text-xs uppercase text-dark-muted px-2 py-1">System Memory</div>
                {renderTree(systemTree, 'system')}
              </>
            )}
            {(sourceFilter === 'all' || sourceFilter === 'vault') && (
              <>
                <div className="text-xs uppercase text-dark-muted px-2 py-1 mt-2">Obsidian Vault</div>
                {renderTree(vaultTree, 'vault')}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedFile ? (
            <>
              <div className="text-sm text-dark-muted mb-3">[{selectedSource}] {selectedFile}</div>
              {contentLoading ? <div className="text-dark-muted">Loading...</div> : <pre className="whitespace-pre-wrap text-gray-200">{content}</pre>}
            </>
          ) : (
            <div className="text-center text-dark-muted mt-20">Select a file to view contents</div>
          )}
        </div>
      </div>
    </>
  );
}
