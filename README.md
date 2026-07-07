# Video Shop

React + TypeScript frontend with a Java Spring Boot backend for signaling and basic consultant APIs.

## Requirements

- Node.js 20+
- Java 17+

## Install

```bash
npm install
```

## Run

Start frontend and Spring Boot backend together:

```bash
npm run dev:all
```

Frontend URL:

- http://localhost:5173

Backend URLs used by the app:

- ws://localhost:8080/ws/signaling
- http://localhost:8080/api/health

## Useful scripts

- `npm run dev` - frontend only (Vite)
- `npm run dev:backend` - Spring Boot backend in dev mode
- `npm run start:backend` - Spring Boot backend once
- `npm run typecheck` - TypeScript project references check
- `npm run lint` - lint all files
- `npm run build` - frontend build plus backend jar build

## Backend files

- `backend/src/main/java/com/videoshop/backend/signaling` - WebSocket signaling, session routing, queue coordination
- `backend/src/main/java/com/videoshop/backend/api` - health, queue stats, and consultant login endpoints
- `backend/src/main/resources/application.properties` - backend port and demo consultant credentials

## Demo consultant login

- username: `consultant`
- password: `demo123`
