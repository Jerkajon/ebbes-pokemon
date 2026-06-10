import Phaser from 'phaser'
import { drawBackdrop } from '../systems/backdrop.js'

export class PokedexScene extends Phaser.Scene {
  constructor() { super('PokedexScene') }

  create() {
    drawBackdrop(this)
    const home = this.add.image(70, 70, 'home').setInteractive()
    home.on('pointerdown', () => this.scene.start('StartScene'))
  }
}
