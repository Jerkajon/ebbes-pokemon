import Phaser from 'phaser'
import { drawBackdrop } from '../systems/backdrop.js'
import { loadCaught } from '../systems/save.js'

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

    const hasPokemon = loadCaught().length > 0
    const dex = this.add.image(hasPokemon ? 432 : 512, 640, 'dex').setInteractive()
    dex.on('pointerdown', () => this.scene.start('PokedexScene'))

    if (hasPokemon) {
      const battle = this.add.image(592, 640, 'battle').setInteractive()
      battle.on('pointerdown', () => this.scene.start('BattleScene'))
    }
  }
}
