import React, { useState } from 'react';
import { createTask } from '../lib/api';
import { Save } from 'lucide-react';
import { Button } from './ui';

interface TaskFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSuccess }) => {
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
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create task', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input 
          required
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
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
          className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
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
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
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
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
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
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <input 
            name="project"
            value={formData.project}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
            placeholder="Project name"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 gap-2">
        <Button
          variant="secondary"
          size="md"
          type="button"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          size="md"
          disabled={loading}
          loading={loading}
          leftIcon={<Save size={18} />}
        >
          Create Task
        </Button>
      </div>
    </form>
  );
};
