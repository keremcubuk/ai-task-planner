import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { createTask } from '../lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateTask() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'minor',
    manualPriority: 0,
    dueDate: '',
    project: '',
    source: 'manual'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTask({
        ...formData,
        manualPriority: Number(formData.manualPriority),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
      });
      router.push('/');
    } catch (error) {
      console.error('Failed to create task', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2" size={20} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input 
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              placeholder="Task details..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select 
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manual Priority (0-5)</label>
              <input 
                type="number"
                min="0"
                max="5"
                name="manualPriority"
                value={formData.manualPriority}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input 
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <input 
                name="project"
                value={formData.project}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                placeholder="Project name"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} className="mr-2" /> Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
