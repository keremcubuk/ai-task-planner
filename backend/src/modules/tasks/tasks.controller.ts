import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UnauthorizedException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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
    @Query('search') search?: string
  ) {
    const where: any = {};
    if (project) {
      where.project = project;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
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
