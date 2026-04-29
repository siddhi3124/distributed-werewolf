const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");

const { MIN_PLAYERS, PHASES, ROLES } = require("./game/constants");
const { generateRoomCode, publicRoomView } = require("./game/utils");
const {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayer,
  findPlayer
} = require("./game/roomManager");
const {
  startGame,
  submitNightAction,
  allNightActionsSubmitted,
  resolveNight,
  submitDayVote,
  allDayVotesSubmitted,
  resolveDayVote,
  checkWinCondition
} = require("./game/gameEngine");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

function emitRoomUpdate(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;
  io.to(roomCode).emit("roomUpdated", publicRoomView(room));
}

function emitPrivateRoles(room) {
  room.players.forEach((player) => {
    io.to(player.socketId).emit("roleAssigned", {
      role: player.role
    });
  });
}

function emitAlivePlayers(room) {
  io.to(room.roomCode).emit(
    "alivePlayers",
    room.players
      .filter((p) => p.alive)
      .map((p) => ({
        socketId: p.socketId,
        name: p.name
      }))
  );
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("createRoom", ({ name }) => {
    if (!name || !name.trim()) {
      socket.emit("errorMessage", "Name is required");
      return;
    }

    let roomCode = generateRoomCode();
    while (getRoom(roomCode)) {
      roomCode = generateRoomCode();
    }

    const player = {
      socketId: socket.id,
      name: name.trim(),
      roomCode,
      role: null,
      alive: true,
      connected: true,
      votedFor: null,
      ready: false
    };

    const room = createRoom(player, roomCode);
    socket.join(roomCode);

    socket.emit("joinedRoom", { roomCode, host: true });
    emitRoomUpdate(roomCode);
  });

  socket.on("joinRoom", ({ name, roomCode }) => {
    const normalizedRoomCode = (roomCode || "").trim().toUpperCase();
    const normalizedName = (name || "").trim();

    const room = getRoom(normalizedRoomCode);

    if (!normalizedName) {
        socket.emit("errorMessage", "Name is required");
        return;
    }

    if (!room) {
        socket.emit("errorMessage", "Room not found");
        return;
    }

    if (room.gameStarted) {
        socket.emit("errorMessage", "Game already started");
        return;
    }

    // Rejoin existing disconnected player by same name
    const existingPlayer = room.players.find(
        (p) => p.name === normalizedName && !p.connected
    );

    if (existingPlayer) {
        const oldSocketId = existingPlayer.socketId;
        existingPlayer.socketId = socket.id;
        existingPlayer.connected = true;

        // If old host reconnects, restore host to new socket id
        if (room.hostId === oldSocketId) {
        room.hostId = socket.id;
        }

        socket.join(room.roomCode);
        socket.emit("joinedRoom", {
        roomCode: room.roomCode,
        host: room.hostId === socket.id
        });

        emitRoomUpdate(room.roomCode);
        return;
    }

    // Prevent duplicate active names
    const duplicateActive = room.players.find(
        (p) => p.name === normalizedName && p.connected
    );

    if (duplicateActive) {
        socket.emit("errorMessage", "A connected player with this name already exists");
        return;
    }

    const player = {
        socketId: socket.id,
        name: normalizedName,
        roomCode: room.roomCode,
        role: null,
        alive: true,
        connected: true,
        votedFor: null,
        ready: false
    };

    addPlayerToRoom(room.roomCode, player);
    socket.join(room.roomCode);

    socket.emit("joinedRoom", {
        roomCode: room.roomCode,
        host: room.hostId === socket.id
    });

    emitRoomUpdate(room.roomCode);
    });

  socket.on("startGame", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    console.log("START GAME DEBUG");
    console.log("socket.id:", socket.id);
    console.log("room.hostId:", room.hostId);
    console.log(
        "players:",
        room.players.map((p) => ({
        name: p.name,
        socketId: p.socketId,
        connected: p.connected
        }))
    );

    if (room.hostId !== socket.id) {
        socket.emit("errorMessage", "Only host can start the game");
        return;
    }

    const connectedPlayers = room.players.filter((p) => p.connected);

    if (connectedPlayers.length < MIN_PLAYERS) {
        socket.emit("errorMessage", `Minimum ${MIN_PLAYERS} connected players required`);
        return;
    }

    // Optional: remove disconnected lobby players before starting
    room.players = room.players.filter((p) => p.connected);

    startGame(room);
    emitPrivateRoles(room);
    emitRoomUpdate(room.roomCode);
    emitAlivePlayers(room);

    io.to(room.roomCode).emit("phaseChanged", {
        phase: room.phase,
        dayCount: room.dayCount
    });
    });

  socket.on("submitNightAction", ({ targetSocketId }) => {
    const found = findPlayer(socket.id);
    if (!found) return;

    const { room, player } = found;

    const result = submitNightAction(room, player.socketId, targetSocketId);
    if (!result.ok) {
      socket.emit("errorMessage", result.message);
      return;
    }

    socket.emit("actionAcknowledged", result.message);

    if (allNightActionsSubmitted(room)) {
      const resolution = resolveNight(room);

      emitRoomUpdate(room.roomCode);
      emitAlivePlayers(room);

      if (!resolution.gameOver) {
        io.to(room.roomCode).emit("phaseChanged", {
          phase: room.phase,
          dayCount: room.dayCount
        });
      } else {
        io.to(room.roomCode).emit("gameOver", {
          winner: resolution.winner
        });
      }
    }
  });

  socket.on("submitDayVote", ({ targetSocketId }) => {
    const found = findPlayer(socket.id);
    if (!found) return;

    const { room, player } = found;

    const result = submitDayVote(room, player.socketId, targetSocketId);
    if (!result.ok) {
      socket.emit("errorMessage", result.message);
      return;
    }

    socket.emit("actionAcknowledged", result.message);

    if (allDayVotesSubmitted(room)) {
      const resolution = resolveDayVote(room);

      emitRoomUpdate(room.roomCode);
      emitAlivePlayers(room);

      if (!resolution.gameOver) {
        io.to(room.roomCode).emit("phaseChanged", {
          phase: room.phase,
          dayCount: room.dayCount
        });
      } else {
        io.to(room.roomCode).emit("gameOver", {
          winner: resolution.winner
        });
      }
    }
  });

  socket.on("disconnect", () => {
    const result = removePlayer(socket.id);
    if (!result) return;

    const { room } = result;
    if (!room) return;

    emitRoomUpdate(room.roomCode);

    if (room.gameStarted && room.phase !== PHASES.ENDED) {
        emitAlivePlayers(room);

        const winCheck = checkWinCondition(room);

        if (winCheck.gameOver) {
        io.to(room.roomCode).emit("gameOver", {
            winner: winCheck.winner
        });
        } else {
        io.to(room.roomCode).emit("phaseChanged", {
            phase: room.phase,
            dayCount: room.dayCount
        });
        }
    }
    });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});