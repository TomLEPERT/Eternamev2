/**
 * Point d’export centralisé pour les contextes de fiches d’items.
 *
 * Responsabilités :
 * - regrouper les builders de contexte des différents types d’items ;
 * - simplifier les imports dans les feuilles ou services qui préparent l’affichage ;
 * - éviter que les autres fichiers aient besoin de connaître le chemin exact
 *   de chaque builder spécialisé.
 *
 * Ce fichier ne doit contenir aucune logique.
 * Il doit seulement réexporter des fonctions depuis les fichiers spécialisés.
 */

export { buildProfessionSheetContext } from "./sheet-context-profession.js";
export { buildTechniqueSheetContext } from "./sheet-context-technique.js";