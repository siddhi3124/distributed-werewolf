console.log("app.js loaded");

const socket = io();

let currentRoomCode = null;
let myRole = null;
let currentPhase = "lobby";
let alivePlayers = [];

const nameInput = document.getElementById("nameInput");
const roomInput = document.getElementById("roomInput");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const startBtn = document.getElementById("startBtn");
const nightActionBtn = document.getElementById("nightActionBtn");
const dayVoteBtn = document.getElementById("dayVoteBtn");

const joinSection = document.getElementById("joinSection");
const roomSection = document.getElementById("roomSection");

const roomCodeText = document.getElementById("roomCodeText");
const phaseText = document.getElementById("phaseText");
const roleText = document.getElementById("roleText");
const winnerText = document.getElementById("winnerText");
const playerList = document.getElementById("playerList");
const alivePlayersList = document.getElementById("alivePlayersList");
const logsBox = document.getElementById("logsBox");
const targetSelect = document.getElementById("targetSelect");
const privateBox = document.getElementById("privateBox");
const myNameText = document.getElementById("myNameText");

function checkElements() {
  const elements = {
    nameInput,
    roomInput,
    createBtn,
    joinBtn,
    startBtn,
    nightActionBtn,
    dayVoteBtn,
    joinSection,
    roomSection,
    roomCodeText,
    phaseText,
    roleText,
    winnerText,
    playerList,
    alivePlayersList,
    logsBox,
    targetSelect,
    privateBox
  };

  Object.entries(elements).forEach(([name, element]) => {
    if (!element) {
      console.error(`Missing HTML element: ${name}`);
    }
  });
}

checkElements();

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
  alert("Socket connection failed. Check if server is running.");
});

createBtn.addEventListener("click", () => {
  console.log("Create button clicked");

  const name = nameInput.value.trim();

  if (!name) {
    alert("Please enter your name");
    return;
  }

  socket.emit("createRoom", { name });
});

joinBtn.addEventListener("click", () => {
  console.log("Join button clicked");

  const name = nameInput.value.trim();
  const roomCode = roomInput.value.trim().toUpperCase();

  if (!name || !roomCode) {
    alert("Please enter name and room code");
    return;
  }

  socket.emit("joinRoom", { name, roomCode });
});

startBtn.addEventListener("click", () => {
  if (!currentRoomCode) return;
  socket.emit("startGame", { roomCode: currentRoomCode });
});

nightActionBtn.addEventListener("click", () => {
  const targetSocketId = targetSelect.value;

  if (!targetSocketId) {
    alert("Select a target");
    return;
  }

  socket.emit("submitNightAction", { targetSocketId });
});

dayVoteBtn.addEventListener("click", () => {
  const targetSocketId = targetSelect.value;

  if (!targetSocketId) {
    alert("Select a target");
    return;
  }

  socket.emit("submitDayVote", { targetSocketId });
});

socket.on("joinedRoom", ({ roomCode }) => {
  console.log("Joined room:", roomCode);

  currentRoomCode = roomCode;
  roomCodeText.textContent = roomCode;
  myNameText.textContent = nameInput.value.trim();

  joinSection.classList.add("hidden");
  roomSection.classList.remove("hidden");
});

socket.on("roomUpdated", (room) => {
  console.log("Room updated:", room);

  currentPhase = room.phase;
  phaseText.textContent = room.phase;
  winnerText.textContent = room.winner || "-";

  playerList.innerHTML = "";

  room.players.forEach((player) => {
    const li = document.createElement("li");

    const isHost = player.socketId === room.hostId;

    li.textContent =
      `${player.name}` +
      `${isHost ? " • Host" : ""}` +
      `${player.alive ? "" : " • Dead"}` +
      `${player.connected ? "" : " • Disconnected"}`;

    playerList.appendChild(li);
  });

  logsBox.innerHTML = "";

  if (room.logs && room.logs.length > 0) {
    room.logs.forEach((log) => {
      const p = document.createElement("p");
      p.textContent = log;
      logsBox.appendChild(p);
    });
  }

  updateActionButtons();
});

socket.on("roleAssigned", ({ role }) => {
  myRole = role;
  roleText.textContent = role;
  updateActionButtons();
});

socket.on("alivePlayers", (players) => {
  alivePlayers = players;

  alivePlayersList.innerHTML = "";
  targetSelect.innerHTML = `<option value="">Select target</option>`;

  players.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player.name;
    alivePlayersList.appendChild(li);

    const option = document.createElement("option");
    option.value = player.socketId;
    option.textContent = player.name;
    targetSelect.appendChild(option);
  });
});

socket.on("phaseChanged", ({ phase, dayCount }) => {
  currentPhase = phase;
  phaseText.textContent = `${phase} (${dayCount})`;
  privateBox.textContent = "Private updates will appear here.";
  updateActionButtons();
});

socket.on("actionAcknowledged", (msg) => {
  privateBox.textContent = msg;
});

socket.on("gameOver", ({ winner }) => {
  winnerText.textContent = winner;
  phaseText.textContent = "ended";
  currentPhase = "ended";
  updateActionButtons();
});

socket.on("errorMessage", (msg) => {
  alert(msg);
});

function updateActionButtons() {
  startBtn.style.display = "none";
  nightActionBtn.style.display = "none";
  dayVoteBtn.style.display = "none";

  if (currentPhase === "lobby") {
    startBtn.style.display = "block";
    return;
  }

  if (currentPhase === "night") {
    if (["mafia", "doctor"].includes(myRole)) {
      nightActionBtn.style.display = "inline-block";
    }
    return;
  }

  if (currentPhase === "day") {
    dayVoteBtn.style.display = "inline-block";
  }
}

updateActionButtons();