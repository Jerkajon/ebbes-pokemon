// Himmel + sol + drivande moln + mark. horizonY > 600 tolkas som "albumläge"
// (pokédex/väljarvy): djup himmel, diskretare sol/moln högt upp så rutnätet får luft.
const CLOUDS_MEADOW = [
  { key: 'cloud1', x: 400, y: 84, scale: 1.0, drift: 30, dur: 11000 },
  { key: 'cloud2', x: 700, y: 150, scale: 0.75, drift: 24, dur: 14000 },
  { key: 'cloud1', x: 130, y: 180, scale: 0.55, drift: 20, dur: 9000 },
]

const CLOUDS_ALBUM = [
  { key: 'cloud2', x: 360, y: 56, scale: 0.6, drift: 22, dur: 13000 },
  { key: 'cloud1', x: 700, y: 48, scale: 0.45, drift: 18, dur: 10000 },
]

export function drawBackdrop(scene, horizonY = 520) {
  const album = horizonY > 600
  const g = scene.add.graphics()
  g.fillGradientStyle(0x6ec6f5, 0x6ec6f5, 0xcfeeff, 0xcfeeff, 1)
  g.fillRect(0, 0, 1024, horizonY)
  g.fillStyle(0x54ad53)
  g.fillRect(0, horizonY, 1024, 768 - horizonY)

  scene.add.image(album ? 920 : 220, album ? 84 : 100, 'sun').setScale(album ? 0.6 : 1)

  for (const c of (album ? CLOUDS_ALBUM : CLOUDS_MEADOW)) {
    const cloud = scene.add.image(c.x, c.y, c.key).setScale(c.scale)
    scene.tweens.add({
      targets: cloud, x: c.x + c.drift,
      duration: c.dur, yoyo: true, repeat: -1, ease: 'sine.inout',
    })
  }
}
