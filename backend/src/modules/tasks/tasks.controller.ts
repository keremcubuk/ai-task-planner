import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Prisma } from '@prisma/client';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Post('reorder')
  reorder(@Body() body: { ids: number[] }) {
    return this.tasksService.reorder(body.ids);
  }

  @Post('reset')
  async reset(@Body() body: { password: string }) {
    if (body.password !== '12345') {
      throw new UnauthorizedException('Invalid password');
    }
    await this.tasksService.deleteAll();
    return { message: 'Database reset successfully' };
  }

  @Get('analytics')
  getAnalytics() {
    return this.tasksService.getAnalytics();
  }

  @Get('projects')
  getProjectsStats() {
    return this.tasksService.getProjectsStats();
  }

  @Get()
  findAll(
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('project') project?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('severity') severity?: string,
    @Query('minAiScore') minAiScore?: string,
    @Query('maxAiScore') maxAiScore?: string,
    @Query('aiScores') aiScores?: string,
    @Query('dueStartDate') dueStartDate?: string,
    @Query('dueEndDate') dueEndDate?: string,
  ) {
    const where: Prisma.TaskWhereInput = {};
    if (project) {
      const projects = project.split(',').map((p) => p.trim());
      where.project = { in: projects };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      where.status = { in: statuses };
    }

    if (assignedTo) {
      where.assignedTo = { contains: assignedTo };
    }

    if (severity) {
      where.severity = severity;
    }

    if (minAiScore || maxAiScore || aiScores) {
      const aiScoreFilter: { gte?: number; lte?: number; in?: number[] } = {};
      if (minAiScore) aiScoreFilter.gte = parseFloat(minAiScore);
      if (maxAiScore) aiScoreFilter.lte = parseFloat(maxAiScore);
      if (aiScores) {
        const scores = aiScores.split(',').map((s) => parseFloat(s.trim()));
        aiScoreFilter.in = scores;
      }
      where.aiScore = aiScoreFilter;
    }

    if (dueStartDate || dueEndDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (dueStartDate) dateFilter.gte = new Date(dueStartDate);
      if (dueEndDate) dateFilter.lte = new Date(dueEndDate);
      where.dueDate = dateFilter;
    }

    const orderBy = sort ? { [sort]: order || 'asc' } : undefined;
    return this.tasksService.findAll({ where, orderBy });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
