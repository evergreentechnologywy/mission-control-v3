'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import TaskCard from '@/components/kanban/TaskCard';
import { Task } from '@/lib/types';
import { AnimatePresence } from 'framer-motion';

type TaskStatus = 'recurring' | 'backlog' | 'in_progress' | 'review' | 'done';

type TaskRun = {
  id: string;
  title: string;
  action: 'create' | 'update' | 'delete';
  assignee: string;
  assignedToType: 'me' | 'assistant' | 'subagent';
  status: 'running' | 'success' | 'error';
  message?: string;
  updatedAt: string;
};

type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  assignTo: string;
  keywords: string[];
  tags: string[];
  projects: string[];
  types: string[];
};

const columns: { key: TaskStatus; title: string; icon: string; color: string }[] = [
  { key: 'recurring', title: 'Recurring', icon: '🔄', color: 'bg-accent-purple' },
  { key: 'backlog', title: 'Backlog', icon: '📥', color: 'bg-dark-muted' },
  { key: 'in_progress', title: 'In Progress', icon: '🚀', color: 'bg-accent-blue' },
  { key: 'review', title: 'Review', icon: '👀', color: 'bg-accent-yellow' },
  { key: 'done', title: 'Done', icon: '✅', color: 'bg-accent-green' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('backlog');
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewResult, setPreviewResult] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const [taskRes, runRes, ruleRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/task-runs?limit=12'),
        fetch('/api/task-automation-rules'),
      ]);
      const taskData = await taskRes.json();
      const runData = await runRes.json();
      const ruleData = await ruleRes.json();
      if (taskData.success) setTasks(taskData.data);
      if (runData.success) setRuns(runData.data);
      if (ruleData.success) setRules(ruleData.data);
    } catch (error) {
      console.error('Error fetching tasks data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSave = async (taskData: Partial<Task> & { runAutomation?: boolean }) => {
    const method = editingTask ? 'PUT' : 'POST';
    const body = editingTask ? { ...taskData, id: editingTask.id } : { ...taskData, status: newTaskStatus };
    const res = await fetch('/api/tasks', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      await fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const runAssign = async (taskId: number) => {
    await fetch('/api/task-automation/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, applyToTask: true }),
    });
    await fetchData();
  };

  const dispatch = async (taskId: number) => {
    const res = await fetch('/api/task-automation/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    const data = await res.json();
    alert(data.success ? `Dispatched to ${data.data.target}` : data.error || 'Dispatch failed');
  };

  const updateRule = async (rule: AutomationRule, patch: Partial<AutomationRule>) => {
    await fetch('/api/task-automation-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rule, ...patch, id: rule.id }),
    });
    await fetchData();
  };

  const createRule = async () => {
    await fetch('/api/task-automation-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New rule', assignTo: 'assistant', enabled: true, priority: 50, keywords: [], tags: [], projects: [], types: [] }),
    });
    await fetchData();
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    await fetch(`/api/task-automation-rules?id=${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const previewRuleMatch = async () => {
    const res = await fetch('/api/task-automation/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: previewInput, description: previewInput, tags: previewInput.split(',').map((x) => x.trim()).filter(Boolean) }),
    });
    const data = await res.json();
    if (data.success) setPreviewResult(`${data.data.assignedAgent} (${data.data.reason})`);
  };

  const tasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);
  if (loading) return <div className="flex-1 flex items-center justify-center text-dark-muted">Loading tasks...</div>;

  return (
    <>
      <TopBar title="Tasks" subtitle="Manage your task board" />

      <div className="px-4 py-3 border-b border-dark-border bg-dark-card/50 flex items-center gap-6">
        <Stat label="This week" value={tasks.filter((t) => new Date(t.created_at) > new Date(Date.now() - 7 * 86400000)).length} />
        <Stat label="In progress" value={tasks.filter((t) => t.status === 'in_progress').length} />
        <Stat label="Total" value={tasks.length} />
      </div>

      <div className="px-4 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-3">
          <div className="text-sm font-medium text-white mb-2">Live Tasks</div>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {runs.length === 0 ? <div className="text-xs text-dark-muted">No recent executions yet.</div> : runs.map((r) => (
              <div key={r.id} className="text-xs bg-dark-bg rounded px-2 py-1.5 flex items-center justify-between gap-2">
                <div className="text-gray-200 truncate">{r.title} • {r.action} • {r.status}</div>
                <div className="text-dark-muted">{r.assignedToType}:{r.assignee}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-white">Automation Rules</div>
            <button onClick={createRule} className="text-xs px-2 py-1 rounded bg-accent-blue text-white">+ Add Rule</button>
          </div>
          <div className="space-y-2 max-h-44 overflow-y-auto mb-2">
            {rules.map((rule) => (
              <div key={rule.id} className="text-xs bg-dark-bg rounded p-2 border border-dark-border">
                <div className="flex items-center gap-2 mb-1">
                  <input value={rule.name} onChange={(e) => updateRule(rule, { name: e.target.value })} className="flex-1 bg-transparent text-gray-200" />
                  <label className="text-dark-muted"><input type="checkbox" checked={rule.enabled} onChange={(e) => updateRule(rule, { enabled: e.target.checked })} /> on</label>
                  <button onClick={() => deleteRule(rule.id)} className="text-accent-red">×</button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-dark-muted">→</span>
                  <input value={rule.assignTo} onChange={(e) => updateRule(rule, { assignTo: e.target.value })} className="bg-transparent text-gray-200 w-28" />
                  <input value={rule.keywords.join(', ')} onChange={(e) => updateRule(rule, { keywords: e.target.value.split(',').map((x) => x.trim()) })} className="flex-1 bg-transparent text-dark-muted" placeholder="keywords" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input value={previewInput} onChange={(e) => setPreviewInput(e.target.value)} placeholder="Test keywords/tags" className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white" />
            <button onClick={previewRuleMatch} className="text-xs px-2 py-1 rounded bg-accent-green text-white">Preview</button>
          </div>
          {previewResult && <div className="text-xs text-dark-muted mt-2">{previewResult}</div>}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((col) => (
            <KanbanColumn key={col.key} title={col.title} count={tasksByStatus(col.key).length} color={col.color} icon={col.icon} onAdd={() => { setEditingTask(null); setNewTaskStatus(col.key); setShowModal(true); }}>
              <AnimatePresence mode="popLayout">
                {tasksByStatus(col.key).map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={(t) => { setEditingTask(t); setShowModal(true); }} onDelete={handleDelete} onAssign={runAssign} onDispatch={dispatch} />
                ))}
              </AnimatePresence>
            </KanbanColumn>
          ))}
        </div>
      </div>

      {showModal && <TaskModal task={editingTask} onSave={handleSave} onClose={() => setShowModal(false)} />}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-2"><span className="text-dark-muted text-sm">{label}:</span><span className="text-white font-medium">{value}</span></div>;
}

function TaskModal({ task, onSave, onClose }: { task: Task | null; onSave: (data: Partial<Task> & { runAutomation?: boolean }) => void; onClose: () => void; }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assignee, setAssignee] = useState(task?.assignee || 'assistant');
  const [priority, setPriority] = useState(task?.priority || 'normal');
  const [status, setStatus] = useState(task?.status || 'backlog');
  const [manualOverride, setManualOverride] = useState(task?.manualOverride || '');
  const [tags, setTags] = useState((task?.tags || []).join(', '));
  const [project, setProject] = useState(task?.project || '');
  const [type, setType] = useState(task?.type || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">{task ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ title, description, assignee, priority, status, manualOverride: manualOverride || null, tags: tags.split(',').map((x) => x.trim()).filter(Boolean), project, type, runAutomation: true }); }} className="space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white" required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white h-24" />
          <div className="grid grid-cols-2 gap-4">
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white">
              <option value="me">🙋 Me</option><option value="assistant">🤖 Assistant</option><option value="FRIDAY">🧠 FRIDAY</option><option value="VERONICA">💬 VERONICA</option><option value="KAREN">💻 KAREN</option><option value="TADASHI">🖥️ TADASHI</option><option value="henry">👨‍💼 Henry</option><option value="alex">👨‍🎨 Alex</option><option value="quill">✍️ Quill</option><option value="echo">🔊 Echo</option><option value="scout">🔭 Scout</option><option value="codex">📚 Codex</option><option value="pixel">🎨 Pixel</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white">
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </div>
          <input value={manualOverride} onChange={(e) => setManualOverride(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white" placeholder="Manual override assignee (optional)" />
          <div className="grid grid-cols-3 gap-2">
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white" placeholder="tags" />
            <input value={project} onChange={(e) => setProject(e.target.value)} className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white" placeholder="project" />
            <input value={type} onChange={(e) => setType(e.target.value)} className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white" placeholder="type" />
          </div>
          {task && <select value={status} onChange={(e) => setStatus(e.target.value as Task['status'])} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"><option value="recurring">Recurring</option><option value="backlog">Backlog</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="done">Done</option></select>}
          <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-muted">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-accent-blue text-white rounded-lg">{task ? 'Update' : 'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}
