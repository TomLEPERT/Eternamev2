/**
 * Service de création et de synchronisation des acteurs d’invocation.
 *
 * Responsabilités :
 * - créer un acteur `invocation` à partir d’un item profil d’invocation ;
 * - synchroniser un acteur d’invocation existant avec son profil source ;
 * - recopier les attributs, la taille, l’image et les notes du profil ;
 * - appliquer les bonus générés par la puissance de la technique liée ;
 * - générer les techniques utilisables par l’invocation depuis la technique principale
 *   et les techniques débloquées par seuils ;
 * - maintenir le lien entre l’item profil d’invocation et l’acteur généré.
 *
 * Ce fichier doit rester dédié à la génération/synchronisation des acteurs d’invocation.
 * Il ne doit pas contenir la logique de fiche, de validation UI ou les définitions de règles d’invocation.
 */

import { normalizeBonusTree } from "../../rules/bonuses/bonus-tree.js";
import { ETERNAME_ATTRIBUTE_MAX_VALUE } from "../constants/attributes.js";
import {
  INVOCATION_ATTRIBUTE_KEYS,
  INVOCATION_THRESHOLD_KEYS
} from "./invocation-definitions.js";
import { buildInvocationSummary } from "./invocation-service.js";

const INVOCATION_ACTOR_FLAGS = Object.freeze({
  generatedTechnique: "generatedInvocationTechnique",
  sourceTechniqueId: "invocationSourceTechniqueId",
  sourceProfileId: "invocationSourceProfileId"
});

const ACTOR_SIZE_BY_INVOCATION_SIZE = Object.freeze({
  tiny: "very_small",
  small: "small",
  medium: "medium",
  large: "large",
  huge: "very_large",
  colossal: "colossal"
});

const TECHNIQUE_COMPONENT_SECTION_KEYS = Object.freeze([
  "keys",
  "conditions",
  "mechanics",
  "states"
]);

/**
 * Normalise une valeur en identifiant texte.
 *
 * @param {unknown} value - Valeur brute.
 * @returns {string} Identifiant nettoyé.
 */
function normalizeId(value) {
  return String(value ?? "").trim();
}

/**
 * Convertit une valeur en entier positif borné.
 *
 * Les valeurs invalides deviennent le fallback.
 * Les valeurs négatives reviennent aussi au fallback.
 *
 * @param {unknown} value - Valeur brute.
 * @param {number} [fallback=0] - Valeur utilisée si l’entrée est invalide ou négative.
 * @param {number} [max=Number.POSITIVE_INFINITY] - Valeur maximale autorisée.
 * @returns {number} Entier positif borné.
 */
function normalizePositiveInteger(
  value,
  fallback = 0,
  max = Number.POSITIVE_INFINITY
) {
  const numericValue = Number(value ?? fallback);

  if (!Number.isFinite(numericValue)) return fallback;

  const normalized = Math.floor(numericValue);

  if (normalized < 0) return fallback;

  return Math.min(normalized, max);
}

/**
 * Construit les updates d’attributs pour un acteur d’invocation.
 *
 * Chaque attribut reçoit :
 * - une valeur bornée entre 0 et `ETERNAME_ATTRIBUTE_MAX_VALUE` ;
 * - des ticks remis à 0.
 *
 * @param {object} [attributes={}] - Attributs bruts du profil d’invocation.
 * @returns {Record<string, number>} Updates Foundry au format chemin pointé.
 */
function buildInvocationActorAttributeUpdates(attributes = {}) {
  const updates = {};

  for (const key of INVOCATION_ATTRIBUTE_KEYS) {
    updates[`system.attributes.${key}.value`] = normalizePositiveInteger(
      attributes?.[key] ?? 0,
      0,
      ETERNAME_ATTRIBUTE_MAX_VALUE
    );
    updates[`system.attributes.${key}.ticks`] = 0;
  }

  return updates;
}

/**
 * Crée un arbre de bonus vide pour une invocation.
 *
 * La fonction passe par `normalizeBonusTree` pour garantir une structure complète
 * compatible avec les calculs d’acteur.
 *
 * @returns {object} Arbre de bonus normalisé.
 */
