/**
 * Préparation des données dérivées des équipements.
 *
 * Responsabilités :
 * - préparer les armes, armures, boucliers et items enchantables génériques ;
 * - résoudre les presets d’équipement depuis leur base ;
 * - normaliser les champs d’équipement : équipé, catégorie, base, poids ;
 * - appliquer les noms, descriptions et compétences localisées des presets ;
 * - préparer les données d’enchantement ;
 * - construire les labels dérivés utiles à l’interface.
 *
 * Ce fichier doit rester dédié à la préparation dérivée des équipements.
 * Il ne doit pas gérer les jets, les événements de fiche, la création d’items
 * ou l’application directe des bonus sur les acteurs.
 */

import {
  buildLocalizedArmorSkill,
  buildLocalizedShieldSkill,
  buildLocalizedWeaponSkills,
  getResolvedItemPreset,
  shouldReplacePresetText
} from "../item-preset-service.js";
import { getDefaultBaseForItemType } from "../preset-registry.js";
import {
  localizePresetDescription,
  localizePresetName
} from "../../i18n/preset-localization.js";
import {
  normalizeDamageType,
  normalizeRange
} from "../../nomenclature.js";
import {
  normalizeItemSaveMap,
  prepareEnchantingData,
  shouldUsePresetName
} from "./shared-derived.js";

/**
 * Prépare un item générique enchantable.
 *
 * Utilisé pour les types simples comme `gear`, `object` ou `tool`,
 * qui n’ont pas de logique de preset spécialisée mais peuvent porter
 * des enchantements.
 *
 * @param {Item} item - Item à préparer.
 * @param {object} system - Données système mutables de l’item.
 * @returns {void}
 */
export function prepareGenericEnchantableItemData(item, system) {
  prepareEnchantingData(item, system);
}

/**
 * Prépare les données dérivées d’une armure.
 *
 * La fonction :
 * - résout le preset d’armure ;
 * - normalise la catégorie, la base, le poids et l’état équipé ;
 * - applique la formule de défense et les sauvegardes ;
 * - prépare la compétence d’armure localisée ;
 * - applique le nom et la description de preset si l’item n’est pas personnalisé ;
 * - prépare les enchantements ;
 * - construit le label de défense affichable.
 *
 * @param {Item} item - Item armure.
 * @param {object} system - Données système mutables de l’armure.
 * @returns {void}
 */
export function prepareArmorData(item, system) {
  const source = getSourceSystem(item);
  const resolved = resolveEquipmentPreset("armor", source, system);
  const preset = resolved?.preset ?? null;
  const config = resolved?.config ?? null;

  applyBaseEquipmentFields(system, source, resolved, {
    defaultCategory: "light",
    defaultWeight: 1
  });

  system.defFormula = String(
    source.defFormula
    ?? preset?.defFormula
    ?? system.defFormula
    ?? "2 + AGI/2"
  );

  system.defBonus = toFiniteNumber(
    source.defBonus ?? source.defense ?? system.defBonus,
    0
  );

  system.saves = normalizeItemSaveMap(source.saves, preset?.saves ?? []);

  const localizedArmorSkill = buildLocalizedArmorSkill(system.category);
  system.skill = {
    name: firstNonEmpty(
      source.skill?.name,
      system.skill?.name,
      localizedArmorSkill.name
    ),
    description: firstNonEmpty(
      source.skill?.description,
      system.skill?.description,
      localizedArmorSkill.description
    )
  };

  applyPresetNameIfNeeded(item, "armor", system.base);
  applyDescriptionIfEmpty(system, "armor", system.base, preset?.description ?? "");

  prepareEnchantingData(item, system);

  system.derived ??= {};
  system.derived.defLabel = buildArmorDefenseLabel(system.defFormula, system.defBonus);
}

/**
 * Prépare les données dérivées d’un bouclier.
 *
 * La fonction :
 * - résout le preset de bouclier ;
 * - normalise la catégorie, la base, le poids et l’état équipé ;
 * - applique le bonus de défense ;
 * - normalise les sauvegardes ;
 * - prépare la compétence localisée du bouclier ;
 * - applique le nom et la description de preset si nécessaire ;
 * - prépare les enchantements ;
 * - construit le label de défense affichable.
 *
 * @param {Item} item - Item bouclier.
 * @param {object} system - Données système mutables du bouclier.
 * @returns {void}
 */
