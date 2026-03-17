'use client';

import React, { useEffect, useState } from 'react';
import { fetchTasks, Task } from '@lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, PageHeader, StatCard, StatCardGrid } from '@components/ui';
import { TaskDetail } from '@components/TaskDetail';

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dueTasks: Task[];
  openedTasks: Task[];
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await fetchTasks({});
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date): DayData[] => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    const remainingDays = 6 - lastDay.getDay();
    endDate.setDate(endDate.getDate() + remainingDays);

    const days: DayData[] = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];

      const dueTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDueDate = new Date(task.dueDate).toISOString().split('T')[0];
        return taskDueDate === dateStr && task.status !== 'done';
      });

      const openedTasks = tasks.filter(task => {
        if (!task.createdAt) return false;
        const taskCreatedDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskCreatedDate === dateStr;
      });

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        dueTasks,
        openedTasks,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  // Calculate summary stats
  const thisMonthTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return (
      dueDate.getMonth() === currentDate.getMonth() &&
      dueDate.getFullYear() === currentDate.getFullYear() &&
      task.status !== 'done'
    );
  });

  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'done') return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" description="Task due dates and opening dates overview" />

      {/* Summary Cards */}
      <StatCardGrid columns={3}>
        <StatCard label="Due This Month" value={thisMonthTasks.length} valueColor="blue" />
        <StatCard label="Overdue" value={overdueTasks.length} valueColor="red" />
        <StatCard label="Total Open Tasks" value={tasks.filter(t => t.status !== 'done').length} />
      </StatCardGrid>

      {/* Calendar */}
      <div className="rounded-lg bg-white p-6 shadow">
        {/* Calendar Header */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <h3 className="min-w-[200px] text-center text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={goToNextMonth}
              className="rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="absolute right-0 rounded-lg px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Today
          </button>
        </div>

        {/* Day Headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {dayNames.map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              onClick={() =>
                (day.dueTasks.length > 0 || day.openedTasks.length > 0) && setSelectedDay(day)
              }
              className={`min-h-[100px] rounded-lg border p-2 transition-colors ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${day.isToday ? 'border-2 border-blue-500' : 'border-gray-200'} ${
                day.dueTasks.length > 0 || day.openedTasks.length > 0
                  ? 'cursor-pointer hover:bg-gray-50'
                  : ''
              }`}
            >
              <div
                className={`mb-1 text-sm font-medium ${
                  day.isToday
                    ? 'text-blue-600'
                    : day.isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                }`}
              >
                {day.date.getDate()}
              </div>

              {day.dueTasks.length > 0 && (
                <div className="mb-1 truncate rounded bg-red-100 px-2 py-1 text-xs text-red-700">
                  📅 {day.dueTasks.length} due
                </div>
              )}

              {day.openedTasks.length > 0 && (
                <div className="truncate rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                  ✨ {day.openedTasks.length} opened
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-6 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-100"></div>
            <span className="text-sm text-gray-600">Due Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-100"></div>
            <span className="text-sm text-gray-600">Opened Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Today</span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={
          selectedDay
            ? `Tasks for ${selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
            : ''
        }
      >
        {selectedDay && (
          <div className="space-y-4">
            {selectedDay.dueTasks.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-red-600 uppercase">
                  📅 Due on this day ({selectedDay.dueTasks.length})
                </h4>
                <div className="space-y-2">
                  {selectedDay.dueTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedDay(null);
                        setSelectedTaskId(task.id);
                      }}
                      className="cursor-pointer rounded-lg border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100"
                    >
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="mt-1 flex gap-4 text-sm text-gray-500">
                        <span>Status: {task.status}</span>
                        <span>Severity: {task.severity}</span>
                        {task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDay.openedTasks.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-green-600 uppercase">
                  ✨ Opened on this day ({selectedDay.openedTasks.length})
                </h4>
                <div className="space-y-2">
                  {selectedDay.openedTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedDay(null);
                        setSelectedTaskId(task.id);
                      }}
                      className="cursor-pointer rounded-lg border border-green-200 bg-green-50 p-3 transition-colors hover:bg-green-100"
                    >
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="mt-1 flex gap-4 text-sm text-gray-500">
                        <span>Status: {task.status}</span>
                        <span>Severity: {task.severity}</span>
                        {task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Task Detail Modal */}
      <Modal isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} title="Task Details">
        {selectedTaskId && (
          <TaskDetail
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            onUpdate={loadTasks}
          />
        )}
      </Modal>
    </div>
  );
}