function createInvocationBonusTree() {
  return normalizeBonusTree({});
}

/**
 * Crée la structure des bonus générés par la puissance d’invocation.
 *
 * Ces données servent de trace dans l’acteur généré pour savoir quels bonus
 * ont été appliqués depuis le profil.
 *
 * @returns {{damageDiceBonus: number, magicTypes: string[], appliedPowerBoons: object[]}} Bonus générés.
 */
function createInvocationGeneratedBonuses() {
  return {
    damageDiceBonus: 0,
    magicTypes: [],
    appliedPowerBoons: []
  };
}

/**
 * Normalise une liste de chaînes uniques.
 *
 * @param {unknown[]} [values=[]] - Valeurs brutes.
 * @returns {string[]} Chaînes uniques non vides.
 */
function uniqueStrings(values = []) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
  ));
}

/**
 * Crée les entrées de magie générées par les bonus de puissance.
 *
 * Attention :
 * cette fonction génère de nouveaux ids à chaque appel. C’est acceptable si la magie
 * est entièrement régénérée à chaque synchronisation, mais cela peut réinitialiser
 * l’état courant des entrées existantes.
 *
 * @param {string[]} [types=[]] - Types de magie générés.
 * @returns {{id: string, type: string, current: number}[]} Entrées de magie.
 */
function createInvocationMagicEntries(types = []) {
  return uniqueStrings(types).map((type) => ({
    id: foundry.utils.randomID(),
    type,
    current: 0
  }));
}

/**
 * Construit les effets générés d’une invocation.
 *
 * Les effets proviennent des bonus de puissance actuellement appliqués.
 * Ils peuvent modifier :
 * - les PV max ;
 * - les attributs ;
 * - les dégâts ;
 * - la défense ;
 * - les précisions d’attaque ;
 * - les sauvegardes ;
 * - les types de magie disponibles.
 *
 * @param {Item} invocationItem - Item profil d’invocation.
 * @param {Actor} sourceActor - Acteur source possédant le profil.
 * @param {object|null} [summary=null] - Résumé d’invocation déjà calculé.
 * @returns {{bonuses: object, magicEntries: object[], generatedBonuses: object}} Effets générés.
 */
function buildInvocationGeneratedEffects(invocationItem, sourceActor, summary = null) {
  const resolvedSummary = summary ?? buildInvocationSummary(invocationItem, sourceActor);

  const bonuses = createInvocationBonusTree();
  const generatedBonuses = createInvocationGeneratedBonuses();
  const magicTypes = [];

  for (const entry of resolvedSummary.powerBoons ?? []) {
    const applied = Boolean(entry.isApplied);

    generatedBonuses.appliedPowerBoons.push({
      id: String(entry.id ?? ""),
      type: String(entry.type ?? ""),
      target: String(entry.target ?? ""),
      applied
    });

    if (!applied) continue;

    switch (String(entry.type ?? "")) {
      case "hp":
        bonuses.hpMax += 1;
        break;

      case "attribute":
        if (entry.target && entry.target in bonuses.attributesValue) {
          bonuses.attributesValue[entry.target] += 1;
        }
        break;

      case "damage":
        generatedBonuses.damageDiceBonus += 1;
        break;

      case "defense":
        bonuses.combat.def += 1;
        break;

      case "attack":
        if (entry.target && entry.target in bonuses.combat) {
          bonuses.combat[entry.target] += 1;
        }
        break;

      case "save":
        if (entry.target && entry.target in bonuses.saves) {
          bonuses.saves[entry.target] += 1;
        }
        break;

      case "magic":
        if (entry.target) magicTypes.push(entry.target);
        break;

      default:
        break;
    }
  }

  generatedBonuses.magicTypes = uniqueStrings(magicTypes);

  return {
    bonuses: normalizeBonusTree(bonuses),
    magicEntries: createInvocationMagicEntries(generatedBonuses.magicTypes),
    generatedBonuses
  };
}

