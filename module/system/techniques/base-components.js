/**
 * Définitions et helpers des composants de base des techniques.
 *
 * Responsabilités :
 * - déclarer les clés, conditions, mécaniques et états accessibles à toutes les techniques ;
 * - fournir les composants universels de base comme Réaction, Opposition, Recharge et Canalisation ;
 * - créer une entrée de composant prête à être ajoutée dans une technique ;
 * - construire les sections de sources affichées dans la fiche technique ;
 * - détecter si un composant de base est déjà présent dans une technique.
 *
 * Ce fichier doit rester un référentiel de composants universels.
 * Il ne doit pas contenir de logique de validation, de calcul XP global ou de rendu DOM.
 */

import { asArray } from '../../utils/arrays.js';
const SECTION_KEYS = Object.freeze([
  "keys",
  "conditions",
  "mechanics",
  "states"
]);

const BASE_COMPONENT_SOURCE_LABEL_KEY = "ETERN.TECHNIQUE.BASE_COMPONENTS.SOURCE_LABEL";

/**
 * Composants de base disponibles pour toutes les techniques.
 *
 * Ces composants ne viennent pas d’un métier.
 * Ils sont considérés comme universels et peuvent être ajoutés directement
 * depuis la fiche de technique.
 *
 * Les textes affichés passent par l’i18n.
 * Les clés internes et `referenceKey` restent en anglais pour garder une nomenclature stable.
 */
export const TECHNIQUE_BASE_COMPONENTS = Object.freeze({
  keys: Object.freeze([
    Object.freeze({
      id: "reaction",
      referenceKey: "key.reaction",
      nameKey: "ETERN.TECHNIQUE.BASE_COMPONENTS.KEYS.REACTION.NAME",
      descriptionKey: "ETERN.TECHNIQUE.BASE_COMPONENTS.KEYS.REACTION.DESCRIPTION",
      xpCost: 2
    }),
    Object.freeze({
      id: "opposition",
      referenceKey: "key.opposition",
      nameKey: "ETERN.TECHNIQUE.BASE_COMPONENTS.KEYS.OPPOSITION.NAME",
      descriptionKey: "ETERN.TECHNIQUE.BASE_COMPONENTS.KEYS.OPPOSITION.DESCRIPTION",
      xpCost: 1
    })
  ]),

  conditions: Object.freeze([
    Object.freeze({
      id: "recharge",
      referenceKey: "condition.recharge",
      nameKey: "ETERN.TECHNIQUE.BASE_COMPONENTS.CONDITIONS.RECHARGE.NAME",
      descriptionKey: "ETERN.TECHNIQUE.BASE_COMPONENTS.CONDITIONS.RECHARGE.DESCRIPTION",

      /**
       * Valeur par défaut.
       * La règle Recharge peut aller de -1 à -4 XP selon la condition choisie.
       * La fiche doit donc permettre de modifier ce coût après ajout si nécessaire.
       */
      xpCost: -1
    }),
    Object.freeze({
      id: "channeling",
      referenceKey: "condition.channeling",
      nameKey: "ETERN.TECHNIQUE.BASE_COMPONENTS.CONDITIONS.CHANNELING.NAME",
      descriptionKey: "ETERN.TECHNIQUE.BASE_COMPONENTS.CONDITIONS.CHANNELING.DESCRIPTION",
      xpCost: 1
    })
  ]),

  mechanics: Object.freeze([]),
  states: Object.freeze([])
});

/**
 * Récupère les composants de base d’une section donnée.
 *
 * Si la section est absente ou invalide, la section `keys` est utilisée.
 *
 * @param {unknown} sectionKey - Section brute à lire.
 * @returns {readonly object[]} Liste des composants de base de la section.
 */
export function getTechniqueBaseComponents(sectionKey = "") {
  const normalizedSectionKey = normalizeTechniqueBaseComponentSection(sectionKey);

  return TECHNIQUE_BASE_COMPONENTS[normalizedSectionKey] ?? [];
}

/**
 * Résout un composant de base depuis sa section et son id.
 *
 * @param {unknown} sectionKey - Section du composant.
 * @param {unknown} componentId - Id du composant recherché.
 * @returns {object|null} Définition du composant, ou `null` si introuvable.
 */
export function resolveTechniqueBaseComponent(sectionKey = "", componentId = "") {
  const normalizedId = String(componentId ?? "").trim();

  return getTechniqueBaseComponents(sectionKey).find((entry) => {
    return entry.id === normalizedId;
  }) ?? null;
}