export function prepareShieldData(item, system) {
  const source = getSourceSystem(item);
  const resolved = resolveEquipmentPreset("shield", source, system);
  const preset = resolved?.preset ?? null;

  applyBaseEquipmentFields(system, source, resolved, {
    defaultCategory: "light",
    defaultWeight: 1
  });

  system.defBonus = toFiniteNumber(
    source.defBonus ?? source.defense ?? preset?.defBonus ?? system.defBonus,
    0
  );

  system.defense = system.defBonus;
  system.saves = normalizeItemSaveMap(source.saves, preset?.saves ?? []);

  const localizedShieldSkill = buildLocalizedShieldSkill(system.base, preset);
  system.skill = {
    name: firstNonEmpty(
      source.skill?.name,
      system.skill?.name,
      localizedShieldSkill.name
    ),
    description: firstNonEmpty(
      source.skill?.description,
      system.skill?.description,
      localizedShieldSkill.description
    )
  };

  applyPresetNameIfNeeded(item, "shield", system.base);
  applyDescriptionIfEmpty(system, "shield", system.base, preset?.description ?? "");

  prepareEnchantingData(item, system);

  system.derived ??= {};
  system.derived.defLabel = buildSignedNumberLabel(system.defBonus);
}

/**
 * Prépare les données dérivées d’une arme.
 *
 * La fonction :
 * - résout le preset d’arme ;
 * - normalise la catégorie, la base, le poids et l’état équipé ;
 * - normalise portée, dégâts, type de dégâts et précision ;
 * - applique les tags et compétences localisées ;
 * - applique le nom et la description de preset si l’item n’est pas personnalisé ;
 * - prépare les enchantements ;
 * - construit le label de précision affichable.
 *
 * @param {Item} item - Item arme.
 * @param {object} system - Données système mutables de l’arme.
 * @returns {void}
 */
export function prepareWeaponData(item, system) {
  const source = getSourceSystem(item);
  const resolved = resolveEquipmentPreset("weapon", source, system);
  const preset = resolved?.preset ?? null;

  applyBaseEquipmentFields(system, source, resolved, {
    defaultCategory: "natural",
    defaultWeight: 1
  });

  system.range = normalizeRange(source.range ?? preset?.range ?? system.range ?? "melee");
  system.damage = String(source.damage ?? preset?.damage ?? system.damage ?? "1d6");
  system.damageType = normalizeDamageType(
    source.damageType ?? preset?.damageType ?? system.damageType ?? "bludgeoning"
  );
  system.precisionBase = String(
    source.precisionBase ?? preset?.precisionBase ?? system.precisionBase ?? "PRC"
  ).toUpperCase();
  system.precisionBonus = toFiniteNumber(
    source.precisionBonus ?? preset?.precisionBonus ?? system.precisionBonus,
    0
  );

  system.tags = Array.isArray(source.tags)
    ? source.tags
    : Array.from(preset?.tags ?? system.tags ?? []);

  system.skills = buildLocalizedWeaponSkills(
    system.base,
    source.skills ?? system.skills,
    preset?.skills ?? []
  );

  while (system.skills.length < 3) {
    system.skills.push({
      name: "",
      description: "",
      learned: false
    });
  }

  applyPresetNameIfNeeded(item, "weapon", system.base);

  if (shouldReplacePresetText(system.description, preset?.description)) {
    system.description = localizePresetDescription(
      "weapon",
      system.base,
      preset?.description ?? ""
    );
  }

  prepareEnchantingData(item, system);

  system.derived ??= {};
  system.derived.precisionTotal = buildPrecisionLabel(
    system.precisionBase,
    system.precisionBonus
  );
}

/**
 * Lit les données système brutes de l’item.
 *
 * Pendant la préparation dérivée, `_source.system` permet de récupérer
 * les valeurs réellement stockées avant normalisation.
 *
 * @param {Item} item - Item source.
 * @returns {object} Données système brutes.
 */
function getSourceSystem(item) {
  return item?._source?.system ?? {};
}

