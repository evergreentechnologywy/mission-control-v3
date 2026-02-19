import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedRequest } from '@/lib/auth';
import { getDecision } from '@/lib/taskAutomation';
import { queryOne } from '@/lib/db';

async function callSubagentTool(input: Record<string, unknown>) {
  const endpoint = process.env.OPENCLAW_TOOLS_ENDPOINT;
  const authToken = process.env.OPENCLAW_TOOLS_TOKEN;

  if (!endpoint) {
    return { ok: false, status: 503, payload: { error: 'OpenClaw tools endpoint is not configured (OPENCLAW_TOOLS_ENDPOINT).' } };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ tool: 'subagents', input }),
    cache: 'no-store',
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { ok: response.ok, status: response.status, payload };
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const taskId = Number(body?.taskId);
    if (!taskId) return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 });

    const task = await queryOne<{ id: number; title: string; description: string | null; assignee: string }>(
      'SELECT id, title, description, assignee FROM board_tasks WHERE id = $1',
      [taskId]
    );

    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    const decision = await getDecision(taskId);
    const target = body?.target || decision?.assignedAgent || task.assignee;
    if (!target) return NextResponse.json({ success: false, error: 'No assigned target found. Run assignment first.' }, { status: 400 });

    const summary = `Task Dispatch\n#${task.id} ${task.title}\nAssignee: ${target}\n${task.description ? `Description: ${task.description}` : ''}`;

    const result = await callSubagentTool({ action: 'steer', target, message: summary });
    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.payload?.error || result.payload?.message || `Dispatch failed (${result.status}). Check OpenClaw tools endpoint and target subagent name.`,
          actionable: 'Verify OPENCLAW_TOOLS_ENDPOINT and confirm target subagent exists via /api/subagents.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: { target, result: result.payload } });
  } catch (error) {
    console.error('Error dispatching task', error);
    return NextResponse.json({ success: false, error: 'Dispatch failed unexpectedly. Check server logs and OpenClaw tool connectivity.' }, { status: 500 });
  }
}
