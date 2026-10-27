# NexLab

NexLab is a full-stack learning platform for structured courses, coding practice, quizzes, reviews, progress tracking, and student/admin workflows. The React experience uses the **Luminous Blue Glass** design system: a dark canvas, layered blue glass surfaces, pill controls, and accessible focus states.

## Highlights

- Course catalogue, lessons, enrolment, ratings, and reviews
- Student dashboard, profile, learning activity, and leaderboard
- Coding-problem practice, submissions, and bulk problem import for administrators
- Quiz creation and management
- Browser-based JavaScript sandbox with Redis-backed rate limiting
- Cookie-based authentication with student and admin roles
- Image uploads through ImageKit
- Responsive React UI with React Router, Tailwind CSS, Zustand, and Monaco Editor

> The server-side sandbox currently executes **JavaScript only**. It runs code with Node.js on the backend host; use a hardened, isolated execution environment before exposing it to untrusted public traffic.

## Architecture

```text
React + Vite + Tailwind
        |
        | Axios requests with cookies
        v
Express API
   |       |       |
MongoDB  Redis   ImageKit
 data    cache   course/media assets
```

## Repository layout

```text
.
├── packages/
│   ├── frontend/      # React 18 + Vite application
│   ├── backend/       # Express API, Mongoose models, services, and routes
│   └── shared/        # Shared TypeScript API and domain types
├── docker-compose.yml # Local MongoDB and Redis services
├── render.yaml        # Backend deployment definition
└── vercel.json        # SPA rewrite configuration
```

## Prerequisites

- Node.js 20+
- npm 9+
- Docker Desktop (recommended for local MongoDB and Redis)
- An ImageKit account only if you need media uploads

## Local setup

1. Install the workspace dependencies.

   ```bash
   npm install
   ```

2. Start MongoDB and Redis.

   ```bash
   docker compose up -d
   ```

3. Create or update the environment files described below.

4. Build the shared package, then start both applications.

   ```bash
   npm run build:shared
   npm run dev
   ```

The frontend runs at `http://localhost:5173` by default. The API runs at `http://localhost:5001` by default; its health check is available at `http://localhost:5001/api/health`.

## Environment variables

### `packages/backend/.env`

```dotenv
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://admin:secret@localhost:27017/nexlab?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
CLIENT_URL=http://localhost:5173

# Required when image-upload functionality is enabled
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

`MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` are required by the API configuration. Redis is optional—the server continues without caching/rate-limit storage if Redis cannot be reached.

### `packages/frontend/.env`

```dotenv
VITE_API_URL=http://localhost:5001/api
```

`VITE_API_URL` is required when the frontend starts or builds. Keep secrets out of any `VITE_*` variable because Vite exposes those values to the browser bundle.

## Available scripts

Run these from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Run the frontend and backend together. |
| `npm run dev:frontend` | Run the Vite development server. |
| `npm run dev:backend` | Run the Express API with watch mode. |
| `npm run build:shared` | Compile the shared TypeScript package. |
| `npm run build:frontend` | Produce the frontend production bundle. |
| `npm run build:backend` | Compile the backend to `packages/backend/dist`. |

## API modules

All routes are mounted under `/api`.

| Module | Base path | Purpose |
| --- | --- | --- |
| Authentication | `/auth` | Register, log in/out, and retrieve the current user. |
| Courses | `/courses` | Course discovery, content, enrolment, and related workflows. |
| Problems | `/problems` | Practice problems, submissions, publishing, and bulk import. |
| Sandbox | `/sandbox` | List available languages and execute JavaScript for authenticated users. |
| Quizzes | `/quizzes` | Quiz authoring and learner attempts. |
| Reviews | `/reviews` | Course ratings and reviews. |
| Leaderboard | `/leaderboard` | Learner rankings. |
| Users | `/users` | Profile and learner data. |
| Admin | `/admin` | Administrative courses, users, and analytics workflows. |

## Deployment

- **Frontend:** deploy the Vite app in `packages/frontend` to a static host such as Vercel. Configure `VITE_API_URL` to the public API URL, including `/api`, at build time. The Vercel configuration includes an SPA fallback rewrite.
- **Backend:** `render.yaml` provisions the Node service from the repository root, builds the shared package and backend, and starts `packages/backend/dist` through its workspace script. Set all backend environment variables in the host dashboard.
- **CORS:** set `CLIENT_URL` to the exact deployed frontend origin. The API uses credentialed cookies, so the frontend and backend origins must be configured deliberately.

## Verification

Build the frontend without modifying the tracked `dist` directory:

```bash
(
  cd packages/frontend
  task_build_dir=$(mktemp -d)
  npx vite build --outDir "$task_build_dir"
  rm -rf "$task_build_dir"
)
```

The project currently has no automated test script. Add unit and integration coverage before relying on production changes.

## Security notes

- Never commit `.env` files or deployment credentials.
- Use a unique, long `JWT_SECRET` in every environment.
- The code execution feature needs OS/container-level isolation, resource quotas, network restrictions, and audit logging for production use.
- Restrict `CLIENT_URL` to trusted frontend origins and use HTTPS in production.
