/**
 * Point d’entrée principal du système Etername pour Foundry VTT.
 *
 * Responsabilités :
 * - enregistrer les classes Document custom pour les Actors et Items ;
 * - associer les DataModels modernes aux types d’Actors et d’Items ;
 * - déclarer les labels de types utilisés par Foundry et l’i18n ;
 * - précharger les templates Handlebars du système ;
 * - enregistrer les feuilles ApplicationV2 utilisées par les Actors et Items ;
 * - forcer le recalcul et le rafraîchissement des fiches acteur lorsqu’un item possédé est modifié.
 *
 * Ce fichier doit rester un fichier d’amorçage.
 * Éviter d’y placer de la logique métier, de la logique UI détaillée ou des calculs de règles.
 */

import { EternameActor } from "./documents/actor.js";
import { EternameItem } from "./documents/item.js";

import { CharacterModel } from "./models/actor/character.js";
import { MerchantModel } from "./models/actor/merchant.js";
import { InvocationActorModel } from "./models/actor/invocation.js";

import {
  ArmorModel,
  BagModel,
  ConsumableModel,
  GearModel,
  HeritageModel,
  InvocationModel,
  MaterialModel,
  ObjectModel,
  ProfessionModel,
  ShieldModel,
  TechniqueModel,
  ToolModel,
  WeaponModel
} from "./models/item/index.js";

import { CharacterSheet } from "./apps/actor/actor-sheet.js";
import { MerchantSheet } from "./apps/merchant/merchant-sheet.js";
import { EternameItemSheet } from "./apps/item-sheet.js";

/**
 * Initialise le système Etername pendant le hook Foundry `init`.
 *
 * Ce hook sert uniquement à enregistrer la configuration globale du système :
 * documents, modèles de données, templates et feuilles.
 *
 * Important :
 * - ne pas accéder ici aux Actors ou Items du monde ;
 * - ne pas faire de logique dépendante d’une scène ou d’un utilisateur connecté ;
 * - réserver ces traitements à des hooks plus tardifs comme `ready`.
 */
