/**
 * Factory de données par défaut pour les items du système Etername.
 *
 * Responsabilités :
 * - créer les données initiales des items avec presets : armes, armures, boucliers ;
 * - créer les données initiales des métiers ;
 * - créer les données initiales des techniques ;
 * - créer les données initiales des héritages passifs ou techniques ;
 * - créer les données initiales des invocations ;
 * - centraliser les valeurs par défaut afin d’éviter la duplication dans les fiches ou services.
 *
 * Ce fichier ne doit pas créer directement de documents Foundry.
 * Il doit seulement produire des objets de données prêts à être utilisés par Item.create,
 * createEmbeddedDocuments ou des formulaires.
 */

import { applyItemPreset } from "./item-preset-service.js";
import { getDefaultBaseForItemType, getItemPresetConfig } from "./preset-registry.js";
import { TECHNIQUE_POWER_THRESHOLDS } from "../techniques/stat-definitions.js";
import { normalizeHeritageFeatureType, normalizeHeritageType } from "../constants/heritages.js";
import {
  INVOCATION_ATTRIBUTE_KEYS,
  INVOCATION_THRESHOLD_KEYS
} from "../techniques/invocation-definitions.js";

export { buildPresetUpdatePayload } from "./item-preset-service.js";

const DEFAULT_IMAGES = Object.freeze({
  profession: "icons/svg/book.svg",
  technique: "icons/svg/explosion.svg",
  heritagePassive: "icons/svg/book.svg",
  heritageTechnique: "icons/svg/explosion.svg",
  invocation: "icons/svg/mystery-man.svg"
});

/**
 * Crée les données par défaut d’un item utilisant un preset.
 *
 * Cette fonction concerne principalement :
 * - les armes ;
 * - les armures ;
 * - les boucliers.
 *
 * Elle récupère le preset par défaut du type d’item, puis applique ce preset
 * pour obtenir des données système complètes et localisées.
 *
 * @param {string} type - Type d’item utilisant un preset.
 * @returns {object|null} Données d’item prêtes à créer, ou `null` si le type n’a pas de preset.
 */
export function createDefaultPresetItemData(type) {
  const config = getItemPresetConfig(type);

  if (!config) return null;

  const itemData = {
    name: game.i18n.localize(config.defaultNameKey),
    type,
    img: config.defaultImage,
    system: {}
  };

  const baseName = getDefaultBaseForItemType(type);

  return applyItemPreset(type, itemData, baseName);
}

/**
 * Crée les données par défaut d’un métier.
 *
 * Un métier contient les sections utilisées par le builder :
 * - passifs ;
 * - clés ;
 * - conditions ;
 * - mécaniques ;
 * - états.
 *
 * @returns {object} Données d’item métier.
 */
export function createDefaultProfessionItemData() {
  return {
    name: game.i18n.localize("ETERN.ITEM.DEFAULT_PROFESSION_NAME"),
    type: "profession",
    img: DEFAULT_IMAGES.profession,
    system: {
      description: "",
      prepared: false,
      passives: [],
      keys: [],
      conditions: [],
      mechanics: [],
      states: []
    }
  };
}

/**
 * Construit les données système par défaut d’une technique.
 *
 * Ces données sont aussi réutilisées par les héritages techniques,
 * afin qu’ils aient les mêmes fonctionnalités de création que les techniques classiques.
 *
 * Les ids de métiers sources sont normalisés, dédupliqués et limités à 2.
 *
 * @param {string[]} [professionIds=[]] - Métiers sources pré-sélectionnés.
 * @returns {object} Données système par défaut d’une technique.
 */
export function buildTechniqueSystemDefaults(professionIds = []) {
  return {
    description: "",
    prepared: false,
    usageType: "attack",
    linkedAttributeKey: "magic",
    professionIds: normalizeIdList(professionIds).slice(0, 2),
    keys: [],
    conditions: [],
    mechanics: [],
    states: [],
    statistics: [],
    mainStatisticId: "",
    power: 0,
    powerEnhancements: buildDefaultTechniquePowerEnhancements()
  };
}

/**
 * Crée les données par défaut d’une technique classique.
 *
 * @param {string[]} [professionIds=[]] - Métiers sources pré-sélectionnés.
 * @returns {object} Données d’item technique.
 */
export function createDefaultTechniqueItemData(professionIds = []) {
  return {
    name: game.i18n.localize("ETERN.ITEM.DEFAULT_TECHNIQUE_NAME"),
    type: "technique",
    img: DEFAULT_IMAGES.technique,
    system: buildTechniqueSystemDefaults(professionIds)
  };
}

/**
 * Crée les données par défaut d’un héritage.
 *
 * Un héritage peut être :
 * - ancestral ou culturel ;
 * - passif ou technique.
 *
 * Pour un héritage passif, une première entrée passive est créée automatiquement.
 * Pour un héritage technique, les données de technique sont initialisées afin de réutiliser
 * le même builder que les techniques classiques.
 *
 * @param {string} [heritageType="ancestral"] - Type d’héritage : ancestral ou cultural.
 * @param {string} [featureType="passive"] - Forme de l’héritage : passive ou technique.
 * @returns {object} Données d’item héritage.
 */
