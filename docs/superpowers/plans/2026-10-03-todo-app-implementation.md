# React Native To-Do App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Android To-Do app with JWT auth (NestJS + MongoDB backend, React Native CLI + TypeScript frontend) for the Modulus Seventeen assessment.

**Architecture:** NestJS REST API with MongoDB stores users and tasks. React Native CLI frontend uses Redux Toolkit + RTK Query for state and API calls. JWT tokens persisted via AsyncStorage. Dark-themed UI with priority-based sorting algorithm.

**Tech Stack:** React Native CLI 0.74 · TypeScript · Redux Toolkit · RTK Query · React Navigation 6 · Reanimated 3 · NestJS 10 · MongoDB · Mongoose · JWT · bcryptjs

**Spec:** `docs/superpowers/specs/2026-10-03-todo-app-design.md`

## Global Constraints

- Android only (React Native CLI, not Expo)
- TypeScript strict mode enabled in all files
- Native Windows PowerShell only — no WSL, no bash
- MongoDB local: `mongodb://localhost:27017/todo-app`
- Backend port: 3000 | Metro port: 8081
- No AWS, no Swagger, no Nginx, no Celery, no Linux shims
- JWT secret in `.env` only — never hardcoded
- Priority enum: `'low' | 'medium' | 'high'`
- All dates stored as ISO strings / Date objects (UTC)

---

## File Map

### Backend (`C:\Proposals\backend\`)
| File | Purpose |
|------|---------|
| `src/main.ts` | App bootstrap, CORS, port |
| `src/app.module.ts` | Root module — MongooseModule, AuthModule, TasksModule |
| `src/auth/auth.module.ts` | Auth module wiring |
| `src/auth/auth.controller.ts` | POST /auth/register, POST /auth/login |
| `src/auth/auth.service.ts` | register/login logic, JWT sign |
| `src/auth/user.schema.ts` | Mongoose User schema |
| `src/auth/dto/register.dto.ts` | RegisterDto (email, password) |
| `src/auth/dto/login.dto.ts` | LoginDto (email, password) |
| `src/common/jwt.strategy.ts` | PassportJS JWT strategy |
| `src/common/jwt-auth.guard.ts` | JwtAuthGuard |
| `src/tasks/tasks.module.ts` | Tasks module wiring |
| `src/tasks/tasks.controller.ts` | GET/POST/PATCH/DELETE /tasks |
| `src/tasks/tasks.service.ts` | CRUD task logic |
| `src/tasks/task.schema.ts` | Mongoose Task schema |
| `src/tasks/dto/create-task.dto.ts` | CreateTaskDto |
| `src/tasks/dto/update-task.dto.ts` | UpdateTaskDto (PartialType) |
| `.env` | MONGODB_URI, JWT_SECRET, PORT |

### Frontend (`C:\Proposals\TodoApp\`)
| File | Purpose |
|------|---------|
| `src/theme/colors.ts` | Dark theme color palette |
| `src/theme/typography.ts` | Font sizes, weights |
| `src/types/index.ts` | Task, User, AuthState TypeScript interfaces |
| `src/utils/sorting.ts` | Composite score sorting algorithm |
| `src/utils/dateHelpers.ts` | Format dates, relative time |
| `src/store/index.ts` | Redux store setup |
| `src/api/authApi.ts` | RTK Query auth endpoints |
| `src/api/tasksApi.ts` | RTK Query tasks CRUD endpoints |
| `src/store/authSlice.ts` | Auth state slice (token, user) |
| `src/navigation/AuthNavigator.tsx` | Stack: Login → Register |
| `src/navigation/AppNavigator.tsx` | Stack: Home → TaskForm → TaskDetail |
| `src/navigation/RootNavigator.tsx` | Switches between Auth and App stacks |
| `src/components/TaskCard.tsx` | Animated task card with priority stripe |
| `src/components/PriorityBadge.tsx` | Color-coded priority badge |
| `src/components/FAB.tsx` | Pulsing floating action button |
| `src/components/FilterTabs.tsx` | All / Active / Completed filter tabs |
| `src/components/TagChip.tsx` | Tag display chip |
| `src/screens/SplashScreen.tsx` | Logo animation + token check |
| `src/screens/LoginScreen.tsx` | Email/password login form |
| `src/screens/RegisterScreen.tsx` | Registration form |
| `src/screens/HomeScreen.tsx` | Task list with filter + FAB |
| `src/screens/TaskFormScreen.tsx` | Create/Edit task form |
| `src/screens/TaskDetailScreen.tsx` | Full task detail + complete/delete |

---

## Task 1: Backend — Project Scaffold & Config

**Files:**
- Create: `C:\Proposals\backend\` (NestJS project)
- Create: `C:\Proposals\backend\.env`
- Create: `C:\Proposals\backend\src\app.module.ts`
- Create: `C:\Proposals\backend\src\main.ts`

**Interfaces:**
- Produces: Running NestJS server on port 3000 connected to MongoDB

- [ ] **Step 1: Scaffold NestJS project**

```powershell
# In PowerShell at C:\Proposals
npx @nestjs/cli new backend --package-manager npm --skip-git
```

Expected: `C:\Proposals\backend\` created with default NestJS structure.

- [ ] **Step 2: Install backend dependencies**

```powershell
# At C:\Proposals\backend
npm install @nestjs/mongoose mongoose @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs class-validator class-transformer
npm install --save-dev @types/bcryptjs @types/passport-jwt
```

- [ ] **Step 3: Create `.env` file**

```powershell
# At C:\Proposals\backend
Set-Content .env "MONGODB_URI=mongodb://localhost:27017/todo-app`nJWT_SECRET=super_secret_key_change_in_prod`nPORT=3000"
```

- [ ] **Step 4: Install config module**

```powershell
npm install @nestjs/config
```

- [ ] **Step 5: Write `src/main.ts`**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS so React Native can communicate with this API
  app.enableCors({ origin: '*' });
  // Automatically validate all incoming DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 6: Write `src/app.module.ts`**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({ isGlobal: true }),
    // Connect to MongoDB using env variable
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    AuthModule,
    TasksModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 7: Start server and verify MongoDB connection**

```powershell
# At C:\Proposals\backend — MongoDB must be running locally
npm run start:dev
```

Expected: Console shows `🚀 Server running on http://localhost:3000` with no connection errors.

