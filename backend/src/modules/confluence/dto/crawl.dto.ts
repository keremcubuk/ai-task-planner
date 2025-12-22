export class CrawlConfluenceDto {
  url: string;
  cookies?: string;
}

export class ConfirmTasksDto {
  tasks: {
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
  }[];
}
