const KEY = 'ebbe-pokedex-v1'

export function loadCaught(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(KEY))
    if (!Array.isArray(parsed)) return []
    return parsed.filter(n => Number.isInteger(n))
  } catch {
    return []
  }
}

export function addCaught(id, storage = globalThis.localStorage) {
  const caught = loadCaught(storage)
  if (!caught.includes(id)) caught.push(id)
  try {
    storage.setItem(KEY, JSON.stringify(caught))
  } catch {
    // Trasigt/fullt localStorage får aldrig krascha spelet — fångsten gäller för sessionen.
  }
  return caught
}
