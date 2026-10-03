// src/tasks/tasks.service.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TasksService', () => {
  let service: TasksService;
  let mockTaskModel: any;

  const validUserId = new Types.ObjectId().toString();
  const otherUserId = new Types.ObjectId().toString();
  const validTaskId = new Types.ObjectId().toString();

  beforeEach(() => {
    function MockModel(this: any, data: any) {
      Object.assign(this, data);
      this.save = vi.fn().mockResolvedValue({ _id: validTaskId, ...data });
    }

    MockModel.find = vi.fn();
    MockModel.findById = vi.fn();
    MockModel.findByIdAndUpdate = vi.fn();
    MockModel.findByIdAndDelete = vi.fn();

    mockTaskModel = MockModel;
    service = new TasksService(mockTaskModel as any);
  });

  describe('findAll', () => {
    it('should return tasks owned by the user sorted by deadline ascending', async () => {
      const execMock = vi.fn().mockResolvedValue([{ title: 'Task 1' }]);
      const sortMock = vi.fn().mockReturnValue({ exec: execMock });
      mockTaskModel.find.mockReturnValue({ sort: sortMock });

      const result = await service.findAll(validUserId);

      expect(mockTaskModel.find).toHaveBeenCalledWith({
        userId: new Types.ObjectId(validUserId),
      });
      expect(sortMock).toHaveBeenCalledWith({ deadline: 1 });
      expect(execMock).toHaveBeenCalled();
      expect(result).toEqual([{ title: 'Task 1' }]);
    });
  });

  describe('create', () => {
    it('should create and save a new task with the user id', async () => {
      const dto: CreateTaskDto = {
        title: 'New Task',
        description: 'Test description',
        dateTime: '2026-10-05T10:00:00Z',
        deadline: '2026-10-07T18:00:00Z',
        priority: 'high',
        category: 'Work',
        tags: ['urgent'],
      };

      const result = await service.create(validUserId, dto);

      expect(result).toBeDefined();
      expect(result.title).toBe(dto.title);
      expect((result as any).userId).toEqual(new Types.ObjectId(validUserId));
    });
  });

  describe('update', () => {
    const dto: UpdateTaskDto = { completed: true, priority: 'low' };

    it('should successfully update task when owned by requesting user', async () => {
      const existingTask = {
        _id: validTaskId,
        userId: new Types.ObjectId(validUserId),
        title: 'Existing',
      };
      mockTaskModel.findById.mockResolvedValue(existingTask);

      const execMock = vi.fn().mockResolvedValue({ ...existingTask, ...dto });
      mockTaskModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.update(validUserId, validTaskId, dto);

      expect(mockTaskModel.findById).toHaveBeenCalledWith(validTaskId);
      expect(mockTaskModel.findByIdAndUpdate).toHaveBeenCalledWith(validTaskId, dto, { new: true });
      expect(execMock).toHaveBeenCalled();
      expect(result).toEqual({ ...existingTask, ...dto });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockTaskModel.findById.mockResolvedValue(null);

      await expect(service.update(validUserId, validTaskId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTaskModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if task is owned by another user', async () => {
      const existingTask = {
        _id: validTaskId,
        userId: new Types.ObjectId(otherUserId),
        title: 'Other Users Task',
      };
      mockTaskModel.findById.mockResolvedValue(existingTask);

      await expect(service.update(validUserId, validTaskId, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockTaskModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should successfully remove task when owned by requesting user', async () => {
      const existingTask = {
        _id: validTaskId,
        userId: new Types.ObjectId(validUserId),
        title: 'Existing',
      };
      mockTaskModel.findById.mockResolvedValue(existingTask);
      mockTaskModel.findByIdAndDelete.mockResolvedValue(existingTask);

      await service.remove(validUserId, validTaskId);

      expect(mockTaskModel.findById).toHaveBeenCalledWith(validTaskId);
      expect(mockTaskModel.findByIdAndDelete).toHaveBeenCalledWith(validTaskId);
    });

    it('should throw NotFoundException if task does not exist on remove', async () => {
      mockTaskModel.findById.mockResolvedValue(null);

      await expect(service.remove(validUserId, validTaskId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTaskModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if task is owned by another user on remove', async () => {
      const existingTask = {
        _id: validTaskId,
        userId: new Types.ObjectId(otherUserId),
        title: 'Other Users Task',
      };
      mockTaskModel.findById.mockResolvedValue(existingTask);

      await expect(service.remove(validUserId, validTaskId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockTaskModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});
