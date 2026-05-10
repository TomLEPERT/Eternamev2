/**
 * Service de synchronisation des composants de techniques importés depuis les métiers.
 *
 * Responsabilités :
 * - retrouver la source métier d’une clé, condition, mécanique ou état importé ;
 * - détecter si une entrée importée est manquante, obsolète ou toujours synchronisée ;
 * - reconstruire une entrée de technique depuis sa source métier ;
 * - produire un statut exploitable par la fiche item pour afficher les badges de synchronisation ;
 * - éviter que les techniques gardent silencieusement des copies périmées de modules de métiers.
 *
 * Ce fichier ne doit pas contenir de logique d’affichage directe.
 * Il prépare seulement les données nécessaires aux templates et aux services de validation.
 */

import { toInteger, toPositiveInteger } from '../../utils/numbers.js';
import {
  buildTechniqueModuleReferenceCandidates,
  normalizeTechniqueModuleReferenceKey,
  resolveTechniqueModuleStateId
} from "./module-reference-service.js";

const TECHNIQUE_SYNC_SECTION_KEYS = Object.freeze([
  "keys",
  "conditions",
  "mechanics",
  "states"
]);

const SOURCE_STATUS = Object.freeze({
  custom: {
    hasSource: false,
    isMissing: false,
    isOutdated: false,
    badgeKey: "ETERN.TECHNIQUE.SOURCE_STATUS.CUSTOM",
    badgeClass: "builder-inline-badge--muted",
    canSync: false,
    syncMessageKey: ""
  },

  missing: {
    hasSource: true,
    isMissing: true,
    isOutdated: false,
    badgeKey: "ETERN.TECHNIQUE.SOURCE_STATUS.MISSING",
    badgeClass: "builder-inline-badge--warning",
    canSync: false,
    syncMessageKey: "ETERN.TECHNIQUE.VALIDATION.MISSING_IMPORTED_SOURCE"
  },

  outdated: {
    hasSource: true,
    isMissing: false,
    isOutdated: true,
    badgeKey: "ETERN.TECHNIQUE.SOURCE_STATUS.OUTDATED",
    badgeClass: "builder-inline-badge--warning",
    canSync: true,
    syncMessageKey: "ETERN.TECHNIQUE.VALIDATION.OUTDATED_IMPORTED_SOURCE"
  },

  linked: {
    hasSource: true,
    isMissing: false,
    isOutdated: false,
    badgeKey: "ETERN.TECHNIQUE.SOURCE_STATUS.LINKED",
    badgeClass: "builder-inline-badge--success",
    canSync: true,
    syncMessageKey: ""
  }
});

/**
 * Construit le statut de synchronisation d’une entrée de technique.
 *
 * Le statut indique si l’entrée est :
 * - personnalisée ;
 * - liée à une source métier valide ;
 * - liée mais obsolète ;
 * - liée à une source désormais introuvable.
 *
 * @param {Actor} actor - Acteur propriétaire de la technique.
 * @param {string} sectionKey - Section de composant : keys, conditions, mechanics ou states.
 * @param {object} entry - Entrée de technique à analyser.
 * @param {string[]} [selectedProfessionIds=[]] - Métiers actuellement sélectionnés comme sources de la technique.
 * @returns {object} Statut de synchronisation exploitable par l’interface.
 */
export function buildTechniqueEntrySourceStatus(
  actor,
  sectionKey,
  entry,
  selectedProfessionIds = []
) {
  const resolution = resolveTechniqueComponentSource(
    actor,
    sectionKey,
    entry,
    selectedProfessionIds
  );

  if (!resolution.hasSource) {
    return buildSourceStatus("custom");
  }

  if (resolution.isMissing) {
    return buildSourceStatus("missing");
  }

  if (resolution.hasDifferences) {
    return buildSourceStatus("outdated", {
      isFromSelectedProfession: resolution.isFromSelectedProfession
    });
  }

  return buildSourceStatus("linked", {
    isFromSelectedProfession: resolution.isFromSelectedProfession
  });
}

