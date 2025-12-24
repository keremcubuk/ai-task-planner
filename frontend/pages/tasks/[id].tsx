import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchTask, updateTask, deleteTask, Task } from '../../lib/api';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { Save, Trash2, ArrowLeft } from 'lucide-react';

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
        project
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
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2" size={20} /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
              <Trash2 size={18} className="mr-2" /> Delete
            </button>
            <button onClick={handleSave} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <Save size={18} className="mr-2" /> Save Changes
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">ID: {task.externalId || '-'}</span>
          <PriorityBadge score={task.aiScore} priority={task.aiPriority} />
          <span>Source: {task.source}</span>
          <span className={
            Math.floor((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24)) > 21 ? 'bg-red-100 text-red-800 px-2 py-1 rounded font-bold' :
            Math.floor((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24)) > 15 ? 'bg-orange-100 text-orange-800 px-2 py-1 rounded font-bold' :
            Math.floor((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24)) > 7 ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold' :
            ''
          }>
            Created: {new Date(task.createdAt).toLocaleDateString()} ({Math.floor((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24))} days ago)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <input 
              type="text" 
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manual Priority (0-5)</label>
            <input 
              type="number" 
              min="0" 
              max="5" 
              value={manualPriority}
              onChange={(e) => setManualPriority(Number(e.target.value))}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Higher value increases AI score.</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
          <div className="bg-gray-50 p-4 rounded-md text-gray-700 whitespace-pre-wrap">
            {task.description || 'No description provided.'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Severity</label>
            <div className="mt-1"><SeverityBadge severity={task.severity || 'unknown'} /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <div className="mt-1 text-gray-900">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Assigned To</label>
             <div className="mt-1 text-gray-900 font-medium">{task.assignedTo || 'Unassigned'}</div>
          </div>
        </div>
      </div>
  );
}
