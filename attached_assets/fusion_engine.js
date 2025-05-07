// fusion_engine.js - Logic to attempt fusions or cause corruption

function attemptFusion(thrA, thrB) {
  const compatibilityScore = calculateCompatibility(thrA, thrB);
  if (compatibilityScore > 0.75) {
    return {
      success: true,
      result: spawnNewThringlet(thrA, thrB)
    };
  } else {
    return {
      success: false,
      corruption: true,
      message: "Fusion failed: Thringlets destabilized system state."
    };
  }
}

function calculateCompatibility(thrA, thrB) {
  const overlap = thrA.emotional_alignment.filter(e => thrB.emotional_alignment.includes(e));
  return overlap.length / Math.max(thrA.emotional_alignment.length, 1);
}

function spawnNewThringlet(thrA, thrB) {
  return {
    name: "THR-X" + Date.now(),
    backstory: `Hybrid of ${thrA.name} and ${thrB.name}, born from bonded terminal logic.`,
    abilities: [...new Set([...thrA.abilities, ...thrB.abilities])].slice(0, 3),
    weaknesses: [...new Set([...thrA.weaknesses, ...thrB.weaknesses])].slice(0, 2),
    preferences: [...new Set([...thrA.preferences, ...thrB.preferences])].slice(0, 2),
    emotional_alignment: [...new Set([...thrA.emotional_alignment, ...thrB.emotional_alignment])].slice(0, 2),
    flaws: [...new Set([...thrA.flaws, ...thrB.flaws])].slice(0, 2),
    origin: "fusion"
  };
}