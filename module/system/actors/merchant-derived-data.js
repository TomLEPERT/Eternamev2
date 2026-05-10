/**
 * Service système d’acteur : Merchant derived data.
 *
 * Responsabilités :
 * - préparer ou normaliser les données acteur du système Etername ;
 * - composer les règles pures issues de `module/rules` ;
 * - séparer les données source des données calculées placées dans `system.derived`.
 *
 * Ce fichier doit rester un service métier et ne pas gérer le DOM.
 */

export function prepareMerchantDerivedData(actor) {
  const system = actor.system;
  if (!system) return;

  system.description ??= '';
  system.wealth ??= { pp: 0, rc: 0, po: 0, pa: 0, pc: 0 };
  system.trade ??= {};
  system.trade.acceptedTypes ??= {
    weapon: true,
    armor: true,
    shield: true,
    gear: true,
    object: true,
    tool: true,
    material: true,
    consumable: true,
    bag: true
  };
  system.trade.acceptsLegal ??= true;
  system.trade.acceptsIllegal ??= false;

  const stockCount = actor.items.contents.reduce(
    (total, item) => total + Math.max(1, Math.floor(Number(item.system?.quantity ?? 1) || 1)),
    0
  );
  system.derived = { stockCount };
}