/**
 * Résout le preset d’un équipement.
 *
 * @param {string} itemType - Type d’équipement : armor, shield ou weapon.
 * @param {object} source - Données système brutes.
 * @param {object} system - Données système préparées.
 * @returns {object|null} Preset résolu.
 */
function resolveEquipmentPreset(itemType, source, system) {
  return getResolvedItemPreset(
    itemType,
    source.base ?? system.base ?? getDefaultBaseForItemType(itemType)
  );
}

/**
 * Applique les champs communs aux équipements.
 *
 * Champs concernés :
 * - équipé ;
 * - catégorie ;
 * - base ;
 * - poids.
 *
 * @param {object} system - Données système mutables.
 * @param {object} source - Données système brutes.
 * @param {object|null} resolved - Preset résolu.
 * @param {object} options - Options de fallback.
 * @param {string} options.defaultCategory - Catégorie par défaut.
 * @param {number} options.defaultWeight - Poids par défaut.
 * @returns {void}
 */
function applyBaseEquipmentFields(
  system,
  source,
  resolved,
  {
    defaultCategory,
    defaultWeight
  }
) {
  const preset = resolved?.preset ?? null;
  const config = resolved?.config ?? null;

  system.equipped = Boolean(source.equipped ?? system.equipped);
  system.category = config?.normalizeCategory?.(
    preset?.category ?? source.category ?? system.category ?? defaultCategory,
    defaultCategory
  ) ?? defaultCategory;
  system.base = String(resolved?.baseName ?? getDefaultBaseForItemType(resolved?.config?.type));
  system.weight = toFiniteNumber(
    source.weight ?? preset?.weight ?? system.weight,
    defaultWeight
  );
}

/**
 * Applique le nom localisé du preset si le nom actuel est encore un nom de preset.
 *
 * @param {Item} item - Item à renommer éventuellement.
 * @param {string} itemType - Type d’item.
 * @param {string} baseName - Base du preset.
 * @returns {void}
 */
function applyPresetNameIfNeeded(item, itemType, baseName) {
  if (shouldUsePresetName(itemType, item.name, baseName)) {
    item.name = localizePresetName(itemType, baseName, baseName);
  }
}

/**
 * Applique une description localisée de preset si la description actuelle est vide.
 *
 * @param {object} system - Données système.
 * @param {string} itemType - Type d’item.
 * @param {string} baseName - Base du preset.
 * @param {string} presetDescription - Description brute du preset.
 * @returns {void}
 */
function applyDescriptionIfEmpty(system, itemType, baseName, presetDescription) {
  if (!system.description) {
    system.description = localizePresetDescription(
      itemType,
      baseName,
      presetDescription
    );
  }
}

/**
 * Construit le label de défense d’une armure.
 *
 * @param {string} defFormula - Formule de défense.
 * @param {number} defBonus - Bonus fixe de défense.
 * @returns {string} Label de défense.
 */
function buildArmorDefenseLabel(defFormula, defBonus) {
  return `${defFormula}${defBonus ? ` ${buildSignedNumberLabel(defBonus)}` : ""}`;
}

/**
 * Construit le label de précision d’une arme.
 *
 * @param {string} precisionBase - Base de précision : PRC, PRD ou PRM.
 * @param {number} precisionBonus - Bonus de précision.
 * @returns {string} Label de précision.
 */
function buildPrecisionLabel(precisionBase, precisionBonus) {
  return `${precisionBase}${precisionBonus ? ` ${buildSignedNumberLabel(precisionBonus)}` : ""}`;
}

/**
 * Formate un nombre avec son signe.
 *
 * @param {number} value - Valeur numérique.
 * @returns {string} Valeur signée.
 */
function buildSignedNumberLabel(value) {
  const amount = toFiniteNumber(value, 0);

  return `${amount >= 0 ? "+" : ""}${amount}`;
}

/**
 * Retourne la première chaîne non vide.
 *
 * Utile pour éviter que `""` bloque un fallback localisé,
 * contrairement à l’opérateur `??`.
 *
 * @param {...unknown} values - Valeurs candidates.
 * @returns {string} Première chaîne non vide ou chaîne vide.
 */
function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
}

/**
 * Convertit une valeur en nombre fini.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur utilisée si l’entrée est invalide.
 * @returns {number} Nombre fini.
 */
function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}