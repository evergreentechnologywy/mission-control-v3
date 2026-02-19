import { promises as fs } from 'fs';
import path from 'path';

const RUNS_FILE = path.join(process.cwd(), '.data', 'task-runs.json');

export type TaskRunStatus = 'running' | 'success' | 'error';

export interface TaskRun {
  id: string;
  taskId?: number;
  title: string;
  action: 'create' | 'update' | 'delete';
  assignee: string;
  assignedToType: 'me' | 'assistant' | 'subagent';
  status: TaskRunStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(RUNS_FILE), { recursive: true });
  try {
    await fs.access(RUNS_FILE);
  } catch {
    await fs.writeFile(RUNS_FILE, '[]', 'utf-8');
  }
}

export async function getTaskRuns(limit = 30): Promise<TaskRun[]> {
  await ensureStore();
  const raw = await fs.readFile(RUNS_FILE, 'utf-8');
  const parsed = JSON.parse(raw) as TaskRun[];
  return parsed
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, limit);
}

export function assigneeType(assignee: string): 'me' | 'assistant' | 'subagent' {
  const normalized = (assignee || '').toLowerCase();
  if (normalized === 'me' || normalized === 'user' || normalized === 'owner') return 'me';
  if (normalized === 'assistant') return 'assistant';
  return 'subagent';
}

export async function pushTaskRun(input: {
  taskId?: number;
  title: string;
  action: 'create' | 'update' | 'delete';
  assignee: string;
  status: TaskRunStatus;
  message?: string;
}) {
  await ensureStore();
  const runs = await getTaskRuns(500);
  const now = new Date().toISOString();
  const run: TaskRun = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    taskId: input.taskId,
    title: input.title,
    action: input.action,
    assignee: input.assignee || 'assistant',
    assignedToType: assigneeType(input.assignee || 'assistant'),
    status: input.status,
    message: input.message,
    createdAt: now,
    updatedAt: now,
  };

  const next = [run, ...runs].slice(0, 500);
  await fs.writeFile(RUNS_FILE, JSON.stringify(next, null, 2), 'utf-8');
  return run;
}
