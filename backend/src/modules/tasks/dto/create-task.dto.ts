export class CreateTaskDto {
  title: string;
  description?: string;
  source: string;
  project?: string;
  severity?: string;
  status?: string;
  externalId?: string;
  openedBy?: string;
  bucketName?: string;
  transitionDate?: string | Date;
  dueDate?: string | Date;
  manualPriority?: number;
}
