let ctx

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, start, dur, type, vol) {
  const c = ac()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, c.currentTime + start)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(c.currentTime + start)
  osc.stop(c.currentTime + start + dur)
}

export function playPop() {
  tone(440, 0, 0.08, 'square', 0.15)
  tone(880, 0.04, 0.1, 'square', 0.12)
}

export function playJingle() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.3))
}

export function playHit() {
  tone(180, 0, 0.12, 'sawtooth', 0.3)
  tone(90, 0.02, 0.18, 'square', 0.25)
}
