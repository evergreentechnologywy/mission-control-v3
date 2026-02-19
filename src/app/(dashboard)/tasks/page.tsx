'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import TaskCard from '@/components/kanban/TaskCard';
import { Task } from '@/lib/types';
import { AnimatePresence } from 'framer-motion';

type TaskStatus = 'recurring' | 'backlog' | 'in_progress' | 'review' | 'done';

const columns: { key: TaskStatus; title: string; icon: string; color: string }[] = [
  { key: 'recurring', title: 'Recurring', icon: '🔄', color: 'bg-accent-purple' },
  { key: 'backlog', title: 'Backlog', icon: '📥', color: 'bg-dark-muted' },
  { key: 'in_progress', title: 'In Progress', icon: '🚀', color: 'bg-accent-blue' },
  { key: 'review', title: 'Review', icon: '👀', color: 'bg-accent-yellow' },
  { key: 'done', title: 'Done', icon: '✅', color: 'bg-accent-green' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('backlog');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAdd = (status: TaskStatus) => {
    setEditingTask(null);
    setNewTaskStatus(status);
    setShowModal(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    
    try {
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleSave = async (taskData: Partial<Task>) => {
    try {
      const method = editingTask ? 'PUT' : 'POST';
      const body = editingTask 
        ? { ...taskData, id: editingTask.id }
        : { ...taskData, status: newTaskStatus };

      const res = await fetch('/api/tasks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        if (editingTask) {
          setTasks(tasks.map(t => t.id === editingTask.id ? data.data : t));
        } else {
          setTasks([data.data, ...tasks]);
        }
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  // Stats
  const thisWeek = tasks.filter(t => {
    const created = new Date(t.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  }).length;
  
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-dark-muted">Loading tasks...</div>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Tasks" subtitle="Manage your task board" />
      
      {/* Stats Bar */}
      <div className="px-4 py-3 border-b border-dark-border bg-dark-card/50 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-dark-muted text-sm">This week:</span>
          <span className="text-white font-medium">{thisWeek}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-dark-muted text-sm">In progress:</span>
          <span className="text-accent-blue font-medium">{inProgress}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-dark-muted text-sm">Total:</span>
          <span className="text-white font-medium">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-dark-muted text-sm">Completion:</span>
          <span className="text-accent-green font-medium">{completion}%</span>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((col) => (
            <KanbanColumn
              key={col.key}
              title={col.title}
              count={tasksByStatus(col.key).length}
              color={col.color}
              icon={col.icon}
              onAdd={() => handleAdd(col.key)}
            >
              <AnimatePresence mode="popLayout">
                {tasksByStatus(col.key).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </KanbanColumn>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

interface TaskModalProps {
  task: Task | null;
  onSave: (data: Partial<Task>) => void;
  onClose: () => void;
}

function TaskModal({ task, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assignee, setAssignee] = useState(task?.assignee || 'assistant');
  const [priority, setPriority] = useState(task?.priority || 'normal');
  const [status, setStatus] = useState(task?.status || 'backlog');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, assignee, priority, status });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">
          {task ? 'Edit Task' : 'New Task'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-muted mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-dark-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue h-24 resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              >
                <option value="assistant">🤖 Assistant</option>
                <option value="henry">👨‍💼 Henry</option>
                <option value="alex">👨‍🎨 Alex</option>
                <option value="quill">✍️ Quill</option>
                <option value="echo">🔊 Echo</option>
                <option value="scout">🔭 Scout</option>
                <option value="codex">📚 Codex</option>
                <option value="pixel">🎨 Pixel</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-dark-muted mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {task && (
            <div>
              <label className="block text-sm text-dark-muted mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              >
                <option value="recurring">Recurring</option>
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