Hooks.once("init", async () => {
  console.log("Etername | init");

  // Remplace les classes de documents Foundry par les classes custom du système.
  CONFIG.Actor.documentClass = EternameActor;
  CONFIG.Item.documentClass = EternameItem;

  // Labels i18n affichés par Foundry pour les différents types d’items.
  CONFIG.Item.typeLabels = {
    armor: "ETERN.ITEM.TYPES.ARMOR",
    consumable: "ETERN.ITEM.TYPES.CONSUMABLE",
    bag: "ETERN.ITEM.TYPES.BAG",
    profession: "ETERN.ITEM.TYPES.PROFESSION",
    technique: "ETERN.ITEM.TYPES.TECHNIQUE",
    invocation: "ETERN.ITEM.TYPES.INVOCATION",
    gear: "ETERN.ITEM.TYPES.GEAR",
    heritage: "ETERN.ITEM.TYPES.HERITAGE",
    material: "ETERN.ITEM.TYPES.MATERIAL",
    object: "ETERN.ITEM.TYPES.OBJECT",
    shield: "ETERN.ITEM.TYPES.SHIELD",
    tool: "ETERN.ITEM.TYPES.TOOL",
    weapon: "ETERN.ITEM.TYPES.WEAPON"
  };

  // Labels i18n affichés par Foundry pour les différents types d’acteurs.
  CONFIG.Actor.typeLabels = {
    character: "ETERN.ACTOR.TYPES.CHARACTER",
    merchant: "ETERN.ACTOR.TYPES.MERCHANT",
    invocation: "ETERN.ACTOR.TYPES.INVOCATION"
  };

  // Association entre les types d’acteurs et leurs DataModels.
  CONFIG.Actor.dataModels ??= {};
  CONFIG.Actor.dataModels.character = CharacterModel;
  CONFIG.Actor.dataModels.merchant = MerchantModel;
  CONFIG.Actor.dataModels.invocation = InvocationActorModel;

  // Association entre les types d’items et leurs DataModels.
  CONFIG.Item.dataModels ??= {};
  CONFIG.Item.dataModels.armor = ArmorModel;
  CONFIG.Item.dataModels.consumable = ConsumableModel;
  CONFIG.Item.dataModels.bag = BagModel;
  CONFIG.Item.dataModels.profession = ProfessionModel;
  CONFIG.Item.dataModels.technique = TechniqueModel;
  CONFIG.Item.dataModels.invocation = InvocationModel;
  CONFIG.Item.dataModels.gear = GearModel;
  CONFIG.Item.dataModels.heritage = HeritageModel;
  CONFIG.Item.dataModels.material = MaterialModel;
  CONFIG.Item.dataModels.object = ObjectModel;
  CONFIG.Item.dataModels.shield = ShieldModel;
  CONFIG.Item.dataModels.tool = ToolModel;
  CONFIG.Item.dataModels.weapon = WeaponModel;

  // Précharge les templates et partials Handlebars utilisés par les feuilles, dialogues et cartes de chat.
  await foundry.applications.handlebars.loadTemplates([
    "systems/eternamev2/templates/actor/character-sheet.hbs",
    "systems/eternamev2/templates/actor/parts/banner.hbs",
    "systems/eternamev2/templates/actor/parts/tabs.hbs",
    "systems/eternamev2/templates/actor/parts/stats/attributes.hbs",
    "systems/eternamev2/templates/actor/parts/stats/misc.hbs",
    "systems/eternamev2/templates/actor/parts/stats/defense.hbs",
    "systems/eternamev2/templates/actor/parts/stats/attacks.hbs",
    "systems/eternamev2/templates/actor/parts/stats/saves.hbs",
    "systems/eternamev2/templates/actor/parts/stats/progression.hbs",
    "systems/eternamev2/templates/dialogs/attribute-roll-dialog.hbs",
    "systems/eternamev2/templates/dialogs/attack-roll-dialog.hbs",
    "systems/eternamev2/templates/dialogs/enchantment-dialog.hbs",
    "systems/eternamev2/templates/chat/attribute-roll.hbs",
    "systems/eternamev2/templates/chat/attack-roll.hbs",
    "systems/eternamev2/templates/chat/technique-use-card.hbs",
    "systems/eternamev2/templates/dialogs/wealth-convert-dialog.hbs",
    "systems/eternamev2/templates/dialogs/inventory-item-dialog.hbs",
    "systems/eternamev2/templates/actor/tabs/identity.hbs",
    "systems/eternamev2/templates/actor/tabs/stats.hbs",
    "systems/eternamev2/templates/actor/tabs/inventory.hbs",
    "systems/eternamev2/templates/actor/tabs/techniques.hbs",
    "systems/eternamev2/templates/actor/parts/techniques/invocation-actor-summary.hbs",
    "systems/eternamev2/templates/actor/parts/techniques/profession-slots.hbs",
    "systems/eternamev2/templates/actor/parts/techniques/profession-list.hbs",
    "systems/eternamev2/templates/actor/parts/techniques/heritage-list.hbs",
    "systems/eternamev2/templates/actor/parts/techniques/heritage-row.hbs",
    "systems/eternamev2/templates/actor/parts/techniques/profession-quick-access.hbs",
    "systems/eternamev2/templates/actor/parts/techniques/prepared-techniques.hbs",
    "systems/eternamev2/templates/actor/parts/techniques/known-techniques.hbs",
    "systems/eternamev2/templates/actor/parts/techniques/invocation-list.hbs",
    "systems/eternamev2/templates/actor/tabs/bonus.hbs",
    "systems/eternamev2/templates/actor/merchant-sheet.hbs",
    "systems/eternamev2/templates/dialogs/merchant-price-dialog.hbs",
    "systems/eternamev2/templates/item/item-sheet-shell.hbs",
    "systems/eternamev2/templates/item/partials/weapon-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/armor-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/shield-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/material-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/consumable-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/bag-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/profession-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/profession-module-entry.hbs",
    "systems/eternamev2/templates/item/partials/enchantment-panel.hbs",
    "systems/eternamev2/templates/item/partials/enchantment-entry-editor.hbs",
    "systems/eternamev2/templates/item/partials/technique-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/technique-sheet-header.hbs",
    "systems/eternamev2/templates/item/partials/technique-sheet-general-tab.hbs",
    "systems/eternamev2/templates/item/partials/technique-sheet-power-tab.hbs",
    "systems/eternamev2/templates/item/partials/technique-sheet-components-tab.hbs",
    "systems/eternamev2/templates/item/partials/technique-sheet-description-tab.hbs",
    "systems/eternamev2/templates/item/partials/invocation-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/heritage-sheet-content.hbs",
    "systems/eternamev2/templates/item/partials/heritage-technique-general-panel.hbs",
    "systems/eternamev2/templates/item/partials/item-sheet-content.hbs"
  ]);

  const ActorCollection = foundry.documents.collections.Actors;
  const ItemCollection = foundry.documents.collections.Items;

  // Désactive les feuilles core pour éviter que Foundry propose les feuilles par défaut.
  ActorCollection.unregisterSheet("core", foundry.applications.sheets.ActorSheetV2);
  ItemCollection.unregisterSheet("core", foundry.applications.sheets.ItemSheetV2);

  // Enregistre la feuille unique des items du système.
  ItemCollection.registerSheet("eternamev2", EternameItemSheet, {
    makeDefault: true
  });

  // Enregistre la feuille des personnages et des acteurs d’invocation.
  ActorCollection.registerSheet("eternamev2", CharacterSheet, {
    types: ["character", "invocation"],
    makeDefault: true
  });

  // Enregistre la feuille spécifique des marchands.
  ActorCollection.registerSheet("eternamev2", MerchantSheet, {
    types: ["merchant"],
    makeDefault: true
  });
});

/**
 * Recalcule et rafraîchit la fiche d’un acteur lorsqu’un item possédé change.
 *
 * Utilité :
 * - appliquer immédiatement les bonus d’équipement, de métier, d’héritage ou de technique ;
 * - mettre à jour les données dérivées de la fiche acteur ;
 * - rafraîchir les feuilles ouvertes sans attendre une réouverture manuelle.
 *
 * La fonction ignore volontairement les items non possédés, comme les items de sidebar,
 * car ils n’ont pas d’acteur parent à recalculer.
 *
 * @param {Item} item - Item créé, modifié ou supprimé.
 * @returns {void}
 */
function rerenderOwnedActorApps(item) {
  const parent = item?.parent;

  if (!(parent instanceof Actor)) return;

  parent.prepareData();

  for (const app of Object.values(parent.apps ?? {})) {
    app?.render?.(false);
  }
}

// Quand un item possédé est modifié, la fiche acteur parente doit être recalculée.
Hooks.on("updateItem", rerenderOwnedActorApps);

// Quand un item possédé est créé, la fiche acteur parente doit être recalculée.
Hooks.on("createItem", rerenderOwnedActorApps);

// Quand un item possédé est supprimé, la fiche acteur parente doit être recalculée.
Hooks.on("deleteItem", rerenderOwnedActorApps);