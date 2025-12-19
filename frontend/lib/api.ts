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
