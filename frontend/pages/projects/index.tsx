import React, { useEffect, useState } from 'react';
import { getProjectsStats, ProjectStats } from '../../lib/api';
import { Search } from 'lucide-react';
import { useRouter } from 'next/router';
import { ProjectCard } from '../../components/ProjectCard';

export default function ProjectsList() {
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
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

  const inProgressProjects = filteredProjects.filter((p) => p.projectStatus !== 'done');
  const doneProjects = filteredProjects.filter((p) => p.projectStatus === 'done');

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {inProgressProjects.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">In Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressProjects.map((project) => (
                <ProjectCard
                  key={project.name}
                  project={project}
                  onClick={() => router.push(`/projects/${encodeURIComponent(project.name)}`)}
                />
              ))}
            </div>
          </div>
        )}

        {doneProjects.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Completed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doneProjects.map((project) => (
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
           <div className="text-center py-12 text-gray-500">
             No projects found matching &quot;{search}&quot;
           </div>
        )}
    </div>
  );
}