export function createDefaultHeritageItemData(
  heritageType = "ancestral",
  featureType = "passive"
) {
  const normalizedType = normalizeHeritageType(heritageType);
  const normalizedFeature = normalizeHeritageFeatureType(featureType);
  const defaultNameKey = getDefaultHeritageNameKey(normalizedType, normalizedFeature);
  const defaultName = game.i18n.localize(defaultNameKey);
  const isTechnique = normalizedFeature === "technique";

  return {
    name: defaultName,
    type: "heritage",
    img: isTechnique ? DEFAULT_IMAGES.heritageTechnique : DEFAULT_IMAGES.heritagePassive,
    system: {
      ...buildTechniqueSystemDefaults([]),
      heritageType: normalizedType,
      featureType: normalizedFeature,
      active: false,
      prepared: false,
      passives: isTechnique ? [] : [buildDefaultHeritagePassiveEntry(defaultName)]
    }
  };
}

/**
 * Crée les données par défaut d’une invocation.
 *
 * L’invocation peut être liée à une technique source.
 * Les attributs et seuils sont générés depuis les constantes d’invocation afin
 * d’éviter de dupliquer les clés dans plusieurs fichiers.
 *
 * @param {string} [techniqueId=""] - Technique liée à l’invocation.
 * @returns {object} Données d’item invocation.
 */
export function createDefaultInvocationItemData(techniqueId = "") {
  return {
    name: game.i18n.localize("ETERN.ITEM.DEFAULT_INVOCATION_NAME"),
    type: "invocation",
    img: DEFAULT_IMAGES.invocation,
    system: {
      description: "",
      techniqueId: String(techniqueId ?? "").trim(),
      actorId: "",
      size: "medium",
      baseCreationXp: 0,
      attributes: buildDefaultInvocationAttributes(),
      powerBoons: [],
      thresholds: buildDefaultInvocationThresholds(),
      notes: ""
    }
  };
}

/**
 * Crée les améliorations de puissance par défaut d’une technique.
 *
 * Les seuils viennent du référentiel des techniques.
 *
 * @returns {{threshold: number, statisticId: string}[]} Améliorations vides par seuil.
 */
function buildDefaultTechniquePowerEnhancements() {
  return TECHNIQUE_POWER_THRESHOLDS.map((threshold) => ({
    threshold,
    statisticId: ""
  }));
}

/**
 * Crée une entrée passive par défaut pour un héritage passif.
 *
 * La structure est alignée avec les entrées de passifs utilisées par le builder de métier :
 * slots statistiques, statistiques embarquées, bonus acteur, piste de progression,
 * récompenses et compteur.
 *
 * @param {string} [name=""] - Nom initial de l’entrée passive.
 * @returns {object} Entrée passive par défaut.
 */
function buildDefaultHeritagePassiveEntry(name = "") {
  return {
    id: foundry.utils.randomID(),
    name: String(name ?? ""),
    description: "",
    xpCost: 0,
    referenceKey: "",
    stateId: "",
    extraStatisticSlots: 0,
    isQuickAccess: false,
    isActive: true,

    hasStatisticSlots: false,
    statisticSlots: [],

    hasStatistics: false,
    statistics: [],

    counter: {
      enabled: false,
      label: "",
      current: 0,
      max: 0,
      resetNote: ""
    },

    hasImprovements: false,
    improvements: [],

    hasActorBonuses: false,
    actorBonuses: [],

    hasProgressTrack: false,
    progressTrack: {
      enabled: false,
      label: "",
      current: 0,
      testAttributeKey: "",
      notes: "",
      objectivesText: "",
      boxes: [],
      thresholds: []
    },

    hasProgressRewards: false,
    progressRewards: []
  };
}

/**
 * Construit la clé i18n du nom par défaut d’un héritage.
 *
 * @param {"ancestral"|"cultural"} heritageType - Type d’héritage normalisé.
 * @param {"passive"|"technique"} featureType - Forme d’héritage normalisée.
 * @returns {string} Clé i18n du nom par défaut.
 */
function getDefaultHeritageNameKey(heritageType, featureType) {
  const origin = heritageType === "cultural" ? "CULTURAL" : "ANCESTRAL";
  const form = featureType === "technique" ? "TECHNIQUE" : "PASSIVE";

  return `ETERN.ITEM.DEFAULT_${origin}_${form}_HERITAGE_NAME`;
}

/**
 * Crée les attributs par défaut d’une invocation.
 *
 * Toutes les valeurs commencent à 0.
 *
 * @returns {Record<string, number>} Attributs d’invocation par défaut.
 */
function buildDefaultInvocationAttributes() {
  return Object.fromEntries(
    INVOCATION_ATTRIBUTE_KEYS.map((key) => [key, 0])
  );
}

/**
 * Crée les seuils par défaut d’une invocation.
 *
 * Chaque seuil contient :
 * - une technique liée vide ;
 * - des notes vides.
 *
 * @returns {Record<string, {techniqueId: string, notes: string}>} Seuils d’invocation.
 */
function buildDefaultInvocationThresholds() {
  return Object.fromEntries(
    INVOCATION_THRESHOLD_KEYS.map((key) => [
      key,
      {
        techniqueId: "",
        notes: ""
      }
    ])
  );
}

/**
 * Normalise une liste d’identifiants.
 *
 * La fonction :
 * - convertit chaque valeur en chaîne ;
 * - retire les espaces ;
 * - supprime les valeurs vides ;
 * - supprime les doublons.
 *
 * @param {unknown} values - Liste brute.
 * @returns {string[]} Identifiants uniques.
 */
function normalizeIdList(values) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
  ));
}