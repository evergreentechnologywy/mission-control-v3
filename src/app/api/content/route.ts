import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ContentItem } from '@/lib/types';
import { isAuthenticatedRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await query<ContentItem>('SELECT * FROM content_items ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, stage, notes, image_url, owner } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const item = await queryOne<ContentItem>(
      `INSERT INTO content_items (title, stage, notes, image_url, owner)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title,
        stage || 'idea',
        notes || null,
        image_url || null,
        owner || 'assistant',
      ]
    );

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, stage, notes, image_url, owner } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const item = await queryOne<ContentItem>(
      `UPDATE content_items 
       SET title = COALESCE($2, title),
           stage = COALESCE($3, stage),
           notes = COALESCE($4, notes),
           image_url = COALESCE($5, image_url),
           owner = COALESCE($6, owner),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, title, stage, notes, image_url, owner]
    );

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
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

    await query('DELETE FROM content_items WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
