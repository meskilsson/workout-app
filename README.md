# Workout App

A full-stack workout tracking app for building training sessions, selecting exercises by muscle group, logging sets, and saving workout history.

This project is currently **pre-MVP and in active development**. The core workout flow is already taking shape, while UI polish, screenshots, deployment, templates, tests, and production hardening are still planned.

## Screenshots

Screenshots will be added once the MVP UI is more stable.

## Project status

The app is not meant to be presented as a finished product yet. It is a work in progress focused on building a strong full-stack foundation.

Current focus:

- Building a reliable workout creation flow
- Connecting frontend and backend features
- Saving user-created exercises and completed workouts
- Improving the user experience before MVP
- Preparing the project for screenshots, deployment, and portfolio presentation

## Features

### Authentication and user accounts

- User signup and login
- JWT authentication stored in an HTTP-only cookie
- Protected frontend routes
- Role-protected admin route structure
- Profile page with account information
- Account update and password change forms

### Exercise library

- Public exercise library
- Authenticated user exercise library
- Create custom exercises
- Edit custom exercises
- Delete custom exercises
- Search and filter exercises
- Muscle group metadata for primary and secondary muscles
- Exercise details such as type, equipment, difficulty, description, and instructions

### Workout builder

- Select muscle groups for a workout
- Create a workout draft
- Select exercises based on chosen muscle groups
- Review selected exercises before starting
- Start an active workout session
- Add and remove sets
- Log weight and reps
- Reorder exercises with drag and drop
- Save progress to the workout draft
- Complete a workout and save it as a workout session
- Abandon an active draft

### Workout tracking

- Workout duration timer
- Rest timer after completed sets
- Workout result page after saving a session
- Workout history page
- Workout detail page for previous sessions
- Basic trained-muscle summary using exercise metadata

### UI and experience

- Responsive React frontend
- Reusable UI components
- CSS modules for page-level styling
- Theme context and body model settings
- Profile/account layout
- Loading, error, and empty states in several flows

## Tech stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- CSS Modules
- dnd-kit for drag-and-drop workout exercise ordering

### Backend

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT authentication
- Cookie-based auth sessions
- Request validation middleware
- Centralized error handling

### Shared package

- Shared TypeScript types
- Shared exercise constants
- Shared timer logic
- Shared current workout context

### Mobile / native

The repository also contains an Expo app under `apps/native`. At the moment, the main product focus appears to be the web app and backend. The native app can be developed further later if mobile support becomes part of the MVP roadmap.

## Monorepo structure

```text
workout-app/
├── apps/
│   ├── backend/        # Express API, MongoDB models, services, routes
│   ├── web/            # React + Vite frontend
│   └── native/         # Expo app scaffold for future mobile development
├── packages/
│   └── shared/         # Shared types, constants, contexts, and timer logic
├── package.json        # Root workspace scripts
└── README.md
```

## Getting started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB database, either local or hosted with MongoDB Atlas

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd workout-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure backend environment variables

Create a backend environment file from the example:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Then update `apps/backend/.env`:

```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### 4. Optional frontend environment variable

The frontend defaults to `http://localhost:5000`, but you can also create `apps/web/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 5. Seed the exercise library

The backend includes a seed file for public exercises.

```bash
npm run seed:exercises --workspace=backend
```

### 6. Start the app

Run the web app and backend together:

```bash
npm run dev:both
```

Or run them separately:

```bash
npm run dev:backend
npm run dev:web
```

Default local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

## Available scripts

From the root of the repository:

```bash
npm run dev:web       # Start the Vite frontend
npm run dev:backend   # Start the Express backend
npm run dev:both      # Start frontend and backend together
npm run dev:native    # Start the Expo native app
npm run build:web     # Build the web app
npm run lint          # Run linting where available
```

Backend-specific:

```bash
npm run seed:exercises --workspace=backend
npm run build --workspace=backend
npm run start --workspace=backend
```

Web-specific:

```bash
npm run build --workspace=web
npm run preview --workspace=web
npm run lint --workspace=web
```

## Main API routes

| Area | Route prefix | Description |
| --- | --- | --- |
| Auth | `/api/auth` | Login, logout, current user |
| Users | `/api/users` | Signup, profile updates, password changes, user management |
| Exercises | `/api/exercises` | Public exercises, user exercise library, custom exercise CRUD |
| Workouts | `/api/workouts` | Basic workout routes |
| Workout drafts | `/api/workout-drafts` | Workout builder flow, draft updates, starting and completing workouts |
| Workout sessions | `/api/workout-sessions` | Saved workout sessions and workout history |
| Admin | `/api/admin` | Role-protected admin route structure |

## App flow

A typical user flow looks like this:

1. Create an account or log in.
2. Choose muscle groups for a workout.
3. Select exercises from the library.
4. Review the workout summary.
5. Start the workout.
6. Add sets with weight and reps.
7. Use timers while training.
8. Complete the workout.
9. View the saved result in workout history.

## Current limitations

This project is still in active development. Some areas are intentionally unfinished or still being shaped.

Known limitations / planned improvements:

- Screenshots are not added yet
- Templates page is still a placeholder
- Admin dashboard is still a placeholder
- Native app is currently a scaffold
- Training stats are planned but not fully implemented
- Deployment instructions are not finalized
- Automated tests are not added yet
- Some UI copy, loading states, and edge cases still need polish

## Roadmap toward MVP

Potential next steps before presenting this as MVP-ready:

- Add screenshots to the README
- Add a deployed demo link
- Polish responsive layout on mobile and tablet
- Finish workout templates
- Improve profile training statistics
- Add automated tests for important backend services and frontend flows
- Add clearer validation feedback in forms
- Review environment variable handling before deployment
- Add production deployment instructions
- Add a short demo video or GIF

## Notes for portfolio reviewers

This app is meant to show practical full-stack development skills, including:

- Structuring a TypeScript monorepo
- Building a React frontend with protected routes
- Creating a REST API with Express
- Modeling data with MongoDB and Mongoose
- Handling authentication with JWT and cookies
- Sharing types and logic across packages
- Managing a multi-step workout flow from draft to completed session

## License

No license has been added yet.
