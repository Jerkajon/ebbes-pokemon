export function drawBackdrop(scene) {
  const g = scene.add.graphics()
  g.fillGradientStyle(0x7ec8f0, 0x7ec8f0, 0xbfe9ff, 0xbfe9ff, 1)
  g.fillRect(0, 0, 1024, 520)
  g.fillStyle(0x6abf5e)
  g.fillRect(0, 520, 1024, 248)
}