- [ ] **Step 8: Commit**

```powershell
git -C C:\Proposals init
git -C C:\Proposals add backend/
git -C C:\Proposals commit -m "feat(backend): scaffold NestJS project with config and MongoDB"
```

---

## Task 2: Backend — User Schema & Auth Module

**Files:**
- Create: `backend/src/auth/user.schema.ts`
- Create: `backend/src/auth/dto/register.dto.ts`
- Create: `backend/src/auth/dto/login.dto.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.module.ts`
- Create: `backend/src/common/jwt.strategy.ts`
- Create: `backend/src/common/jwt-auth.guard.ts`

**Interfaces:**
- Consumes: `AppModule` from Task 1 (MongooseModule, ConfigModule available)
- Produces:
  - `POST /auth/register` → `{ token: string, user: { _id, email } }`
  - `POST /auth/login` → `{ token: string, user: { _id, email } }`
  - `JwtAuthGuard` injectable guard for tasks routes
  - `JwtPayload { sub: string, email: string }` type

- [ ] **Step 1: Write User schema**

```typescript
// backend/src/auth/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string; // stored as bcrypt hash
}

export const UserSchema = SchemaFactory.createForClass(User);
```

- [ ] **Step 2: Write DTOs**

```typescript
// backend/src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

```typescript
// backend/src/auth/dto/login.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

- [ ] **Step 3: Write JWT Strategy**

```typescript
// backend/src/common/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;   // user _id
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract token from Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    // Returned object is attached to request.user
    return { userId: payload.sub, email: payload.email };
  }
}
```

- [ ] **Step 4: Write JwtAuthGuard**

```typescript
// backend/src/common/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 5: Write AuthService**

```typescript
// backend/src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    // Hash password with 12 rounds
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({ email: dto.email, password: hashed });

    const token = this.jwtService.sign({ sub: user._id.toString(), email: user.email });
    return { token, user: { _id: user._id, email: user.email } };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user._id.toString(), email: user.email });
    return { token, user: { _id: user._id, email: user.email } };
  }
}
```

- [ ] **Step 6: Write AuthController**

```typescript
// backend/src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

- [ ] **Step 7: Write AuthModule**

```typescript
// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User, UserSchema } from './user.schema';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../common/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' }, // Token valid for 7 days
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
```

Fix the export — add JwtAuthGuard import:

```typescript
// Replace the exports array in auth.module.ts
import { JwtAuthGuard } from '../common/jwt-auth.guard';
// Add to providers: JwtAuthGuard
// exports: [JwtAuthGuard]
```

- [ ] **Step 8: Test auth endpoints**

```powershell
# Register
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/auth/register" `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}'

# Login
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}'
```

Expected: Both return `{ token: "eyJ...", user: { _id: "...", email: "test@example.com" } }`

- [ ] **Step 9: Commit**

```powershell
git -C C:\Proposals add backend/src/auth backend/src/common
git -C C:\Proposals commit -m "feat(backend): add JWT auth with register/login endpoints"
```

---

## Task 3: Backend — Tasks Module (Full CRUD)

**Files:**
- Create: `backend/src/tasks/task.schema.ts`
- Create: `backend/src/tasks/dto/create-task.dto.ts`
- Create: `backend/src/tasks/dto/update-task.dto.ts`
- Create: `backend/src/tasks/tasks.service.ts`
- Create: `backend/src/tasks/tasks.controller.ts`
- Create: `backend/src/tasks/tasks.module.ts`

**Interfaces:**
- Consumes: `JwtAuthGuard` from Task 2, `JwtPayload.sub` as `userId`
- Produces:
  - `GET /tasks` → `Task[]` (filtered by userId, sorted server-side by deadline)
  - `POST /tasks` → `Task`
  - `PATCH /tasks/:id` → `Task`
  - `DELETE /tasks/:id` → `204`

- [ ] **Step 1: Write Task schema**

```typescript
// backend/src/tasks/task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export type Priority = 'low' | 'medium' | 'high';

@Schema({ timestamps: true })
export class Task {
  // Reference to the user who owns this task
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ maxlength: 500 })
  description: string;

  @Prop({ required: true })
  dateTime: Date; // When to work on the task

  @Prop({ required: true })
  deadline: Date; // Hard due date

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: Priority;

  @Prop({ default: false })
  completed: boolean;

  // Bonus features
  @Prop({ default: 'General' })
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
```

- [ ] **Step 2: Write CreateTaskDto**

```typescript
// backend/src/tasks/dto/create-task.dto.ts
import { IsString, IsDateString, IsEnum, IsOptional, IsBoolean, MaxLength, IsArray } from 'class-validator';
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
```

- [ ] **Step 3: Write UpdateTaskDto**

```typescript
// backend/src/tasks/dto/update-task.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsBoolean, IsOptional } from 'class-validator';

// All fields from CreateTaskDto become optional
export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
```

- [ ] **Step 4: Write TasksService**

```typescript
// backend/src/tasks/tasks.service.ts
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
    // Return all tasks for this user, sorted by deadline ascending
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
    // Ensure user can only update their own tasks
    if (task.userId.toString() !== userId) throw new ForbiddenException();
    return this.taskModel.findByIdAndUpdate(taskId, dto, { new: true }).exec() as Promise<Task>;
  }

  async remove(userId: string, taskId: string): Promise<void> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    if (task.userId.toString() !== userId) throw new ForbiddenException();
    await this.taskModel.findByIdAndDelete(taskId);
  }
}
```

- [ ] **Step 5: Write TasksController**

```typescript
// backend/src/tasks/tasks.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// All routes require a valid JWT token
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.tasksService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.userId, dto);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.tasksService.remove(req.user.userId, id);
  }
}
```

- [ ] **Step 6: Write TasksModule**

```typescript
// backend/src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './task.schema';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { JwtStrategy } from '../common/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    PassportModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  providers: [TasksService, JwtAuthGuard, JwtStrategy],
  controllers: [TasksController],
})
export class TasksModule {}
```

- [ ] **Step 7: Test CRUD with PowerShell**

```powershell
# First get a token
$login = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}'
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

