const { PHASES } = require("./constants");

const rooms = new Map();

function createRoom(hostPlayer, roomCode) {
  const room = {
    roomCode,
    hostId: hostPlayer.socketId,
    players: [hostPlayer],
    gameStarted: false,
    phase: PHASES.LOBBY,
    dayCount: 0,
    logs: [],
    winner: null,
    nightActions: {
      mafiaVotes: {},
      doctorSave: null,
      detectiveInspect: null
    },
    votes: {}
  };

  rooms.set(roomCode, room);
  return room;
}

function getRoom(roomCode) {
  return rooms.get(roomCode);
}

function addPlayerToRoom(roomCode, player) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  room.players.push(player);
  return room;
}

function removePlayer(socketId) {
  for (const [roomCode, room] of rooms.entries()) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) continue;

    // In lobby, do not remove immediately. Just mark disconnected.
    if (!room.gameStarted) {
      player.connected = false;

      // If host disconnects in lobby, transfer host to first connected player
      if (room.hostId === socketId) {
        const nextHost = room.players.find(
          (p) => p.socketId !== socketId && p.connected
        );
        if (nextHost) {
          room.hostId = nextHost.socketId;
        }
      }

      room.logs.push(`${player.name} disconnected from lobby.`);
      return { room, removedPlayer: player, deleted: false };
    }

    // During game
    player.connected = false;
    player.alive = false;

    if (room.hostId === socketId) {
      const nextHost = room.players.find((p) => p.connected);
      if (nextHost) {
        room.hostId = nextHost.socketId;
      }
    }

    room.logs.push(`${player.name} disconnected and is out of the game.`);
    return { room, removedPlayer: player, deleted: false };
  }

  return null;
}

function findPlayer(socketId) {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (player) return { room, player };
  }
  return null;
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayer,
  findPlayer
};