/**
 * Règle pure de donnée dérivée : Movement.
 *
 * Responsabilités :
 * - calculer une valeur de jeu à partir des données source ;
 * - éviter toute écriture directe dans les documents Foundry ;
 * - rester réutilisable par les fiches, jets et préparateurs de données.
 *
 * Ce fichier ne doit pas contenir de rendu ni de persistance.
 */

const WALK_MODE_ID = "walk";

export function sizeToWalkSpeed(size) {
  switch (String(size ?? "")) {
    case "very_small":
    case "very-small":
    case "tiny":
      return 9;
    case "small":
      return 12;
    case "medium":
      return 12;
    case "large":
      return 15;
    case "very_large":
    case "very-large":
    case "colossal":
    case "colossale":
    case "huge":
      return 18;
    default:
      return 12;
  }
}

export function normalizeMovementModes(modes = []) {
  const source = Array.isArray(modes) ? modes : [];
  return source
    .map((entry) => {
      const id = String(entry?.id ?? foundry.utils.randomID());
      const name = String(entry?.name ?? "");
      let value = Number(entry?.value ?? 0);
      if (!Number.isFinite(value)) value = 0;
      value = Math.max(0, Math.floor(value));

      return {
        id,
        name,
        value,
        auto: Boolean(entry?.auto)
      };
    })
    .filter((entry) => entry.id !== WALK_MODE_ID);
}

function resolveArmorType(equippedArmor = null) {
  const raw = String(equippedArmor?.system?.armorType ?? equippedArmor?.system?.category ?? "").trim().toLowerCase();
  if (["medium", "intermediaire", "intermédiaire"].includes(raw)) return "medium";
  if (["heavy", "lourde"].includes(raw)) return "heavy";
  if (["light", "legere", "légère", "naturelle", "natural"].includes(raw)) return "light";
  return "";
}

export function deriveMovement(identity = {}, armorTraining = {}, equippedArmor = null, movement = {}) {
  const baseWalk = sizeToWalkSpeed(identity?.size);
  const armorType = resolveArmorType(equippedArmor);

  let armorPenalty = 0;
  if (armorType === "medium" && !Boolean(armorTraining?.medium)) armorPenalty = 3;
  if (armorType === "heavy") armorPenalty = 3;

  const walk = Math.max(0, baseWalk - armorPenalty);

  const walkMode = {
    id: WALK_MODE_ID,
    name: game.i18n?.localize?.("ETERN.MOVEMENT.WALK") ?? "Walk",
    value: walk,
    auto: true
  };

  return {
    base: walk,
    baseWalk,
    armorPenalty,
    modes: [walkMode, ...normalizeMovementModes(movement?.modes)]
  };
}
