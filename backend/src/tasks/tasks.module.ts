// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './task.schema';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to get JwtAuthGuard

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    AuthModule, // Provides JwtAuthGuard via AuthModule's exports — do NOT re-provide JwtStrategy or JwtModule here
  ],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
