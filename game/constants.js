const ROLES = {
  MAFIA: "mafia",
  DOCTOR: "doctor",
  VILLAGER: "villager"
};

const PHASES = {
  LOBBY: "lobby",
  NIGHT: "night",
  DAY: "day",
  ENDED: "ended"
};

const MIN_PLAYERS = 4;

function getRoleDistribution(playerCount) {
  if (playerCount < 4) {
    throw new Error("Not enough players");
  }

  if (playerCount === 4) {
    return [
      ROLES.MAFIA,
      ROLES.DOCTOR,
      ROLES.VILLAGER,
      ROLES.VILLAGER
    ];
  }

  if (playerCount === 5) {
    return [
      ROLES.MAFIA,
      ROLES.DOCTOR,
      ROLES.VILLAGER,
      ROLES.VILLAGER,
      ROLES.VILLAGER
    ];
  }

  if (playerCount === 6) {
    return [
      ROLES.MAFIA,
      ROLES.MAFIA,
      ROLES.DOCTOR,
      ROLES.VILLAGER,
      ROLES.VILLAGER,
      ROLES.VILLAGER
    ];
  }

  return [
    ROLES.MAFIA,
    ROLES.MAFIA,
    ROLES.DOCTOR,
    ...Array(playerCount - 3).fill(ROLES.VILLAGER)
  ];
}

module.exports = {
  ROLES,
  PHASES,
  MIN_PLAYERS,
  getRoleDistribution
};