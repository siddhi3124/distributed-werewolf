const { ROLES } = require("./constants");

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateRoomCode(length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getAlivePlayers(room) {
  return room.players.filter((player) => player.alive);
}

function countMafia(room) {
  return getAlivePlayers(room).filter(
    (player) => player.role === ROLES.MAFIA
  ).length;
}

function countVillagers(room) {
  return getAlivePlayers(room).filter(
    (player) => player.role && player.role !== ROLES.MAFIA
  ).length;
}

function getAliveNonMafiaPlayers(room) {
  return getAlivePlayers(room).filter((player) => player.role !== ROLES.MAFIA);
}

function getAliveMafiaPlayers(room) {
  return getAlivePlayers(room).filter((player) => player.role === ROLES.MAFIA);
}

function findPlayerBySocketId(room, socketId) {
  return room.players.find((player) => player.socketId === socketId);
}

function resetNightActions(room) {
  room.nightActions = {
    mafiaVotes: {},
    doctorSave: null
  };
}

function resetDayVotes(room) {
  room.votes = {};
}

function publicPlayerView(player) {
  return {
    socketId: player.socketId,
    name: player.name,
    alive: player.alive,
    connected: player.connected,
    ready: player.ready
  };
}

function publicRoomView(room) {
  return {
    roomCode: room.roomCode,
    hostId: room.hostId,
    gameStarted: room.gameStarted,
    phase: room.phase,
    dayCount: room.dayCount,
    players: room.players.map(publicPlayerView),
    logs: room.logs,
    winner: room.winner || null
  };
}

module.exports = {
  shuffle,
  generateRoomCode,
  getAlivePlayers,
  countMafia,
  countVillagers,
  getAliveNonMafiaPlayers,
  getAliveMafiaPlayers,
  findPlayerBySocketId,
  resetNightActions,
  resetDayVotes,
  publicRoomView
};