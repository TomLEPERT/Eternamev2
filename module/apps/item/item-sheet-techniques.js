/**
 * Extension de fiche item : Item sheet techniques.
 *
 * Responsabilités :
 * - préparer ou synchroniser la section correspondante de l’ItemSheetV2 ;
 * - gérer les actions utilisateur liées à l’item affiché ;
 * - éviter de mélanger rendu, règles et persistance dans un même bloc.
 *
 * Ce fichier doit rester spécialisé par section de fiche item.
 */

import { bindTechniqueArrayEntryActions } from './technique-builder/array-entry-actions.js';
import { bindTechniqueSourceActions } from './technique-builder/source-entry-actions.js';
import { bindTechniqueStatisticActions } from './technique-builder/stat-actions.js';

export function bindTechniqueBuilderListeners(sheet, root) {
  if (!root) return;

  bindTechniqueArrayEntryActions(sheet, root);
  bindTechniqueSourceActions(sheet, root);
  bindTechniqueStatisticActions(sheet, root);
}
