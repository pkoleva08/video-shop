# Video Shop Architecture (Starter)

## Goal

Live consultation where customer receives consultant video and audio, while customer never sends video.

## Frontend modules

- `src/realtime/signaling`: WebSocket client and signaling message protocol.
- `src/realtime/webrtc`: WebRTC media and peer wrappers.
- `src/features/customer/call`: Customer call flow and waiting state.
- `src/features/consultant/call`: Consultant call flow and offer publishing.
- `src/pages`: Top-level pages for each role.

## Signaling flow (MVP)

1. Both roles connect through WebSocket and send `join`.
2. Consultant creates an SDP offer and sends `offer`.
3. Customer receives `offer`, creates `answer`, and sends it back.
4. Both peers exchange `ice-candidate` messages.
5. Either side can end via `leave` and `hangup`.

## One-way video rule

- Consultant peer: `video=sendonly`, `audio=sendrecv`.
- Customer peer: `video=recvonly`, `audio=sendrecv`.
- Customer local media request is audio-only.
- Customer video tracks are explicitly ignored in peer setup.

## Current status

- WebSocket and peer wrappers are scaffolded.
- Customer and consultant views are wired to signaling events.
- Backend integration endpoint is expected at `ws://localhost:8080/ws/signaling`.
