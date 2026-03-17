import React, { useState } from 'react';
import { createTask } from '../lib/api';
import { Save } from 'lucide-react';
import { Button, InputField, InputSelect, InputDate, InputTextarea } from './ui';

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
    source: 'manual',
  });

  const handleFieldChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTask({
        ...formData,
        manualPriority: Number(formData.manualPriority),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
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
      <InputField
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleFieldChange('title')}
        placeholder="Task title"
        required
      />

      <InputTextarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleFieldChange('description')}
        placeholder="Task details..."
        rows={4}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InputSelect
          label="Severity"
          value={formData.severity}
          onChange={handleFieldChange('severity')}
          options={[
            { value: 'minor', label: 'Minor' },
            { value: 'major', label: 'Major' },
            { value: 'critical', label: 'Critical' },
          ]}
        />
        <InputField
          label="Manual Priority (0-5)"
          name="manualPriority"
          type="number"
          value={formData.manualPriority}
          onChange={handleFieldChange('manualPriority')}
          min="0"
          max="5"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InputDate
          label="Due Date"
          value={formData.dueDate}
          onChange={handleFieldChange('dueDate')}
        />
        <InputField
          label="Project"
          name="project"
          value={formData.project}
          onChange={handleFieldChange('project')}
          placeholder="Project name"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="secondary" size="md" type="button" onClick={onClose}>
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
