import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isAuthenticatedRequest } from '@/lib/auth';

const NOTES_ROOT = '/root/.openclaw/workspace/notes';

type VaultNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: VaultNode[];
};

function safeJoin(relativePath = '') {
  const normalized = relativePath.replace(/^\/+/, '');
  const fullPath = path.resolve(NOTES_ROOT, normalized);
  if (!fullPath.startsWith(path.resolve(NOTES_ROOT))) {
    throw new Error('Path is outside vault allowlist');
  }
  return fullPath;
}

async function buildTree(basePath: string, relativeBase = ''): Promise<VaultNode[]> {
  const entries = await fs.readdir(basePath, { withFileTypes: true });
  const nodes: VaultNode[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relPath = path.posix.join(relativeBase, entry.name);
    const fullPath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relPath,
        type: 'directory',
        children: await buildTree(fullPath, relPath),
      });
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      nodes.push({ name: entry.name, path: relPath, type: 'file' });
    }
  }

  return nodes;
}

async function searchMarkdown(query: string, basePath: string, relativeBase = ''): Promise<any[]> {
  const entries = await fs.readdir(basePath, { withFileTypes: true });
  const results: any[] = [];
  const q = query.toLowerCase();

  for (const entry of entries) {
    const relPath = path.posix.join(relativeBase, entry.name);
    const fullPath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await searchMarkdown(query, fullPath, relPath)));
      continue;
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue;

    const content = await fs.readFile(fullPath, 'utf-8');
    const contentLower = content.toLowerCase();
    if (!contentLower.includes(q) && !entry.name.toLowerCase().includes(q)) continue;

    const idx = contentLower.indexOf(q);
    const start = Math.max(0, idx - 80);
    const end = Math.min(content.length, idx + 120);
    const snippet = idx >= 0 ? content.slice(start, end).replace(/\s+/g, ' ').trim() : '';

    results.push({ path: relPath, name: entry.name, snippet });
  }

  return results.slice(0, 100);
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get('path');
    const q = searchParams.get('q');

    if (q) {
      const results = await searchMarkdown(q, NOTES_ROOT);
      return NextResponse.json({ success: true, data: results, mode: 'search' });
    }

    if (targetPath) {
      const filePath = safeJoin(targetPath);
      const stat = await fs.stat(filePath);
      if (!stat.isFile() || !targetPath.toLowerCase().endsWith('.md')) {
        return NextResponse.json({ error: 'Only markdown files are readable' }, { status: 400 });
      }
      const content = await fs.readFile(filePath, 'utf-8');
      return NextResponse.json({ success: true, data: { path: targetPath, content } });
    }

    const tree = await buildTree(NOTES_ROOT);
    return NextResponse.json({ success: true, data: tree, mode: 'tree' });
  } catch (error: any) {
    console.error('Vault API error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to access vault' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const targetPath = body?.path;
    const content = body?.content;

    if (!targetPath || typeof content !== 'string') {
      return NextResponse.json({ error: 'path and content are required' }, { status: 400 });
    }

    if (!String(targetPath).toLowerCase().endsWith('.md')) {
      return NextResponse.json({ error: 'Only markdown files can be written' }, { status: 400 });
    }

    const fullPath = safeJoin(targetPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');

    return NextResponse.json({ success: true, data: { path: targetPath } });
  } catch (error: any) {
    console.error('Vault write error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update note' }, { status: 500 });
  }
}
