import Phaser from 'phaser'
import { drawBackdrop } from '../systems/backdrop.js'

export class StartScene extends Phaser.Scene {
  constructor() { super('StartScene') }

  create() {
    drawBackdrop(this)

    const ball = this.add.image(512, 360, 'pokeball').setInteractive()
    this.tweens.add({
      targets: ball,
      scale: { from: 1, to: 1.12 },
      duration: 700, yoyo: true, repeat: -1, ease: 'sine.inout',
    })
    ball.on('pointerdown', () => this.scene.start('CatchScene'))

    const dex = this.add.image(512, 640, 'dex').setInteractive()
    dex.on('pointerdown', () => this.scene.start('PokedexScene'))
  }
}
