const { ROLES, PHASES, getRoleDistribution } = require("./constants");
const {
  shuffle,
  getAlivePlayers,
  countMafia,
  countVillagers,
  getAliveMafiaPlayers,
  findPlayerBySocketId,
  resetNightActions,
  resetDayVotes
} = require("./utils");

function assignRoles(room) {
  const roles = shuffle(getRoleDistribution(room.players.length));

  room.players.forEach((player, index) => {
    player.role = roles[index];
    player.alive = true;
    player.connected = true;
    player.ready = false;
    player.votedFor = null;
  });
}

function startGame(room) {
  assignRoles(room);
  room.gameStarted = true;
  room.phase = PHASES.NIGHT;
  room.dayCount = 1;
  room.logs = ["Game started.", "Night 1 begins."];
  room.winner = null;
  resetNightActions(room);
  resetDayVotes(room);
  return room;
}

function isPlayerAlive(room, socketId) {
  const player = findPlayerBySocketId(room, socketId);
  return !!player && player.alive;
}

function canPlayerAct(room, socketId) {
  const player = findPlayerBySocketId(room, socketId);
  return player && player.alive && room.phase !== PHASES.ENDED;
}

function submitNightAction(room, actorSocketId, targetSocketId) {
  if (room.phase !== PHASES.NIGHT) {
    return { ok: false, message: "Not night phase" };
  }

  const actor = findPlayerBySocketId(room, actorSocketId);
  const target = findPlayerBySocketId(room, targetSocketId);

  if (!actor || !target) {
    return { ok: false, message: "Invalid actor or target" };
  }

  if (!actor.alive) {
    return { ok: false, message: "Dead players cannot act" };
  }

  if (!target.alive) {
    return { ok: false, message: "Target is dead" };
  }

  if (actor.role === ROLES.MAFIA) {
    room.nightActions.mafiaVotes[actorSocketId] = targetSocketId;
    return { ok: true, message: "Mafia vote submitted" };
  }

  if (actor.role === ROLES.DOCTOR) {
    room.nightActions.doctorSave = targetSocketId;
    return { ok: true, message: "Doctor save submitted" };
  }

  if (actor.role === ROLES.DETECTIVE) {
    room.nightActions.detectiveInspect = targetSocketId;
    return { ok: true, message: "Detective inspection submitted" };
  }

  return { ok: false, message: "This role has no night action" };
}

function allNightActionsSubmitted(room) {
  const aliveMafia = getAliveMafiaPlayers(room);
  const mafiaVotesCount = Object.keys(room.nightActions.mafiaVotes).length;

  const doctorAlive = room.players.some((p) => p.alive && p.role === ROLES.DOCTOR);
  const detectiveAlive = room.players.some((p) => p.alive && p.role === ROLES.DETECTIVE);

  const mafiaDone = mafiaVotesCount >= aliveMafia.length;
  const doctorDone = !doctorAlive || !!room.nightActions.doctorSave;
  const detectiveDone = !detectiveAlive || !!room.nightActions.detectiveInspect;

  return mafiaDone && doctorDone && detectiveDone;
}

function getMajorityTarget(votesMap) {
  const counts = {};

  Object.values(votesMap).forEach((targetId) => {
    counts[targetId] = (counts[targetId] || 0) + 1;
  });

  let maxVotes = 0;
  let selectedTarget = null;
  let tie = false;

  for (const [targetId, voteCount] of Object.entries(counts)) {
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      selectedTarget = targetId;
      tie = false;
    } else if (voteCount === maxVotes) {
      tie = true;
    }
  }

  if (tie) return null;
  return selectedTarget;
}

