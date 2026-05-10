/**
 * Règle pure de donnée dérivée : Combat.
 *
 * Responsabilités :
 * - calculer une valeur de jeu à partir des données source ;
 * - éviter toute écriture directe dans les documents Foundry ;
 * - rester réutilisable par les fiches, jets et préparateurs de données.
 *
 * Ce fichier ne doit pas contenir de rendu ni de persistance.
 */

export function deriveInitiative(attributes) {
  const agility = Number(attributes?.agility?.value ?? 0);
  const instinct = Number(attributes?.instinct?.value ?? 0);
  return safeFloor(agility) + safeFloor(instinct);
}

export function deriveAttackBases(attributes = {}) {
  return {
    prc: safeHalf(attributes?.strength?.value),
    prd: safeHalf(attributes?.hability?.value),
    prm: safeHalf(attributes?.magic?.value)
  };
}

function safeFloor(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

function safeHalf(value) {
  return Math.max(0, safeFloor(Number(value ?? 0) / 2));
}
