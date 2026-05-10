/**
 * Extension de fiche acteur : Actor sheet magic.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { deriveMagicList } from "../../rules/derived/magic.js";

function normalizeMagicCurrent(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.floor(number));
}

function toMagicPool(entry) {
  return {
    id: String(entry?.id ?? foundry.utils.randomID()),
    type: String(entry?.type ?? ""),
    current: normalizeMagicCurrent(entry?.current)
  };
}

export function registerActorSheetMagic(ActorSheetClass) {
  ActorSheetClass.prototype._getMagicPools = function() {
    return deriveMagicList(
      this.document.system?.magic,
      this.document.system?.attributes ?? {}
    ).map(toMagicPool);
  };

  ActorSheetClass.prototype._saveMagicPools = async function(pools, activeElement = null) {
    this._captureViewState(activeElement);

    const normalized = deriveMagicList(
      pools,
      this.document.system?.attributes ?? {}
    ).map(toMagicPool);

    await this.document.update({ "system.magic": normalized });
  };

  ActorSheetClass.prototype._onCreateMagicPool = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const wrapper = button.closest(".magic-add-inline");
    const select = wrapper?.querySelector?.('[data-role="magic-type-select"]');
    if (!(select instanceof HTMLSelectElement)) return;

    const type = select.value;
    if (!type) return;

    const pools = this._getMagicPools();
    if (pools.some((entry) => entry.type === type)) return;

    pools.push(
      toMagicPool({
        id: foundry.utils.randomID(),
        type,
        current: 0
      })
    );

    await this._saveMagicPools(pools, button);
  };

  ActorSheetClass.prototype._onDeleteMagicPool = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const poolId = button.dataset.magicId;
    if (!poolId) return;

    const pools = this._getMagicPools().filter((entry) => entry.id !== poolId);
    await this._saveMagicPools(pools, button);
  };

  ActorSheetClass.prototype._onMagicPoolCurrentChange = async function(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;

    const poolId = field.dataset.magicId;
    if (!poolId) return;

    const pools = this._getMagicPools();
    const entry = pools.find((pool) => pool.id === poolId);
    if (!entry) return;

    entry.current = normalizeMagicCurrent(field.value);

    await this._saveMagicPools(pools, field);
  };

  ActorSheetClass.prototype._onMagicPoolAdjust = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const poolId = button.dataset.magicId;
    const delta = Number(button.dataset.delta ?? 0);
    if (!poolId || !Number.isFinite(delta) || delta === 0) return;

    const derivedPools = deriveMagicList(
      this.document.system?.magic,
      this.document.system?.attributes ?? {}
    );
    const derivedEntry = derivedPools.find((entry) => entry.id === poolId);
    if (!derivedEntry) return;

    const pools = this._getMagicPools();
    const entry = pools.find((pool) => pool.id === poolId);
    if (!entry) return;

    let next = entry.current + delta;
    if (Number.isFinite(derivedEntry.max)) {
      next = Math.min(next, derivedEntry.max);
    }

    entry.current = Math.max(0, next);

    await this._saveMagicPools(pools, button);
  };
}