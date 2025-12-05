import React, { useEffect, useState } from 'react';
import { fetchTasks, prioritizeTasks, exportXlsx, reorderTasks, resetDb } from '../lib/api';
import { TasksTable } from '../components/TasksTable';
import Link from 'next/link';
import { RefreshCw, Download, Upload, Trash2, Search } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TaskForm } from '../components/TaskForm';
import { TaskDetail } from '../components/TaskDetail';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks({ search });
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePrioritize = async () => {
    setLoading(true);
    try {
      await prioritizeTasks();
      await loadTasks();
    } catch (error) {
      console.error('Prioritization failed', error);
      setLoading(false);
    }
  };

  const handleExport = async (type: 'raw' | 'stats') => {
    try {
      const response = await exportXlsx(type);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks_${type}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const handleSort = (field: string) => {
    // Client-side sort for demo
    // Toggle direction if same field? Simplified for now
    const sorted = [...tasks].sort((a: any, b: any) => {
       if (a[field] < b[field]) return -1;
       if (a[field] > b[field]) return 1;
       return 0;
    });
    setTasks(sorted);
  };

  const handleReorder = async (newTasks: any[]) => {
    setTasks(newTasks);
    try {
      await reorderTasks(newTasks.map(t => t.id));
    } catch (error) {
      console.error('Reorder failed', error);
      loadTasks();
    }
  };

  const handleReset = async () => {
    const password = prompt('Enter password to reset database:');
    if (!password) return;
    
    try {
      await resetDb(password);
      alert('Database reset successful');
      loadTasks();
    } catch (error) {
      alert('Failed to reset database. Check password.');
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
         <div className="flex gap-4">
             <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" title="Reset Database">
                <Trash2 size={18} />
             </button>
             <Link href="/import" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <Upload size={18} /> Import
             </Link>
             <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                <Upload size={18} className="rotate-90" /> New Task
             </button>
             <div className="flex gap-2">
               <button onClick={() => handleExport('raw')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" title="Export Raw Data">
                  <Download size={18} /> Raw
               </button>
               <button onClick={() => handleExport('stats')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" title="Export Statistics">
                  <Download size={18} /> Stats
               </button>
             </div>
             <button onClick={handlePrioritize} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                <RefreshCw size={18} /> AI Prioritize
             </button>
          </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center gap-4 border border-gray-200">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search tasks..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border-none focus:ring-0 text-gray-700 outline-none"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-10">Loading tasks...</div>
        ) : (
          <TasksTable 
            tasks={tasks} 
            onSort={handleSort} 
            onReorder={handleReorder} 
            onTaskClick={(id) => setSelectedTaskId(id)}
          />
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Task">
        <TaskForm 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => { 
            loadTasks(); 
          }} 
        />
      </Modal>

      <Modal isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} title="Task Details">
        {selectedTaskId && (
          <TaskDetail 
            taskId={selectedTaskId} 
            onClose={() => setSelectedTaskId(null)} 
            onUpdate={() => { 
              loadTasks(); 
            }} 
          />
        )}
      </Modal>
    </>
  );
}