/**
 * Construit les données initiales d’un acteur d’invocation.
 *
 * Cette fonction est utilisée uniquement lors de la création d’un nouvel acteur.
 *
 * @param {Actor} sourceActor - Acteur source possédant le profil.
 * @param {Item} invocationItem - Item profil d’invocation.
 * @param {object} summary - Résumé d’invocation.
 * @returns {object} Données complètes pour `Actor.create`.
 */
function buildInvocationActorBaseData(sourceActor, invocationItem, summary) {
  const effects = buildInvocationGeneratedEffects(invocationItem, sourceActor, summary);

  return {
    name: invocationItem.name,
    type: "invocation",
    img: invocationItem.img,
    prototypeToken: {
      name: invocationItem.name,
      actorLink: true,
      texture: {
        src: invocationItem.img
      }
    },
    system: {
      identity: {
        description: String(invocationItem.system?.description ?? ""),
        gmNotes: String(invocationItem.system?.notes ?? ""),
        size: ACTOR_SIZE_BY_INVOCATION_SIZE[summary.size] ?? "medium"
      },
      invocation: {
        sourceActorId: normalizeId(sourceActor?.id),
        profileItemId: normalizeId(invocationItem?.id),
        sourceTechniqueId: normalizeId(invocationItem.system?.techniqueId),
        sourceInvocationSize: summary.size,
        generatedFromPower: normalizePositiveInteger(summary.linkedTechniquePower ?? 0),
        generatedBonuses: effects.generatedBonuses
      },
      bonuses: effects.bonuses,
      magic: effects.magicEntries,
      attributes: Object.fromEntries(
        INVOCATION_ATTRIBUTE_KEYS.map((key) => [
          key,
          {
            value: normalizePositiveInteger(
              invocationItem.system?.attributes?.[key] ?? 0,
              0,
              ETERNAME_ATTRIBUTE_MAX_VALUE
            ),
            ticks: 0
          }
        ])
      )
    }
  };
}

/**
 * Construit les updates nécessaires pour synchroniser un acteur d’invocation existant.
 *
 * Cette fonction met à jour :
 * - nom ;
 * - image ;
 * - prototype token ;
 * - identité ;
 * - lien source ;
 * - bonus générés ;
 * - magie générée ;
 * - attributs.
 *
 * @param {Actor} sourceActor - Acteur source possédant le profil.
 * @param {Item} invocationItem - Item profil d’invocation.
 * @param {object} summary - Résumé d’invocation.
 * @returns {object} Updates Foundry au format chemin pointé.
 */
function buildInvocationActorSyncUpdates(sourceActor, invocationItem, summary) {
  const effects = buildInvocationGeneratedEffects(invocationItem, sourceActor, summary);

  return {
    name: invocationItem.name,
    img: invocationItem.img,
    "prototypeToken.name": invocationItem.name,
    "prototypeToken.actorLink": true,
    "prototypeToken.texture.src": invocationItem.img,
    "system.identity.description": String(invocationItem.system?.description ?? ""),
    "system.identity.gmNotes": String(invocationItem.system?.notes ?? ""),
    "system.identity.size": ACTOR_SIZE_BY_INVOCATION_SIZE[summary.size] ?? "medium",
    "system.invocation.sourceActorId": normalizeId(sourceActor?.id),
    "system.invocation.profileItemId": normalizeId(invocationItem?.id),
    "system.invocation.sourceTechniqueId": normalizeId(invocationItem.system?.techniqueId),
    "system.invocation.sourceInvocationSize": summary.size,
    "system.invocation.generatedFromPower": normalizePositiveInteger(summary.linkedTechniquePower ?? 0),
    "system.invocation.generatedBonuses": effects.generatedBonuses,
    "system.bonuses": effects.bonuses,
    "system.magic": effects.magicEntries,
    ...buildInvocationActorAttributeUpdates(invocationItem.system?.attributes ?? {})
  };
}

