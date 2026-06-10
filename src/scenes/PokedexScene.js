import Phaser from 'phaser'
import { POKEMON } from '../data/pokemon.js'
import { loadCaught } from '../systems/save.js'
import { drawBackdrop } from '../systems/backdrop.js'

export class PokedexScene extends Phaser.Scene {
  constructor() { super('PokedexScene') }

  create() {
    drawBackdrop(this)
    this.detailOpen = false
    const caught = new Set(loadCaught())

    POKEMON.forEach((p, i) => {
      const col = i % 5
      const row = Math.floor(i / 5)
      const x = 152 + col * 180
      const y = 200 + row * 150
      this.add.circle(x, y, 66, 0xffffff, 0.55)
      const img = this.add.image(x, y, `pokemon-${p.id}`).setScale(0.26)
      if (caught.has(p.id)) {
        img.setInteractive()
        img.on('pointerdown', () => this.showDetail(p))
      } else {
        img.setTint(0x16213e) // mörk silhuett — "vem är det där?"
      }
    })

    const home = this.add.image(70, 70, 'home').setInteractive()
    home.on('pointerdown', () => this.scene.start('StartScene'))
  }

  showDetail(p) {
    if (this.detailOpen) return
    this.detailOpen = true
    const cover = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.6).setInteractive()
    const big = this.add.image(512, 350, `pokemon-${p.id}`).setScale(0)
    const name = this.add.text(512, 670, p.name, {
      fontSize: '64px', fontFamily: 'sans-serif', color: '#ffffff',
    }).setOrigin(0.5)
    this.tweens.add({ targets: big, scale: 1, duration: 300, ease: 'back.out' })
    this.sound.play(`cry-${p.id}`, { volume: 0.6 })
    cover.once('pointerdown', () => {
      this.detailOpen = false
      cover.destroy()
      big.destroy()
      name.destroy()
    })
  }
}
