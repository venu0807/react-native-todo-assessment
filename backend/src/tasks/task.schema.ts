// src/tasks/task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;
export type Priority = 'low' | 'medium' | 'high';

@Schema({ timestamps: true })
export class Task {
  // Reference to the user who owns this task — enforces ownership in service layer
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ maxlength: 500, default: '' })
  description: string;

  @Prop({ required: true })
  dateTime: Date; // When to work on the task

  @Prop({ required: true })
  deadline: Date; // Hard due date

  @Prop({ type: String, enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: Priority;

  @Prop({ default: false })
  completed: boolean;

  // Bonus: category and tags
  @Prop({ default: 'General' })
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
