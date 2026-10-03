// src/tasks/tasks.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// All routes in this controller require a valid JWT — JwtAuthGuard verifies the Bearer token
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  // GET /tasks — returns all tasks for the authenticated user
  @Get()
  findAll(@Request() req: any) {
    return this.tasksService.findAll(req.user.userId);
  }

  // POST /tasks — creates a new task for the authenticated user
  @Post()
  create(@Request() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.userId, dto);
  }

  // PATCH /tasks/:id — partial update (completed flag, priority, etc.)
  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(req.user.userId, id, dto);
  }

  // DELETE /tasks/:id — hard delete, returns 204 No Content
  @Delete(':id')
  @HttpCode(204)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.tasksService.remove(req.user.userId, id);
  }
}
