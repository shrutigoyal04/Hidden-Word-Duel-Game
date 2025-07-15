# WebSocket Lobby Implementation

This document describes the WebSocket implementation for the Hidden Word Duel Game lobby system.

## Overview

The WebSocket lobby system allows two players to connect and automatically start a round when both players are present in the lobby.

## Features

- **Real-time Connection**: Players connect via WebSocket to the lobby
- **Automatic Round Start**: When both players are connected, the server automatically emits `startRound`
- **Player Management**: Track player connections, disconnections, and lobby status
- **Room-based Communication**: All lobby events are broadcast to all connected players

## Architecture

### Components

1. **LobbyGateway** (`src/lobby/lobby.gateway.ts`)
   - WebSocket gateway handling real-time connections
   - Manages player join/leave events
   - Emits game events to connected players

2. **LobbyService** (`src/lobby/lobby.service.ts`)
   - Business logic for lobby management
   - Player tracking and validation
   - Lobby state management

3. **LobbyModule** (`src/lobby/lobby.module.ts`)
   - NestJS module configuration
   - Exports services for use in other modules

## WebSocket Events

### Client to Server Events

#### `joinLobby`
Join the game lobby.

**Payload:**
```typescript
{
  playerId: string;
  username: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  lobby?: Lobby;
  error?: string;
}
```

#### `leaveLobby`
Leave the game lobby.

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `getLobbyStatus`
Get current lobby status.

**Response:**
```typescript
{
  success: boolean;
  lobby?: Lobby;
  error?: string;
}
```

### Server to Client Events

#### `playerJoined`
Emitted when a new player joins the lobby.

**Payload:**
```typescript
{
  playerId: string;
  username: string;
  lobbySize: number;
}
```

#### `startRound`
Emitted when the lobby is full (2 players) and the round should start.

**Payload:**
```typescript
{
  players: LobbyPlayer[];
  roundId: string;
}
```

#### `playerLeft`
Emitted when a player leaves the lobby.

**Payload:**
```typescript
{
  playerId: string;
  message: string;
}
```

## Data Structures

### LobbyPlayer
```typescript
interface LobbyPlayer {
  socketId: string;
  playerId: string;
  username: string;
  joinedAt: Date;
}
```

### Lobby
```typescript
interface Lobby {
  id: string;
  players: LobbyPlayer[];
  roundId?: string;
  createdAt: Date;
  isActive: boolean;
}
```

## Usage

### Starting the Server

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run start:dev
```

The WebSocket server will be available at `ws://localhost:3000`.

### Testing with the HTML Client

1. Open `test-websocket.html` in a web browser
2. Connect two players with different IDs and usernames
3. Watch the lobby events in real-time
4. When both players are connected, the `startRound` event will be emitted

### Client Implementation Example

```javascript
// Connect to WebSocket server
const socket = io('http://localhost:3000');

// Join lobby
socket.emit('joinLobby', {
  playerId: 'player1',
  username: 'Alice'
});

// Listen for events
socket.on('playerJoined', (data) => {
  console.log(`Player joined: ${data.username}`);
});

socket.on('startRound', (data) => {
  console.log('Round starting!', data);
  // Start your game logic here
});

socket.on('playerLeft', (data) => {
  console.log(`Player left: ${data.playerId}`);
});
```

## Integration with Game Logic

The `startRound` event provides:
- `players`: Array of connected players with their details
- `roundId`: Unique identifier for the round

You can use this information to:
1. Initialize the game state
2. Set up player turns
3. Start the word guessing mechanics
4. Track round progress

## Error Handling

The system includes error handling for:
- Lobby full (max 2 players)
- Duplicate player connections
- Invalid player data
- Connection timeouts

All errors are returned with a `success: false` flag and an `error` message.

## Security Considerations

- CORS is enabled for development (`origin: '*'`)
- Player validation prevents duplicate connections
- Socket ID tracking ensures proper cleanup on disconnect

## Future Enhancements

- Multiple lobby support
- Player authentication integration
- Spectator mode
- Lobby chat functionality
- Game state persistence 