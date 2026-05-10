/**
 * Règle pure d’état : State effects.
 *
 * Responsabilités :
 * - convertir les états actifs en modificateurs de règle ;
 * - centraliser les effets mécaniques des conditions ;
 * - éviter de répéter les mêmes calculs dans plusieurs fiches.
 *
 * Ce fichier doit rester sans logique d’affichage.
 */

export function getStateEffects(system = {}) {
  const states = system?.states ?? {};
  const active = (id) => Boolean(states?.[id]?.active);
  return {
    allTestsDisadvantage: active("weakened"),
    attackDisadvantage: active("destabilized"),
    perceptionDisadvantage: active("blinded"),
    blindAttackDisadvantage: active("blinded"),
    defenseModifier: (active("prone") ? -3 : 0) + (active("blinded") ? -3 : 0),
    attackModifier: active("prone") ? -3 : 0,
    saveModifier: active("shock") ? -1 : 0,
    hpMaxModifier: 0,
    movementMultiplier: active("immobilized") ? 0 : (active("slowed") ? 0.5 : 1)
  };
}
