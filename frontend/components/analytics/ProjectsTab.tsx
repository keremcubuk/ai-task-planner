import { StatCard, StatCardGrid, DataTable, DataTableColumn, ProgressBar } from '../ui';

interface ProjectDetails {
  total: number;
  closed: number;
  inProgress: number;
  critical: number;
  minor: number;
}

interface ProjectRow {
  project: string;
  stats: ProjectDetails;
}

interface ProjectsTabProps {
  projectCount: number;
  totalTasks: number;
  activeTasksCount: number;
  criticalCount: number;
  topProjectsByTickets: Array<{ project: string; count: number }>;
  byProject: Record<string, ProjectDetails>;
}

export function ProjectsTab({
  projectCount,
  totalTasks,
  activeTasksCount,
  criticalCount,
  topProjectsByTickets,
  byProject,
}: ProjectsTabProps) {
  const projectData: ProjectRow[] = Object.entries(byProject).map(([project, stats]) => ({
    project,
    stats,
  }));

  const columns: DataTableColumn<ProjectRow>[] = [
    {
      key: 'project',
      header: 'Project Name',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{row.project}</span>
      ),
    },
    {
      key: 'stats.total',
      header: 'Total',
      render: (_, row) => row.stats.total,
    },
    {
      key: 'stats.closed',
      header: 'Done',
      render: (_, row) => (
        <span className="text-green-600 font-medium">{row.stats.closed}</span>
      ),
    },
    {
      key: 'stats.inProgress',
      header: 'In Progress',
      render: (_, row) => (
        <span className="text-blue-600 font-medium">{row.stats.inProgress}</span>
      ),
    },
    {
      key: 'stats.critical',
      header: 'Critical',
      render: (_, row) => (
        <span className="text-red-600 font-medium">{row.stats.critical}</span>
      ),
    },
    {
      key: 'stats.minor',
      header: 'Minor',
      render: (_, row) => row.stats.minor,
    },
  ];

  return (
    <div className="space-y-6">
      <StatCardGrid columns={4}>
        <StatCard label="Toplam Proje" value={projectCount} />
        <StatCard label="Toplam Ticket" value={totalTasks} />
        <StatCard label="Açık Ticket" value={activeTasksCount} valueColor="blue" />
        <StatCard label="Kritik" value={criticalCount} valueColor="red" />
      </StatCardGrid>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">En Çok Ticket Gelen Projeler</h3>
        <div className="space-y-3">
          {topProjectsByTickets.map(({ project, count }, idx) => (
            <div key={project} className="flex items-center gap-3">
              <span className="text-gray-400 w-6">{idx + 1}.</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-900 font-medium">{project}</span>
                  <span className="text-gray-600">{count} ticket</span>
                </div>
                <ProgressBar
                  value={(count / (topProjectsByTickets[0]?.count || 1)) * 100}
                  color="blue"
                  size="md"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
        <DataTable
          data={projectData}
          columns={columns}
          keyExtractor={(row) => row.project}
          emptyMessage="Proje bulunamadı"
        />
      </div>
    </div>
  );
}
