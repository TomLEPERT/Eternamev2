/**
 * Règle pure d’équipement : Equipped items.
 *
 * Responsabilités :
 * - lire les items équipés et en déduire leurs effets ;
 * - isoler les calculs d’armure, de bouclier ou d’équipement ;
 * - fournir des helpers aux préparateurs de données acteur.
 *
 * Ce fichier doit rester indépendant des fiches ApplicationV2.
 */

import { buildEmptySaveBonusMap, toInt } from "../bonuses/bonus-tree.js";

export function parseArmorFormula(formula, attributes = {}) {
  const raw = String(formula ?? "").trim();
  if (!raw) return 0;

  const agility = Number(attributes?.agility?.value ?? 0);
  const agi = Number.isFinite(agility) ? agility : 0;
  const agiHalf = Math.floor(agi / 2);

  const normalized = raw
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/AGI\/2/g, String(agiHalf))
    .replace(/AGI/g, String(agi));

  if (!/^[0-9+\-*/().]+$/.test(normalized)) return 0;

  try {
    const result = Function(`"use strict"; return (${normalized});`)();
    const value = Number(result);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  } catch (_err) {
    return 0;
  }
}

function getEquippedItems(actor, itemType) {
  return actor.items.filter((item) => item.type === itemType && item.system?.equipped);
}


function getEquippedSaveBonuses(actor, itemType) {
  const bonuses = buildEmptySaveBonusMap();
  for (const item of getEquippedItems(actor, itemType)) {
    const source = item.system?.saves;
    if (Array.isArray(source)) {
      for (const row of source) {
        const key = String(row?.key ?? row?.type ?? "");
        if (!(key in bonuses)) continue;
        bonuses[key] += toInt(row?.value);
      }
      continue;
    }

    if (source && typeof source === "object") {
      for (const key of Object.keys(bonuses)) {
        bonuses[key] += toInt(source[key]);
      }
    }
  }
  return bonuses;
}

export function getArmorSaveBonuses(actor) {
  return getEquippedSaveBonuses(actor, "armor");
}

export function getShieldSaveBonuses(actor) {
  return getEquippedSaveBonuses(actor, "shield");
}

export function getEquippedArmorItem(actor, attributesOverride = null) {
  const equippedArmors = getEquippedItems(actor, "armor");
  const attributes = attributesOverride ?? actor.system?.derived?.attributes ?? actor.system?.attributes;

  return equippedArmors.reduce((best, item) => {
    const bestValue = best
      ? parseArmorFormula(best.system?.defFormula ?? best.system?.defense ?? 0, attributes) + toInt(best.system?.defBonus)
      : -1;
    const itemValue = parseArmorFormula(item.system?.defFormula ?? item.system?.defense ?? 0, attributes) + toInt(item.system?.defBonus);
    return itemValue > bestValue ? item : best;
  }, null);
}

export function getArmorDefenseValue(actor, attributesOverride = null) {
  const equippedArmors = getEquippedItems(actor, "armor");
  const attributes = attributesOverride ?? actor.system?.derived?.attributes ?? actor.system?.attributes;

  return equippedArmors.reduce((highest, item) => {
    const safe = parseArmorFormula(item.system?.defFormula ?? item.system?.defense ?? 0, attributes) + toInt(item.system?.defBonus);
    return Math.max(highest, Math.max(0, safe));
  }, 0);
}

export function getShieldDefenseValue(actor) {
  const equippedShields = getEquippedItems(actor, "shield");

  return equippedShields.reduce((total, item) => {
    const raw = Number(item.system?.defBonus ?? item.system?.defense ?? 0);
    const safe = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    return total + safe;
  }, 0);
}
