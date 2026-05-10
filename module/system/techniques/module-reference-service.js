/**
 * Service de gestion des références de modules de techniques et de métiers.
 *
 * Responsabilités :
 * - normaliser les clés de référence des modules ;
 * - générer des références stables à partir du nom d’un module ;
 * - gérer les références spéciales liées aux états système ;
 * - construire des candidats de référence pour retrouver une entrée source ;
 * - détecter les références manquantes, générées ou dupliquées ;
 * - construire une carte d’utilisation des références dans une section.
 *
 * Ce fichier sert à stabiliser les liens entre :
 * - les modules définis dans les métiers ;
 * - les composants importés dans les techniques ;
 * - les états système utilisés par certains modules.
 *
 * Il ne doit pas modifier les items.
 * Il ne doit contenir que de la normalisation, de la résolution et de la métadonnée.
 */

import { getTechniqueModuleStateDefinition } from "./module-entry-config.js";

const SECTION_REFERENCE_PREFIXES = Object.freeze({
  passives: "passive",
  keys: "key",
  conditions: "condition",
  mechanics: "mechanic",
  states: "state"
});

/**
 * Normalise une clé de référence brute.
 *
 * Cette fonction est utilisée pour comparer des références existantes.
 * Elle produit une clé stable :
 * - en minuscules ;
 * - sans espaces ;
 * - avec des points comme séparateurs ;
 * - sans caractères spéciaux inutiles ;
 * - sans points multiples ou points en début/fin.
 *
 * Exemple :
 * `"Key. Fire Ball"` devient `"key.fire.ball"`.
 *
 * @param {unknown} referenceKey - Clé de référence brute.
 * @returns {string} Clé de référence normalisée.
 */
