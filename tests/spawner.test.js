import { describe, it, expect } from 'vitest'
import { pickPokemon } from '../src/systems/spawner.js'

describe('pickPokemon', () => {
  it('väljer första posten när rng=0', () => {
    expect(pickPokemon([1, 4, 7], [], () => 0)).toBe(1)
  })

  it('väljer sista posten när rng nära 1', () => {
    expect(pickPokemon([1, 4, 7], [], () => 0.9999)).toBe(7)
  })

  it('viktar ofångade 3x mot fångade', () => {
    // ids: [1 (fångad, vikt 1), 4 (ofångad, vikt 3)] → pool [1, 4, 4, 4]
    // rng 0.0 → index 0 → 1; rng 0.3 → index 1 → 4
    expect(pickPokemon([1, 4], [1], () => 0)).toBe(1)
    expect(pickPokemon([1, 4], [1], () => 0.3)).toBe(4)
    expect(pickPokemon([1, 4], [1], () => 0.9)).toBe(4)
  })

  it('fungerar när alla är fångade', () => {
    expect(pickPokemon([1, 4], [1, 4], () => 0.6)).toBe(4)
  })

  it('returnerar alltid ett id ur listan (fuzz)', () => {
    const ids = [1, 4, 7, 25]
    for (let i = 0; i < 200; i++) {
      expect(ids).toContain(pickPokemon(ids, [4, 25]))
    }
  })
})