/**
 * Récupère les techniques sources à copier dans l’acteur d’invocation.
 *
 * La liste contient :
 * - la technique principale liée à l’invocation ;
 * - les techniques de seuil débloquées par la puissance.
 *
 * @param {Actor} sourceActor - Acteur source.
 * @param {Item} invocationItem - Item profil d’invocation.
 * @param {object} summary - Résumé d’invocation.
 * @returns {Item[]} Techniques sources valides.
 */
function getSourceTechniques(sourceActor, invocationItem, summary) {
  const ids = [];

  const primaryTechniqueId = normalizeId(invocationItem.system?.techniqueId);
  if (primaryTechniqueId) ids.push(primaryTechniqueId);

  for (const key of INVOCATION_THRESHOLD_KEYS) {
    const thresholdEntry = summary.thresholdSummaries?.find?.((entry) => entry.key === key);

    if (!thresholdEntry?.unlocked) continue;

    const techniqueId = normalizeId(invocationItem.system?.thresholds?.[key]?.techniqueId);
    if (techniqueId) ids.push(techniqueId);
  }

  return Array.from(new Set(ids))
    .map((id) => sourceActor?.items?.get?.(id) ?? null)
    .filter((item) => item?.type === "technique");
}

/**
 * Construit les données d’une technique générée pour l’acteur d’invocation.
 *
 * La technique est copiée depuis la source, puis nettoyée :
 * - suppression de l’id ;
 * - suppression des données dérivées ;
 * - préparation forcée ;
 * - suppression des métiers sources ;
 * - suppression des liens de source métier dans les composants ;
 * - ajout de flags permettant d’identifier la technique générée.
 *
 * @param {Item} sourceTechnique - Technique source à copier.
 * @param {Item} invocationItem - Profil d’invocation source.
 * @returns {object} Données d’item technique à créer.
 */
function buildGeneratedTechniqueData(sourceTechnique, invocationItem) {
  const data = sourceTechnique.toObject();

  delete data._id;
  delete data.id;

  data.system ??= {};
  delete data.system.derived;

  data.system.prepared = true;
  data.system.professionIds = [];

  for (const key of TECHNIQUE_COMPONENT_SECTION_KEYS) {
    if (!Array.isArray(data.system[key])) continue;

    data.system[key] = data.system[key].map((entry) => ({
      ...entry,
      sourceProfessionId: "",
      sourceEntryId: "",
      sourceReferenceKey: "",
      sourceLabel: ""
    }));
  }

  data.flags ??= {};
  data.flags.eternamev2 ??= {};
  data.flags.eternamev2[INVOCATION_ACTOR_FLAGS.generatedTechnique] = true;
  data.flags.eternamev2[INVOCATION_ACTOR_FLAGS.sourceTechniqueId] = sourceTechnique.id;
  data.flags.eternamev2[INVOCATION_ACTOR_FLAGS.sourceProfileId] = invocationItem.id;

  return data;
}

/**
 * Récupère les techniques générées pour un profil d’invocation donné.
 *
 * @param {Actor} actor - Acteur d’invocation.
 * @param {string} profileId - Id de l’item profil d’invocation.
 * @returns {Item[]} Techniques générées liées à ce profil.
 */
function getGeneratedTechniquesForProfile(actor, profileId) {
  return actor.items.contents.filter((item) => {
    const flags = item.flags?.eternamev2 ?? {};

    return item.type === "technique"
      && flags[INVOCATION_ACTOR_FLAGS.generatedTechnique] === true
      && normalizeId(flags[INVOCATION_ACTOR_FLAGS.sourceProfileId]) === normalizeId(profileId);
  });
}

/**
 * Remplace les techniques générées d’un acteur d’invocation.
 *
 * La synchronisation supprime d’abord les anciennes techniques générées pour ce profil,
 * puis recrée les techniques depuis les sources actuellement valides.
 *
 * @param {Actor} actor - Acteur d’invocation à modifier.
 * @param {Actor} sourceActor - Acteur source.
 * @param {Item} invocationItem - Profil d’invocation.
 * @param {object} summary - Résumé d’invocation.
 * @returns {Promise<Item[]>} Techniques créées.
 */
