/**
 * Module d’action technique acteur : Bindings.
 *
 * Responsabilités :
 * - isoler les interactions d’interface liées aux techniques d’acteur ;
 * - préparer les données nécessaires aux handlers ApplicationV2 ;
 * - déléguer la logique métier aux services système plutôt que de la dupliquer dans la fiche.
 *
 * Ce fichier doit rester centré sur le comportement UI d’une zone précise de la fiche acteur.
 */

const TECHNIQUE_BINDINGS = [
  ['[data-action="create-profession-item"]', 'boundCreateProfessionItem', 'click', '_onCreateProfessionItem'],
  ['[data-action="create-technique-item"]', 'boundCreateTechniqueItem', 'click', '_onCreateTechniqueItem'],
  ['[data-action="create-heritage-item"]', 'boundCreateHeritageItem', 'click', '_onCreateHeritageItem'],
  ['[data-action="create-invocation-item"]', 'boundCreateInvocationItem', 'click', '_onCreateInvocationItem'],
  ['[data-action="create-technique-from-profession"]', 'boundCreateTechniqueFromProfession', 'click', '_onCreateTechniqueFromProfession'],
  ['[data-action="open-technique-item"]', 'boundOpenTechniqueItem', 'click', '_onOpenTechniqueItem'],
  ['[data-action="duplicate-technique-item"]', 'boundDuplicateTechniqueItem', 'click', '_onDuplicateTechniqueItem'],
  ['[data-action="duplicate-heritage-item"]', 'boundDuplicateHeritageItem', 'click', '_onDuplicateHeritageItem'],
  ['[data-action="toggle-technique-prepared"]', 'boundToggleTechniquePrepared', 'click', '_onToggleTechniquePrepared'],
  ['[data-action="toggle-heritage-active"]', 'boundToggleHeritageActive', 'click', '_onToggleHeritageActive'],
  ['[data-action="toggle-heritage-prepared"]', 'boundToggleHeritagePrepared', 'click', '_onToggleHeritagePrepared'],
  ['[data-action="toggle-profession-passive-active"]', 'boundToggleProfessionPassiveActive', 'click', '_onToggleProfessionPassiveActive'],
  ['[data-action="adjust-profession-counter"]', 'boundAdjustProfessionCounter', 'click', '_onAdjustProfessionCounter'],
  ['[data-action="toggle-profession-progress-box"]', 'boundToggleProfessionProgressBox', 'click', '_onToggleProfessionProgressBox'],
  ['[data-action="roll-profession-progress-test"]', 'boundRollProfessionProgressTest', 'click', '_onRollProfessionProgressTest'],
  ['[data-action="use-technique-item"]', 'boundUseTechniqueItem', 'click', '_onUseTechniqueItem'],
  ['[data-action="use-heritage-item"]', 'boundUseHeritageItem', 'click', '_onUseHeritageItem'],
  ['[data-action="create-invocation-actor"]', 'boundCreateInvocationActor', 'click', '_onCreateInvocationActor'],
  ['[data-action="sync-invocation-actor"]', 'boundSyncInvocationActor', 'click', '_onSyncInvocationActor'],
  ['[data-action="open-invocation-actor"]', 'boundOpenInvocationActor', 'click', '_onOpenInvocationActor'],
  ['[data-technique-search]', 'boundTechniqueSearch', 'input', '_onTechniqueSearchInput'],
  ['[data-technique-filter="prepared"]', 'boundTechniquePreparedFilter', 'change', '_onTechniquePreparedFilterChange'],
  ['[data-technique-sort]', 'boundTechniqueSort', 'change', '_onTechniqueSortChange']
];

export function registerTechniqueBindings(ActorSheetClass) {
  ActorSheetClass.prototype._bindTechniqueControls = function(root) {
    for (const [selector, datasetKey, eventName, handlerName] of TECHNIQUE_BINDINGS) {
      this._bindElements(root, { selector, datasetKey, eventName, handlerName });
    }

    this._restoreTechniqueFilters(root);
    this._applyTechniqueFilters(root);
  };
}
