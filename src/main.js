import Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene.js'
import { StartScene } from './scenes/StartScene.js'
import { CatchScene } from './scenes/CatchScene.js'
import { PokedexScene } from './scenes/PokedexScene.js'
import { BattleScene } from './scenes/BattleScene.js'

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
  scene: [PreloadScene, StartScene, CatchScene, PokedexScene, BattleScene],
})