function normalizeRawReferenceKey(referenceKey = "") {
  return String(referenceKey ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

/**
 * Transforme une valeur libre en slug utilisable dans une référence générée.
 *
 * Cette fonction est plutôt utilisée pour construire une référence depuis un nom.
 * Elle retire les accents, passe en minuscules et utilise des tirets comme séparateurs.
 *
 * Exemple :
 * `"Élan du Tonnerre"` devient `"elan-du-tonnerre"`.
 *
 * @param {unknown} value - Valeur brute à transformer en slug.
 * @returns {string} Slug normalisé.
 */
export function slugifyTechniqueModuleReference(value = "") {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Construit la référence canonique d’un état système.
 *
 * Une référence d’état a toujours la forme :
 *
 * ```txt
 * state.<stateId>
 * ```
 *
 * La fonction renvoie une chaîne vide si l’état n’existe pas dans les définitions système.
 *
 * @param {unknown} stateId - Identifiant d’état à convertir en référence.
 * @returns {string} Référence canonique de l’état, ou chaîne vide.
 */
export function buildTechniqueModuleCanonicalStateReferenceKey(stateId = "") {
  const normalizedStateId = String(stateId ?? "").trim();

  return getTechniqueModuleStateDefinition(normalizedStateId)
    ? `state.${normalizedStateId}`
    : "";
}

/**
 * Résout l’identifiant d’état ciblé par un module.
 *
 * La fonction accepte plusieurs formes :
 * - un `stateId` direct ;
 * - une référence de type `state.<id>` ;
 * - une référence qui correspond directement à un id d’état.
 *
 * Elle renvoie une chaîne vide si aucun état valide n’est trouvé.
 *
 * @param {object} [params={}] - Paramètres de résolution.
 * @param {unknown} [params.stateId=""] - Id d’état direct.
 * @param {unknown} [params.referenceKey=""] - Clé de référence potentiellement liée à un état.
 * @returns {string} Id d’état résolu, ou chaîne vide.
 */
export function resolveTechniqueModuleStateId({
  stateId = "",
  referenceKey = ""
} = {}) {
  const normalizedStateId = String(stateId ?? "").trim();

  if (getTechniqueModuleStateDefinition(normalizedStateId)) {
    return normalizedStateId;
  }

  const normalizedReference = normalizeRawReferenceKey(referenceKey);

  if (!normalizedReference) return "";

  if (normalizedReference.startsWith("state.")) {
    const candidate = normalizedReference.slice("state.".length);

    if (getTechniqueModuleStateDefinition(candidate)) {
      return candidate;
    }
  }

  if (getTechniqueModuleStateDefinition(normalizedReference)) {
    return normalizedReference;
  }

  return "";
}

/**
 * Normalise ou génère une clé de référence de module.
 *
 * Priorité :
 * 1. si l’entrée correspond à un état système, renvoie la référence canonique `state.<id>` ;
 * 2. si une référence brute existe, la normalise ;
 * 3. sinon, génère une référence depuis la section et le nom du module.
 *
 * Exemple :
 * - section `keys` + nom `"Attaque lourde"` devient `key.attaque-lourde`.
 *
 * @param {unknown} referenceKey - Référence brute existante.
 * @param {object} [context={}] - Contexte de génération.
 * @param {string} [context.sectionKey=""] - Section du module.
 * @param {string} [context.name=""] - Nom du module.
 * @param {string} [context.stateId=""] - État ciblé si la section concerne les états.
 * @returns {string} Référence normalisée ou générée.
 */
export function normalizeTechniqueModuleReferenceKey(
  referenceKey = "",
  {
    sectionKey = "",
    name = "",
    stateId = ""
  } = {}
) {
  const resolvedStateId = resolveTechniqueModuleStateId({
    stateId,
    referenceKey
  });

  if (resolvedStateId) {
    return buildTechniqueModuleCanonicalStateReferenceKey(resolvedStateId);
  }

  const normalizedReference = normalizeRawReferenceKey(referenceKey);

  if (normalizedReference) return normalizedReference;

  const prefix = SECTION_REFERENCE_PREFIXES[String(sectionKey ?? "").trim()] ?? "module";
  const slug = slugifyTechniqueModuleReference(name);

  return slug ? `${prefix}.${slug}` : "";
}

/**
 * Construit les références candidates permettant de retrouver une entrée source.
 *
 * Cette fonction est utile quand une technique possède une copie d’un module de métier
 * et qu’on veut retrouver sa source malgré un changement de nom ou de référence.
 *
 * Les candidats incluent :
 * - la référence brute normalisée ;
 * - la référence canonique d’état si applicable ;
 * - la référence générée depuis la section et le nom.
 *
 * Les doublons sont automatiquement supprimés.
 *
 * @param {object} [entry={}] - Entrée de module à analyser.
 * @param {string} [sectionKey=""] - Section du module.
 * @returns {string[]} Liste de références candidates.
 */
export function buildTechniqueModuleReferenceCandidates(entry = {}, sectionKey = "") {
  const candidates = new Set();

  const rawReference = normalizeRawReferenceKey(entry?.referenceKey ?? "");
  if (rawReference) candidates.add(rawReference);

  const resolvedStateId = resolveTechniqueModuleStateId({
    stateId: entry?.stateId ?? "",
    referenceKey: entry?.referenceKey ?? ""
  });

  const canonicalStateReference = buildTechniqueModuleCanonicalStateReferenceKey(resolvedStateId);
  if (canonicalStateReference) candidates.add(canonicalStateReference);

  const generatedReference = normalizeTechniqueModuleReferenceKey("", {
    sectionKey,
    name: entry?.name ?? "",
    stateId: resolvedStateId
  });

  if (generatedReference) candidates.add(generatedReference);

  return Array.from(candidates);
}

/**
 * Construit les métadonnées de référence d’une entrée de module.
 *
 * Ces métadonnées permettent à l’interface de savoir si la référence est :
 * - présente ou manquante ;
 * - dupliquée dans la section ;
 * - liée à un état système ;
 * - générée automatiquement depuis le nom.
 *
 * @param {object} [entry={}] - Entrée de module à analyser.
 * @param {string} [sectionKey=""] - Section du module.
 * @param {Map<string, number>} [usageMap=new Map()] - Nombre d’utilisations de chaque référence.
 * @returns {{
 *   resolvedStateId: string,
 *   referenceKey: string,
 *   hasReferenceKey: boolean,
 *   hasDuplicateReference: boolean,
 *   isBuiltInStateReference: boolean,
 *   isGeneratedReference: boolean
 * }} Métadonnées de référence.
 */
export function buildTechniqueModuleReferenceMeta(
  entry = {},
  sectionKey = "",
  usageMap = new Map()
) {
  const resolvedStateId = resolveTechniqueModuleStateId({
    stateId: entry?.stateId ?? "",
    referenceKey: entry?.referenceKey ?? ""
  });

  const referenceKey = normalizeTechniqueModuleReferenceKey(entry?.referenceKey ?? "", {
    sectionKey,
    name: entry?.name ?? "",
    stateId: resolvedStateId
  });

  const count = referenceKey
    ? Number(usageMap.get(referenceKey) ?? 0) || 0
    : 0;

  const hasDuplicateReference = referenceKey
    ? count > 1
    : false;

  const isBuiltInStateReference = Boolean(resolvedStateId)
    && referenceKey === buildTechniqueModuleCanonicalStateReferenceKey(resolvedStateId);

  const isGeneratedReference = !String(entry?.referenceKey ?? "").trim()
    && Boolean(referenceKey);

  return {
    resolvedStateId,
    referenceKey,
    hasReferenceKey: Boolean(referenceKey),
    hasDuplicateReference,
    isBuiltInStateReference,
    isGeneratedReference
  };
}

/**
 * Construit une carte d’utilisation des références dans une section.
 *
 * La carte permet ensuite de détecter les doublons :
 *
 * ```txt
 * referenceKey → nombre d’utilisations
 * ```
 *
 * Les entrées sans référence valide sont ignorées.
 *
 * @param {object[]} [entries=[]] - Entrées de la section.
 * @param {string} [sectionKey=""] - Section analysée.
 * @returns {Map<string, number>} Carte d’utilisation des références.
 */
export function buildTechniqueModuleReferenceUsageMap(entries = [], sectionKey = "") {
  const usage = new Map();

  for (const entry of Array.isArray(entries) ? entries : []) {
    const referenceKey = normalizeTechniqueModuleReferenceKey(entry?.referenceKey ?? "", {
      sectionKey,
      name: entry?.name ?? "",
      stateId: entry?.stateId ?? ""
    });

    if (!referenceKey) continue;

    usage.set(referenceKey, Number(usage.get(referenceKey) ?? 0) + 1);
  }

  return usage;
}