/**
 * Règle pure de donnée dérivée : Defense.
 *
 * Responsabilités :
 * - calculer une valeur de jeu à partir des données source ;
 * - éviter toute écriture directe dans les documents Foundry ;
 * - rester réutilisable par les fiches, jets et préparateurs de données.
 *
 * Ce fichier ne doit pas contenir de rendu ni de persistance.
 */

import { normalizeArmorCategory } from "../../system/nomenclature.js";
export function deriveExplorationPassive(attributes) {
  const reasoning = Number(attributes?.reasoning?.value ?? 0);
  const perception = Number(attributes?.perception?.value ?? 0);

  const rai = Number.isFinite(reasoning) ? Math.floor(reasoning / 2) : 0;
  const per = Number.isFinite(perception) ? Math.floor(perception / 2) : 0;
  return rai + per;
}

export function deriveDefense(attributes, defense = {}) {
  const agility = Number(attributes?.agility?.value ?? 0);
  const agilityBase = Number.isFinite(agility) ? 1 + Math.floor(agility / 2) : 1;

  const armor = Number(defense?.armor ?? 0);
  const shield = Number(defense?.shield ?? 0);
  const bonus = Number(defense?.bonus ?? 0);

  const safeArmor = Number.isFinite(armor) ? Math.max(0, Math.floor(armor)) : 0;
  const safeShield = Number.isFinite(shield) ? Math.max(0, Math.floor(shield)) : 0;
  const safeBonus = Number.isFinite(bonus) ? Math.floor(bonus) : 0;

  const base = safeArmor > 0 ? safeArmor : agilityBase;
  const total = base + safeShield + safeBonus;

  return {
    base,
    armor: safeArmor,
    shield: safeShield,
    bonus: safeBonus,
    total
  };
}

export function deriveArmorTraining(training = {}, equippedArmor = null) {
  const light = Boolean(training?.light);
  const medium = Boolean(training?.medium);
  const heavy = Boolean(training?.heavy);

  const category = String(equippedArmor?.system?.category ?? equippedArmor?.system?.armorType ?? "");
  const armorType = ["natural", "light", "medium", "heavy"].includes(normalizeArmorCategory(category, "")) ? normalizeArmorCategory(category, "") : null;
  const armorName = equippedArmor?.name ?? "";
  const trained = armorType ? Boolean(training?.[armorType]) : true;

  let agilityDisadvantage = false;
  let speedPenalty = 0;

  if (armorType === "medium") {
    if (!medium) {
      agilityDisadvantage = true;
      speedPenalty = 3;
    }
  } else if (armorType === "heavy") {
    speedPenalty = 3;
    if (!heavy) agilityDisadvantage = true;
  }

  return {
    light,
    medium,
    heavy,
    equippedArmorType: armorType,
    equippedArmorName: armorName,
    trained,
    agilityDisadvantage,
    speedPenalty
  };
}
