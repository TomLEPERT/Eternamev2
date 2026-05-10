/**
 * Service de préparation des sources de composants venant des métiers.
 *
 * Responsabilités :
 * - lire les métiers sélectionnés comme sources d’une technique ;
 * - récupérer leurs clés, conditions, mécaniques et états disponibles ;
 * - marquer les modules déjà importés dans la technique courante ;
 * - normaliser les références de modules pour permettre la synchronisation ;
 * - fournir des sections prêtes à être fusionnées avec les composants de base.
 *
 * Ce fichier ne doit pas modifier les items.
 * Il prépare uniquement des données de contexte pour la fiche technique.
 */

import { asArray } from '../../utils/arrays.js';
import { uniqueIds } from '../../utils/ids.js';
import { toInteger, toPositiveInteger } from '../../utils/numbers.js';
import {
  normalizeTechniqueModuleReferenceKey,
  resolveTechniqueModuleStateId
} from "./module-reference-service.js";

const TECHNIQUE_SECTION_KEYS = Object.freeze([
  "keys",
  "conditions",
  "mechanics",
  "states"
]);

/**
 * Construit les sections de composants disponibles depuis les métiers sources.
 *
 * Pour chaque métier sélectionné, la fonction récupère :
 * - ses clés ;
 * - ses conditions ;
 * - ses mécaniques ;
 * - ses états.
 *
 * Chaque entrée est enrichie avec :
 * - l’id et le nom du métier source ;
 * - sa référence normalisée ;
 * - son état ciblé éventuel ;
 * - ses slots statistiques ;
 * - l’information `alreadyAdded` si elle est déjà importée dans la technique.
 *
 * @param {Actor|null} actor - Acteur propriétaire de la technique.
 * @param {string[]} selectedProfessionIds - Identifiants des métiers sélectionnés comme sources.
 * @param {object} [currentSystem={}] - Données système actuelles de la technique.
 * @returns {{keys: object[], conditions: object[], mechanics: object[], states: object[]}} Sections de sources métier.
 */
export function buildTechniqueProfessionSourceSections(
  actor,
  selectedProfessionIds,
  currentSystem = {}
) {
  const professionIds = uniqueIds(selectedProfessionIds);
  const professions = getSelectedProfessions(actor, professionIds);
  const importedSources = buildImportedSourceMap(currentSystem);

  return Object.fromEntries(
    TECHNIQUE_SECTION_KEYS.map((sectionKey) => {
      const availableEntries = professions
        .flatMap((profession) => {
          return buildProfessionSectionEntries(
            profession,
            sectionKey,
            importedSources
          );
        })
        .filter(hasMeaningfulSourceEntry)
        .sort(compareSourceEntries);

      return [sectionKey, availableEntries];
    })
  );
}

/**
 * Récupère les métiers sélectionnés sur l’acteur.
 *
 * Les ids invalides, vides ou ne correspondant pas à un item de type `profession`
 * sont ignorés.
 *
 * @param {Actor|null} actor - Acteur propriétaire.
 * @param {string[]} professionIds - Identifiants normalisés des métiers sélectionnés.
 * @returns {Item[]} Métiers trouvés.
 */
function getSelectedProfessions(actor, professionIds) {
  return professionIds
    .map((professionId) => actor?.items?.get?.(professionId))
    .filter((item) => item?.type === "profession");
}

/**
 * Construit une carte des entrées déjà importées dans la technique.
 *
 * La clé utilisée est :
 *
 * ```txt
 * sectionKey:sourceProfessionId:sourceEntryId
 * ```
 *
 * Cette carte permet ensuite de marquer les entrées disponibles avec `alreadyAdded`.
 *
 * @param {object} [currentSystem={}] - Données système actuelles de la technique.
 * @returns {Map<string, boolean>} Carte des sources déjà importées.
 */
function buildImportedSourceMap(currentSystem = {}) {
  const importedSources = new Map();

  for (const sectionKey of TECHNIQUE_SECTION_KEYS) {
    const entries = asArray(currentSystem?.[sectionKey]);

    for (const entry of entries) {
      const sourceProfessionId = String(entry?.sourceProfessionId ?? "").trim();
      const sourceEntryId = String(entry?.sourceEntryId ?? "").trim();

      if (!sourceProfessionId || !sourceEntryId) continue;

      importedSources.set(
        buildImportedSourceKey(sectionKey, sourceProfessionId, sourceEntryId),
        true
      );
    }
  }

  return importedSources;
}

