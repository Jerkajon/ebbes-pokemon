import Phaser from 'phaser'

class BootScene extends Phaser.Scene {
  create() {
    this.add.circle(512, 384, 100, 0xe3350d)
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#87ceeb',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [BootScene],
})