async function replaceGeneratedTechniques(actor, sourceActor, invocationItem, summary) {
  const existing = getGeneratedTechniquesForProfile(actor, invocationItem.id);

  if (existing.length) {
    await actor.deleteEmbeddedDocuments(
      "Item",
      existing.map((item) => item.id),
      { render: false }
    );
  }

  const sourceTechniques = getSourceTechniques(sourceActor, invocationItem, summary);

  if (!sourceTechniques.length) return [];

  return actor.createEmbeddedDocuments(
    "Item",
    sourceTechniques.map((technique) => buildGeneratedTechniqueData(technique, invocationItem)),
    { render: false }
  );
}

/**
 * Récupère l’acteur d’invocation lié à un profil.
 *
 * Le lien est stocké dans `system.actorId` de l’item invocation.
 *
 * @param {Item} invocationItem - Profil d’invocation.
 * @returns {Actor|null} Acteur lié, ou `null`.
 */
export function getLinkedInvocationActor(invocationItem) {
  const actorId = normalizeId(invocationItem?.system?.actorId);

  if (!actorId) return null;

  return game.actors?.get?.(actorId) ?? null;
}

/**
 * Crée un nouvel acteur d’invocation depuis un profil.
 *
 * Après création :
 * - les techniques générées sont copiées ;
 * - l’id de l’acteur créé est enregistré dans le profil.
 *
 * @param {Actor} sourceActor - Acteur source possédant le profil.
 * @param {Item} invocationItem - Item profil d’invocation.
 * @returns {Promise<Actor|null>} Acteur créé, ou `null`.
 */
export async function createInvocationActorFromProfile(sourceActor, invocationItem) {
  const summary = buildInvocationSummary(invocationItem, sourceActor);
  const actorData = buildInvocationActorBaseData(sourceActor, invocationItem, summary);
  const created = await Actor.create(actorData, { renderSheet: false });

  if (!created) return null;

  await replaceGeneratedTechniques(created, sourceActor, invocationItem, summary);
  await invocationItem.update({ "system.actorId": created.id }, { render: false });

  return created;
}

/**
 * Synchronise un acteur d’invocation existant avec son profil source.
 *
 * La synchronisation met à jour :
 * - les données principales de l’acteur ;
 * - ses bonus générés ;
 * - ses attributs ;
 * - ses techniques générées ;
 * - le lien `system.actorId` du profil si nécessaire.
 *
 * @param {Actor} actor - Acteur d’invocation à synchroniser.
 * @param {Actor} sourceActor - Acteur source possédant le profil.
 * @param {Item} invocationItem - Item profil d’invocation.
 * @returns {Promise<Actor>} Acteur synchronisé.
 */
export async function syncInvocationActorFromProfile(actor, sourceActor, invocationItem) {
  const summary = buildInvocationSummary(invocationItem, sourceActor);

  await actor.update(
    buildInvocationActorSyncUpdates(sourceActor, invocationItem, summary),
    { render: false }
  );

  await replaceGeneratedTechniques(actor, sourceActor, invocationItem, summary);

  if (normalizeId(invocationItem.system?.actorId) !== normalizeId(actor.id)) {
    await invocationItem.update({ "system.actorId": actor.id }, { render: false });
  }

  return actor;
}

/**
 * Crée ou synchronise l’acteur lié à un profil d’invocation.
 *
 * Si le profil possède déjà un acteur lié, celui-ci est synchronisé.
 * Sinon, un nouvel acteur d’invocation est créé.
 *
 * @param {Actor} sourceActor - Acteur source possédant le profil.
 * @param {Item} invocationItem - Item profil d’invocation.
 * @returns {Promise<Actor|null>} Acteur créé ou synchronisé.
 */
export async function createOrSyncInvocationActor(sourceActor, invocationItem) {
  const linkedActor = getLinkedInvocationActor(invocationItem);

  if (linkedActor) {
    return syncInvocationActorFromProfile(linkedActor, sourceActor, invocationItem);
  }

  return createInvocationActorFromProfile(sourceActor, invocationItem);
}