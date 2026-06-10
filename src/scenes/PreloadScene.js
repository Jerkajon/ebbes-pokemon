import Phaser from 'phaser'
import { POKEMON } from '../data/pokemon.js'

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene') }

  preload() {
    const bar = this.add.rectangle(512, 384, 10, 40, 0xe3350d)
    this.load.on('progress', v => { bar.width = 600 * v })

    // Hellre tydligt stopp under utveckling än ett halvtrasigt spel för Ebbe.
    this.load.on('loaderror', file => {
      throw new Error(`Kunde inte ladda: ${file.key} (${file.url})`)
    })

    this.load.svg('pokeball', 'assets/ui/pokeball.svg', { width: 220, height: 220 })
    this.load.svg('grass', 'assets/ui/grass.svg', { width: 240, height: 160 })
    this.load.svg('star', 'assets/ui/star.svg', { width: 48, height: 48 })
    this.load.svg('home', 'assets/ui/home.svg', { width: 90, height: 90 })
    this.load.svg('dex', 'assets/ui/dex.svg', { width: 90, height: 90 })

    for (const p of POKEMON) {
      this.load.image(`pokemon-${p.id}`, `assets/pokemon/${p.id}.png`)
      this.load.audio(`cry-${p.id}`, `assets/cries/${p.id}.m4a`)
    }
  }

  create() {
    this.scene.start('StartScene')
  }
}