function resolveNight(room) {
  if (room.phase !== PHASES.NIGHT) {
    return { ok: false, message: "Not night phase" };
  }

  const mafiaTargetId = getMajorityTarget(room.nightActions.mafiaVotes);
  const doctorSaveId = room.nightActions.doctorSave;
  const detectiveInspectId = room.nightActions.detectiveInspect;

  let killedPlayer = null;
  let detectiveResult = null;

  if (mafiaTargetId && mafiaTargetId !== doctorSaveId) {
    killedPlayer = findPlayerBySocketId(room, mafiaTargetId);
    if (killedPlayer) {
      killedPlayer.alive = false;
      room.logs.push(`${killedPlayer.name} was eliminated during the night.`);
    }
  } else {
    room.logs.push("No one was eliminated during the night.");
  }

  if (detectiveInspectId) {
    const inspected = findPlayerBySocketId(room, detectiveInspectId);
    if (inspected) {
      detectiveResult = {
        targetSocketId: inspected.socketId,
        targetName: inspected.name,
        role: inspected.role
      };
    }
  }

  const winCheck = checkWinCondition(room);
  if (!winCheck.gameOver) {
    room.phase = PHASES.DAY;
    room.logs.push(`Day ${room.dayCount} begins.`);
    resetDayVotes(room);
  }

  return {
    ok: true,
    killedPlayer,
    detectiveResult,
    gameOver: winCheck.gameOver,
    winner: room.winner || null
  };
}

function submitDayVote(room, voterSocketId, targetSocketId) {
  if (room.phase !== PHASES.DAY) {
    return { ok: false, message: "Not day phase" };
  }

  const voter = findPlayerBySocketId(room, voterSocketId);
  const target = findPlayerBySocketId(room, targetSocketId);

  if (!voter || !target) {
    return { ok: false, message: "Invalid voter or target" };
  }

  if (!voter.alive) {
    return { ok: false, message: "Dead players cannot vote" };
  }

  if (!target.alive) {
    return { ok: false, message: "Cannot vote for dead player" };
  }

  room.votes[voterSocketId] = targetSocketId;
  return { ok: true, message: "Vote submitted" };
}

function allDayVotesSubmitted(room) {
  const alivePlayers = getAlivePlayers(room);
  return Object.keys(room.votes).length >= alivePlayers.length;
}

function resolveDayVote(room) {
  if (room.phase !== PHASES.DAY) {
    return { ok: false, message: "Not day phase" };
  }

  const selectedTargetId = getMajorityTarget(room.votes);
  let eliminatedPlayer = null;

  if (selectedTargetId) {
    eliminatedPlayer = findPlayerBySocketId(room, selectedTargetId);
    if (eliminatedPlayer) {
      eliminatedPlayer.alive = false;
      room.logs.push(`${eliminatedPlayer.name} was voted out during the day.`);
    }
  } else {
    room.logs.push("Day voting ended in a tie. No one was eliminated.");
  }

  const winCheck = checkWinCondition(room);

  if (!winCheck.gameOver) {
    room.phase = PHASES.NIGHT;
    room.dayCount += 1;
    resetNightActions(room);
    room.logs.push(`Night ${room.dayCount} begins.`);
  }

  return {
    ok: true,
    eliminatedPlayer,
    gameOver: winCheck.gameOver,
    winner: room.winner || null
  };
}

function checkWinCondition(room) {
  if (!room.gameStarted || room.phase === PHASES.LOBBY) {
    return { gameOver: false, winner: null };
  }

  const mafiaCount = countMafia(room);
  const villagerCount = countVillagers(room);

  if (mafiaCount === 0) {
    room.phase = PHASES.ENDED;
    room.winner = "Villagers";
    room.logs.push("Villagers win the game.");
    return { gameOver: true, winner: room.winner };
  }

  if (mafiaCount >= villagerCount) {
    room.phase = PHASES.ENDED;
    room.winner = "Mafia";
    room.logs.push("Mafia win the game.");
    return { gameOver: true, winner: room.winner };
  }

  return { gameOver: false, winner: null };
}

module.exports = {
  assignRoles,
  startGame,
  canPlayerAct,
  isPlayerAlive,
  submitNightAction,
  allNightActionsSubmitted,
  resolveNight,
  submitDayVote,
  allDayVotesSubmitted,
  resolveDayVote,
  checkWinCondition
};