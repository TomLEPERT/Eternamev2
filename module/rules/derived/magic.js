/**
 * Règle pure de donnée dérivée : Magic.
 *
 * Responsabilités :
 * - calculer une valeur de jeu à partir des données source ;
 * - éviter toute écriture directe dans les documents Foundry ;
 * - rester réutilisable par les fiches, jets et préparateurs de données.
 *
 * Ce fichier ne doit pas contenir de rendu ni de persistance.
 */

const MAGIC_TYPES = ["canalisation", "fascination", "serment"];

export function getAvailableMagicTypes() {
  return [...MAGIC_TYPES];
}

export function auraToManaRecovery(aura) {
  const a = Number(aura);
  if (!Number.isFinite(a) || a <= 0) return 0;
  if (a <= 2) return 2;
  if (a <= 4) return 4;
  if (a <= 6) return 6;
  if (a <= 8) return 8;
  if (a <= 10) return 10;
  return 12;
}

export function deriveMagicEntry(entry = {}, attributes = {}) {
  const type = MAGIC_TYPES.includes(String(entry?.type)) ? String(entry.type) : "canalisation";
  const id = String(entry?.id ?? foundry.utils.randomID());
  const currentRaw = Number(entry?.current ?? 0);
  const currentBase = Number.isFinite(currentRaw) ? Math.max(0, Math.floor(currentRaw)) : 0;

  const knowledge = Number(attributes?.knowledge?.value ?? 0);
  const instinct = Number(attributes?.instinct?.value ?? 0);
  const aura = Number(attributes?.aura?.value ?? 0);

  let current = currentBase;
  let max = null;
  let recoveryPerAction = 0;

  if (type === "canalisation") {
    max = Math.max(0, Math.floor((Number.isFinite(knowledge) ? knowledge : 0) * 2));
    current = Math.min(current, max);
  } else if (type === "fascination") {
    max = null;
    recoveryPerAction = auraToManaRecovery(aura);
  } else if (type === "serment") {
    max = Math.max(0, 30 + Math.floor(Number.isFinite(instinct) ? instinct : 0));
    current = Math.min(current, max);
  }

  return {
    id,
    type,
    current,
    max,
    recoveryPerAction
  };
}

export function deriveMagicList(entries, attributes = {}) {
  const list = Array.isArray(entries) ? entries : [];
  const seen = new Set();

  return list
    .map((entry) => deriveMagicEntry(entry, attributes))
    .filter((entry) => {
      if (seen.has(entry.type)) return false
      seen.add(entry.type);
      return true;
    });
}
