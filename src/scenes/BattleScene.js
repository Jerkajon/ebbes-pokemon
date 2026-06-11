import Phaser from 'phaser'
import { POKEMON } from '../data/pokemon.js'
import { pickPokemon } from '../systems/spawner.js'
import { loadCaught } from '../systems/save.js'
import { createBattle } from '../systems/battle.js'
import { playJingle, playHit } from '../systems/audio.js'
import { drawBackdrop } from '../systems/backdrop.js'

export class BattleScene extends Phaser.Scene {
  constructor() { super('BattleScene') }

  create() {
    drawBackdrop(this, 730)
    this.busy = false

    this.homeBtn = this.add.image(70, 70, 'home').setInteractive()
    this.homeBtn.on('pointerdown', () => this.scene.start('StartScene'))

    this.showPicker()
  }

  showPicker() {
    const caught = loadCaught()
    this.pickerItems = []
    caught.forEach((id, i) => {
      const col = i % 5
      const row = Math.floor(i / 5)
      const x = 152 + col * 180
      const y = 200 + row * 150
      const circle = this.add.circle(x, y, 66, 0xffffff, 0.55)
      const img = this.add.image(x, y, `pokemon-${id}`).setScale(0.26).setInteractive()
      img.on('pointerdown', () => this.startBattle(id))
      this.pickerItems.push(circle, img)
    })
  }

  startBattle(fighterId) {
    if (this.busy) return
    this.busy = true
    this.pickerItems.forEach(o => o.destroy())
    this.pickerItems = []

    drawBackdrop(this)
    this.children.bringToTop(this.homeBtn)

    this.opponentId = pickPokemon(POKEMON.map(p => p.id), loadCaught())
    this.battle = createBattle(3)

    this.fighter = this.add.image(280, 560, `pokemon-${fighterId}`)
      .setScale(0).setFlipX(true).setInteractive()
    this.opponent = this.add.image(744, 330, `pokemon-${this.opponentId}`).setScale(0)

    this.sound.play(`cry-${this.opponentId}`, { volume: 0.6 })
    this.tweens.add({ targets: this.fighter, scale: 0.6, duration: 350, ease: 'back.out' })
    this.tweens.add({
      targets: this.opponent,
      scale: 0.55, duration: 350, ease: 'back.out',
      onComplete: () => {
        this.hearts = [0, 1, 2].map(i => this.add.image(674 + i * 70, 160, 'heart').setScale(0))
        this.hearts.forEach((h, i) => this.tweens.add({
          targets: h, scale: 1, duration: 200, delay: i * 100, ease: 'back.out',
        }))
        this.fighter.on('pointerdown', () => this.attack())
        this.busy = false
      },
    })
  }

  attack() {
    if (this.busy || this.battle.won) return
    this.busy = true

    let struck = false
    this.tweens.add({
      targets: this.fighter,
      x: this.opponent.x - 120, y: this.opponent.y + 60,
      duration: 250,
      ease: 'quad.in',
      yoyo: true,
      onYoyo: () => {
        if (struck) return
        struck = true
        this.strike()
      },
      onComplete: () => {
        this.fighter.setPosition(280, 560)
        if (!this.battle.won) this.fakeCounter()
      },
    })
  }

  strike() {
    playHit()
    const remaining = this.battle.hit()
    this.cameras.main.shake(120, 0.004)
    this.tweens.add({ targets: this.opponent, x: '+=18', duration: 60, yoyo: true, repeat: 3 })

    const heart = this.hearts[remaining]
    this.tweens.add({ targets: heart, scale: 0, angle: 180, duration: 300, ease: 'back.in' })

    if (this.battle.won) {
      this.time.delayedCall(450, () => this.win())
    }
  }

  fakeCounter() {
    this.tweens.add({
      targets: this.opponent,
      x: this.fighter.x + 120, y: this.fighter.y - 60,
      duration: 280,
      ease: 'quad.in',
      yoyo: true,
      onYoyo: () => {
        if (this.wobbling) return
        this.wobbling = true
        this.tweens.add({
          targets: this.fighter,
          angle: { from: -8, to: 8 },
          duration: 90, yoyo: true, repeat: 2,
          onComplete: () => {
            this.fighter.angle = 0
            this.wobbling = false
          },
        })
      },
      onComplete: () => {
        this.opponent.setPosition(744, 330)
        this.busy = false
      },
    })
  }

  win() {
    playJingle()
    this.add.particles(this.opponent.x, this.opponent.y, 'star', {
      speed: { min: 150, max: 350 },
      lifespan: 900,
      quantity: 14,
      scale: { start: 1, end: 0 },
      emitting: false,
    }).explode(14)
    this.sound.play(`cry-${this.opponentId}`, { volume: 0.6 })
    this.tweens.add({ targets: this.opponent, angle: 90, y: '+=80', alpha: 0, duration: 600, ease: 'quad.in' })
    this.tweens.add({ targets: this.fighter, y: '-=40', duration: 250, yoyo: true, repeat: 3, ease: 'quad.out' })
    this.time.delayedCall(2200, () => this.scene.restart())
  }
}
