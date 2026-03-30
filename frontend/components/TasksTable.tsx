import React from 'react';
import { PriorityBadge } from './PriorityBadge';
import { SeverityBadge } from './SeverityBadge';
import { ArrowUpDown, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../lib/api';

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const getEstimatedDateColor = (estimatedDueDate: string): string => {
  const estDate = new Date(estimatedDueDate);
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  if (estDate <= now) return 'text-red-600';
  if (estDate <= threeDaysFromNow) return 'text-orange-500';
  return 'text-blue-600';
};

interface TasksTableProps {
  tasks: Task[];
  onSort: (field: keyof Task) => void;
  onReorder: (newTasks: Task[]) => void;
  onTaskClick?: (taskId: number) => void;
}

function SortableRow({
  task,
  index,
  onTaskClick,
}: {
  task: Task;
  index: number;
  onTaskClick?: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className="bg-white hover:bg-gray-50">
      <td className="w-10 border-b border-gray-200 px-2 py-4">
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab justify-center text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={16} />
        </div>
      </td>
      <td className="border-b border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-500">
        {index}
      </td>
      <td className="max-w-xs border-b border-gray-200 px-6 py-4 text-sm font-medium text-gray-900">
        <a
          href={`/tasks/${task.id}`}
          onClick={e => {
            e.preventDefault();
            onTaskClick?.(task.id);
          }}
          className="block cursor-pointer truncate text-blue-600 hover:underline"
          title={task.title}
        >
          {task.title}
        </a>
      </td>
      <td className="border-b border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-500">
        {task.status}
      </td>
      <td className="border-b border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-500">
        <SeverityBadge severity={task.severity || 'unknown'} />
      </td>
      <td className="border-b border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-500">
        <PriorityBadge score={task.aiScore} priority={task.aiPriority} />
      </td>
      <td className="border-b border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-500">
        {formatDate(task.createdAt)}
      </td>
      <td className="border-b border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-500">
        {formatDate(task.dueDate || '')}
      </td>
      <td className="border-b border-gray-200 px-6 py-4 text-sm whitespace-nowrap">
        {task.dueDate ? (
          <span className="text-gray-400">-</span>
        ) : task.estimatedDueDate ? (
          <span className={`font-medium ${getEstimatedDateColor(task.estimatedDueDate)}`}>
            {formatDate(task.estimatedDueDate)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="max-w-3xs truncate border-b border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-500">
        {task.openedBy || '-'}
      </td>
      <td className="max-w-3xs truncate border-b border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-500">
        {task.assignedTo || '-'}
      </td>
    </tr>
  );
}

export const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  onSort,
  onReorder,
  onTaskClick,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);

      onReorder(newTasks);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="max-h-[calc(100vh-200px)] overflow-x-auto">
        <table className="relative min-w-full border border-gray-200 bg-white">
          <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
            <tr>
              <th className="w-10 border-b border-gray-200 bg-gray-50 px-2"></th>
              <th className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                #
              </th>
              <th
                className="cursor-pointer border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                onClick={() => onSort('title')}
              >
                Title <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="cursor-pointer border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                onClick={() => onSort('status')}
              >
                Status <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="cursor-pointer border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                onClick={() => onSort('severity')}
              >
                Severity <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="cursor-pointer border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                onClick={() => onSort('aiPriority')}
              >
                AI Priority <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="cursor-pointer border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                onClick={() => onSort('createdAt')}
              >
                Created Date <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="cursor-pointer border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                onClick={() => onSort('dueDate')}
              >
                Due Date <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="cursor-pointer border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                onClick={() => onSort('estimatedDueDate')}
              >
                Est. Due Date <ArrowUpDown size={14} className="inline" />
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Opened By
              </th>
              <th
                className="cursor-pointer border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                onClick={() => onSort('assignedTo')}
              >
                Assigned To <ArrowUpDown size={14} className="inline" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task, index) => (
                <SortableRow
                  key={task.id}
                  task={task}
                  index={index + 1}
                  onTaskClick={onTaskClick}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
};
