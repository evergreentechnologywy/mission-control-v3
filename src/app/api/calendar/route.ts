import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { CalendarEvent } from '@/lib/types';
import { isAuthenticatedRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await query<CalendarEvent>(
      'SELECT * FROM calendar_events ORDER BY starts_at ASC'
    );
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, starts_at, ends_at, source, details } = body;

    if (!title || !starts_at) {
      return NextResponse.json({ error: 'Title and start time are required' }, { status: 400 });
    }

    const event = await queryOne<CalendarEvent>(
      `INSERT INTO calendar_events (title, starts_at, ends_at, source, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, starts_at, ends_at || null, source || 'local', details || null]
    );

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, starts_at, ends_at, source, details } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const event = await queryOne<CalendarEvent>(
      `UPDATE calendar_events 
       SET title = COALESCE($2, title),
           starts_at = COALESCE($3, starts_at),
           ends_at = COALESCE($4, ends_at),
           source = COALESCE($5, source),
           details = COALESCE($6, details),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, title, starts_at, ends_at, source, details]
    );

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
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

    await query('DELETE FROM calendar_events WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
