import React, { useEffect, useState } from 'react';
import { getProjectsStats } from '../../lib/api';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/router';

export default function ProjectsList() {
  const [projects, setProjects] = useState<any[]>([]);
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div 
              key={project.name} 
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              onClick={() => router.push(`/projects/${encodeURIComponent(project.name)}`)}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 truncate" title={project.name}>
                  {project.name}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Tasks</span>
                    <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">{project.total}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><CheckCircle size={14} className="text-green-500"/> Completed</span>
                    <span className="font-medium text-green-700">{project.completed}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><AlertCircle size={14} className="text-red-500"/> Critical</span>
                    <span className="font-medium text-red-700">{project.critical}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                   <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${project.total > 0 ? (project.completed / project.total) * 100 : 0}%` }}
                      ></div>
                   </div>
                   <p className="text-xs text-right mt-1 text-gray-400">
                     {project.total > 0 ? Math.round((project.completed / project.total) * 100) : 0}% done
                   </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProjects.length === 0 && (
           <div className="text-center py-12 text-gray-500">
             No projects found matching "{search}"
           </div>
        )}
    </div>
  );
}
