const socket = io();

let currentRoom = null;
let myRole = null;

const nameInput = document.getElementById("name");
const roomCodeInput = document.getElementById("roomCode");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const roomSection = document.getElementById("room-section");
const gameSection = document.getElementById("game-section");
const playerList = document.getElementById("playerList");
const roomCodeDisplay = document.getElementById("roomCodeDisplay");
const roleDisplay = document.getElementById("roleDisplay");
const phaseDisplay = document.getElementById("phaseDisplay");

createBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!name) return alert("Enter name");
  socket.emit("createRoom", { name });
};

joinBtn.onclick = () => {
  const name = nameInput.value.trim();
  const roomCode = roomCodeInput.value.trim().toUpperCase();
  if (!name || !roomCode) return alert("Enter name and room code");
  socket.emit("joinRoom", { name, roomCode });
};

socket.on("roomUpdated", (room) => {
  currentRoom = room;
  roomSection.style.display = "block";
  roomCodeDisplay.textContent = room.roomCode;

  playerList.innerHTML = "";
    room.players.forEach((player) => {
    const li = document.createElement("li");

    const isHost = player.socketId === room.hostId;
    li.textContent =
        `${player.name}` +
        `${isHost ? " (host)" : ""}` +
        `${player.alive ? "" : " (dead)"}` +
        `${player.connected ? "" : " (disconnected)"}`;

    playerList.appendChild(li);
    });
});

socket.on("roleAssigned", ({ role }) => {
  myRole = role;
  roleDisplay.textContent = role;
});

socket.on("gameStarted", (room) => {
  currentRoom = room;
  gameSection.style.display = "block";
  phaseDisplay.textContent = room.phase;
});

socket.on("errorMessage", (msg) => {
  alert(msg);
});

document.getElementById("startBtn").onclick = () => {
  if (!currentRoom) return;
  socket.emit("startGame", { roomCode: currentRoom.roomCode });
};