import Phaser from 'phaser'
import { POKEMON } from '../data/pokemon.js'
import { pickPokemon } from '../systems/spawner.js'
import { loadCaught, addCaught } from '../systems/save.js'
import { playPop, playJingle } from '../systems/audio.js'
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
    const ball = this.add.image(512, 690, 'pokeball').setScale(0.6).setInteractive()
    this.tweens.add({ targets: ball, y: 675, duration: 500, yoyo: true, repeat: -1 })
    ball.once('pointerdown', () => {
      this.tweens.killTweensOf(ball)
      this.throwBall(ball, mon, id)
    })
  }

  throwBall(ball, mon, id) {
    this.tweens.add({
      targets: ball,
      x: mon.x, y: mon.y,
      scale: 0.45,
      duration: 550,
      ease: 'quad.out',
      onComplete: () => {
        this.tweens.add({
          targets: mon,
          scale: 0, x: ball.x, y: ball.y,
          duration: 250,
          onComplete: () => this.shakeBall(ball, id),
        })
      },
    })
  }

  shakeBall(ball, id) {
    this.tweens.add({
      targets: ball,
      angle: { from: -25, to: 25 },
      duration: 180, yoyo: true, repeat: 3,
      onComplete: () => {
        ball.angle = 0
        this.celebrate(ball, id)
      },
    })
  }

  celebrate(ball, id) {
    addCaught(id)
    playJingle()
    this.add.particles(ball.x, ball.y, 'star', {
      speed: { min: 150, max: 350 },
      lifespan: 900,
      quantity: 14,
      scale: { start: 1, end: 0 },
      emitting: false,
    }).explode(14)

    const big = this.add.image(512, 340, `pokemon-${id}`).setScale(0)
    this.tweens.add({ targets: big, scale: 0.9, duration: 400, ease: 'back.out' })
    this.sound.play(`cry-${id}`, { volume: 0.6 })

    this.time.delayedCall(2200, () => this.scene.restart())
  }
}
