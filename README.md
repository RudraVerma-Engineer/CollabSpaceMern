# CollabSpace

A collaboration platform for engineering students and developers:
**People → Projects → Collaboration → Real-time communication.**

Users build profiles, publish posts, create projects, request to join other
people's projects, and chat in real time (direct chats and project team chats).

| Layer      | Tech                                                         |
| ---------- | ------------------------------------------------------------ |
| Web        | React 19, Vite, React Router, Context API, Axios, Socket.IO client |
| Mobile     | React Native 0.87 (CLI, no Expo), TypeScript, React Navigation, Socket.IO client |
| Server     | Node.js, Express 5, Mongoose, Joi, JWT, Socket.IO            |
| Database   | MongoDB                                                      |

> Principle: **REST handles application data, MongoDB persists it, Socket.IO
> delivers real-time events, and the backend authorises every resource.**

## Getting started

Requirements: Node.js 20+ and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd server
cp .env.example .env        # then fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                 # http://localhost:5000

# 2. Web (new terminal)
cd web
cp .env.example .env        # optional, defaults to http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173

# 3. Mobile app (see mobile/README.md for Android/iOS setup)
cd mobile
npm install
npm run android             # or: cd ios && bundle exec pod install && cd .. && npm run ios
```

Run the automated end-to-end tests (needs a throw-away MongoDB; the database
is **dropped** on every run):

```bash
cd server
MONGO_URI_TEST=mongodb://127.0.0.1:27017/collabspace_test npm test
```

The suite has 41 tests covering auth, profiles, posts, projects, collaboration,
real-time chat, notifications, search, uploads and GitHub stats.

## Project structure

```
CollabSpace/
├── server/src/
│   ├── config/        env + database connection
│   ├── models/        Mongoose schemas (User, Project, Post, CollaborationRequest,
│   │                  Conversation, Message, Notification)
│   ├── validators/    Joi request schemas
│   ├── routes/        URL -> middleware -> controller
│   ├── controllers/   thin HTTP layer (read request, call service, send response)
│   ├── services/      business rules and database access   <- most logic lives here
│   ├── middleware/    auth, validation, rate limiting, error handling
│   ├── sockets/       Socket.IO auth, chat handlers, presence, emit helpers
│   ├── utils/         constants, AppError, small helpers
│   ├── app.js         Express app (no listen)
│   ├── http-server.js Express + Socket.IO on one HTTP server
│   └── server.js      entry point
├── server/test/       integration/ (automated)  manual/ (old ad-hoc socket scripts)
├── web/src/
│   ├── components/    UI grouped by feature (auth, chat, posts, projects, ...)
│   ├── pages/         one file per route
│   ├── layouts/       AuthLayout, MainLayout
│   ├── context/       Auth, Notification and Toast providers
│   ├── hooks/         useChat, useConversations, useFetch, usePaginatedList, ...
│   ├── services/      one Axios module per API area (no API calls in components)
│   ├── socket/        the single shared Socket.IO client
│   ├── styles/        design tokens + CSS per area
│   └── utils/
├── docs/              API.md, SOCKET_EVENTS.md, design document
└── mobile/            React Native app (Android + iOS), see mobile/README.md
```

Backend flow: **Routes → Controllers → Services → Models → MongoDB.**
Socket handlers only authenticate, authorise and call the same services.

## How the main flow works

1. Rudra creates a project -> the server also creates its **team conversation**.
2. Aman sends a collaboration request -> Rudra gets a live notification.
3. Rudra accepts -> Aman is added to `project.members` and to the team
   conversation, a system message is posted and Aman is notified.
4. Both chat in the team conversation in real time. Non-members are rejected
   by the backend (REST and sockets).

## Feature status (vs. the specification's MVP)

| Area                         | Status |
| ---------------------------- | ------ |
| Auth (register, login, logout, JWT, protected routes) | Done |
| Profiles (skills, college, GitHub, edit, public view) | Done |
| Feed & posts (types, tags, project link, delete own)  | Done |
| Projects (CRUD, status, tech, skills, links, members, filters) | Done |
| Collaboration requests (send, accept/reject/cancel, duplicate guard) | Done |
| Direct chat + project team chat (persistent, real-time) | Done |
| Notifications (requests, accepted/rejected, joined, new message) | Done |
| Search & discovery (global search, filters by skill/tech/status) | Done |
| Typing indicator, presence, read receipts, retry on failed send | Done |
| Likes, comments (with notifications), saved posts | Done |
| Message attachments (images/files), avatar upload, edit/delete own messages | Done |
| Group chat creation | Done |
| GitHub repository stats on project pages | Done |
| Change password, light/dark theme | Done |
| React Native mobile app (`mobile/`): all of the above except theme toggle (follows system light/dark) | Done |
| Push notifications when the app is closed | Not yet |

## Security notes

* Uploads: random file names, extension taken from the validated MIME type, allow-list of types, 5 MB limit, login required to upload.
* Never commit `.env`. Rotate any secret that has been shared.
* Passwords are hashed with bcrypt; JWT secret/expiry come from the environment.
* Helmet, CORS allow-list (`CLIENT_URL`), rate limiting on auth, Joi validation
  on every input, ownership/membership checks in services.
