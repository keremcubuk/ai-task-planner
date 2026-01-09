import axios from 'axios';

export interface Task {
  id: number;
  externalId?: string;
  title: string;
  description?: string;
  source?: string;
  project?: string;
  severity?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  transitionDate?: string;
  dueDate?: string;
  assignedTo?: string;
  openedBy?: string;
  componentName?: string;
  manualPriority?: number;
  aiPriority: number;
  aiScore: number;
  position: number;
}

export interface ProjectStats {
  name: string;
  total: number;
  completed: number;
  critical: number;
  projectStatus?: 'done' | 'in_progress' | string;
}

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export const getAnalytics = async () => {
  const response = await api.get('/tasks/analytics');
  return response.data;
};

export const getProjectsStats = async (): Promise<ProjectStats[]> => {
  const response = await api.get('/tasks/projects');
  return response.data;
};

export const fetchTasks = async (params: { 
  sort?: string; 
  order?: 'asc' | 'desc'; 
  project?: string; 
  search?: string;
  status?: string;
  assignedTo?: string;
  severity?: string;
  minAiScore?: number;
  maxAiScore?: number;
  aiScores?: string;
  dueStartDate?: string;
  dueEndDate?: string;
} = {}): Promise<Task[]> => {
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const fetchTask = async (id: number): Promise<Task> => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id: number, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const response = await api.patch(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: number) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const importCsv = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const importXlsx = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/import/xlsx', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const prioritizeTasks = async () => {
  const response = await api.post('/ai/prioritize');
  return response.data;
};

export const reorderTasks = async (ids: number[]) => {
  const response = await api.post('/tasks/reorder', { ids });
  return response.data;
};

export const resetDb = async (password: string) => {
  const response = await api.post('/tasks/reset', { password });
  return response.data;
};

export const exportXlsx = async (type: 'raw' | 'stats' = 'raw') => {
  const response = await api.get('/export/xlsx', {
    params: { type },
    responseType: 'blob',
  });
  return response;
};

// Confluence Crawler API
export interface ConfluenceTask {
  projectName: string;
  projectStatus: string;
  source: string;
  taskId: string;
  taskName: string;
  progress: string;
  assignedTo: string;
  priority: string;
  description: string;
  createdDate: string;
  dueDate: string;
}

export interface ConfluenceCrawlResponse {
  success: boolean;
  pageTitle: string;
  projectStatus: string;
  tasks: ConfluenceTask[];
  totalCount: number;
  url?: string;
  error?: string;
}

export const crawlConfluence = async (
  url: string,
  cookies?: string,
): Promise<ConfluenceCrawlResponse> => {
  const response = await api.post('/confluence/crawl', { url, cookies });
  return response.data;
};

export const confirmConfluenceTasks = async (
  tasks: ConfluenceTask[],
): Promise<{ count: number; message: string }> => {
  const response = await api.post('/confluence/confirm', { tasks });
  return response.data;
};

export const extractConfluenceCookies = async (
  baseUrl: string,
): Promise<{ success: boolean; cookies: string; error?: string }> => {
  const response = await api.post('/confluence/extract-cookies', { baseUrl });
  return response.data;
};

// AI Component Analysis API
export interface ComponentInfo {
  name: string;
  count: number;
  activeTasks: number;
  completedTasks: number;
  tasks: {
    id: number;
    title: string;
    description?: string;
    status: string;
    severity?: string;
  }[];
}

export interface ComponentAnalysisResult {
  components: ComponentInfo[];
  totalTasks: number;
  analyzedTasks: number;
}

export interface OllamaStatus {
  available: boolean;
  message: string;
}

export const getOllamaStatus = async (): Promise<OllamaStatus> => {
  const response = await api.get('/ai/ollama-status');
  return response.data;
};

export const getComponentAnalysis = async (
  useOllama: boolean = true,
  model?: string,
): Promise<ComponentAnalysisResult> => {
  const params: { useOllama?: string; model?: string } = {};
  if (!useOllama) params.useOllama = 'false';
  if (model) params.model = model;

  const response = await api.get('/ai/component-analysis', { params });
  return response.data;
};
