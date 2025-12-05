import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchTasks } from '../../lib/api';
import { TasksTable } from '../../components/TasksTable';
import { CheckCircle, AlertCircle, Folder } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { TaskDetail } from '../../components/TaskDetail';

export default function ProjectDetail() {
  const router = useRouter();
  const { name } = router.query;
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    if (name) {
      loadProjectTasks(name as string);
    }
  }, [name]);

  const loadProjectTasks = async (projectName: string) => {
    try {
      const data = await fetchTasks({ project: projectName });
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };
  
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const critical = tasks.filter(t => t.severity === 'critical').length;

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Project: {name}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{total}</p>
            </div>
            <Folder className="text-gray-300" size={40} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
             <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completed}</p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
          </div>
           <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
             <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Critical Issues</p>
              <p className="text-3xl font-bold text-red-600">{critical}</p>
            </div>
            <AlertCircle className="text-red-200" size={40} />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks</h2>
          {tasks.length > 0 ? (
            <TasksTable 
              tasks={tasks} 
              onSort={() => {}} 
              onReorder={() => {}} 
              onTaskClick={(id) => setSelectedTaskId(id)}
            />
          ) : (
            <p className="text-gray-500">No tasks found for this project.</p>
          )}
        </div>

        <Modal isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} title="Task Details">
          {selectedTaskId && (
            <TaskDetail 
              taskId={selectedTaskId} 
              onClose={() => setSelectedTaskId(null)} 
              onUpdate={() => { 
                if (name) loadProjectTasks(name as string); 
              }} 
            />
          )}
        </Modal>
    </div>
  );
}
