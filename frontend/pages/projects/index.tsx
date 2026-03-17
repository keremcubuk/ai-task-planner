import React, { useEffect, useState } from 'react';
import { getProjectsStats, ProjectStats } from '../../lib/api';
import { Search } from 'lucide-react';
import { useRouter } from 'next/router';
import { ProjectCard } from '../../components/ProjectCard';
import { InputSelect, InputField, PageHeader, StatCard, StatCardRow } from '@components/ui';

const sortOptions = [
  { value: 'mostTasks', label: 'Most Tasks' },
  { value: 'leastTasks', label: 'Least Tasks' },
  { value: 'a-z', label: 'A-Z' },
  { value: 'z-a', label: 'Z-A' },
];

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

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const inProgressProjects = filteredProjects.filter(p => p.projectStatus !== 'done');
  const doneProjects = filteredProjects.filter(p => p.projectStatus === 'done');

  // Sorting function
  const sortProjects = (projects: ProjectStats[]) => {
    const sorted = [...projects]; // Copy to avoid mutating original

    switch (sortBy) {
      case 'a-z':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'mostTasks':
        return sorted.sort((a, b) => b.total - a.total);
      case 'leastTasks':
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
      <PageHeader title="Projects" description="Browse and manage all projects" />

      {/* Search, Sort, and Stats summary in a single grid */}
      <div className="mb-8 flex flex-col items-center gap-4 md:flex-row">
        {/* Search and Sort - 65% */}
        <div className="w-full md:w-8/12">
          <div className="flex h-20 items-center rounded-lg bg-white p-4 shadow">
            <div className="relative flex w-full gap-4">
              <InputField
                type="search"
                placeholder="Search projects..."
                value={search}
                onChange={setSearch}
                icon={<Search size={20} />}
                iconPosition="left"
                className="flex-1"
              />
              <InputSelect
                value={sortBy}
                onChange={value => setSortBy(value)}
                options={sortOptions}
              />
            </div>
          </div>
        </div>
        {/* Stats - 35% */}
        <StatCardRow className="w-full md:w-4/12">
          <StatCard label="Total" value={totalCount} valueColor="blue" size="md" />
          <StatCard label="Completed" value={completedCount} valueColor="green" size="md" />
          <StatCard label="In Progress" value={inProgressCount} valueColor="yellow" size="md" />
        </StatCardRow>
      </div>

      {sortedInProgressProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
            In Progress
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedInProgressProjects.map(project => (
              <ProjectCard
                key={project.name}
                project={project}
                onClick={() => router.push(`/projects/${encodeURIComponent(project.name)}`)}
              />
            ))}
          </div>
        </div>
      )}

      {sortedDoneProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide text-gray-600 uppercase">Completed</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedDoneProjects.map(project => (
              <ProjectCard
                key={project.name}
                project={project}
                onClick={() => router.push(`/projects/${encodeURIComponent(project.name)}`)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No projects found matching &quot;{search}&quot;
        </div>
      )}
    </div>
  );
}