# Create a task
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/tasks" `
  -ContentType "application/json" -Headers $headers `
  -Body '{"title":"Test Task","dateTime":"2026-10-05T10:00:00Z","deadline":"2026-10-07T18:00:00Z","priority":"high"}'

# Get all tasks
Invoke-RestMethod -Method GET -Uri "http://localhost:3000/tasks" -Headers $headers
```

Expected: Task created with `_id`, returned in GET response.

- [ ] **Step 8: Commit**

```powershell
git -C C:\Proposals add backend/src/tasks
git -C C:\Proposals commit -m "feat(backend): add tasks CRUD with JWT protection"
```

---

## Task 4: React Native — Project Scaffold & Dependencies

**Files:**
- Create: `C:\Proposals\TodoApp\` (React Native CLI project)
- Create: `TodoApp\src\theme\colors.ts`
- Create: `TodoApp\src\theme\typography.ts`
- Create: `TodoApp\src\types\index.ts`

**Interfaces:**
- Produces: Runnable RN app shell on Android emulator/device; theme constants and types consumed by all subsequent tasks

- [ ] **Step 1: Initialize React Native CLI project**

```powershell
# At C:\Proposals
npx react-native@latest init TodoApp --template react-native-template-typescript
```

Expected: `C:\Proposals\TodoApp\` with Android project, `tsconfig.json`, `App.tsx`.

- [ ] **Step 2: Install all dependencies**

```powershell
# At C:\Proposals\TodoApp
npm install @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated @reduxjs/toolkit react-redux @react-native-async-storage/async-storage @react-native-community/datetimepicker

npm install --save-dev @types/react-native
```

- [ ] **Step 3: Link native modules (Android)**

```powershell
# Add to android/app/build.gradle dependencies if needed
# Run Metro to verify no import errors
npx react-native run-android
```

Expected: App launches on emulator showing default React Native screen.

- [ ] **Step 4: Write `src/theme/colors.ts`**

```typescript
// src/theme/colors.ts
// Dark theme color palette — all screens reference these constants
export const Colors = {
  background: '#0D0D0D',      // Main app background
  card: '#1A1A2E',            // Card and surface background
  cardElevated: '#16213E',    // Slightly lighter card for modals
  accent: '#E94560',          // Primary action color (red)
  accentSoft: '#FF6B81',      // Lighter accent for hover/disabled
  text: '#EAEAEA',            // Primary text
  textMuted: '#888899',       // Secondary/placeholder text
  success: '#2ECC71',         // Completed / low priority
  warning: '#F39C12',         // Medium priority
  danger: '#E74C3C',          // High priority / error
  border: '#2A2A4A',          // Dividers and borders
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)', // Modal overlays
} as const;

export type ColorKey = keyof typeof Colors;
```

- [ ] **Step 5: Write `src/theme/typography.ts`**

```typescript
// src/theme/typography.ts
export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.5 },
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.3 },
};
```

- [ ] **Step 6: Write `src/types/index.ts`**

```typescript
// src/types/index.ts
// Core domain types — imported by all modules

export type Priority = 'low' | 'medium' | 'high';

