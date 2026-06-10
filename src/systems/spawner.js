export function pickPokemon(allIds, caughtIds, rng = Math.random) {
  const caught = new Set(caughtIds)
  const pool = allIds.flatMap(id => (caught.has(id) ? [id] : [id, id, id]))
  return pool[Math.floor(rng() * pool.length)]
}
