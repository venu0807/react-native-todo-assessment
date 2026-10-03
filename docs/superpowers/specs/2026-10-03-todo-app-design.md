# React Native To-Do App — Design Spec

**Date:** 2026-10-03  
**Author:** Venu Gopal Reddy Palugulla  
**Assignment:** Modulus Seventeen — React Native Assessment

---

## 1. Overview

A full-stack mobile To-Do application for Android built with **React Native CLI + TypeScript**, backed by a **NestJS REST API** with **MongoDB**. Users register/login with JWT auth, then manage tasks with title, description, date-time, deadline, and priority. The UI targets a visually premium, dark-themed design with smooth animations.

---

## 2. Architecture

```
┌─────────────────────────────┐       HTTP/REST        ┌──────────────────────────────┐
│  React Native CLI (Android) │ ◄───────────────────► │  NestJS API (Node.js)        │
│  TypeScript + Redux Toolkit │       JWT Bearer        │  MongoDB (Mongoose)          │
│  React Navigation           │                        │  bcryptjs + JWT              │
└─────────────────────────────┘                        └──────────────────────────────┘
```

### 2.1 Backend — NestJS + MongoDB

- **Auth Module:** `POST /auth/register`, `POST /auth/login` → returns JWT
- **Tasks Module:** Full CRUD under `/tasks` (JWT-protected)
- **MongoDB collections:** `users`, `tasks`
- **Guard:** `JwtAuthGuard` applied globally to tasks routes

### 2.2 Frontend — React Native CLI

- **Navigation:** React Navigation v6 (Stack: Auth flow → App flow)
- **State:** Redux Toolkit + RTK Query (API slice for tasks + auth)
- **Storage:** AsyncStorage for JWT token persistence
- **UI:** Custom dark-themed components, React Native Reanimated for animations

---

## 3. Data Models

### User (MongoDB)
```ts
{
  _id: ObjectId,
  email: string,      // unique, lowercase
  password: string,   // bcrypt hash (12 rounds)
  createdAt: Date
}
```

### Task (MongoDB)
```ts
{
  _id: ObjectId,
  userId: ObjectId,   // ref: User
  title: string,      // max 100 chars
  description: string, // optional, max 500 chars
  dateTime: Date,     // task date/time (when to do it)
  deadline: Date,     // due date
  priority: 'low' | 'medium' | 'high',
  completed: boolean, // default false
  category: string,   // bonus: e.g. "Work", "Personal"
  tags: string[],     // bonus: free-form tags
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. API Contract

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | /auth/register | ❌ | `{email, password}` | `{token, user}` |
| POST | /auth/login | ❌ | `{email, password}` | `{token, user}` |
| GET | /tasks | ✅ | — | `Task[]` |
| POST | /tasks | ✅ | `TaskCreateDto` | `Task` |
| PATCH | /tasks/:id | ✅ | `TaskUpdateDto` | `Task` |
| DELETE | /tasks/:id | ✅ | — | `204` |

---

## 5. Sorting Algorithm (Bonus)

A composite score determines task order:

```
score = priorityWeight(priority) + deadlineUrgency(deadline) + dateTimeProximity(dateTime)

priorityWeight: high=3, medium=2, low=1
deadlineUrgency: 1 / (hoursUntilDeadline + 1)  [capped at 10]
dateTimeProximity: 1 / (hoursUntilDateTime + 1) [capped at 5]

Tasks sorted descending by score.
```

---

## 6. Frontend Screens

1. **SplashScreen** — animated logo, checks stored token
2. **LoginScreen** — email/password, link to Register
3. **RegisterScreen** — email/password/confirm
4. **HomeScreen** — task list with filters (All / Active / Completed), FAB to add
5. **TaskFormScreen** — create/edit task (title, desc, dateTime picker, deadline picker, priority selector, category, tags)
6. **TaskDetailScreen** — full task view with complete/delete actions

---

## 7. UI Design Language

- **Theme:** Dark (`#0D0D0D` bg, `#1A1A2E` card, `#E94560` accent)
- **Typography:** Bold headers, medium body — system fonts
- **Cards:** Rounded corners (12px), subtle shadow/glow on priority HIGH
- **Priority Indicators:** Left border color (red/orange/green)
- **Animations:** Card slide-in on list render (Reanimated), swipe-to-delete gesture
- **FAB:** Pulsing accent button for add task

---

## 8. Project Structure

```
C:\Proposals\
├── backend\                    # NestJS API
│   ├── src\
│   │   ├── auth\               # auth module (controller, service, guards, DTOs)
│   │   ├── tasks\              # tasks module (controller, service, schema, DTOs)
│   │   ├── common\             # JWT strategy, guards
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   └── package.json
│
└── TodoApp\                    # React Native CLI
    ├── src\
    │   ├── api\                # RTK Query API slices
    │   ├── components\         # Reusable UI components
    │   ├── navigation\         # Stack navigators
    │   ├── screens\            # Screen components
    │   ├── store\              # Redux store
    │   ├── theme\              # Colors, fonts, spacing
    │   ├── types\              # TypeScript interfaces
    │   └── utils\             # sorting algorithm, date helpers
    ├── android\
    └── package.json
```

---

## 9. Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Framework | React Native CLI 0.74 + TypeScript |
| Navigation | React Navigation 6 (Stack) |
| State / API | Redux Toolkit + RTK Query |
| Storage | @react-native-async-storage/async-storage |
| Animations | React Native Reanimated 3 |
| Gestures | React Native Gesture Handler |
| Date Picker | @react-native-community/datetimepicker |
| Backend | NestJS 10 |
| Database | MongoDB 7 (Mongoose) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Testing | Jest + React Native Testing Library (frontend) |

---

## 10. Constraints

- Target: Android only (as per assignment)
- No WSL — all commands via PowerShell natively
- MongoDB: local instance on `mongodb://localhost:27017/todo-app`
- Backend port: 3000
- Metro bundler port: 8081
- Environment vars via `.env` files (never committed)
- TypeScript strict mode enabled
- No Swagger, no AWS, no Nginx, no Linux/Bash shims
