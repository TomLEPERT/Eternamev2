/**
 * Règle pure de donnée dérivée : Saves.
 *
 * Responsabilités :
 * - calculer une valeur de jeu à partir des données source ;
 * - éviter toute écriture directe dans les documents Foundry ;
 * - rester réutilisable par les fiches, jets et préparateurs de données.
 *
 * Ce fichier ne doit pas contenir de rendu ni de persistance.
 */

export function deriveSaveBaseFromAttribute(value) {
  const v = Number(value ?? 0);

  if (!Number.isFinite(v) || v <= 0) return 0;
  if (v >= 15) return 6;
  if (v >= 11) return 5;
  if (v >= 8) return 4;
  if (v >= 5) return 3;
  if (v >= 3) return 2;
  return 1;
}

export function deriveSaves(saves = {}, attributes = {}) {
  const derived = {};

  for (const [key, save] of Object.entries(saves ?? {})) {
    const sourceAttr = String(save?.sourceAttr ?? "");
    const attributeValue = sourceAttr
      ? Number(attributes?.[sourceAttr]?.value ?? 0)
      : 0;

    const base = sourceAttr ? deriveSaveBaseFromAttribute(attributeValue) : 0;
    const bonus = toInt(save?.bonus);
    const bonusGear = toInt(save?.bonusGear);
    const bonusOther = toInt(save?.bonusOther);
    const total = Math.max(0, Math.min(12, base + bonus + bonusGear + bonusOther));
    const boxes = normalizeBoxes(save?.boxes);

    derived[key] = {
      key,
      name: String(save?.name ?? ""),
      sourceAttr,
      base,
      bonus,
      bonusGear,
      bonusOther,
      total,
      slots: Array.from({ length: 12 }, (_, index) => ({
        index,
        saveKey: key,
        checked: Boolean(boxes[index]),
        disabled: index >= total
      }))
    };
  }

  return derived;
}

function normalizeBoxes(value) {
  const base = Array.isArray(value) ? value.slice(0, 12) : [];
  while (base.length < 12) base.push(false);
  return base.map((entry) => Boolean(entry));
}

function toInt(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}
