// src/tasks/tasks.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async findAll(userId: string): Promise<Task[]> {
    // Return only tasks owned by this user, sorted by deadline ascending
    return this.taskModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ deadline: 1 })
      .exec();
  }

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = new this.taskModel({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
    return task.save();
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    // Enforce ownership — users can only update their own tasks
    if (task.userId.toString() !== userId) throw new ForbiddenException();
    return this.taskModel.findByIdAndUpdate(taskId, dto, { new: true }).exec() as Promise<Task>;
  }

  async remove(userId: string, taskId: string): Promise<void> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    // Enforce ownership — users can only delete their own tasks
    if (task.userId.toString() !== userId) throw new ForbiddenException();
    await this.taskModel.findByIdAndDelete(taskId);
  }
}
