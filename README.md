# Video Shop

React + TypeScript frontend with a local WebSocket signaling server for one-way consultant video calls.

## Requirements

- Node.js 20+

## Install

```bash
npm install
```

## Run

Start frontend and signaling server together:

```bash
npm run dev:all
```

Frontend URL:

- http://localhost:5173

Signaling URL used by the app:

- ws://localhost:8080/ws/signaling

## Useful scripts

- `npm run dev` - frontend only (Vite)
- `npm run dev:signaling` - signaling server in watch mode
- `npm run start:signaling` - signaling server once
- `npm run typecheck` - TypeScript project references check
- `npm run lint` - lint all files
- `npm run build` - production build

## Server files

- `server/signalingServer.ts` - WebSocket server endpoint and message handling
- `server/sessionRouter.ts` - session membership and peer message routing
