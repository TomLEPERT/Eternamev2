/**
 * Résolution du personnage qui commerce avec un marchand.
 *
 * Responsabilités :
 * - retrouver un personnage joueur possédé par l'utilisateur courant ;
 * - prioriser le personnage choisi dans la fiche marchand ;
 * - éviter que l'acteur marchand soit confondu avec l'acheteur/vendeur.
 *
 * Ce fichier ne réalise aucune transaction : il ne fait que résoudre l'acteur source.
 */

function isCharacterActor(actor) {
  return actor?.type === "character";
}

export function isOwnedTradeActor(actor, user = game.user) {
  if (!isCharacterActor(actor)) return false;
  if (actor.isOwner) return true;
  return Boolean(actor.testUserPermission?.(user, "OWNER"));
}

export function getOwnedTradeActors(user = game.user) {
  return game.actors
    .filter((actor) => isOwnedTradeActor(actor, user))
    .sort((left, right) => String(left.name ?? "").localeCompare(String(right.name ?? ""), game.i18n.lang, { sensitivity: "base" }));
}

function getAssignedTradeActor(user = game.user) {
  const actor = user?.character ?? null;
  return isOwnedTradeActor(actor, user) ? actor : null;
}

function getControlledTradeActor(user = game.user) {
  const token = canvas?.tokens?.controlled?.find((candidate) => isOwnedTradeActor(candidate.actor, user));
  return token?.actor ?? null;
}

function getSelectedTradeActor(actorId, user = game.user) {
  const actor = game.actors.get(String(actorId ?? "")) ?? null;
  return isOwnedTradeActor(actor, user) ? actor : null;
}

export function resolveTradeActor({ actorId = "", user = game.user } = {}) {
  const selected = getSelectedTradeActor(actorId, user);
  if (selected) return selected;

  const assigned = getAssignedTradeActor(user);
  if (assigned) return assigned;

  const controlled = getControlledTradeActor(user);
  if (controlled) return controlled;

  const ownedActors = getOwnedTradeActors(user);
  return ownedActors.length === 1 ? ownedActors[0] : null;
}

export function resolveTradeActorFromItem(item, user = game.user) {
  const parent = item?.parent ?? null;
  return isOwnedTradeActor(parent, user) ? parent : null;
}
