import React, { useEffect, useState } from 'react';
import { fetchTasks, prioritizeTasks, exportXlsx, reorderTasks, resetDb } from '../lib/api';
import { TasksTable } from '../components/TasksTable';
import Link from 'next/link';
import { RefreshCw, Download, Upload, Trash2, Search, Info } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TaskForm } from '../components/TaskForm';
import { TaskDetail } from '../components/TaskDetail';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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
             <div className="flex gap-2">
                <button onClick={handlePrioritize} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    <RefreshCw size={18} /> AI Prioritize
                </button>
                <button onClick={() => setIsInfoModalOpen(true)} className="flex items-center justify-center w-10 h-10 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300" title="How it works?">
                    <Info size={20} />
                </button>
             </div>
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

      <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="How AI Prioritization Works">
        <div className="space-y-4 text-gray-700">
            <p>The AI Priority score is calculated based on three main factors:</p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2">1. Severity (Technical Impact)</h4>
                <p className="text-sm">Based on the 'Severity' field. Critical issues get the highest base points.</p>
                <ul className="list-disc list-inside mt-2 text-sm text-blue-800">
                    <li>Critical: High Impact</li>
                    <li>Major: Medium Impact</li>
                    <li>Minor: Low Impact</li>
                </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="font-bold text-green-900 mb-2">2. Urgency (Due Date)</h4>
                <p className="text-sm">Tasks closer to their due date receive a higher score multiplier. Overdue tasks are prioritized highest.</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h4 className="font-bold text-purple-900 mb-2">3. Manual Override (Manager/Business Factor)</h4>
                <p className="text-sm">The <strong>'Manual Priority (0-5)'</strong> field acts as a multiplier for business urgency or VIP requests.</p>
                <ul className="list-disc list-inside mt-2 text-sm text-purple-800">
                    <li>0: Standard Priority</li>
                    <li>3: High Importance (Manager Request)</li>
                    <li>5: Emergency / "Fire" Mode</li>
                </ul>
            </div>

            <p className="text-sm italic text-gray-500 mt-4">
                Total Score = (Severity Base) + (Time Urgency) + (Manual Priority × Weight)
            </p>
        </div>
      </Modal>
    </>
  );
}
