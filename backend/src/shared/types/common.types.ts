/**
 * Common types and interfaces used across the backend
 */

// AI Configuration
export interface AiConfig {
  severityWeight: number;
  deadlineWeight: number;
  transitionWeight: number;
  ageWeight: number;
  manualWeight: number;
  mode?: 'rulebased' | 'local-llm' | 'openai';
  localLlmPath?: string;
  modelPath?: string;
}

// LLM Configuration
export interface LlmConfig {
  localLlmPath: string;
  modelPath: string;
}

// Export Filter
export interface ExportFilter {
  status?: string;
  severity?: string;
}

// Import Task Interface
export interface ImportedTask {
  [key: string]: unknown;
  Title?: string;
  title?: string;
  'Task Name'?: string;
  Subject?: string;
  Description?: string;
  description?: string;
  Notes?: string;
  Status?: string;
  status?: string;
  'Bucket Name'?: string;
  bucketName?: string;
  Progress?: string | number;
  progress?: string | number;
  Severity?: string;
  severity?: string;
  Priority?: string;
  'Due Date'?: string | Date;
  'Due date'?: string | Date;
  'due date'?: string | Date;
  dueDate?: string | Date;
  Deadline?: string | Date;
  'Created Date'?: string | Date;
  createdAt?: string | Date;
  'Date Created'?: string | Date;
  'Start Date'?: string | Date;
  'Task ID'?: string | number;
  ID?: string | number;
  TaskId?: string | number;
  'External ID'?: string;
  'Assigned To'?: string;
  assignedTo?: string;
  Owner?: string;
  Assignee?: string;
  'Project Name'?: string;
  'Project  Name'?: string;
  'project name'?: string;
  ProjectName?: string;
  project?: string;
  Source?: string;
  source?: string;
  'Manual Priority'?: string | number;
  manualPriority?: string | number;
  'AI Score'?: string | number;
  aiScore?: string | number;
  'AI Priority'?: string | number;
  aiPriority?: string | number;
}

// Project Statistics
export interface ProjectStats {
  total: number;
  completed: number;
  critical: number;
}

// Assignee Performance
export interface AssigneePerformance {
  total: number;
  completed: number;
}

// Project Details
export interface ProjectDetails {
  total: number;
  closed: number;
  inProgress: number;
  critical: number;
  minor: number;
}

export interface BucketCategoryBreakdown {
  done: number;
  projectSolved: number;
  declined: number;
  design: number;
  other: number;
  none: number;
}

export interface OpenedByStats {
  total: number;
  firstCreatedAt?: string;
  lastCreatedAt?: string;
  issuesPerWeek: number;
  last30Days: number;
  bucketBreakdown: BucketCategoryBreakdown;
}

// Analytics Response
export interface AnalyticsResponse {
  totalTasks: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byAssignedTo: Record<string, number>;
  byAssigneePerformance: Record<string, AssigneePerformance>;
  byProject: Record<string, ProjectDetails>;
  byOpenedBy: Record<string, OpenedByStats>;
  byBucketCategory: BucketCategoryBreakdown;
  avgCompletionTimeDays: number;
}

// Import Result
export interface ImportResult {
  count: number;
  message: string;
}

// Export Result
export interface ExportResult {
  filePath: string;
  fileName: string;
}

// Error with message
export interface ErrorWithMessage {
  message: string;
  stack?: string;
}

// Type guard for Error
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Get error message helper
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) return error.message;
  return String(error);
}

// Get error stack helper
export function getErrorStack(error: unknown): string | undefined {
  if (isErrorWithMessage(error)) return error.stack;
  return undefined;
}