/**
 * Synchronise une entrée de technique avec sa source métier.
 *
 * Si la source n’existe plus ou ne peut pas être résolue, la fonction renvoie `null`.
 * Sinon, elle fusionne l’entrée actuelle avec les données fraîches du métier source.
 *
 * @param {Actor} actor - Acteur propriétaire de la technique.
 * @param {string} sectionKey - Section de composant à synchroniser.
 * @param {object} entry - Entrée actuelle de la technique.
 * @param {string[]} [selectedProfessionIds=[]] - Métiers actuellement sélectionnés.
 * @returns {object|null} Entrée synchronisée, ou `null` si la source est introuvable.
 */
export function syncTechniqueComponentEntry(
  actor,
  sectionKey,
  entry,
  selectedProfessionIds = []
) {
  const resolution = resolveTechniqueComponentSource(
    actor,
    sectionKey,
    entry,
    selectedProfessionIds
  );

  if (resolution.isMissing || !resolution.sourceEntry || !resolution.profession) {
    return null;
  }

  return mergeTechniqueComponentWithSource(
    entry,
    resolution.profession,
    resolution.sourceEntry
  );
}

/**
 * Résout la source métier d’une entrée de composant de technique.
 *
 * La recherche utilise plusieurs indices :
 * - l’id du métier source ;
 * - l’id de l’entrée source ;
 * - la clé de référence du module ;
 * - l’état ciblé pour les modules d’état.
 *
 * Si la source directe ne fonctionne pas, la fonction cherche aussi dans les métiers
 * sélectionnés, puis dans les autres métiers de l’acteur.
 *
 * @param {Actor} actor - Acteur propriétaire de la technique.
 * @param {string} sectionKey - Section de composant.
 * @param {object} entry - Entrée dont on cherche la source.
 * @param {string[]} [selectedProfessionIds=[]] - Métiers sélectionnés comme sources.
 * @returns {{
 *   hasSource: boolean,
 *   isMissing: boolean,
 *   isFromSelectedProfession: boolean,
 *   hasDifferences: boolean,
 *   profession: Item|null,
 *   sourceEntry: object|null
 * }} Résolution de source.
 */
export function resolveTechniqueComponentSource(
  actor,
  sectionKey,
  entry,
  selectedProfessionIds = []
) {
  const normalizedSectionKey = normalizeSectionKey(sectionKey);

  const sourceProfessionId = String(entry?.sourceProfessionId ?? "").trim();
  const sourceEntryId = String(entry?.sourceEntryId ?? "").trim();

  const sourceReferenceKey = normalizeTechniqueModuleReferenceKey(
    entry?.sourceReferenceKey ?? "",
    {
      sectionKey: normalizedSectionKey,
      name: entry?.name ?? "",
      stateId: entry?.stateId ?? ""
    }
  );

  const referenceKey = normalizeTechniqueModuleReferenceKey(
    entry?.referenceKey ?? "",
    {
      sectionKey: normalizedSectionKey,
      name: entry?.name ?? "",
      stateId: entry?.stateId ?? ""
    }
  );

  const resolvedStateId = resolveTechniqueModuleStateId({
    stateId: entry?.stateId ?? "",
    referenceKey
  });

  const hasSource = Boolean(sourceProfessionId || sourceEntryId || sourceReferenceKey);

  if (!hasSource) {
    return {
      hasSource: false,
      isMissing: false,
      isFromSelectedProfession: false,
      hasDifferences: false,
      profession: null,
      sourceEntry: null
    };
  }

  const lookup = {
    id: sourceEntryId,
    referenceKey: sourceReferenceKey || referenceKey,
    stateId: resolvedStateId,
    entry
  };

  const professionCandidates = getProfessionCandidates(
    actor,
    sourceProfessionId,
    selectedProfessionIds
  );

  let profession = null;
  let sourceEntry = null;

  if (sourceProfessionId) {
    profession = actor?.items?.get?.(sourceProfessionId);

    if (profession?.type === "profession") {
      sourceEntry = findProfessionEntry(profession, normalizedSectionKey, lookup);
    }
  }

  if ((!profession || !sourceEntry) && hasLookupClue(lookup)) {
    for (const candidate of professionCandidates) {
      const foundEntry = findProfessionEntry(candidate, normalizedSectionKey, lookup);

      if (!foundEntry) continue;

      profession = candidate;
      sourceEntry = foundEntry;
      break;
    }
  }

  if (!profession || !sourceEntry) {
    return {
      hasSource: true,
      isMissing: true,
      isFromSelectedProfession: false,
      hasDifferences: false,
      profession: null,
      sourceEntry: null
    };
  }

  const selectedSet = toIdSet(selectedProfessionIds);

  return {
    hasSource: true,
    isMissing: false,
    isFromSelectedProfession: selectedSet.size
      ? selectedSet.has(String(profession.id ?? ""))
      : false,
    hasDifferences: hasTechniqueComponentSourceDifferences(
      entry,
      sourceEntry,
      profession,
      normalizedSectionKey
    ),
    profession,
    sourceEntry
  };
}

