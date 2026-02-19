import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedRequest } from '@/lib/auth';
import { getTaskRuns } from '@/lib/taskRuns';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || 20);

  try {
    const data = await getTaskRuns(Number.isFinite(limit) ? limit : 20);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching task runs:', error);
    return NextResponse.json({ error: 'Failed to fetch task runs' }, { status: 500 });
  }
}
