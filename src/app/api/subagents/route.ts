import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedRequest } from '@/lib/auth';

interface OpenClawSubagent {
  id?: string;
  target?: string;
  label?: string;
  name?: string;
  status?: string;
  state?: string;
  role?: string;
  scope?: string;
  summary?: string;
  updatedAt?: string;
  updated_at?: string;
  lastActivity?: string;
  last_activity?: string;
}

function toArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.subagents)) return payload.subagents;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeSubagent(item: OpenClawSubagent, index: number) {
  return {
    id: item.id || item.target || `subagent-${index}`,
    name: item.label || item.name || item.target || `Subagent ${index + 1}`,
    status: (item.status || item.state || 'unknown').toLowerCase(),
    summary: item.summary || item.role || item.scope || 'No scope summary provided',
    lastActivity: item.lastActivity || item.last_activity || item.updatedAt || item.updated_at || null,
    raw: item,
  };
}

async function callSubagentTool(input: Record<string, unknown>) {
  const endpoint = process.env.OPENCLAW_TOOLS_ENDPOINT;
  const authToken = process.env.OPENCLAW_TOOLS_TOKEN;

  if (!endpoint) {
    return { ok: false, status: 503, payload: { error: 'Tools endpoint not configured' } };
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

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await callSubagentTool({ action: 'list' });

    if (!result.ok) {
      return NextResponse.json({
        success: true,
        data: [],
        unavailable: true,
        message: `OpenClaw tools endpoint returned ${result.status}`,
      });
    }

    const rawItems = toArray(result.payload);
    const subagents = rawItems.map(normalizeSubagent);

    return NextResponse.json({ success: true, data: subagents, unavailable: false });
  } catch (error) {
    console.error('Error fetching subagents:', error);
    return NextResponse.json({
      success: true,
      data: [],
      unavailable: true,
      message: 'Could not reach OpenClaw tools endpoint.',
    });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body?.action;

    if (!['steer', 'kill', 'list'].includes(action)) {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const input: Record<string, unknown> = { action };
    if (body?.target) input.target = body.target;
    if (body?.message) input.message = body.message;

    const result = await callSubagentTool(input);
    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.payload?.error || result.payload?.message || `Subagent action failed (${result.status})`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: result.payload });
  } catch (error) {
    console.error('Error executing subagent action:', error);
    return NextResponse.json({ success: false, error: 'Failed to execute subagent action' }, { status: 500 });
  }
}
