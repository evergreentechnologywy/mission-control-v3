import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedRequest } from '@/lib/auth';
import { assignTask, upsertTaskMetadata } from '@/lib/taskAutomation';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const taskId = Number(body?.taskId);
    if (!taskId) return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 });

    if (body?.metadata) {
      await upsertTaskMetadata(taskId, body.metadata);
    }

    const decision = await assignTask(taskId);
    if (!decision) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    if (body?.applyToTask !== false) {
      await query('UPDATE board_tasks SET assignee = $2, updated_at = NOW() WHERE id = $1', [taskId, decision.assignedAgent]);
    }

    return NextResponse.json({ success: true, data: decision });
  } catch (error) {
    console.error('Error assigning task by automation', error);
    return NextResponse.json({ success: false, error: 'Failed to run assignment' }, { status: 500 });
  }
}
