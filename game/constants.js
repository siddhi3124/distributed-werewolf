const ROLES = {
  MAFIA: "mafia",
  DOCTOR: "doctor",
  DETECTIVE: "detective",
  VILLAGER: "villager"
};

const PHASES = {
  LOBBY: "lobby",
  NIGHT: "night",
  DAY: "day",
  ENDED: "ended"
};

const MIN_PLAYERS = 5;

function getRoleDistribution(playerCount) {
  if (playerCount < 5) {
    throw new Error("Not enough players");
  }

  if (playerCount === 5) {
    return [
      ROLES.MAFIA,
      ROLES.DOCTOR,
      ROLES.DETECTIVE,
      ROLES.VILLAGER,
      ROLES.VILLAGER
    ];
  }

  if (playerCount === 6) {
    return [
      ROLES.MAFIA,
      ROLES.MAFIA,
      ROLES.DOCTOR,
      ROLES.DETECTIVE,
      ROLES.VILLAGER,
      ROLES.VILLAGER
    ];
  }

  if (playerCount === 7) {
    return [
      ROLES.MAFIA,
      ROLES.MAFIA,
      ROLES.DOCTOR,
      ROLES.DETECTIVE,
      ROLES.VILLAGER,
      ROLES.VILLAGER,
      ROLES.VILLAGER
    ];
  }

  return [
    ROLES.MAFIA,
    ROLES.MAFIA,
    ROLES.DOCTOR,
    ROLES.DETECTIVE,
    ...Array(playerCount - 4).fill(ROLES.VILLAGER)
  ];
}

module.exports = {
  ROLES,
  PHASES,
  MIN_PLAYERS,
  getRoleDistribution
};