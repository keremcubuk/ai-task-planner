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

  @Get('analytics/trends')
  getTrendAnalytics() {
    return this.tasksService.getTrendAnalytics();
  }

  @Get('analytics/opener-tickets')
  getOpenerTickets(
    @Query('openedBy') openedBy?: string,
    @Query('component') component?: string,
  ) {
    return this.tasksService.getTicketsByOpenerAndComponent(
      openedBy,
      component,
    );
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

    // Project filter - "No Project" için null değerli taskları da dahil et
    let projectFilter: Prisma.TaskWhereInput | undefined;
    if (project) {
      const projects = project.split(',').map((p) => p.trim());
      const hasNoProject = projects.includes('No Project');
      const otherProjects = projects.filter((p) => p !== 'No Project');

      if (hasNoProject && otherProjects.length > 0) {
        projectFilter = {
          OR: [{ project: null }, { project: { in: otherProjects } }],
        };
      } else if (hasNoProject) {
        projectFilter = { project: null };
      } else {
        projectFilter = { project: { in: projects } };
      }
    }

    // Search filter
    let searchFilter: Prisma.TaskWhereInput | undefined;
    if (search) {
      searchFilter = {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      };
    }

    // Combine project and search filters with AND
    if (projectFilter && searchFilter) {
      where.AND = [projectFilter, searchFilter];
    } else if (projectFilter) {
      Object.assign(where, projectFilter);
    } else if (searchFilter) {
      Object.assign(where, searchFilter);
    }

    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      where.status = { in: statuses };
    }

    if (assignedTo) {
      const assignees = assignedTo.split(',').map((a) => a.trim());
      // Handle 'Unassigned' case - convert to null check
      if (assignees.includes('Unassigned')) {
        const otherAssignees = assignees.filter((a) => a !== 'Unassigned');
        if (otherAssignees.length > 0) {
          where.OR = [
            { assignedTo: { in: otherAssignees } },
            { assignedTo: null },
          ];
        } else {
          where.assignedTo = null;
        }
      } else {
        where.assignedTo = { in: assignees };
      }
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