/**
 * Fusionne une entrée de technique avec sa source métier.
 *
 * La fonction conserve les données propres à l’entrée actuelle lorsque c’est utile,
 * mais remplace les données synchronisées par celles de la source :
 * nom, description, coût XP, universalité, slots statistiques et références source.
 *
 * @param {object} entry - Entrée actuelle de la technique.
 * @param {Item} profession - Métier source.
 * @param {object} sourceEntry - Entrée source dans le métier.
 * @returns {object} Entrée mise à jour depuis la source.
 */
export function mergeTechniqueComponentWithSource(entry, profession, sourceEntry) {
  const statisticSlots = Array.isArray(sourceEntry?.statisticSlots)
    ? foundry.utils.deepClone(sourceEntry.statisticSlots)
    : [];

  return {
    ...foundry.utils.deepClone(entry ?? {}),
    name: String(sourceEntry?.name ?? ""),
    description: String(sourceEntry?.description ?? ""),
    xpCost: Math.floor(Number(sourceEntry?.xpCost ?? 0) || 0),
    isUniversal: Boolean(sourceEntry?.isUniversal),
    referenceKey: String(sourceEntry?.referenceKey ?? ""),
    stateId: String(sourceEntry?.stateId ?? ""),
    statisticSlots,
    extraStatisticSlots: Math.max(
      0,
      Math.floor(Number(sourceEntry?.extraStatisticSlots ?? 0) || 0)
    ),
    sourceProfessionId: String(profession?.id ?? ""),
    sourceEntryId: String(sourceEntry?.id ?? ""),
    sourceReferenceKey: String(sourceEntry?.referenceKey ?? ""),
    sourceLabel: String(profession?.name ?? "")
  };
}

/**
 * Construit un objet de statut de source à partir d’un statut prédéfini.
 *
 * Cette fonction évite de répéter les mêmes objets dans
 * `buildTechniqueEntrySourceStatus`.
 *
 * @param {"custom"|"missing"|"outdated"|"linked"} statusKey - Type de statut.
 * @param {object} [overrides={}] - Valeurs à surcharger.
 * @returns {object} Statut final.
 */
function buildSourceStatus(statusKey, overrides = {}) {
  const baseStatus = SOURCE_STATUS[statusKey] ?? SOURCE_STATUS.custom;

  return {
    ...baseStatus,
    isFromSelectedProfession: false,
    ...overrides
  };
}

/**
 * Recherche une entrée source dans un métier.
 *
 * L’ordre de recherche est volontaire :
 * 1. recherche par id exact ;
 * 2. recherche par clé de référence ;
 * 3. recherche par état ciblé.
 *
 * @param {Item} profession - Métier dans lequel chercher.
 * @param {string} sectionKey - Section du métier.
 * @param {object} [options={}] - Indices de recherche.
 * @param {string} [options.id=""] - Id source attendu.
 * @param {string} [options.referenceKey=""] - Clé de référence attendue.
 * @param {string} [options.stateId=""] - Id d’état attendu.
 * @param {object|null} [options.entry=null] - Entrée actuelle servant à générer des candidats de référence.
 * @returns {object|null} Entrée trouvée, ou `null`.
 */
