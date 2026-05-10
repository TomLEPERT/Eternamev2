/**
 * Point d’export centralisé pour la préparation des données dérivées des items.
 *
 * Responsabilités :
 * - exposer `prepareDerivedItemData` depuis le dossier `derived` ;
 * - éviter que les autres fichiers aient besoin de connaître le chemin exact
 *   de l’implémentation interne ;
 * - garder une interface d’import stable même si l’organisation du dossier
 *   `derived` évolue plus tard.
 *
 * Ce fichier ne doit contenir aucune logique.
 * Il doit uniquement réexporter les fonctions publiques du module de dérivation.
 */

export { prepareDerivedItemData } from "./derived/index.js";