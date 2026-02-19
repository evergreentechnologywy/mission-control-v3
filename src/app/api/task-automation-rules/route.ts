import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedRequest } from '@/lib/auth';
import { createRule, deleteRule, getRules, updateRule } from '@/lib/taskAutomation';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await getRules();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error loading automation rules', error);
    return NextResponse.json({ success: false, error: 'Failed to load rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const data = await createRule(body || {});
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error creating automation rule', error);
    return NextResponse.json({ success: false, error: 'Failed to create rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body?.id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    const data = await updateRule(body.id, body);
    if (!data) return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating automation rule', error);
    return NextResponse.json({ success: false, error: 'Failed to update rule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  try {
    const ok = await deleteRule(id);
    if (!ok) return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting automation rule', error);
    return NextResponse.json({ success: false, error: 'Failed to delete rule' }, { status: 500 });
  }
}
