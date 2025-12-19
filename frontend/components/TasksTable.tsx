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
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
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


interface TasksTableProps {
  tasks: Task[];
  onSort: (field: keyof Task) => void;
  onReorder: (newTasks: Task[]) => void;
  onTaskClick?: (taskId: number) => void;
}

function SortableRow({ task, index, onTaskClick }: { task: Task; index: number; onTaskClick?: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 bg-white">
      <td className="px-2 py-4 w-10 border-b border-gray-200">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 flex justify-center">
           <GripVertical size={16} />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">{index}</td>
      <td className="px-6 py-4 text-sm font-medium text-gray-900 border-b border-gray-200 max-w-xs">
        <a 
          href={`/tasks/${task.id}`} 
          onClick={(e) => { 
            e.preventDefault(); 
            onTaskClick?.(task.id); 
          }} 
          className="text-blue-600 hover:underline cursor-pointer block truncate"
          title={task.title}
        >
          {task.title}
        </a>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">{task.status}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">
        <SeverityBadge severity={task.severity || 'unknown'} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">
        <PriorityBadge score={task.aiScore} priority={task.aiPriority} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">{formatDate(task.dueDate || '')}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">{task.assignedTo || '-'}</td>
    </tr>
  );
}

export const TasksTable: React.FC<TasksTableProps> = ({ tasks, onSort, onReorder, onTaskClick }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      onReorder(newTasks);
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
        <table className="min-w-full bg-white border border-gray-200 relative">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="w-10 px-2 border-b border-gray-200 bg-gray-50"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                #
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-b border-gray-200 bg-gray-50"
                onClick={() => onSort("title")}
              >
                Title <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-b border-gray-200 bg-gray-50"
                onClick={() => onSort("status")}
              >
                Status <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-b border-gray-200 bg-gray-50"
                onClick={() => onSort("severity")}
              >
                Severity <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-b border-gray-200 bg-gray-50"
                onClick={() => onSort("aiPriority")}
              >
                AI Priority <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-b border-gray-200 bg-gray-50"
                onClick={() => onSort("dueDate")}
              >
                Due Date <ArrowUpDown size={14} className="inline" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-b border-gray-200 bg-gray-50"
                onClick={() => onSort("assignedTo")}
              >
                Assigned To <ArrowUpDown size={14} className="inline" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <SortableContext 
              items={tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task, index) => (
                <SortableRow key={task.id} task={task} index={index + 1} onTaskClick={onTaskClick} />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
};
