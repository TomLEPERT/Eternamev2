/**
 * Extension de fiche item : Item sheet render.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import { activateInitialItemTab, bindItemSheetInteractions } from './item-sheet-controller.js';

export function bindItemSheetRender(root) {
  bindItemSheetInteractions(this, root);
  activateInitialItemTab(this, root);
}
