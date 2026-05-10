/**
 * Extension de fiche acteur : Actor sheet saves.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

function normalizeSaveBoxes(boxes) {
  const list = Array.isArray(boxes) ? foundry.utils.deepClone(boxes).slice(0, 12) : [];
  while (list.length < 12) list.push(false);
  return list.map((entry) => Boolean(entry));
}

export function registerActorSheetSaves(ActorSheetClass) {
  ActorSheetClass.prototype._onSaveBoxClick = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLButtonElement)) return;

    const saveKey = String(target.dataset.saveKey ?? "");
    const boxIndex = Number(target.dataset.boxIndex);
    if (!saveKey || !Number.isInteger(boxIndex) || boxIndex < 0 || boxIndex > 11) return;

    const save = this.document.system?.saves?.[saveKey];
    const derived = this.document.system?.derived?.saves?.[saveKey];
    if (!save || !derived) return;
    if (boxIndex >= Number(derived.total ?? 0)) return;

    const boxes = normalizeSaveBoxes(save.boxes);
    boxes[boxIndex] = !boxes[boxIndex];

    this._captureViewState(target);
    await this.document.update({ [`system.saves.${saveKey}.boxes`]: boxes }, { render: false });
    this._refreshLiveView();
  };
};