/**
 * Construit les entrées disponibles d’une section pour un métier donné.
 *
 * @param {Item} profession - Métier source.
 * @param {string} sectionKey - Section analysée : keys, conditions, mechanics ou states.
 * @param {Map<string, boolean>} importedSources - Sources déjà importées.
 * @returns {object[]} Entrées disponibles depuis ce métier.
 */
function buildProfessionSectionEntries(profession, sectionKey, importedSources) {
  const professionEntries = asArray(profession.system?.[sectionKey]);

  return professionEntries.map((entry, index) => {
    return buildProfessionSourceEntry({
      profession,
      sectionKey,
      entry,
      index,
      importedSources
    });
  });
}

/**
 * Construit une entrée source issue d’un métier.
 *
 * Cette fonction normalise les champs nécessaires à l’ajout dans une technique :
 * - nom ;
 * - description ;
 * - coût XP ;
 * - référence ;
 * - état ciblé ;
 * - slots statistiques ;
 * - métier source ;
 * - statut déjà ajouté.
 *
 * @param {object} params - Paramètres de construction.
 * @param {Item} params.profession - Métier source.
 * @param {string} params.sectionKey - Section source.
 * @param {object} params.entry - Entrée brute du métier.
 * @param {number} params.index - Position de l’entrée dans la section du métier.
 * @param {Map<string, boolean>} params.importedSources - Sources déjà importées.
 * @returns {object} Entrée source prête pour le contexte de fiche.
 */
function buildProfessionSourceEntry({
  profession,
  sectionKey,
  entry,
  index,
  importedSources
}) {
  const professionId = String(profession.id ?? "");
  const entryId = String(entry?.id ?? "");

  const stateId = resolveTechniqueModuleStateId({
    stateId: entry?.stateId ?? "",
    referenceKey: entry?.referenceKey ?? ""
  });

  const referenceKey = normalizeTechniqueModuleReferenceKey(
    entry?.referenceKey ?? "",
    {
      sectionKey,
      name: entry?.name ?? "",
      stateId
    }
  );

  return {
    id: entryId,
    index,
    name: String(entry?.name ?? ""),
    description: String(entry?.description ?? ""),
    xpCost: toInteger(entry?.xpCost),
    referenceKey,
    stateId,
    statisticSlots: Array.isArray(entry?.statisticSlots)
      ? foundry.utils.deepClone(entry.statisticSlots)
      : [],
    extraStatisticSlots: toPositiveInteger(entry?.extraStatisticSlots),
    isUniversal: Boolean(entry?.isUniversal),
    professionId,
    professionName: String(profession.name ?? ""),
    alreadyAdded: importedSources.has(
      buildImportedSourceKey(sectionKey, professionId, entryId)
    )
  };
}

/**
 * Indique si une entrée source contient une information utile.
 *
 * Les entrées totalement vides ne sont pas proposées dans la liste des composants disponibles.
 *
 * @param {object} entry - Entrée source préparée.
 * @returns {boolean} `true` si l’entrée mérite d’être affichée.
 */
function hasMeaningfulSourceEntry(entry) {
  return Boolean(
    entry.name
    || entry.description
    || entry.xpCost !== 0
    || entry.extraStatisticSlots > 0
    || entry.stateId
  );
}

/**
 * Construit la clé interne utilisée pour repérer une source déjà importée.
 *
 * @param {string} sectionKey - Section de composant.
 * @param {string} professionId - Identifiant du métier source.
 * @param {string} entryId - Identifiant de l’entrée source.
 * @returns {string} Clé unique de source importée.
 */
function buildImportedSourceKey(sectionKey, professionId, entryId) {
  return `${sectionKey}:${professionId}:${entryId}`;
}

/**
 * Trie les entrées disponibles par nom de métier, puis par nom d’entrée.
 *
 * Le tri utilise la langue active de Foundry pour respecter l’ordre localisé.
 *
 * @param {object} left - Entrée de gauche.
 * @param {object} right - Entrée de droite.
 * @returns {number} Résultat de comparaison.
 */
function compareSourceEntries(left, right) {
  const professionCompare = String(left.professionName ?? "").localeCompare(
    String(right.professionName ?? ""),
    game.i18n.lang
  );

  if (professionCompare !== 0) return professionCompare;

  return String(left.name ?? "").localeCompare(
    String(right.name ?? ""),
    game.i18n.lang
  );
}


