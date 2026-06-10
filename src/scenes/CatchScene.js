import Phaser from 'phaser'
import { POKEMON } from '../data/pokemon.js'
import { pickPokemon } from '../systems/spawner.js'
import { loadCaught } from '../systems/save.js'
import { playPop } from '../systems/audio.js'
import { drawBackdrop } from '../systems/backdrop.js'

const TUFTS = [
  { x: 200, y: 560 },
  { x: 460, y: 620 },
  { x: 720, y: 570 },
  { x: 880, y: 660 },
]

export class CatchScene extends Phaser.Scene {
  constructor() { super('CatchScene') }

  create() {
    drawBackdrop(this)
    this.busy = false

    for (const pos of TUFTS) {
      const tuft = this.add.image(pos.x, pos.y, 'grass').setInteractive()
      this.tweens.add({
        targets: tuft,
        angle: { from: -3, to: 3 },
        duration: 900 + Math.random() * 400,
        yoyo: true, repeat: -1, ease: 'sine.inout',
      })
      tuft.on('pointerdown', () => this.reveal(tuft))
    }

    const home = this.add.image(70, 70, 'home').setInteractive()
    home.on('pointerdown', () => this.scene.start('StartScene'))
    const dex = this.add.image(954, 70, 'dex').setInteractive()
    dex.on('pointerdown', () => this.scene.start('PokedexScene'))
  }

  reveal(tuft) {
    if (this.busy) return
    this.busy = true

    const id = pickPokemon(POKEMON.map(p => p.id), loadCaught())
    this.tweens.add({ targets: tuft, scaleX: 1.3, duration: 80, yoyo: true, repeat: 2 })

    const mon = this.add.image(tuft.x, tuft.y - 130, `pokemon-${id}`).setScale(0)
    playPop()
    this.sound.play(`cry-${id}`, { volume: 0.6 })
    this.tweens.add({
      targets: mon,
      scale: 0.55,
      duration: 350,
      ease: 'back.out',
      onComplete: () => this.showBall(mon, id),
    })
  }

  showBall(mon, id) {
    // Fångstsekvensen byggs i Task 8.
  }
}
