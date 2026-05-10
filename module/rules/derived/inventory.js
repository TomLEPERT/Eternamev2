/**
 * Règle pure de donnée dérivée : Inventory.
 *
 * Responsabilités :
 * - calculer une valeur de jeu à partir des données source ;
 * - éviter toute écriture directe dans les documents Foundry ;
 * - rester réutilisable par les fiches, jets et préparateurs de données.
 *
 * Ce fichier ne doit pas contenir de rendu ni de persistance.
 */

export function weightToThirds(value) {
  const weight = Number(value ?? 0);
  if (Math.abs(weight - 0.3) < 0.001) return 1;
  if (Math.abs(weight - 1) < 0.001) return 3;
  if (Math.abs(weight - 2) < 0.001) return 6;
  return Math.max(0, Math.round(weight * 3));
}

export function deriveInventoryUsage(actor, derivedAttributes = {}) {
  const strengthValue = Number(derivedAttributes?.strength?.value ?? 0);
  const safeStrength = Number.isFinite(strengthValue) ? Math.max(0, Math.floor(strengthValue)) : 0;
  const backpackCapacity = 9 + (safeStrength * 3);
  const beltCapacity = 3 + safeStrength;

  let backpackUsedThirds = 0;
  let beltUsedThirds = 0;

  for (const item of actor.items.contents) {
    const qty = Math.max(0, Math.floor(Number(item.system?.quantity ?? 1) || 0));
    const thirds = weightToThirds(item.system?.weight ?? 0);
    if (qty <= 0 || thirds <= 0) continue;

    const location = String(item.system?.location ?? "backpack");
    if (location === "bag") continue;
    if (location === "belt") beltUsedThirds += thirds * qty;
    else backpackUsedThirds += thirds * qty;
  }

  return {
    backpack: {
      capacity: backpackCapacity,
      capacityThirds: backpackCapacity * 3,
      usedThirds: backpackUsedThirds,
      used: Math.round((backpackUsedThirds / 3) * 100) / 100
    },
    belt: {
      capacity: beltCapacity,
      capacityThirds: beltCapacity * 3,
      usedThirds: beltUsedThirds,
      used: Math.round((beltUsedThirds / 3) * 100) / 100
    }
  };
}
