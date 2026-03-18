'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchTasks, Task } from '@lib/api';
import { TasksTable } from '@components/TasksTable';
import { Modal, PageHeader, StatCard, StatCardGrid } from '@components/ui';
import { TaskDetail } from '@components/TaskDetail';

export default function ComponentDetailPage() {
  const params = useParams();
  const componentName = decodeURIComponent(params?.name as string);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<keyof Task | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const allTasks = await fetchTasks({});
        const filtered = allTasks.filter(
          (task: Task) => task.componentName?.toLowerCase() === componentName.toLowerCase()
        );
        setTasks(filtered);
      } catch (error) {
        console.error('Failed to load tasks', error);
      } finally {
        setLoading(false);
      }
    };

    if (componentName) {
      loadTasks();
    }
  }, [componentName]);

  const handleSort = (field: keyof Task) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const sorted = [...tasks].sort((a: Task, b: Task) => {
      const valA = a[field];
      const valB = b[field];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (valA < valB) return newDirection === 'asc' ? -1 : 1;
      if (valA > valB) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setTasks(sorted);
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const allTasks = await fetchTasks({});
      const filtered = allTasks.filter(
        (task: Task) => task.componentName?.toLowerCase() === componentName.toLowerCase()
      );
      setTasks(filtered);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const openCount = tasks.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const closedCount = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const criticalCount = tasks.filter(t => t.severity === 'critical').length;

  return (
    <>
      <PageHeader
        title={`Component: ${componentName}`}
        description={`${componentName} componentine ait tüm ticketlar`}
      />

      <StatCardGrid columns={4}>
        <StatCard label="Toplam Ticket" value={tasks.length} />
        <StatCard label="Açık" value={openCount} valueColor="blue" />
        <StatCard label="Kapalı" value={closedCount} valueColor="green" />
        <StatCard label="Kritik" value={criticalCount} valueColor="red" />
      </StatCardGrid>

      <div className="mt-6 rounded-lg bg-white p-2 shadow">
        {loading ? (
          <div className="py-10 text-center">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center text-gray-500">Bu component için ticket bulunamadı</div>
        ) : (
          <TasksTable
            tasks={tasks}
            onSort={handleSort}
            onReorder={() => {}}
            onTaskClick={id => setSelectedTaskId(id)}
          />
        )}
      </div>

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
