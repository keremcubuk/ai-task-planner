import React, { useEffect, useState } from 'react';
import { getProjectsStats, ProjectStats } from '../../lib/api';
import { Search } from 'lucide-react';
import { useRouter } from 'next/router';
import { ProjectCard } from '../../components/ProjectCard';

export default function ProjectsList() {
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('mostTasks'); // Default: most tasks
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjectsStats();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const inProgressProjects = filteredProjects.filter((p) => p.projectStatus !== 'done');
  const doneProjects = filteredProjects.filter((p) => p.projectStatus === 'done');

  // Sorting function
  const sortProjects = (projects: ProjectStats[]) => {
    const sorted = [...projects]; // Copy to avoid mutating original

    switch (sortBy) {
      case "a-z":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "z-a":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "mostTasks":
        return sorted.sort((a, b) => b.total - a.total);
      case "leastTasks":
        return sorted.sort((a, b) => a.total - b.total);
      default:
        return sorted;
    }
  };

  const sortedInProgressProjects = sortProjects(inProgressProjects);
  const sortedDoneProjects = sortProjects(doneProjects);

  if (loading) return <div className="p-8">Loading...</div>;

  // Statistics
  const totalCount = filteredProjects.length;
  const completedCount = sortedDoneProjects.length;
  const inProgressCount = sortedInProgressProjects.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
      </div>

      {/* Search, Sort, and Stats summary in a single grid */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
        {/* Search and Sort - 65% */}
        <div className="w-full md:w-8/12">
          <div className="bg-white p-4 rounded-lg shadow h-full flex items-center">
            <div className="relative w-full flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-5 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mostTasks">Most Tasks</option>
                <option value="leastTasks">Least Tasks</option>
                <option value="a-z">A-Z</option>
                <option value="z-a">Z-A</option>
              </select>
            </div>
          </div>
        </div>
        {/* Stats - 35% */}
        <div className="w-full md:w-4/12 flex gap-4 justify-end">
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center min-w-[120px]">
            <span className="text-xs text-gray-500">Total</span>
            <span className="text-2xl font-bold text-blue-700">
              {totalCount}
            </span>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center min-w-[120px]">
            <span className="text-xs text-gray-500">Completed</span>
            <span className="text-2xl font-bold text-green-700">
              {completedCount}
            </span>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center min-w-[120px]">
            <span className="text-xs text-gray-500">In Progress</span>
            <span className="text-2xl font-bold text-yellow-600">
              {inProgressCount}
            </span>
          </div>
        </div>
      </div>

      {sortedInProgressProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            In Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedInProgressProjects.map((project) => (
              <ProjectCard
                key={project.name}
                project={project}
                onClick={() =>
                  router.push(`/projects/${encodeURIComponent(project.name)}`)
                }
              />
            ))}
          </div>
        </div>
      )}

      {sortedDoneProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Completed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDoneProjects.map((project) => (
              <ProjectCard
                key={project.name}
                project={project}
                onClick={() =>
                  router.push(`/projects/${encodeURIComponent(project.name)}`)
                }
              />
            ))}
          </div>
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No projects found matching &quot;{search}&quot;
        </div>
      )}
    </div>
  );
}
