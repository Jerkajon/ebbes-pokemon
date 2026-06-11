export function createBattle(hearts = 3) {
  let remaining = hearts
  return {
    get remaining() { return remaining },
    get won() { return remaining === 0 },
    hit() {
      if (remaining > 0) remaining--
      return remaining
    },
  }
}
