import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { ProjectStats } from '../lib/api';

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
  const totalValueBg = isDone ? 'bg-white/60 border-green-200 text-gray-800' : 'bg-gray-100 text-gray-700';
  const criticalValueColor = 'text-red-700';

  return (
    <div
      className={`rounded-lg shadow transition-shadow cursor-pointer border ${containerClasses}`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`text-xl font-semibold mb-4 truncate ${titleColor}`} title={project.name}>
            {project.name}
          </h3>
          {isDone && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-800 border border-green-200">
              <CheckCircle size={14} className="text-green-600" /> Done
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Total Tasks</span>
            <span className={`font-medium px-2 py-0.5 rounded border ${isDone ? 'border-green-200' : 'border-transparent'} ${totalValueBg}`}>
              {project.total}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <CheckCircle size={14} className="text-green-600" /> Completed
            </span>
            <span className={`font-medium ${completedValueColor}`}>{project.completed}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <AlertCircle size={14} className="text-red-500" /> Critical
            </span>
            <span className={`font-medium ${criticalValueColor}`}>{project.critical}</span>
          </div>
        </div>

        <div className={`mt-4 pt-4 border-t ${isDone ? 'border-green-200/60' : 'border-gray-100'}`}>
          <div className={`w-full rounded-full h-2 ${progressBg}`}>
            <div
              className={`h-2 rounded-full ${progressFill}`}
              style={{ width: `${project.total > 0 ? (project.completed / project.total) * 100 : 0}%` }}
            ></div>
          </div>
          <p className={`text-xs text-right mt-1 ${progressText}`}>
            {project.total > 0 ? Math.round((project.completed / project.total) * 100) : 0}% done
          </p>
        </div>
      </div>
    </div>
  );
};
