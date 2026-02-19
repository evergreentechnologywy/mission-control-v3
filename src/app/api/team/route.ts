import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { TeamMember } from '@/lib/types';
import { isAuthenticatedRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const members = await query<TeamMember>('SELECT * FROM team_roles ORDER BY created_at');
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, role, status } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const member = await queryOne<TeamMember>(
      `INSERT INTO team_roles (name, role, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, role, status || 'active']
    );

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, role, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const member = await queryOne<TeamMember>(
      `UPDATE team_roles 
       SET name = COALESCE($2, name),
           role = COALESCE($3, role),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name, role, status]
    );

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await query('DELETE FROM team_roles WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}
