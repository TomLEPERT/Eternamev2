/**
 * Helpers partagés pour gérer le drag/drop d’items dans les feuilles du système.
 *
 * Responsabilités :
 * - lire les données d’un événement de drop Foundry ;
 * - résoudre un item depuis un UUID, un compendium ou la sidebar ;
 * - cloner un item déposé dans l’inventaire d’un acteur ;
 * - éviter les créations multiples causées par plusieurs handlers de drop déclenchés en même temps.
 *
 * Ce fichier ne doit pas contenir de logique spécifique à une fiche particulière.
 * Les règles propres à une feuille doivent passer par les options, notamment `allowedTypes` et `transform`.
 */

/**
 * Verrou anti-doublon pour éviter qu’un même item soit créé plusieurs fois
 * lorsqu’un drop déclenche plusieurs handlers ou plusieurs rendus rapprochés.
 *
 * La clé utilisée est l’UUID de l’item source.
 *
 * @type {Set<string>}
 */
const DROP_LOCK = new Set();

/**
 * Résout l’item déposé depuis un événement de drag/drop Foundry.
 *
 * La fonction supporte plusieurs formats de données :
 * - drop moderne avec `uuid` ;
 * - drop d’un item de compendium avec `pack` et `id` ;
 * - drop d’un item du monde avec `type: "Item"` et `id`.
 *
 * En cas d’erreur de parsing, d’UUID invalide ou de document non-item,
 * la fonction renvoie `null` au lieu de lancer une exception.
 *
 * @param {DragEvent} event - Événement de drop reçu par le listener.
 * @returns {Promise<Item|null>} Item résolu, ou `null` si le drop n’est pas un item valide.
 */
export async function resolveDroppedItem(event) {
  let data = null;

  try {
    const dragDropApi = foundry.applications?.ux?.TextEditor?.implementation;

    data = typeof dragDropApi?.getDragEventData === "function"
      ? dragDropApi.getDragEventData(event)
      : JSON.parse(event.dataTransfer?.getData("text/plain") || "{}");
  } catch (_err) {
    return null;
  }

  const uuid = String(data?.uuid ?? "");

  if (uuid) {
    try {
      const doc = await fromUuid(uuid);
      return doc?.documentName === "Item" ? doc : null;
    } catch (_err) {
      return null;
    }
  }

  const type = String(data?.type ?? "");
  const id = String(data?.id ?? "");
  const pack = String(data?.pack ?? "");

  if (type !== "Item" || !id) return null;

  if (pack) {
    try {
      const doc = await fromUuid(`Compendium.${pack}.${id}`);
      return doc?.documentName === "Item" ? doc : null;
    } catch (_err) {
      return null;
    }
  }

  const doc = game.items?.get(id);
  return doc?.documentName === "Item" ? doc : null;
}

/**
 * Clone un item déposé dans les items possédés d’un acteur.
 *
 * La fonction :
 * - vérifie que l’acteur et l’item source existent ;
 * - filtre le type d’item si `allowedTypes` est fourni ;
 * - empêche le double drop d’une même source grâce à `DROP_LOCK` ;
 * - supprime l’ancien `_id` pour laisser Foundry créer un nouvel item embedded ;
 * - conserve l’UUID d’origine dans un flag ;
 * - applique une transformation optionnelle avant création ;
 * - crée l’item dans l’acteur.
 *
 * `transform` permet d’adapter l’item cloné selon le contexte :
 * par exemple changer une quantité, forcer un état préparé,
 * nettoyer certaines données ou ajouter des flags système.
 *
 * @param {Actor} actor - Acteur qui reçoit l’item.
 * @param {Item} itemDoc - Item source à cloner.
 * @param {object} [options] - Options de clonage.
 * @param {string[]} [options.allowedTypes=[]] - Types d’items autorisés. Vide = tous les types.
 * @param {Function|null} [options.transform=null] - Fonction optionnelle de transformation des données.
 * @param {string} [options.sourceFlag="flags.core.sourceId"] - Chemin du flag où stocker l’UUID source.
 * @returns {Promise<Item|null>} Item créé dans l’acteur, ou `null` si la création est annulée.
 */
export async function cloneDroppedItemToActor(actor, itemDoc, {
  allowedTypes = [],
  transform = null,
  sourceFlag = "flags.core.sourceId"
} = {}) {
  if (!actor || !itemDoc) return null;

  const itemType = String(itemDoc.type ?? "");

  if (Array.isArray(allowedTypes) && allowedTypes.length > 0 && !allowedTypes.includes(itemType)) {
    ui.notifications.warn(game.i18n.localize("ETERN.INVENTORY.ERROR_INVALID_DROP_TYPE"));
    return null;
  }

  const sourceId = itemDoc.uuid;

  if (!sourceId) return null;
  if (DROP_LOCK.has(sourceId)) return null;

  DROP_LOCK.add(sourceId);

  try {
    let itemData = itemDoc.toObject();

    delete itemData._id;

    foundry.utils.setProperty(itemData, sourceFlag, sourceId);

    if (typeof transform === "function") {
      itemData = (await transform(itemData, itemDoc)) ?? itemData;
    }

    const created = await actor.createEmbeddedDocuments("Item", [itemData]);

    return created?.[0] ?? null;
  } finally {
    DROP_LOCK.delete(sourceId);
  }
}