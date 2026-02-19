import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedRequest } from '@/lib/auth';
import { previewAssignment } from '@/lib/taskAutomation';

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const data = await previewAssignment(body || {});
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error previewing automation rule match', error);
    return NextResponse.json({ success: false, error: 'Failed to preview rule match' }, { status: 500 });
  }
}
