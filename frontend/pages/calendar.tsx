import React, { useEffect, useState } from 'react';
import { fetchTasks, Task } from '../lib/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TaskDetail } from '../components/TaskDetail';

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
        openedTasks
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
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  // Calculate summary stats
  const thisMonthTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate.getMonth() === currentDate.getMonth() && 
           dueDate.getFullYear() === currentDate.getFullYear() &&
           task.status !== 'done';
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon size={28} /> Calendar
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm font-medium uppercase">Due This Month</p>
          <p className="text-3xl font-bold text-blue-600">{thisMonthTasks.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm font-medium uppercase">Overdue</p>
          <p className="text-3xl font-bold text-red-600">{overdueTasks.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm font-medium uppercase">Total Open Tasks</p>
          <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.status !== 'done').length}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-center mb-6 relative">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="absolute right-0 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              onClick={() => (day.dueTasks.length > 0 || day.openedTasks.length > 0) && setSelectedDay(day)}
              className={`min-h-[100px] p-2 border rounded-lg transition-colors ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${day.isToday ? 'border-blue-500 border-2' : 'border-gray-200'} ${
                (day.dueTasks.length > 0 || day.openedTasks.length > 0) ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>
              
              {day.dueTasks.length > 0 && (
                <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded mb-1 truncate">
                  📅 {day.dueTasks.length} due
                </div>
              )}
              
              {day.openedTasks.length > 0 && (
                <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded truncate">
                  ✨ {day.openedTasks.length} opened
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded"></div>
            <span className="text-sm text-gray-600">Due Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span className="text-sm text-gray-600">Opened Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Today</span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      <Modal 
        isOpen={!!selectedDay} 
        onClose={() => setSelectedDay(null)} 
        title={selectedDay ? `Tasks for ${selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
      >
        {selectedDay && (
          <div className="space-y-4">
            {selectedDay.dueTasks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 uppercase mb-2">📅 Due on this day ({selectedDay.dueTasks.length})</h4>
                <div className="space-y-2">
                  {selectedDay.dueTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => {
                        setSelectedDay(null);
                        setSelectedTaskId(task.id);
                      }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500 flex gap-4 mt-1">
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
                <h4 className="text-sm font-semibold text-green-600 uppercase mb-2">✨ Opened on this day ({selectedDay.openedTasks.length})</h4>
                <div className="space-y-2">
                  {selectedDay.openedTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => {
                        setSelectedDay(null);
                        setSelectedTaskId(task.id);
                      }}
                      className="p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500 flex gap-4 mt-1">
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