export interface User {
  _id: string;
  email: string;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  dateTime: string;        // ISO string
  deadline: string;        // ISO string
  priority: Priority;
  completed: boolean;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

// DTO for creating/updating tasks — matches backend CreateTaskDto
export interface TaskFormData {
  title: string;
  description: string;
  dateTime: string;
  deadline: string;
  priority: Priority;
  category: string;
  tags: string[];
}
```

- [ ] **Step 7: Commit**

```powershell
git -C C:\Proposals add TodoApp/src/theme TodoApp/src/types
git -C C:\Proposals commit -m "feat(app): scaffold RN project with theme and type definitions"
```

---

## Task 5: Frontend — Redux Store & API Slices

**Files:**
- Create: `TodoApp/src/store/authSlice.ts`
- Create: `TodoApp/src/api/authApi.ts`
- Create: `TodoApp/src/api/tasksApi.ts`
- Create: `TodoApp/src/store/index.ts`

**Interfaces:**
- Consumes: `AuthState`, `Task`, `TaskFormData`, `User` from `src/types/index.ts`
- Produces:
  - `useLoginMutation()` → RTK Query mutation
  - `useRegisterMutation()` → RTK Query mutation
  - `useGetTasksQuery()` → RTK Query query
  - `useCreateTaskMutation()` → RTK Query mutation
  - `useUpdateTaskMutation()` → RTK Query mutation
  - `useDeleteTaskMutation()` → RTK Query mutation
  - `authSlice.actions.setCredentials(token, user)` → sets auth state
  - `authSlice.actions.logout()` → clears auth state

- [ ] **Step 1: Write `src/api/authApi.ts`**

```typescript
// src/api/authApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import { User } from '../types';

const BASE_URL = 'http://10.0.2.2:3000'; // Android emulator localhost

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    // Attach JWT token to every request
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<{ token: string; user: User }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<{ token: string; user: User }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
```

- [ ] **Step 2: Write `src/api/tasksApi.ts`**

```typescript
// src/api/tasksApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import { Task, TaskFormData } from '../types';

const BASE_URL = 'http://10.0.2.2:3000';

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => '/tasks',
      providesTags: ['Task'], // Cache invalidated when task is mutated
    }),
    createTask: builder.mutation<Task, TaskFormData>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: ['Task'], // Refetch task list after creation
    }),
    updateTask: builder.mutation<Task, { id: string; data: Partial<TaskFormData> & { completed?: boolean } }>({
      query: ({ id, data }) => ({ url: `/tasks/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Task'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;
```

- [ ] **Step 3: Write `src/store/authSlice.ts`**

```typescript
// src/store/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types';

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called after successful login or register
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      // Persist token so user stays logged in across app restarts
      AsyncStorage.setItem('token', action.payload.token);
      AsyncStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    // Called on logout button press
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    },
    // Called on app launch to restore persisted session
    restoreSession(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
  },
});

export const { setCredentials, logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;
```

- [ ] **Step 4: Write `src/store/index.ts`**

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './authSlice';
import { authApi } from '../api/authApi';
import { tasksApi } from '../api/tasksApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
  },
  // RTK Query middleware handles caching, invalidation, polling
  middleware: (getDefault) =>
    getDefault().concat(authApi.middleware, tasksApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks — use these instead of plain useDispatch/useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

- [ ] **Step 5: Wrap App with Provider in `App.tsx`**

```typescript
// App.tsx — replace default content
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
```

- [ ] **Step 6: Commit**

```powershell
git -C C:\Proposals add TodoApp/src/store TodoApp/src/api TodoApp/App.tsx
git -C C:\Proposals commit -m "feat(app): add Redux store with RTK Query API slices for auth and tasks"
```

---

## Task 6: Frontend — Navigation Setup

**Files:**
- Create: `TodoApp/src/navigation/AuthNavigator.tsx`
- Create: `TodoApp/src/navigation/AppNavigator.tsx`
- Create: `TodoApp/src/navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: `useAppSelector` from `src/store/index.ts`, `restoreSession` from `src/store/authSlice.ts`
- Produces:
  - `RootNavigator` component — renders Auth or App stack based on auth state
  - Screen parameter types: `AuthStackParamList`, `AppStackParamList`

- [ ] **Step 1: Write `src/navigation/AuthNavigator.tsx`**

```typescript
// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { Colors } from '../theme/colors';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 2: Write `src/navigation/AppNavigator.tsx`**

```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { TaskFormScreen } from '../screens/TaskFormScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { Colors } from '../theme/colors';
import { Task } from '../types';

export type AppStackParamList = {
  Home: undefined;
  TaskForm: { task?: Task };  // undefined = create mode, task = edit mode
  TaskDetail: { taskId: string };
};

const Stack = createStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' },
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Tasks' }} />
      <Stack.Screen name="TaskForm" component={TaskFormScreen}
        options={({ route }) => ({ title: route.params?.task ? 'Edit Task' : 'New Task' })} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task Detail' }} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 3: Write `src/navigation/RootNavigator.tsx`**

```typescript
// src/navigation/RootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store';
import { restoreSession } from '../store/authSlice';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On app launch, check if a valid session token is stored
    async function hydrateSession() {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        if (token && userStr) {
          dispatch(restoreSession({ token, user: JSON.parse(userStr) }));
        }
      } catch {
        // If storage read fails, start fresh (unauthenticated)
      } finally {
        setLoading(false);
      }
    }
    hydrateSession();
  }, [dispatch]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
```

- [ ] **Step 4: Commit**

```powershell
git -C C:\Proposals add TodoApp/src/navigation
git -C C:\Proposals commit -m "feat(app): add navigation with auth/app stack routing"
```

---

## Task 7: Frontend — Utility Functions

**Files:**
- Create: `TodoApp/src/utils/sorting.ts`
- Create: `TodoApp/src/utils/dateHelpers.ts`

**Interfaces:**
- Consumes: `Task`, `Priority` from `src/types/index.ts`
- Produces:
  - `sortTasks(tasks: Task[], filter: 'all' | 'active' | 'completed'): Task[]`
  - `formatDate(iso: string): string` → `"Oct 5, 10:00 AM"`
  - `getRelativeDeadline(iso: string): string` → `"Due in 2 days"` / `"Overdue 1 day"`

- [ ] **Step 1: Write `src/utils/sorting.ts`**

```typescript
// src/utils/sorting.ts
// Composite priority scoring algorithm (Bonus feature)
import { Task, Priority } from '../types';

/**
 * Priority weights — higher = more urgent
 */
const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Compute composite urgency score for a task.
 * Higher score = should appear first in list.
 *
 * Score = priorityWeight + deadlineUrgency + dateTimeProximity
 * deadlineUrgency = 10 / (hoursUntilDeadline + 1)   (capped at 10)
 * dateTimeProximity = 5 / (hoursUntilDateTime + 1)  (capped at 5)
 */
function computeScore(task: Task): number {
  const now = Date.now();
  const deadlineMs = new Date(task.deadline).getTime() - now;
  const dateTimeMs = new Date(task.dateTime).getTime() - now;

  const hoursToDeadline = deadlineMs / (1000 * 60 * 60);
  const hoursToDateTime = dateTimeMs / (1000 * 60 * 60);

  // Urgency increases as deadline approaches; negative = overdue (max urgency)
  const deadlineUrgency = hoursToDeadline <= 0
    ? 10
    : Math.min(10, 10 / (hoursToDeadline + 1));

  const dateTimeProximity = hoursToDateTime <= 0
    ? 5
    : Math.min(5, 5 / (hoursToDateTime + 1));

  return PRIORITY_WEIGHT[task.priority] + deadlineUrgency + dateTimeProximity;
}

/**
 * Sort tasks by composite score (descending).
 * Optionally filter by completion status.
 */
export function sortTasks(
  tasks: Task[],
  filter: 'all' | 'active' | 'completed',
): Task[] {
  let filtered = tasks;
  if (filter === 'active') filtered = tasks.filter((t) => !t.completed);
  if (filter === 'completed') filtered = tasks.filter((t) => t.completed);

  return [...filtered].sort((a, b) => computeScore(b) - computeScore(a));
}
```

- [ ] **Step 2: Write `src/utils/dateHelpers.ts`**

```typescript
// src/utils/dateHelpers.ts
/**
 * Format an ISO date string for display.
 * Example: "2026-10-05T10:00:00Z" → "Oct 5, 10:00 AM"
 */
export function formatDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Return a human-readable relative deadline string.
 * Example: "Due in 2 days" | "Due today" | "Overdue 1 day"
 */
export function getRelativeDeadline(iso: string): string {
  if (!iso) return '';
  const now = new Date();
  const deadline = new Date(iso);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffHours / 24);

  if (diffHours < 0) {
    const overdue = Math.abs(diffDays);
    return overdue === 0 ? 'Overdue today' : `Overdue ${overdue}d`;
  }
  if (diffHours < 24) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays}d`;
}
```

- [ ] **Step 3: Commit**

```powershell
git -C C:\Proposals add TodoApp/src/utils
git -C C:\Proposals commit -m "feat(app): add composite sort algorithm and date helpers"
```

---

## Task 8: Frontend — Reusable UI Components

**Files:**
- Create: `TodoApp/src/components/TaskCard.tsx`
- Create: `TodoApp/src/components/PriorityBadge.tsx`
- Create: `TodoApp/src/components/FAB.tsx`
- Create: `TodoApp/src/components/FilterTabs.tsx`
- Create: `TodoApp/src/components/TagChip.tsx`

**Interfaces:**
- Consumes: `Task`, `Priority` from `src/types/index.ts`; `Colors`, `Typography` from `src/theme/`
- Produces:
  - `<TaskCard task={Task} onPress onComplete onDelete />`
  - `<PriorityBadge priority={Priority} />`
  - `<FAB onPress />` — pulsing accent button
  - `<FilterTabs active={'all'|'active'|'completed'} onChange />`
  - `<TagChip label={string} />`

- [ ] **Step 1: Write `src/components/PriorityBadge.tsx`**

```typescript
// src/components/PriorityBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Priority } from '../types';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface Props { priority: Priority }

// Maps priority to its display color
const PRIORITY_COLOR: Record<Priority, string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.success,
};

export function PriorityBadge({ priority }: Props) {
  const color = PRIORITY_COLOR[priority];
  return (
    <View style={[styles.badge, { backgroundColor: color + '33' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{priority.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  label: { ...Typography.caption, fontWeight: '700' },
});
```

- [ ] **Step 2: Write `src/components/TagChip.tsx`**

```typescript
// src/components/TagChip.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface Props { label: string }

export function TagChip({ label }: Props) {
  return (
    <View style={styles.chip}>
      <Text style={styles.label}>#{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { backgroundColor: Colors.accent + '22', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4 },
  label: { ...Typography.caption, color: Colors.accentSoft },
});
```

- [ ] **Step 3: Write `src/components/TaskCard.tsx`**

```typescript
// src/components/TaskCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { Task, Priority } from '../types';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { PriorityBadge } from './PriorityBadge';
import { TagChip } from './TagChip';
import { getRelativeDeadline, formatDate } from '../utils/dateHelpers';

const PRIORITY_STRIPE: Record<Priority, string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.success,
};

interface Props {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onPress, onComplete, onDelete }: Props) {
  const relativeDeadline = getRelativeDeadline(task.deadline);
  const isOverdue = relativeDeadline.startsWith('Overdue');

  return (
    // FadeInRight gives cards a slide-in animation on list render
    <Animated.View entering={FadeInRight.duration(300)} layout={Layout.springify()} style={styles.card}>
      {/* Left priority stripe */}
      <View style={[styles.stripe, { backgroundColor: PRIORITY_STRIPE[task.priority] }]} />

      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.8}>
        {/* Header row */}
        <View style={styles.header}>
          <Text style={[styles.title, task.completed && styles.strikethrough]} numberOfLines={1}>
            {task.title}
          </Text>
          <PriorityBadge priority={task.priority} />
        </View>

        {/* Description (truncated) */}
        {task.description ? (
          <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
        ) : null}

        {/* Tags */}
        {task.tags.length > 0 && (
          <View style={styles.tags}>
            {task.tags.slice(0, 3).map((tag) => <TagChip key={tag} label={tag} />)}
          </View>
        )}

        {/* Footer row: deadline + action buttons */}
        <View style={styles.footer}>
          <Text style={[styles.deadline, isOverdue && { color: Colors.danger }]}>
            {relativeDeadline}
          </Text>
          <View style={styles.actions}>
            {/* Complete toggle */}
            <TouchableOpacity onPress={onComplete} style={[styles.actionBtn, task.completed && styles.completed]}>
              <Text style={styles.actionText}>{task.completed ? '✓' : '○'}</Text>
            </TouchableOpacity>
            {/* Delete */}
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, marginHorizontal: 16, marginVertical: 6, overflow: 'hidden' },
  stripe: { width: 4 },
  content: { flex: 1, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { ...Typography.h3, color: Colors.text, flex: 1, marginRight: 8 },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textMuted },
  description: { ...Typography.small, color: Colors.textMuted, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deadline: { ...Typography.caption, color: Colors.textMuted },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.textMuted, justifyContent: 'center', alignItems: 'center' },
  completed: { backgroundColor: Colors.success, borderColor: Colors.success },
  actionText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.danger + '33', justifyContent: 'center', alignItems: 'center' },
  deleteText: { color: Colors.danger, fontSize: 12, fontWeight: '700' },
});
```

- [ ] **Step 4: Write `src/components/FAB.tsx`**

```typescript
// src/components/FAB.tsx
import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '../theme/colors';

interface Props { onPress: () => void }

export function FAB({ onPress }: Props) {
  // Subtle pulsing scale animation to draw attention to the FAB
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true, // reverse
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.icon}>+</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 24, right: 24 },
  btn: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  icon: { color: Colors.white, fontSize: 28, lineHeight: 32 },
});
```

- [ ] **Step 5: Write `src/components/FilterTabs.tsx`**

```typescript
// src/components/FilterTabs.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

type Filter = 'all' | 'active' | 'completed';

interface Props { active: Filter; onChange: (f: Filter) => void }

const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

export function FilterTabs({ active, onChange }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, active === tab.key && styles.activeTab]}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, active === tab.key && styles.activeLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, backgroundColor: Colors.card, borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: Colors.accent },
  label: { ...Typography.small, color: Colors.textMuted, fontWeight: '600' },
  activeLabel: { color: Colors.white },
});
```

- [ ] **Step 6: Commit**

```powershell
git -C C:\Proposals add TodoApp/src/components
git -C C:\Proposals commit -m "feat(app): add reusable UI components (TaskCard, FAB, FilterTabs, badges)"
```

---

## Task 9: Frontend — Auth Screens (Login & Register)

**Files:**
- Create: `TodoApp/src/screens/LoginScreen.tsx`
- Create: `TodoApp/src/screens/RegisterScreen.tsx`

**Interfaces:**
- Consumes: `useLoginMutation`, `useRegisterMutation` from `src/api/authApi.ts`; `setCredentials` from `src/store/authSlice.ts`; `AuthStackParamList` from `src/navigation/AuthNavigator.tsx`
- Produces: Functional login and register screens that dispatch `setCredentials` on success

- [ ] **Step 1: Write `src/screens/LoginScreen.tsx`**

```typescript
// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLoginMutation } from '../api/authApi';
import { setCredentials } from '../store/authSlice';
import { useAppDispatch } from '../store';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    try {
      const result = await login({ email: email.trim(), password }).unwrap();
      // Store JWT + user info in Redux state and AsyncStorage
      dispatch(setCredentials(result));
    } catch (err: any) {
      Alert.alert('Login Failed', err?.data?.message ?? 'Invalid credentials');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        {/* App logo/title */}
        <Text style={styles.logo}>✅ TodoApp</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
          {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? <Text style={styles.linkAccent}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logo: { fontSize: 36, fontWeight: '700', color: Colors.accent, textAlign: 'center', marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: Colors.text, ...Typography.body, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20, elevation: 4, shadowColor: Colors.accent, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  btnText: { ...Typography.body, color: Colors.white, fontWeight: '700' },
  link: { ...Typography.small, color: Colors.textMuted, textAlign: 'center' },
  linkAccent: { color: Colors.accent, fontWeight: '700' },
});
```

- [ ] **Step 2: Write `src/screens/RegisterScreen.tsx`**

```typescript
// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRegisterMutation } from '../api/authApi';
import { setCredentials } from '../store/authSlice';
import { useAppDispatch } from '../store';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  async function handleRegister() {
    if (!email || !password || !confirm) return Alert.alert('Error', 'Please fill in all fields');
    if (password !== confirm) return Alert.alert('Error', 'Passwords do not match');
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    try {
      const result = await register({ email: email.trim(), password }).unwrap();
      dispatch(setCredentials(result));
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.data?.message ?? 'Something went wrong');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>✅ TodoApp</Text>
        <Text style={styles.subtitle}>Create a new account</Text>

        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password (min 6 chars)" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor={Colors.textMuted} value={confirm} onChangeText={setConfirm} secureTextEntry />

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
          {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkAccent}>Sign In</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logo: { fontSize: 36, fontWeight: '700', color: Colors.accent, textAlign: 'center', marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: Colors.text, ...Typography.body, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20, elevation: 4, shadowColor: Colors.accent, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  btnText: { ...Typography.body, color: Colors.white, fontWeight: '700' },
  link: { ...Typography.small, color: Colors.textMuted, textAlign: 'center' },
  linkAccent: { color: Colors.accent, fontWeight: '700' },
});
```

- [ ] **Step 3: Commit**

```powershell
git -C C:\Proposals add TodoApp/src/screens/LoginScreen.tsx TodoApp/src/screens/RegisterScreen.tsx
git -C C:\Proposals commit -m "feat(app): add login and register screens with JWT auth"
```

---

## Task 10: Frontend — HomeScreen (Task List)

**Files:**
- Create: `TodoApp/src/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `useGetTasksQuery`, `useUpdateTaskMutation`, `useDeleteTaskMutation` from `src/api/tasksApi.ts`; `sortTasks` from `src/utils/sorting.ts`; `TaskCard`, `FAB`, `FilterTabs` components; `logout` from `src/store/authSlice.ts`; `AppStackParamList` from navigation
- Produces: Main screen rendering sorted, filtered task list with logout button

- [ ] **Step 1: Write `src/screens/HomeScreen.tsx`**

```typescript
// src/screens/HomeScreen.tsx
import React, { useState } from 'react';
import {
  View, FlatList, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGetTasksQuery, useUpdateTaskMutation, useDeleteTaskMutation } from '../api/tasksApi';
import { logout } from '../store/authSlice';
import { useAppDispatch } from '../store';
import { sortTasks } from '../utils/sorting';
import { TaskCard } from '../components/TaskCard';
import { FAB } from '../components/FAB';
import { FilterTabs } from '../components/FilterTabs';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { AppStackParamList } from '../navigation/AppNavigator';

type Filter = 'all' | 'active' | 'completed';
type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: tasks = [], isLoading, refetch } = useGetTasksQuery();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  // Apply composite sorting algorithm on top of API response
  const sortedTasks = sortTasks(tasks, filter);

  async function handleComplete(taskId: string, current: boolean) {
    await updateTask({ id: taskId, data: { completed: !current } });
  }

  async function handleDelete(taskId: string) {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTask(taskId),
      },
    ]);
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logout button in header */}
      <View style={styles.header}>
        <Text style={styles.heading}>My Tasks ({tasks.length})</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <FilterTabs active={filter} onChange={setFilter} />

      {/* Task list */}
      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
            onComplete={() => handleComplete(item._id, item.completed)}
            onDelete={() => handleDelete(item._id)}
          />
        )}
        contentContainerStyle={sortedTasks.length === 0 ? styles.emptyContainer : { paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No tasks yet!</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first task</Text>
          </View>
        }
        onRefresh={refetch}
        refreshing={isLoading}
      />

      {/* Floating action button to create new task */}
      <FAB onPress={() => navigation.navigate('TaskForm', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  heading: { ...Typography.h2, color: Colors.text },
  logoutBtn: { ...Typography.small, color: Colors.danger, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  emptyContainer: { flex: 1 },
  emptyInner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyText: { ...Typography.h2, color: Colors.text, marginBottom: 4 },
  emptySubtext: { ...Typography.body, color: Colors.textMuted },
});
```

- [ ] **Step 2: Commit**

```powershell
git -C C:\Proposals add TodoApp/src/screens/HomeScreen.tsx
git -C C:\Proposals commit -m "feat(app): add HomeScreen with sorted/filtered task list"
```

---

## Task 11: Frontend — TaskFormScreen (Create / Edit)

**Files:**
- Create: `TodoApp/src/screens/TaskFormScreen.tsx`

**Interfaces:**
- Consumes: `useCreateTaskMutation`, `useUpdateTaskMutation`; `TaskFormData` from `src/types/index.ts`; `AppStackParamList` from navigation
- Produces: Form screen that creates a new task or edits existing task; navigates back to Home on success

- [ ] **Step 1: Write `src/screens/TaskFormScreen.tsx`**

```typescript
// src/screens/TaskFormScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreateTaskMutation, useUpdateTaskMutation } from '../api/tasksApi';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Priority } from '../types';
import { AppStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskForm'>;

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const PRIORITY_LABELS: Record<Priority, string> = { low: '🟢 Low', medium: '🟡 Medium', high: '🔴 High' };
const CATEGORIES = ['General', 'Work', 'Personal', 'Health', 'Study', 'Shopping'];

export function TaskFormScreen({ navigation, route }: Props) {
  const existingTask = route.params?.task;
  const isEdit = !!existingTask;

  // Initialize form with existing task values (edit mode) or defaults (create mode)
  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [description, setDescription] = useState(existingTask?.description ?? '');
  const [dateTime, setDateTime] = useState(existingTask ? new Date(existingTask.dateTime) : new Date());
  const [deadline, setDeadline] = useState(existingTask ? new Date(existingTask.deadline) : new Date(Date.now() + 86400000));
  const [priority, setPriority] = useState<Priority>(existingTask?.priority ?? 'medium');
  const [category, setCategory] = useState(existingTask?.category ?? 'General');
  const [tagsInput, setTagsInput] = useState((existingTask?.tags ?? []).join(', '));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const isLoading = isCreating || isUpdating;

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (deadline <= new Date()) return Alert.alert('Error', 'Deadline must be in the future');

    // Parse comma-separated tags into array
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    const data = {
      title: title.trim(),
      description: description.trim(),
      dateTime: dateTime.toISOString(),
      deadline: deadline.toISOString(),
      priority,
      category,
      tags,
    };

    try {
      if (isEdit) {
        await updateTask({ id: existingTask!._id, data }).unwrap();
      } else {
        await createTask(data).unwrap();
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message ?? 'Failed to save task');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Title */}
      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} placeholder="Task title" placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} maxLength={100} />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.multiline]} placeholder="Add details..." placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription} multiline numberOfLines={3} maxLength={500} />

      {/* Date/Time picker */}
      <Text style={styles.label}>Date & Time</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateText}>📅 {dateTime.toLocaleString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={dateTime}
          mode="datetime"
          display="default"
          onChange={(_, date) => { setShowDatePicker(false); if (date) setDateTime(date); }}
        />
      )}

      {/* Deadline picker */}
      <Text style={styles.label}>Deadline *</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDeadlinePicker(true)}>
        <Text style={styles.dateText}>⏰ {deadline.toLocaleString()}</Text>
      </TouchableOpacity>
      {showDeadlinePicker && (
        <DateTimePicker
          value={deadline}
          mode="datetime"
          display="default"
          minimumDate={new Date()}
          onChange={(_, date) => { setShowDeadlinePicker(false); if (date) setDeadline(date); }}
        />
      )}

      {/* Priority selector */}
      <Text style={styles.label}>Priority</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.priorityLabel, priority === p && styles.priorityLabelActive]}>
              {PRIORITY_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category selector */}
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryLabel, category === cat && styles.categoryLabelActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tags input */}
      <Text style={styles.label}>Tags (comma-separated)</Text>
      <TextInput style={styles.input} placeholder="e.g. urgent, frontend, review" placeholderTextColor={Colors.textMuted} value={tagsInput} onChangeText={setTagsInput} />

      {/* Submit button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.8}>
        {isLoading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.submitText}>{isEdit ? 'Update Task' : 'Create Task'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  label: { ...Typography.small, color: Colors.textMuted, fontWeight: '700', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: Colors.text, ...Typography.body, borderWidth: 1, borderColor: Colors.border },
  multiline: { height: 90, textAlignVertical: 'top' },
  dateBtn: { backgroundColor: Colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.border },
  dateText: { ...Typography.body, color: Colors.text },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  priorityBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  priorityLabel: { ...Typography.small, color: Colors.textMuted, fontWeight: '600' },
  priorityLabelActive: { color: Colors.white },
  categoryRow: { marginBottom: 0 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  categoryLabel: { ...Typography.small, color: Colors.textMuted },
  categoryLabelActive: { color: Colors.white },
  submitBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28, elevation: 4, shadowColor: Colors.accent, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  submitText: { ...Typography.body, color: Colors.white, fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```powershell
git -C C:\Proposals add TodoApp/src/screens/TaskFormScreen.tsx
git -C C:\Proposals commit -m "feat(app): add TaskFormScreen for create/edit with datetime pickers"
```

---

## Task 12: Frontend — TaskDetailScreen

**Files:**
- Create: `TodoApp/src/screens/TaskDetailScreen.tsx`

**Interfaces:**
- Consumes: `useGetTasksQuery`, `useUpdateTaskMutation`, `useDeleteTaskMutation`; `formatDate`, `getRelativeDeadline`; `AppStackParamList` from navigation
- Produces: Read-only detail view with complete toggle and delete; navigates to TaskForm for edit

- [ ] **Step 1: Write `src/screens/TaskDetailScreen.tsx`**

```typescript
// src/screens/TaskDetailScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGetTasksQuery, useUpdateTaskMutation, useDeleteTaskMutation } from '../api/tasksApi';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { PriorityBadge } from '../components/PriorityBadge';
import { TagChip } from '../components/TagChip';
import { formatDate, getRelativeDeadline } from '../utils/dateHelpers';
import { AppStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskDetail'>;

export function TaskDetailScreen({ navigation, route }: Props) {
  const { taskId } = route.params;
  const { data: tasks = [] } = useGetTasksQuery();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  // Find task from RTK Query cache — no extra API call needed
  const task = tasks.find((t) => t._id === taskId);

  if (!task) {
    return <View style={styles.center}><ActivityIndicator color={Colors.accent} /></View>;
  }

  async function handleToggleComplete() {
    await updateTask({ id: task!._id, data: { completed: !task!.completed } });
  }

  async function handleDelete() {
    Alert.alert('Delete Task', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(task!._id);
          navigation.goBack();
        },
      },
    ]);
  }

  const relDeadline = getRelativeDeadline(task.deadline);
  const isOverdue = relDeadline.startsWith('Overdue');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Status banner */}
        {task.completed && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>✓ Completed</Text>
          </View>
        )}

        {/* Title + priority */}
        <View style={styles.row}>
          <Text style={[styles.title, task.completed && styles.strikethrough]}>{task.title}</Text>
          <PriorityBadge priority={task.priority} />
        </View>

        {/* Description */}
        {task.description && <Text style={styles.description}>{task.description}</Text>}

        {/* Meta info */}
        <View style={styles.meta}>
          <InfoRow label="Category" value={task.category} />
          <InfoRow label="Date / Time" value={formatDate(task.dateTime)} />
          <InfoRow label="Deadline" value={`${formatDate(task.deadline)} (${relDeadline})`} valueStyle={isOverdue ? { color: Colors.danger } : undefined} />
          <InfoRow label="Created" value={formatDate(task.createdAt)} />
        </View>

        {/* Tags */}
        {task.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {task.tags.map((tag) => <TagChip key={tag} label={tag} />)}
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {/* Edit button */}
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('TaskForm', { task })} activeOpacity={0.8}>
          <Text style={styles.editText}>✏️ Edit Task</Text>
        </TouchableOpacity>

        {/* Complete/Undo toggle */}
        <TouchableOpacity
          style={[styles.completeBtn, task.completed && styles.undoBtn]}
          onPress={handleToggleComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.completeBtnText}>
            {task.completed ? '↩ Mark Incomplete' : '✓ Mark Complete'}
          </Text>
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={isDeleting} activeOpacity={0.8}>
          {isDeleting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.deleteBtnText}>🗑 Delete Task</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Small helper component for label/value rows
function InfoRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: object }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { margin: 16, backgroundColor: Colors.card, borderRadius: 16, padding: 20 },
  completedBanner: { backgroundColor: Colors.success + '22', borderRadius: 8, padding: 8, marginBottom: 12, alignItems: 'center' },
  completedText: { color: Colors.success, fontWeight: '700', ...Typography.small },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  title: { ...Typography.h2, color: Colors.text, flex: 1, marginRight: 12 },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textMuted },
  description: { ...Typography.body, color: Colors.textMuted, marginBottom: 16, lineHeight: 22 },
  meta: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  actions: { padding: 16, gap: 10 },
  editBtn: { backgroundColor: Colors.card, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  editText: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  completeBtn: { backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  undoBtn: { backgroundColor: Colors.textMuted },
  completeBtnText: { ...Typography.body, color: Colors.white, fontWeight: '700' },
  deleteBtn: { backgroundColor: Colors.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { ...Typography.body, color: Colors.white, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { ...Typography.small, color: Colors.textMuted, flex: 1 },
  value: { ...Typography.small, color: Colors.text, flex: 2, textAlign: 'right' },
});
```

- [ ] **Step 2: Commit**

```powershell
git -C C:\Proposals add TodoApp/src/screens/TaskDetailScreen.tsx
git -C C:\Proposals commit -m "feat(app): add TaskDetailScreen with edit/complete/delete actions"
```

---

## Task 13: Integration Testing & Final Build

**Files:**
- Modify: `backend/.env` (if needed)
- Modify: `TodoApp/android/app/src/main/AndroidManifest.xml` (cleartext traffic)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Working end-to-end app — register → login → CRUD tasks → logout

- [ ] **Step 1: Allow cleartext HTTP in Android (required for localhost dev)**

Add to `android/app/src/main/AndroidManifest.xml` inside `<application`:
```xml
android:usesCleartextTraffic="true"
```

- [ ] **Step 2: Start MongoDB (if not running)**

```powershell
# Start MongoDB service (must be installed as Windows service)
Start-Service -Name MongoDB
# Or if running as standalone:
# mongod --dbpath C:\data\db
```

- [ ] **Step 3: Start the backend**

```powershell
# At C:\Proposals\backend
npm run start:dev
```

Expected: `🚀 Server running on http://localhost:3000`

- [ ] **Step 4: Start Metro and run on Android**

```powershell
# At C:\Proposals\TodoApp — in separate PowerShell window
npx react-native start
# In another window:
npx react-native run-android
```

- [ ] **Step 5: End-to-end smoke test**

| Test | Expected |
|------|----------|
| Register with new email | Navigates to HomeScreen (empty tasks) |
| Logout + Login with same credentials | Navigates to HomeScreen |
| Add task (high priority, near deadline) | Task appears at top of list |
| Add task (low priority, far deadline) | Task appears below high priority task |
| Mark task complete | Task moves to Done filter; strikethrough |
| Delete task | Confirmation dialog; task removed |
| Edit task | Form pre-filled; saved changes reflected |
| Filter: Active | Only non-completed tasks shown |
| Filter: Completed | Only completed tasks shown |

- [ ] **Step 6: Final commit**

```powershell
git -C C:\Proposals add .
git -C C:\Proposals commit -m "feat: complete React Native Todo App with NestJS backend"
git -C C:\Proposals tag v1.0.0
```

- [ ] **Step 7: Build release APK for submission**

```powershell
# At C:\Proposals\TodoApp\android
.\gradlew assembleRelease
```

Expected: APK at `android/app/build/outputs/apk/release/app-release.apk`

---

## Spec Coverage Check

| Assignment Requirement | Covered In |
|------------------------|-----------|
| Register with email/password | Task 2 (backend) + Task 9 (LoginScreen) |
| Login with credentials | Task 2 (backend) + Task 9 (RegisterScreen) |
| Add task: title, description, dateTime, deadline, priority | Task 3 (backend) + Task 11 (TaskFormScreen) |
| Mark tasks complete | Task 3 (PATCH endpoint) + Task 10 (HomeScreen) |
| Delete tasks | Task 3 (DELETE endpoint) + Task 10, 12 |
| View task list with status | Task 10 (HomeScreen + FilterTabs) |
| Node.js/NestJS backend | Task 1–3 |
| MongoDB storage | Task 1 (AppModule) + Task 2–3 (schemas) |
| React Native CLI | Task 4 |
| TypeScript throughout | All tasks |
| Redux state management | Task 5 |
| JWT Authentication | Task 2 (JwtStrategy, JwtAuthGuard) |
| Code comments | All tasks (inline comments in every file) |
| Clean project structure | Task 4 (file map) |
| **BONUS:** Task due dates | Task 11 (deadline picker) |
| **BONUS:** Composite sort algorithm | Task 7 (sortTasks) |
| **BONUS:** Categories + tags | Task 3, 11 |
| **BONUS:** Sort/filter | Task 7, 10 (FilterTabs) |
| **BONUS:** Cool UI design | Task 4 (dark theme), Task 8 (animated components) |
