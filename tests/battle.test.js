import { describe, it, expect } from 'vitest'
import { createBattle } from '../src/systems/battle.js'

describe('createBattle', () => {
  it('startar med 3 hjärtan som default', () => {
    expect(createBattle().remaining).toBe(3)
  })

  it('tar emot eget antal hjärtan', () => {
    expect(createBattle(5).remaining).toBe(5)
  })

  it('hit() minskar med ett och returnerar kvarvarande', () => {
    const b = createBattle()
    expect(b.hit()).toBe(2)
    expect(b.remaining).toBe(2)
  })

  it('won är false tills alla hjärtan är borta', () => {
    const b = createBattle()
    b.hit()
    b.hit()
    expect(b.won).toBe(false)
    b.hit()
    expect(b.won).toBe(true)
  })

  it('hit() vid 0 stannar på 0 (inga negativa hjärtan)', () => {
    const b = createBattle(1)
    b.hit()
    expect(b.hit()).toBe(0)
    expect(b.remaining).toBe(0)
    expect(b.won).toBe(true)
  })
})
