/**
 * Extension de fiche acteur : Actor sheet render.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

export function bindCharacterSheetRender(root, context = {}, options = {}) {
  this._bindTabs(root);
  this._restoreViewState(root);

  this._bindPortrait(root);
  this._bindAutosaveFields(root);
  this._bindResourceControls(root);
  this._bindRollControls(root);
  this._bindMovementControls(root);
  this._bindMagicControls(root);
  this._bindOwnedItemControls(root);
  this._bindInventoryControls(root);
  this._bindInventoryDraggables(root);
  this._bindTechniqueControls(root);
  this._bindAttackControls(root);
  this._bindSaveControls(root);
  this._bindProgressionControls(root);
  this._bindStateControls(root);
}

export function registerActorSheetRender(ActorSheetClass) {
  ActorSheetClass.prototype._bindElements = function(root, {
    selector,
    datasetKey,
    eventName,
    handlerName,
    filter = null
  }) {
    if (!root) return;
    if (typeof this[handlerName] !== "function") return;

    const elements = root.querySelectorAll(selector);
    for (const element of elements) {
      if (filter && !filter(element)) continue;
      if (element.dataset[datasetKey]) continue;

      element.dataset[datasetKey] = "1";
      element.addEventListener(eventName, this[handlerName].bind(this));
    }
  };

  ActorSheetClass.prototype._bindElementEvents = function(root, {
    selector,
    datasetKey,
    events,
    handlerName,
    filter = null
  }) {
    if (!root) return;
    if (typeof this[handlerName] !== "function") return;

    const elements = root.querySelectorAll(selector);
    for (const element of elements) {
      if (filter && !filter(element)) continue;
      if (element.dataset[datasetKey]) continue;

      element.dataset[datasetKey] = "1";
      for (const eventName of events) {
        element.addEventListener(eventName, this[handlerName].bind(this));
      }
    }
  };

  ActorSheetClass.prototype._bindPortrait = function(root) {
    this._bindElements(root, {
      selector: "img.portrait-img",
      datasetKey: "boundPortrait",
      eventName: "click",
      handlerName: "_onClickPortrait"
    });
  };

  ActorSheetClass.prototype._bindAutosaveFields = function(root) {
    if (!root) return;

    this._bindElements(root, {
      selector: "textarea[name]",
      datasetKey: "boundInput",
      eventName: "input",
      handlerName: "_onFieldInput"
    });

    this._bindElements(root, {
      selector: "textarea[name]",
      datasetKey: "boundBlur",
      eventName: "blur",
      handlerName: "_onTextareaBlur"
    });

    this._bindElements(root, {
      selector: "input[name], select[name]",
      datasetKey: "boundInput",
      eventName: "input",
      handlerName: "_onFieldInput",
      filter: (field) =>
        field instanceof HTMLInputElement &&
        field.type !== "checkbox" &&
        field.type !== "radio"
    });

    this._bindElements(root, {
      selector: "input[name], select[name]",
      datasetKey: "boundChange",
      eventName: "change",
      handlerName: "_onFieldChange"
    });

    this._bindElements(root, {
      selector: "input[name], select[name]",
      datasetKey: "boundBlurFlush",
      eventName: "blur",
      handlerName: "_onFieldChange"
    });
  };

  ActorSheetClass.prototype._bindResourceControls = function(root) {
    this._bindElements(root, {
      selector: '.accustomance-track-box[data-index]',
      datasetKey: "boundAccustomanceBox",
      eventName: "click",
      handlerName: "_onAccustomanceBoxClick"
    });

    this._bindElements(root, {
      selector: '[data-action="accustomance-adjust-disabled"]',
      datasetKey: "boundAccustomanceAdjust",
      eventName: "click",
      handlerName: "_onAccustomanceAdjustDisabled"
    });

    this._bindElements(root, {
      selector: '.hp-track-box[data-index]',
      datasetKey: "boundHpBox",
      eventName: "click",
      handlerName: "_onHpBoxClick"
    });

    this._bindElements(root, {
      selector: '[data-action="hp-adjust-severe"]',
      datasetKey: "boundHpSevere",
      eventName: "click",
      handlerName: "_onHpAdjustSevereWounds"
    });
  };

  ActorSheetClass.prototype._bindRollControls = function(root) {
    this._bindElements(root, {
      selector: ".attribute-tick[data-attr]",
      datasetKey: "boundTick",
      eventName: "click",
      handlerName: "_onAttributeTickClick"
    });

    this._bindElements(root, {
      selector: ".attribute-roll[data-attr]",
      datasetKey: "boundRoll",
      eventName: "click",
      handlerName: "_onAttributeRollClick"
    });

    this._bindElements(root, {
      selector: '[data-action="roll-overdose"]',
      datasetKey: "boundOverdoseRoll",
      eventName: "click",
      handlerName: "_onOverdoseRollClick"
    });
  };

  ActorSheetClass.prototype._bindMovementControls = function(root) {
    this._bindElements(root, {
      selector: '[data-action="create-movement-mode"]',
      datasetKey: "boundCreateMovementMode",
      eventName: "click",
      handlerName: "_onCreateMovementMode"
    });

    this._bindElements(root, {
      selector: '[data-action="delete-movement-mode"]',
      datasetKey: "boundDeleteMovementMode",
      eventName: "click",
      handlerName: "_onDeleteMovementMode"
    });

    this._bindElementEvents(root, {
      selector: '[data-mode-id][data-mode-field]',
      datasetKey: "boundMovementField",
      events: ["change", "blur"],
      handlerName: "_onMovementModeFieldChange"
    });
  };

  ActorSheetClass.prototype._bindMagicControls = function(root) {
    this._bindElements(root, {
      selector: '[data-action="create-magic-pool"]',
      datasetKey: "boundCreateMagicPool",
      eventName: "click",
      handlerName: "_onCreateMagicPool"
    });

    this._bindElements(root, {
      selector: '[data-action="delete-magic-pool"]',
      datasetKey: "boundDeleteMagicPool",
      eventName: "click",
      handlerName: "_onDeleteMagicPool"
    });

    this._bindElementEvents(root, {
      selector: '[data-magic-id][data-magic-field="current"]',
      datasetKey: "boundMagicField",
      events: ["change", "blur"],
      handlerName: "_onMagicPoolCurrentChange"
    });

    this._bindElements(root, {
      selector: '[data-action="adjust-magic-pool"]',
      datasetKey: "boundAdjustMagicPool",
      eventName: "click",
      handlerName: "_onMagicPoolAdjust"
    });
  };


  ActorSheetClass.prototype._bindAttackControls = function(root) {
    this._bindElements(root, {
      selector: "[data-action=\"create-attack\"]",
      datasetKey: "boundCreateAttack",
      eventName: "click",
      handlerName: "_onCreateAttack"
    });

    this._bindElements(root, {
      selector: "[data-action=\"delete-attack\"]",
      datasetKey: "boundDeleteAttack",
      eventName: "click",
      handlerName: "_onDeleteAttack"
    });

    this._bindElementEvents(root, {
      selector: "[data-attack-index][data-attack-field]",
      datasetKey: "boundAttackField",
      events: ["change", "blur"],
      handlerName: "_onAttackFieldChange"
    });

    this._bindElements(root, {
      selector: "[data-action=\"edit-weapon-attack\"]",
      datasetKey: "boundEditWeaponAttack",
      eventName: "click",
      handlerName: "_onEditWeaponAttack"
    });

    this._bindElements(root, {
      selector: "[data-action=\"roll-attack\"]",
      datasetKey: "boundRollAttack",
      eventName: "click",
      handlerName: "_onAttackRollClick"
    });
  };

  ActorSheetClass.prototype._bindSaveControls = function(root) {
    this._bindElements(root, {
      selector: ".save-track-box[data-save-key][data-box-index]",
      datasetKey: "boundSaveBox",
      eventName: "click",
      handlerName: "_onSaveBoxClick"
    });
  };


  ActorSheetClass.prototype._bindProgressionControls = function(root) {
    this._bindElements(root, {
      selector: '[data-action="create-progress-track"]',
      datasetKey: 'boundCreateProgressTrack',
      eventName: 'click',
      handlerName: '_onCreateProgressTrack'
    });

    this._bindElements(root, {
      selector: '[data-action="delete-progress-track"]',
      datasetKey: 'boundDeleteProgressTrack',
      eventName: 'click',
      handlerName: '_onDeleteProgressTrack'
    });

    this._bindElementEvents(root, {
      selector: '[data-track-index][data-track-field]',
      datasetKey: 'boundProgressTrackField',
      events: ['input', 'change', 'blur'],
      handlerName: '_onProgressTrackFieldInput'
    });

    this._bindElements(root, {
      selector: '.progress-track-box[data-track-index][data-box-index]',
      datasetKey: 'boundProgressTrackBox',
      eventName: 'click',
      handlerName: '_onProgressTrackBoxClick'
    });
  };

  ActorSheetClass.prototype._bindInventoryControls = function(root) {
    this._bindElements(root, {
      selector: '[data-action="inventory-create"]',
      datasetKey: "boundInventoryCreate",
      eventName: "click",
      handlerName: "_onInventoryCreate"
    });

    this._bindElements(root, {
      selector: '[data-action="inventory-edit"]',
      datasetKey: "boundInventoryEdit",
      eventName: "click",
      handlerName: "_onInventoryEdit"
    });

    this._bindElements(root, {
      selector: '[data-action="inventory-qty"]',
      datasetKey: "boundInventoryQty",
      eventName: "click",
      handlerName: "_onInventoryAdjustQty"
    });

    this._bindElements(root, {
      selector: '[data-action="inventory-move"]',
      datasetKey: "boundInventoryMove",
      eventName: "click",
      handlerName: "_onInventoryMove"
    });

    this._bindElements(root, {
      selector: '[data-action="inventory-delete"]',
      datasetKey: "boundInventoryDelete",
      eventName: "click",
      handlerName: "_onInventoryDelete"
    });

    this._bindElements(root, {
      selector: '[data-action="inventory-use"]',
      datasetKey: "boundInventoryUse",
      eventName: "click",
      handlerName: "_onInventoryUse"
    });

    this._bindElements(root, {
      selector: '.inventory-dropzone[data-location]',
      datasetKey: "boundInventoryDragover",
      eventName: "dragover",
      handlerName: "_onInventoryDropDragover"
    });

    this._bindElements(root, {
      selector: '.inventory-dropzone[data-location]',
      datasetKey: "boundInventoryDrop",
      eventName: "drop",
      handlerName: "_onInventoryDrop"
    });

    this._bindElements(root, {
      selector: '[data-action="wealth-convert"]',
      datasetKey: "boundWealthConvert",
      eventName: "click",
      handlerName: "_onWealthConvert"
    });
  };

  ActorSheetClass.prototype._bindInventoryDraggables = function(root) {
    this._bindElements(root, {
      selector: ".inv-name-button[data-action=\"inventory-edit\"]",
      datasetKey: "boundInventoryDragStart",
      eventName: "dragstart",
      handlerName: "_onInventoryDragStart"
    });
  };

  ActorSheetClass.prototype._bindOwnedItemControls = function(root) {
    this._bindElements(root, {
      selector: '[data-action="create-defense-item"]',
      datasetKey: "boundCreateDefenseItem",
      eventName: "click",
      handlerName: "_onCreateDefenseItem"
    });

    this._bindElements(root, {
      selector: 'input[data-action="toggle-owned-item"]',
      datasetKey: "boundOwnedItemToggle",
      eventName: "change",
      handlerName: "_onOwnedItemToggle"
    });

    this._bindElements(root, {
      selector: '[data-action="owned-item-toggle-equip"]',
      datasetKey: "boundOwnedItemToggleEquipButton",
      eventName: "click",
      handlerName: "_onOwnedItemToggleEquipButton"
    });

    this._bindElementEvents(root, {
      selector: "[data-item-id][data-item-path]",
      datasetKey: "boundOwnedItemField",
      events: ["change", "blur"],
      handlerName: "_onOwnedItemFieldChange"
    });

    this._bindElements(root, {
      selector: '[data-action="delete-owned-item"]',
      datasetKey: "boundDeleteOwnedItem",
      eventName: "click",
      handlerName: "_onDeleteOwnedItem"
    });
  };
}