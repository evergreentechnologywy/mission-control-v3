import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Task } from '@/lib/types';
import { isAuthenticatedRequest } from '@/lib/auth';
import { pushTaskRun } from '@/lib/taskRuns';
import { assignTask, getAllDecisions, getAllTaskMetadata, upsertTaskMetadata } from '@/lib/taskAutomation';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [tasks, metadata, decisions] = await Promise.all([
      query<Task>('SELECT * FROM board_tasks ORDER BY created_at DESC'),
      getAllTaskMetadata(),
      getAllDecisions(),
    ]);

    const hydrated = tasks.map((task) => {
      const meta = metadata[String(task.id)] || null;
      const decision = decisions[String(task.id)] || null;
      return {
        ...task,
        automation: decision,
        tags: meta?.tags || [],
        project: meta?.project || null,
        type: meta?.type || null,
        manualOverride: meta?.manualOverride || null,
      };
    });

    return NextResponse.json({ success: true, data: hydrated });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, assignee, status, priority, due_at, tags, project, type, manualOverride } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const initialAssignee = assignee || 'assistant';

    const task = await queryOne<Task>(
      `INSERT INTO board_tasks (title, description, assignee, status, priority, due_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title,
        description || null,
        initialAssignee,
        status || 'backlog',
        priority || 'normal',
        due_at || null,
      ]
    );

    if (!task) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    await upsertTaskMetadata(task.id, {
      tags: Array.isArray(tags) ? tags : [],
      project,
      type,
      manualOverride: manualOverride || null,
    });

    const decision = await assignTask(task.id, {
      title,
      description,
      tags,
      project,
      type,
      manualOverride: manualOverride || null,
    });

    if (!assignee && decision?.assignedAgent) {
      await query('UPDATE board_tasks SET assignee = $2, updated_at = NOW() WHERE id = $1', [task.id, decision.assignedAgent]);
      task.assignee = decision.assignedAgent;
    }

    await pushTaskRun({
      taskId: task.id,
      title: task.title,
      action: 'create',
      assignee: task.assignee,
      status: 'success',
      message: decision ? `Task created and auto-assigned: ${decision.assignedAgent}` : 'Task created',
    });

    return NextResponse.json({ success: true, data: { ...task, automation: decision } });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticatedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, description, assignee, status, priority, due_at, tags, project, type, manualOverride, runAutomation } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const task = await queryOne<Task>(
      `UPDATE board_tasks 
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           assignee = COALESCE($4, assignee),
           status = COALESCE($5, status),
           priority = COALESCE($6, priority),
           due_at = COALESCE($7, due_at),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, title, description, assignee, status, priority, due_at]
    );

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    if (tags !== undefined || project !== undefined || type !== undefined || manualOverride !== undefined) {
      await upsertTaskMetadata(Number(id), {
        tags: Array.isArray(tags) ? tags : undefined,
        project,
        type,
        manualOverride,
      });
    }

    let decision = null;
    if (runAutomation || manualOverride !== undefined) {
      decision = await assignTask(Number(id));
      if (!assignee && decision?.assignedAgent) {
        await query('UPDATE board_tasks SET assignee = $2, updated_at = NOW() WHERE id = $1', [id, decision.assignedAgent]);
        task.assignee = decision.assignedAgent;
      }
    }

    await pushTaskRun({
      taskId: task.id,
      title: task.title,
      action: 'update',
      assignee: task.assignee,
      status: 'success',
      message: decision ? `Task moved to ${task.status} • auto-assigned ${task.assignee}` : `Task moved to ${task.status}`,
    });

    return NextResponse.json({ success: true, data: { ...task, automation: decision } });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
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

    const existing = await queryOne<Task>('SELECT * FROM board_tasks WHERE id = $1', [id]);
    await query('DELETE FROM board_tasks WHERE id = $1', [id]);

    if (existing) {
      await pushTaskRun({
        taskId: existing.id,
        title: existing.title,
        action: 'delete',
        assignee: existing.assignee,
        status: 'success',
        message: 'Task deleted',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
