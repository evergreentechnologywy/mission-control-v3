import { promises as fs } from 'fs';
import path from 'path';

const WORKSPACE_PATH = process.env.WORKSPACE_PATH || '/workspace';

export interface MemoryFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: MemoryFile[];
}

export async function getMemoryTree(): Promise<MemoryFile[]> {
  const memoryPath = path.join(WORKSPACE_PATH, 'memory');
  
  try {
    const files = await fs.readdir(memoryPath, { withFileTypes: true });
    const tree: MemoryFile[] = [];
    
    // Group by year/month if possible
    const mdFiles = files.filter(f => f.isFile() && f.name.endsWith('.md'));
    
    // Create "Daily Journal" sections grouped by month
    const byMonth: Record<string, MemoryFile[]> = {};
    
    for (const file of mdFiles) {
      const match = file.name.match(/^(\d{4})-(\d{2})-\d{2}\.md$/);
      if (match) {
        const monthKey = `${match[1]}-${match[2]}`;
        if (!byMonth[monthKey]) {
          byMonth[monthKey] = [];
        }
        byMonth[monthKey].push({
          name: file.name,
          path: path.join('memory', file.name),
          type: 'file',
        });
      }
    }
    
    // Sort months descending
    const sortedMonths = Object.keys(byMonth).sort().reverse();
    
    for (const month of sortedMonths) {
      const date = new Date(month + '-01');
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      tree.push({
        name: `Daily Journal - ${monthName}`,
        path: month,
        type: 'directory',
        children: byMonth[month].sort((a, b) => b.name.localeCompare(a.name)),
      });
    }
    
    // Add other markdown files at root
    const otherFiles = files.filter(f => 
      f.isFile() && 
      f.name.endsWith('.md') && 
      !f.name.match(/^\d{4}-\d{2}-\d{2}\.md$/)
    );
    
    for (const file of otherFiles) {
      tree.unshift({
        name: file.name,
        path: path.join('memory', file.name),
        type: 'file',
      });
    }
    
    return tree;
  } catch (error) {
    console.error('Error reading memory directory:', error);
    return [];
  }
}

export async function getMemoryFile(filePath: string): Promise<string> {
  const fullPath = path.join(WORKSPACE_PATH, filePath);
  
  // Security check - ensure we're still within workspace
  if (!fullPath.startsWith(WORKSPACE_PATH)) {
    throw new Error('Invalid path');
  }
  
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error('File not found');
  }
}

export async function listWorkspaceFiles(): Promise<MemoryFile[]> {
  try {
    const files = await fs.readdir(WORKSPACE_PATH, { withFileTypes: true });
    const tree: MemoryFile[] = [];
    
    // Add key workspace files
    const keyFiles = ['SOUL.md', 'AGENTS.md', 'USER.md', 'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md'];
    
    for (const keyFile of keyFiles) {
      if (files.some(f => f.name === keyFile)) {
        tree.push({
          name: keyFile,
          path: keyFile,
          type: 'file',
        });
      }
    }
    
    // Add memory directory
    if (files.some(f => f.name === 'memory' && f.isDirectory())) {
      const memoryTree = await getMemoryTree();
      tree.push({
        name: 'memory',
        path: 'memory',
        type: 'directory',
        children: memoryTree,
      });
    }
    
    return tree;
  } catch (error) {
    console.error('Error listing workspace files:', error);
    return [];
  }
}
