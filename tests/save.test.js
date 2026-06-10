import { describe, it, expect } from 'vitest'
import { loadCaught, addCaught } from '../src/systems/save.js'

function fakeStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v) },
  }
}

describe('save', () => {
  it('ger tom lista när inget är sparat', () => {
    expect(loadCaught(fakeStorage())).toEqual([])
  })

  it('ger tom lista vid korrupt data istället för att krascha', () => {
    expect(loadCaught(fakeStorage({ 'ebbe-pokedex-v1': 'inte{{json' }))).toEqual([])
  })

  it('ger tom lista om sparad data inte är en array', () => {
    expect(loadCaught(fakeStorage({ 'ebbe-pokedex-v1': '{"a":1}' }))).toEqual([])
  })

  it('lägger till och läser tillbaka fångade pokemon', () => {
    const s = fakeStorage()
    addCaught(25, s)
    addCaught(1, s)
    expect(loadCaught(s)).toEqual([25, 1])
  })

  it('dubblerar inte samma pokemon', () => {
    const s = fakeStorage()
    addCaught(25, s)
    addCaught(25, s)
    expect(loadCaught(s)).toEqual([25])
  })

  it('kraschar inte om setItem kastar (fullt/avstängt localStorage)', () => {
    const s = { getItem: () => null, setItem: () => { throw new Error('kvotfullt') } }
    expect(() => addCaught(25, s)).not.toThrow()
  })
})
