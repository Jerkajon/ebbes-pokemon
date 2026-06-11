// Ängsdekor: kullar + träd/buskar per scen. Positionerna är valda så att dekoren
// aldrig överlappar interaktiva ytor (tuvor, knappar, fighters) — för en treåring
// ska bara det tryckbara se tryckbart ut.
const DECOR = {
  start: [
    { key: 'tree', x: 120, y: 444, scale: 0.9 },
    { key: 'tree', x: 912, y: 462, scale: 0.7, flip: true },
    { key: 'bush', x: 300, y: 552, scale: 0.9 },
    { key: 'bush', x: 740, y: 560, scale: 0.8, flip: true },
  ],
  catch: [
    { key: 'tree', x: 54, y: 420, scale: 0.75 },
    { key: 'tree', x: 950, y: 452, scale: 0.65, flip: true },
  ],
  arena: [
    { key: 'tree', x: 56, y: 460, scale: 0.62 },
    { key: 'bush', x: 962, y: 564, scale: 0.85, flip: true },
  ],
}

export function addMeadow(scene, preset) {
  scene.add.image(512, 446, 'hillsfar')
  scene.add.image(512, 478, 'hillsnear')
  for (const d of DECOR[preset]) {
    scene.add.image(d.x, d.y, d.key).setScale(d.scale).setFlipX(!!d.flip)
  }
}
