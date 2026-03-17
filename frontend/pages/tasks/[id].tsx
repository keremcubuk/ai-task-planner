import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchTask, updateTask, deleteTask, Task } from '../../lib/api';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { Save, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@components/ui';

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualPriority, setManualPriority] = useState<number>(0);
  const [status, setStatus] = useState('');
  const [project, setProject] = useState('');

  useEffect(() => {
    if (id) {
      loadTask(Number(id));
    }
  }, [id]);

  const loadTask = async (taskId: number) => {
    try {
      const data = await fetchTask(taskId);
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
      await updateTask(Number(id), {
        manualPriority: Number(manualPriority),
        status,
        project,
      });
      alert('Task updated!');
      router.push('/');
    } catch (error) {
      console.error('Failed to update task', error);
      alert('Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(Number(id));
      router.push('/');
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!task) return <div className="p-8">Task not found</div>;

  return (
    <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="md"
          leftIcon={<ArrowLeft size={20} />}
        >
          Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleDelete} variant="danger" size="md" leftIcon={<Trash2 size={18} />}>
            Delete
          </Button>
          <Button onClick={handleSave} variant="primary" size="md" leftIcon={<Save size={18} />}>
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
        <span
          className={
            Math.floor(
              (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24)
            ) > 21
              ? 'rounded bg-red-100 px-2 py-1 font-bold text-red-800'
              : Math.floor(
                    (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24)
                  ) > 15
                ? 'rounded bg-orange-100 px-2 py-1 font-bold text-orange-800'
                : Math.floor(
                      (new Date().getTime() - new Date(task.createdAt).getTime()) /
                        (1000 * 3600 * 24)
                    ) > 7
                  ? 'rounded bg-yellow-100 px-2 py-1 font-bold text-yellow-800'
                  : ''
          }
        >
          Created: {new Date(task.createdAt).toLocaleDateString()} (
          {Math.floor(
            (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24)
          )}{' '}
          days ago)
        </span>
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
          <input
            type="number"
            min="0"
            max="5"
            value={manualPriority}
            onChange={e => setManualPriority(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm"
          />
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
          <div className="mt-1 text-gray-900">
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Assigned To</label>
          <div className="mt-1 font-medium text-gray-900">{task.assignedTo || 'Unassigned'}</div>
        </div>
      </div>
    </div>
  );
}
