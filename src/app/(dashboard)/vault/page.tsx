'use client';

import { useCallback, useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';

interface VaultFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: VaultFile[];
}

export default function VaultPage() {
  const [tree, setTree] = useState<VaultFile[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ path: string; name: string; snippet: string }[]>([]);

  const loadTree = useCallback(async () => {
    const res = await fetch('/api/vault');
    const data = await res.json();
    if (data.success) {
      setTree(data.data);
      setExpanded(new Set(['']));
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const openFile = async (path: string) => {
    const res = await fetch(`/api/vault?path=${encodeURIComponent(path)}`);
    const data = await res.json();
    if (data.success) {
      setSelectedPath(path);
      setContent(data.data.content);
    }
  };

  const runSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/vault?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success) setResults(data.data);
  };

  const renderTree = (nodes: VaultFile[], depth = 0): React.ReactNode =>
    nodes.map((node) => {
      const isOpen = expanded.has(node.path);
      return (
        <div key={node.path}>
          <button
            className="w-full text-left px-3 py-1.5 rounded text-sm text-dark-muted hover:text-white hover:bg-dark-hover"
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            onClick={() => {
              if (node.type === 'directory') {
                const next = new Set(expanded);
                if (isOpen) next.delete(node.path);
                else next.add(node.path);
                setExpanded(next);
              } else {
                openFile(node.path);
              }
            }}
          >
            {node.type === 'directory' ? (isOpen ? '📂' : '📁') : '📄'} {node.name}
          </button>
          {node.type === 'directory' && isOpen && node.children && renderTree(node.children, depth + 1)}
        </div>
      );
    });

  return (
    <>
      <TopBar title="Vault" subtitle="Obsidian vault (read + safe write API)" />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-dark-border bg-dark-card p-3 overflow-y-auto">
          <div className="mb-3 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="Search markdown..."
              className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white"
            />
            <button onClick={runSearch} className="px-3 py-2 rounded bg-accent-blue text-white text-sm">Search</button>
          </div>
          {results.length > 0 ? (
            <div className="space-y-2 mb-3">
              {results.map((r) => (
                <button key={r.path} onClick={() => openFile(r.path)} className="w-full text-left bg-dark-bg rounded p-2">
                  <div className="text-xs text-white">{r.path}</div>
                  <div className="text-xs text-dark-muted mt-1">{r.snippet || 'Match in filename'}</div>
                </button>
              ))}
            </div>
          ) : null}
          <div className="border-t border-dark-border pt-2">{renderTree(tree)}</div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {selectedPath ? (
            <>
              <div className="text-sm text-dark-muted mb-3">{selectedPath}</div>
              <pre className="whitespace-pre-wrap text-sm text-gray-200">{content}</pre>
            </>
          ) : (
            <div className="text-dark-muted">Open a markdown file from the vault tree.</div>
          )}
        </div>
      </div>
    </>
  );
}
