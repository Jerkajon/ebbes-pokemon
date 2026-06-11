export function drawBackdrop(scene, horizonY = 520) {
  const g = scene.add.graphics()
  g.fillGradientStyle(0x7ec8f0, 0x7ec8f0, 0xbfe9ff, 0xbfe9ff, 1)
  g.fillRect(0, 0, 1024, horizonY)
  g.fillStyle(0x6abf5e)
  g.fillRect(0, horizonY, 1024, 768 - horizonY)
}