function findProfessionEntry(
  profession,
  sectionKey,
  { id = "", referenceKey = "", stateId = "", entry = null } = {}
) {
  const entries = Array.isArray(profession?.system?.[sectionKey])
    ? profession.system[sectionKey]
    : [];

  const normalizedId = String(id ?? "").trim();

  if (normalizedId) {
    const exact = entries.find((candidate) => {
      return String(candidate?.id ?? "").trim() === normalizedId;
    });

    if (exact) return exact;
  }

  const candidates = buildReferenceCandidateSet({
    entry,
    sectionKey,
    referenceKey,
    stateId
  });

  if (candidates.size) {
    const byReference = entries.find((candidate) => {
      const entryReference = normalizeTechniqueModuleReferenceKey(
        candidate?.referenceKey ?? "",
        {
          sectionKey,
          name: candidate?.name ?? "",
          stateId: candidate?.stateId ?? ""
        }
      );

      return entryReference && candidates.has(entryReference);
    });

    if (byReference) return byReference;
  }

  const normalizedStateId = resolveTechniqueModuleStateId({
    stateId,
    referenceKey
  });

  if (normalizedStateId) {
    const byStateId = entries.find((candidate) => {
      return resolveTechniqueModuleStateId({
        stateId: candidate?.stateId ?? "",
        referenceKey: candidate?.referenceKey ?? ""
      }) === normalizedStateId;
    });

    if (byStateId) return byStateId;
  }

  return null;
}

/**
 * Compare une entrée de technique avec son entrée source.
 *
 * La fonction renvoie `true` si une différence est détectée sur :
 * - le nom ;
 * - la description ;
 * - le coût XP ;
 * - le statut universel ;
 * - la clé de référence ;
 * - l’état ciblé ;
 * - les slots statistiques ;
 * - le label de source.
 *
 * @param {object} entry - Entrée actuelle de la technique.
 * @param {object} sourceEntry - Entrée source du métier.
 * @param {Item} profession - Métier source.
 * @param {string} [sectionKey=""] - Section analysée.
 * @returns {boolean} `true` si l’entrée est obsolète.
 */
function hasTechniqueComponentSourceDifferences(
  entry,
  sourceEntry,
  profession,
  sectionKey = ""
) {
  const entryReference = normalizeTechniqueModuleReferenceKey(
    entry?.referenceKey ?? "",
    {
      sectionKey,
      name: entry?.name ?? "",
      stateId: entry?.stateId ?? ""
    }
  );

  const sourceReference = normalizeTechniqueModuleReferenceKey(
    sourceEntry?.referenceKey ?? "",
    {
      sectionKey,
      name: sourceEntry?.name ?? "",
      stateId: sourceEntry?.stateId ?? ""
    }
  );

  const entryStateId = resolveTechniqueModuleStateId({
    stateId: entry?.stateId ?? "",
    referenceKey: entry?.referenceKey ?? ""
  });

  const sourceStateId = resolveTechniqueModuleStateId({
    stateId: sourceEntry?.stateId ?? "",
    referenceKey: sourceEntry?.referenceKey ?? ""
  });

  return String(entry?.name ?? "") !== String(sourceEntry?.name ?? "")
    || String(entry?.description ?? "") !== String(sourceEntry?.description ?? "")
    || toInteger(entry?.xpCost) !== toInteger(sourceEntry?.xpCost)
    || Boolean(entry?.isUniversal) !== Boolean(sourceEntry?.isUniversal)
    || entryReference !== sourceReference
    || entryStateId !== sourceStateId
    || toPositiveInteger(entry?.extraStatisticSlots) !== toPositiveInteger(sourceEntry?.extraStatisticSlots)
    || JSON.stringify(entry?.statisticSlots ?? []) !== JSON.stringify(sourceEntry?.statisticSlots ?? [])
    || String(entry?.sourceLabel ?? "") !== String(profession?.name ?? "");
}

