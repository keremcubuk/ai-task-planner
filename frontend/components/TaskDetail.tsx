import React, { useEffect, useState } from 'react';
import { fetchTask, updateTask, deleteTask, Task } from '@lib/api';
import { PriorityBadge } from '@components/PriorityBadge';
import { SeverityBadge } from '@components/SeverityBadge';
import { Save, Trash2 } from 'lucide-react';
import { Button, Badge } from '@components/ui';

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

interface TaskDetailProps {
  taskId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, onClose, onUpdate }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualPriority, setManualPriority] = useState<number>(0);
  const [status, setStatus] = useState('');
  const [project, setProject] = useState('');

  useEffect(() => {
    if (taskId) {
      loadTask(taskId);
    }
  }, [taskId]);

  const loadTask = async (id: number) => {
    setLoading(true);
    try {
      const data = await fetchTask(id);
      setTask(data);
      setManualPriority(data.manualPriority || 0);
      setStatus(data.status || 'open');
      setProject(data.project || '');
    } catch (error) {
      console.error('Failed to load task', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateTask(taskId, {
        manualPriority: Number(manualPriority),
        status,
        project,
      });
      alert('Task updated!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update task', error);
      alert('Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!task) return <div className="p-8">Task not found</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-end">
        <div className="flex gap-2">
          <Button variant="danger" size="md" onClick={handleDelete} leftIcon={<Trash2 size={18} />}>
            Delete
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} leftIcon={<Save size={18} />}>
            Save Changes
          </Button>
        </div>
      </div>

      <h1 className="mb-2 text-3xl font-bold text-gray-900">{task.title}</h1>
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-gray-700">
          ID: {task.externalId || '-'}
        </span>
        <PriorityBadge score={task.aiScore} priority={task.aiPriority} />
        <span>Source: {task.source}</span>
        {(() => {
          const daysAgo = Math.floor(
            (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24)
          );
          const color =
            daysAgo > 21 ? 'red' : daysAgo > 15 ? 'orange' : daysAgo > 7 ? 'yellow' : undefined;
          const content = `Created: ${formatDate(task.createdAt)} (${daysAgo} days ago)`;
          return color ? (
            <Badge color={color} rounded="md">
              {content}
            </Badge>
          ) : (
            <span>{content}</span>
          );
        })()}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Project</label>
          <input
            type="text"
            value={project}
            onChange={e => setProject(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm"
            placeholder="Enter project name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Manual Priority (0-5)
          </label>
          <select
            value={manualPriority}
            onChange={e => setManualPriority(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm"
          >
            {[0, 1, 2, 3, 4, 5].map(p => (
              <option key={p} value={p}>
                {p} {p === 0 ? '(None)' : p === 5 ? '(Highest)' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Higher value increases AI score.</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-lg font-medium text-gray-900">Description</h3>
        <div className="rounded-md bg-gray-50 p-4 whitespace-pre-wrap text-gray-700">
          {task.description || 'No description provided.'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Severity</label>
          <div className="mt-1">
            <SeverityBadge severity={task.severity || 'unknown'} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Due Date</label>
          <div className="mt-1 text-gray-900">{formatDate(task.dueDate || '')}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Opened By</label>
          <div className="mt-1 font-medium text-gray-900">{task.openedBy || '-'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Assigned To</label>
          <div className="mt-1 font-medium text-gray-900">{task.assignedTo || 'Unassigned'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Component</label>
          <div className="mt-1 inline-block rounded bg-indigo-50 px-3 py-1 font-medium text-gray-900">
            {task.componentName || 'Unknown'}
          </div>
        </div>
      </div>
    </div>
  );
};
