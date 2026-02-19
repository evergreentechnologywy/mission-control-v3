import { NextRequest, NextResponse } from 'next/server';
import { listWorkspaceFiles, getMemoryFile } from '@/lib/memory';
import { isAuthenticatedRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  try {
    if (path) {
      // Get specific file content
      const content = await getMemoryFile(path);
      return NextResponse.json({ success: true, data: { content } });
    } else {
      // Get file tree
      const tree = await listWorkspaceFiles();
      return NextResponse.json({ success: true, data: tree });
    }
  } catch (error) {
    console.error('Error accessing memory:', error);
    return NextResponse.json({ error: 'Failed to access memory' }, { status: 500 });
  }
}