/**
 * Construit la liste des métiers candidats à la résolution d’une source.
 *
 * Priorité :
 * - métier explicitement référencé ;
 * - métiers sélectionnés sur la technique ;
 * - autres métiers possédés par l’acteur.
 *
 * Les doublons sont supprimés.
 *
 * @param {Actor} actor - Acteur propriétaire.
 * @param {string} preferredProfessionId - Métier source explicitement référencé.
 * @param {string[]} [selectedProfessionIds=[]] - Métiers sélectionnés.
 * @returns {Item[]} Métiers candidats.
 */
function getProfessionCandidates(
  actor,
  preferredProfessionId,
  selectedProfessionIds = []
) {
  const selectedSet = toIdSet(selectedProfessionIds);
  const preferred = preferredProfessionId
    ? actor?.items?.get?.(preferredProfessionId)
    : null;

  const professions = actor?.items?.contents?.filter((item) => {
    return item?.type === "profession";
  }) ?? [];

  const selected = professions.filter((item) => {
    return selectedSet.has(String(item.id ?? ""));
  });

  const remaining = professions.filter((item) => {
    return !selectedSet.has(String(item.id ?? ""));
  });

  return [preferred, ...selected, ...remaining].filter((item, index, list) => {
    if (item?.type !== "profession") return false;

    return list.findIndex((candidate) => {
      return String(candidate?.id ?? "") === String(item?.id ?? "");
    }) === index;
  });
}

/**
 * Normalise une clé de section synchronisable.
 *
 * Si la section est inconnue, `keys` est utilisée comme fallback.
 *
 * @param {unknown} sectionKey - Section brute.
 * @returns {"keys"|"conditions"|"mechanics"|"states"} Section normalisée.
 */
function normalizeSectionKey(sectionKey) {
  const normalized = String(sectionKey ?? "").trim();

  return TECHNIQUE_SYNC_SECTION_KEYS.includes(normalized)
    ? normalized
    : "keys";
}

/**
 * Construit l’ensemble des clés de référence candidates pour une entrée.
 *
 * @param {object} params - Paramètres de construction.
 * @param {object|null} params.entry - Entrée actuelle.
 * @param {string} params.sectionKey - Section analysée.
 * @param {string} params.referenceKey - Clé de référence directe.
 * @param {string} params.stateId - État ciblé.
 * @returns {Set<string>} Ensemble des références candidates.
 */
function buildReferenceCandidateSet({
  entry,
  sectionKey,
  referenceKey,
  stateId
}) {
  const candidates = new Set();

  for (const candidate of [
    referenceKey,
    ...buildTechniqueModuleReferenceCandidates(entry ?? {}, sectionKey)
  ]) {
    const normalizedReference = normalizeTechniqueModuleReferenceKey(
      candidate ?? "",
      {
        sectionKey,
        name: entry?.name ?? "",
        stateId: (stateId || entry?.stateId) ?? ""
      }
    );

    if (normalizedReference) {
      candidates.add(normalizedReference);
    }
  }

  return candidates;
}

/**
 * Vérifie si au moins un indice de recherche de source est disponible.
 *
 * @param {object} lookup - Données de recherche.
 * @returns {boolean} `true` si une recherche indirecte vaut la peine d’être tentée.
 */
function hasLookupClue(lookup) {
  return Boolean(
    lookup.id
    || lookup.referenceKey
    || lookup.stateId
  );
}

/**
 * Convertit une liste de valeurs en ensemble d’identifiants propres.
 *
 * @param {unknown[]} values - Valeurs brutes.
 * @returns {Set<string>} Ensemble d’identifiants non vides.
 */
function toIdSet(values) {
  return new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
  );
}


