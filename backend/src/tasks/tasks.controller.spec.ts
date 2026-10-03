// src/tasks/tasks.controller.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TasksController', () => {
  let controller: TasksController;
  let service: Partial<TasksService>;

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    controller = new TasksController(service as TasksService);
  });

  const mockUserReq = {
    user: { userId: '507f1f77bcf86cd799439011', email: 'test@example.com' },
  };

  it('findAll should return tasks for the authenticated user', async () => {
    const tasks = [
      { title: 'Task 1', userId: '507f1f77bcf86cd799439011' },
      { title: 'Task 2', userId: '507f1f77bcf86cd799439011' },
    ];
    (service.findAll as any).mockResolvedValue(tasks);

    const result = await controller.findAll(mockUserReq);
    expect(service.findAll).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(result).toEqual(tasks);
  });

  it('create should pass user id and DTO to tasksService.create', async () => {
    const dto: CreateTaskDto = {
      title: 'New Task',
      dateTime: '2026-10-05T10:00:00Z',
      deadline: '2026-10-07T18:00:00Z',
      priority: 'high',
    };
    const createdTask = { _id: 'task_1', ...dto, userId: '507f1f77bcf86cd799439011' };
    (service.create as any).mockResolvedValue(createdTask);

    const result = await controller.create(mockUserReq, dto);
    expect(service.create).toHaveBeenCalledWith('507f1f77bcf86cd799439011', dto);
    expect(result).toEqual(createdTask);
  });

  it('update should pass user id, task id, and DTO to tasksService.update', async () => {
    const dto: UpdateTaskDto = { completed: true };
    const updatedTask = { _id: 'task_1', title: 'Task', completed: true };
    (service.update as any).mockResolvedValue(updatedTask);

    const result = await controller.update(mockUserReq, 'task_1', dto);
    expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'task_1', dto);
    expect(result).toEqual(updatedTask);
  });

  it('remove should pass user id and task id to tasksService.remove', async () => {
    (service.remove as any).mockResolvedValue(undefined);

    const result = await controller.remove(mockUserReq, 'task_1');
    expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'task_1');
    expect(result).toBeUndefined();
  });
});
