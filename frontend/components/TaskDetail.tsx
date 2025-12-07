import React, { useEffect, useState } from 'react';
import { fetchTask, updateTask, deleteTask } from '../lib/api';
import { PriorityBadge } from './PriorityBadge';
import { SeverityBadge } from './SeverityBadge';
import { Save, Trash2 } from 'lucide-react';

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
  const [task, setTask] = useState<any>(null);
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
        project
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
      <div className="flex items-center justify-end mb-6">
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
          Created: {formatDate(task.createdAt)} ({Math.floor((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24))} days ago)
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
          <select 
            value={manualPriority}
            onChange={(e) => setManualPriority(Number(e.target.value))}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
          >
            {[0, 1, 2, 3, 4, 5].map(p => (
              <option key={p} value={p}>{p} {p === 0 ? '(None)' : p === 5 ? '(Highest)' : ''}</option>
            ))}
          </select>
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
          <div className="mt-1"><SeverityBadge severity={task.severity} /></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Due Date</label>
          <div className="mt-1 text-gray-900">{formatDate(task.dueDate)}</div>
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700">Assigned To</label>
           <div className="mt-1 text-gray-900 font-medium">{task.assignedTo || 'Unassigned'}</div>
        </div>
      </div>
    </div>
  );
};
