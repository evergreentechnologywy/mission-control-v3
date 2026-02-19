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

export default function MemoryPage() {
  const [tree, setTree] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const fetchTree = useCallback(async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.success) {
        setTree(data.data);
        // Auto-expand memory directory
        setExpandedDirs(new Set(['memory']));
      }
    } catch (error) {
      console.error('Error fetching memory tree:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const fetchFile = async (path: string) => {
    setContentLoading(true);
    try {
      const res = await fetch(`/api/memory?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.success) {
        setContent(data.data.content);
        setSelectedFile(path);
      }
    } catch (error) {
      console.error('Error fetching file:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const renderTree = (items: MemoryFile[], depth = 0) => {
    return items.map((item) => {
      const isExpanded = expandedDirs.has(item.path);
      const isSelected = selectedFile === item.path;
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch && item.type === 'file') return null;

      return (
        <div key={item.path}>
          <button
            onClick={() => {
              if (item.type === 'directory') {
                toggleDir(item.path);
              } else {
                fetchFile(item.path);
              }
            }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors rounded-lg ${
              isSelected
                ? 'bg-accent-blue/20 text-accent-blue'
                : 'text-dark-muted hover:bg-dark-hover hover:text-white'
            }`}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
          >
            <span className="text-sm">
              {item.type === 'directory' 
                ? (isExpanded ? '📂' : '📁')
                : '📄'}
            </span>
            <span className="truncate">{item.name}</span>
          </button>
          
          {item.type === 'directory' && isExpanded && item.children && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {renderTree(item.children, depth + 1)}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      );
    });
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="bg-gray-800 p-3 rounded mb-3 overflow-x-auto">
              <code className="text-sm font-mono text-green-400">
                {codeBlockContent.join('\n')}
              </code>
            </pre>
          );
          codeBlockContent = [];
        }
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-lg font-medium mb-2 text-white">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-xl font-semibold mb-3 text-white">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-2xl font-bold mb-4 text-white">
            {line.slice(2)}
          </h1>
        );
      }
      // List items
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={i} className="text-gray-300 ml-4 mb-1">
            {renderInline(line.slice(2))}
          </li>
        );
      }
      // Horizontal rule
      else if (line.match(/^---+$/)) {
        elements.push(<hr key={i} className="border-gray-700 my-4" />);
      }
      // Timestamp line (common in journal entries)
      else if (line.match(/^\d{1,2}:\d{2}/)) {
        elements.push(
          <div key={i} className="flex gap-3 mb-3">
            <span className="text-accent-blue font-mono text-sm whitespace-nowrap">
              {line.match(/^\d{1,2}:\d{2}(?:\s*[AP]M)?/i)?.[0]}
            </span>
            <span className="text-gray-300">{renderInline(line.replace(/^\d{1,2}:\d{2}(?:\s*[AP]M)?:?\s*/i, ''))}</span>
          </div>
        );
      }
      // Regular paragraph
      else if (line.trim()) {
        elements.push(
          <p key={i} className="text-gray-300 mb-3">
            {renderInline(line)}
          </p>
        );
      }
      // Empty line
      else {
        elements.push(<div key={i} className="h-2" />);
      }
    });

    return elements;
  };

  const renderInline = (text: string) => {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    // Code
    text = text.replace(/`(.+?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-green-400">$1</code>');
    // Links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-accent-blue hover:underline">$1</a>');
    
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-dark-muted">Loading memory...</div>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Memory" subtitle="Browse workspace files and journal entries" />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-dark-border bg-dark-card flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-dark-border">
            <div className="relative">
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-accent-blue"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-sm">🔍</span>
            </div>
          </div>
          
          {/* File Tree */}
          <div className="flex-1 overflow-y-auto p-2">
            {renderTree(tree)}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="px-6 py-3 border-b border-dark-border bg-dark-card/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <span className="font-medium text-white">{selectedFile}</span>
                </div>
              </div>
              
              {/* File Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {contentLoading ? (
                  <div className="text-dark-muted">Loading...</div>
                ) : (
                  <div className="max-w-3xl mx-auto markdown-content">
                    {renderMarkdown(content)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-4 block">📚</span>
                <h3 className="text-xl font-semibold text-white mb-2">Select a file</h3>
                <p className="text-dark-muted">Choose a file from the sidebar to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