/**
 * Crée une entrée de technique à partir d’un composant de base.
 *
 * Cette fonction est utilisée quand l’utilisateur ajoute un composant universel
 * dans une technique.
 *
 * L’entrée créée :
 * - reçoit un nouvel id ;
 * - utilise les textes localisés ;
 * - conserve la référence stable du composant ;
 * - est marquée comme universelle ;
 * - n’est liée à aucun métier source.
 *
 * @param {unknown} sectionKey - Section cible.
 * @param {unknown} componentId - Id du composant à créer.
 * @returns {object|null} Entrée prête à être insérée dans la technique, ou `null`.
 */
export function createTechniqueBaseComponentEntry(sectionKey = "", componentId = "") {
  const component = resolveTechniqueBaseComponent(sectionKey, componentId);

  if (!component) return null;

  return {
    id: foundry.utils.randomID(),
    name: game.i18n.localize(component.nameKey),
    description: game.i18n.localize(component.descriptionKey),
    xpCost: Number(component.xpCost ?? 0) || 0,
    referenceKey: component.referenceKey,
    stateId: "",
    extraStatisticSlots: 0,
    statisticSlots: [],
    sourceProfessionId: "",
    sourceEntryId: "",
    sourceReferenceKey: "",
    sourceLabel: game.i18n.localize(BASE_COMPONENT_SOURCE_LABEL_KEY),
    isUniversal: true
  };
}

/**
 * Construit les sections de sources de composants de base.
 *
 * Ces sections sont utilisées par la fiche de technique pour afficher
 * les composants universels disponibles à l’ajout.
 *
 * Chaque composant indique aussi s’il est déjà présent dans la technique courante,
 * afin d’éviter les ajouts involontaires en doublon.
 *
 * @param {object} [currentSystem={}] - Données système actuelles de la technique.
 * @returns {{keys: object[], conditions: object[], mechanics: object[], states: object[]}} Sections de composants de base.
 */
export function buildTechniqueBaseComponentSourceSections(currentSystem = {}) {
  const sourceLabel = game.i18n.localize(BASE_COMPONENT_SOURCE_LABEL_KEY);

  return Object.fromEntries(
    SECTION_KEYS.map((sectionKey) => [
      sectionKey,
      getTechniqueBaseComponents(sectionKey).map((component) => {
        return buildBaseComponentSourceEntry(
          component,
          sectionKey,
          currentSystem,
          sourceLabel
        );
      })
    ])
  );
}

/**
 * Normalise une section de composant de base.
 *
 * Valeurs autorisées :
 * - `keys`
 * - `conditions`
 * - `mechanics`
 * - `states`
 *
 * Toute valeur invalide revient à `keys`.
 *
 * @param {unknown} sectionKey - Section brute.
 * @returns {"keys"|"conditions"|"mechanics"|"states"} Section normalisée.
 */
export function normalizeTechniqueBaseComponentSection(sectionKey = "") {
  const normalized = String(sectionKey ?? "").trim();

  return SECTION_KEYS.includes(normalized)
    ? normalized
    : "keys";
}

/**
 * Construit une entrée de source pour un composant de base.
 *
 * Cette entrée est destinée à l’affichage dans la liste des composants disponibles.
 *
 * @param {object} component - Définition du composant de base.
 * @param {string} sectionKey - Section du composant.
 * @param {object} currentSystem - Données système de la technique courante.
 * @param {string} sourceLabel - Libellé localisé de la source universelle.
 * @returns {object} Entrée de source prête pour le contexte de fiche.
 */
function buildBaseComponentSourceEntry(component, sectionKey, currentSystem, sourceLabel) {
  return {
    id: component.id,
    sourceKind: "base",
    isBaseComponent: true,
    name: game.i18n.localize(component.nameKey),
    description: game.i18n.localize(component.descriptionKey),
    xpCost: Number(component.xpCost ?? 0) || 0,
    referenceKey: component.referenceKey,
    stateId: "",
    statisticSlots: [],
    extraStatisticSlots: 0,
    isUniversal: true,
    professionId: "",
    professionName: sourceLabel,
    alreadyAdded: hasComponentReference(
      currentSystem?.[sectionKey],
      component.referenceKey
    )
  };
}

/**
 * Vérifie si une liste d’entrées contient déjà une référence de composant.
 *
 * La détection se base sur `referenceKey`.
 * C’est suffisant pour les composants de base, car leurs références sont fixes.
 *
 * @param {Array<object>} entries - Entrées actuelles de la section.
 * @param {unknown} referenceKey - Référence à rechercher.
 * @returns {boolean} `true` si la référence existe déjà.
 */
function hasComponentReference(entries, referenceKey = "") {
  const normalizedReference = String(referenceKey ?? "").trim();

  if (!normalizedReference) return false;

  return asArray(entries).some((entry) => {
    return String(entry?.referenceKey ?? "").trim() === normalizedReference;
  });
}

