import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { ProjectStats } from '../lib/api';
import { Badge } from './ui';

interface ProjectCardProps {
  project: ProjectStats;
  onClick: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const isDone = project.projectStatus === 'done';

  // Base styles
  const containerClasses = isDone
    ? 'bg-green-50 border-green-200 hover:shadow-md'
    : 'bg-white border-gray-200 hover:shadow-md';

  const titleColor = 'text-gray-900';
  const progressBg = isDone ? 'bg-green-100' : 'bg-gray-200';
  const progressFill = isDone ? 'bg-green-600' : 'bg-blue-600';
  const progressText = isDone ? 'text-green-800/70' : 'text-gray-400';

  // Specific text colors for done state
  const completedValueColor = isDone ? 'text-green-800' : 'text-green-700';
  const totalValueBg = isDone
    ? 'bg-white/60 border-green-200 text-gray-800'
    : 'bg-gray-100 text-gray-700';
  const criticalValueColor = 'text-red-700';

  return (
    <div
      className={`cursor-pointer rounded-lg border shadow transition-shadow ${containerClasses}`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`mb-4 truncate text-xl font-semibold ${titleColor}`} title={project.name}>
            {project.name}
          </h3>
          {isDone && (
            <Badge
              color="green"
              size="sm"
              icon={<CheckCircle size={14} className="text-green-600" />}
            >
              Done
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Tasks</span>
            <span
              className={`rounded border px-2 py-0.5 font-medium ${isDone ? 'border-green-200' : 'border-transparent'} ${totalValueBg}`}
            >
              {project.total}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-gray-500">
              <CheckCircle size={14} className="text-green-600" /> Completed
            </span>
            <span className={`font-medium ${completedValueColor}`}>{project.completed}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-gray-500">
              <AlertCircle size={14} className="text-red-500" /> Critical
            </span>
            <span className={`font-medium ${criticalValueColor}`}>{project.critical}</span>
          </div>
        </div>

        <div className={`mt-4 border-t pt-4 ${isDone ? 'border-green-200/60' : 'border-gray-100'}`}>
          <div className={`h-2 w-full rounded-full ${progressBg}`}>
            <div
              className={`h-2 rounded-full ${progressFill}`}
              style={{
                width: `${project.total > 0 ? (project.completed / project.total) * 100 : 0}%`,
              }}
            ></div>
          </div>
          <p className={`mt-1 text-right text-xs ${progressText}`}>
            {project.total > 0 ? Math.round((project.completed / project.total) * 100) : 0}% done
          </p>
        </div>
      </div>
    </div>
  );
};
