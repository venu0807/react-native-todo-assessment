// src/tasks/dto/create-task.dto.ts
import { IsString, IsDateString, IsEnum, IsOptional, MaxLength, IsArray } from 'class-validator';
import { Priority } from '../task.schema';

export class CreateTaskDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  dateTime: string;

  @IsDateString()
  deadline: string;

  @IsEnum(['low', 'medium', 'high'])
  priority: Priority;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
