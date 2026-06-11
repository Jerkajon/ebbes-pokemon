# Pokemon för Ebbe v2 (Strid) — Implementationsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Förenklad strid för en treåring: välj din pokemon → tryck för att attackera → motståndarens tre hjärtan poppar → segerfirande. Ingen förlust möjlig, ingen text, snabb loop för hög omspelbarhet.

**Architecture:** Ny BattleScene med två faser (väljarvy → arena) i samma scen; `scene.restart()` efter seger ger snabb omspelsloop. Ren stridslogik (hjärträknare) i `src/systems/battle.js`, TDD med Vitest. Återanvänder spawner (viktad motståndarslump), save (fångade = valbara), audio (+ ny playHit), backdrop och partikelmönstret från CatchScene.

**Tech Stack:** Befintlig — Phaser 3.90.0, Vite 8.0.11, Vitest 4.1.5. Inga nya beroenden.

**Spec:** `docs/superpowers/specs/2026-06-10-pokemon-for-ebbe-design.md` (avsnitt "V2: Strid")

**Designkonstanter:**
- Fighter (din pokemon): (280, 560), scale 0.6, flipX(true) så den vänder sig mot motståndaren.
- Motståndare: (744, 330), scale 0.55, oflippad.
- Tre hjärtan ovanför motståndaren: y=160, x = 674/744/814.
- Texture-nycklar: `heart`, `battle` (+ befintliga).
- Busy-guard mot multi-touch-mash i varje interaktiv fas.

---

### Task A: battle.js — hjärträknare (TDD)

**Files:**
- Create: `src/systems/battle.js`
- Test: `tests/battle.test.js`

- [ ] **Step 1: Skriv failande test** — `tests/battle.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { createBattle } from '../src/systems/battle.js'

describe('createBattle', () => {
  it('startar med 3 hjärtan som default', () => {
    expect(createBattle().remaining).toBe(3)
  })

  it('tar emot eget antal hjärtan', () => {
    expect(createBattle(5).remaining).toBe(5)
  })

  it('hit() minskar med ett och returnerar kvarvarande', () => {
    const b = createBattle()
    expect(b.hit()).toBe(2)
    expect(b.remaining).toBe(2)
  })

  it('won är false tills alla hjärtan är borta', () => {
    const b = createBattle()
    b.hit()
    b.hit()
    expect(b.won).toBe(false)
    b.hit()
    expect(b.won).toBe(true)
  })

  it('hit() vid 0 stannar på 0 (inga negativa hjärtan)', () => {
    const b = createBattle(1)
    b.hit()
    expect(b.hit()).toBe(0)
    expect(b.remaining).toBe(0)
    expect(b.won).toBe(true)
  })
})
```

- [ ] **Step 2: Kör — ska faila**

Run: `npm test`
Expected: battle-testerna failar (modulen finns inte); save (6) + spawner (5) fortsatt gröna.

- [ ] **Step 3: Implementera** — `src/systems/battle.js`:

```js
export function createBattle(hearts = 3) {
  let remaining = hearts
  return {
    get remaining() { return remaining },
    get won() { return remaining === 0 },
    hit() {
      if (remaining > 0) remaining--
      return remaining
    },
  }
}
```

- [ ] **Step 4: Kör — ska passera**

Run: `npm test`
Expected: PASS, 16 test gröna (6 + 5 + 5).

- [ ] **Step 5: Commit**

```bash
git add src/systems/battle.js tests/battle.test.js
git commit -m "feat: stridslogik med hjärträknare (TDD)"
```

---

### Task B: Strids-assets — hjärta, stridsknapp, träffljud

**Files:**
- Create: `public/assets/ui/heart.svg`, `public/assets/ui/battle.svg`
- Modify: `src/systems/audio.js` (lägg till playHit — rör inget annat)

- [ ] **Step 1: Skapa public/assets/ui/heart.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M50 88 C20 65 5 45 5 30 C5 15 17 8 28 8 C38 8 46 14 50 22 C54 14 62 8 72 8 C83 8 95 15 95 30 C95 45 80 65 50 88 Z" fill="#e3350d" stroke="#8c1500" stroke-width="4"/>
</svg>
```

- [ ] **Step 2: Skapa public/assets/ui/battle.svg** (orange smällstjärna — "action", medvetet INTE ett X/svärd som kan läsas som "stäng")

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#ffffff" fill-opacity="0.85"/>
  <path d="M50 12 L57 36 L78 24 L66 44 L90 50 L66 56 L78 76 L57 64 L50 88 L43 64 L22 76 L34 56 L10 50 L34 44 L22 24 L43 36 Z" fill="#f5a623" stroke="#c47d00" stroke-width="3"/>
</svg>
```

- [ ] **Step 3: Lägg till playHit i src/systems/audio.js** (efter playJingle, inga andra ändringar)

```js
export function playHit() {
  tone(180, 0, 0.12, 'sawtooth', 0.3)
  tone(90, 0.02, 0.18, 'square', 0.25)
}
```

- [ ] **Step 4: Verifiera XML**

Run: `xmllint --noout public/assets/ui/heart.svg public/assets/ui/battle.svg && echo OK`
Expected: OK. Kör även `npm test` (16 gröna, regression).

- [ ] **Step 5: Commit**

```bash
git add public/assets/ui/heart.svg public/assets/ui/battle.svg src/systems/audio.js
git commit -m "feat: strids-assets — hjärta, stridsknapp och träffljud"
```

---

### Task C: BattleScene + startskärmsknapp + preload

**Files:**
- Create: `src/scenes/BattleScene.js`
- Modify: `src/scenes/PreloadScene.js` (två load-rader), `src/scenes/StartScene.js` (ersätts helt), `src/main.js` (ersätts helt)

- [ ] **Step 1: Lägg till i src/scenes/PreloadScene.js**, efter dex-raden i preload():

```js
    this.load.svg('heart', 'assets/ui/heart.svg', { width: 64, height: 64 })
    this.load.svg('battle', 'assets/ui/battle.svg', { width: 90, height: 90 })
```

- [ ] **Step 2: Ersätt src/scenes/StartScene.js helt** (stridsknappen visas bara när minst en pokemon är fångad — "upplåsningsögonblick"; dex centreras när den är ensam)

```js
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
```

- [ ] **Step 3: Skapa src/scenes/BattleScene.js**

```js
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
    drawBackdrop(this)
    this.busy = false

    const home = this.add.image(70, 70, 'home').setInteractive()
    home.on('pointerdown', () => this.scene.start('StartScene'))

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

    this.tweens.add({
      targets: this.fighter,
      x: this.opponent.x - 120, y: this.opponent.y + 60,
      duration: 250,
      ease: 'quad.in',
      yoyo: true,
      onYoyo: () => this.strike(),
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
        this.tweens.add({
          targets: this.fighter,
          angle: { from: -8, to: 8 },
          duration: 90, yoyo: true, repeat: 2,
          onComplete: () => { this.fighter.angle = 0 },
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
```

- [ ] **Step 4: Ersätt src/main.js helt** (registrerar BattleScene)

```js
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
```

- [ ] **Step 5: Verifiera i webbläsare** (dev-server + Preview MCP, etablerad eval-teknik; temporär `window.__game`-handle MÅSTE återställas före commit)

1. Tom save → startskärm: BARA pokeboll + centrerad dex (ingen stridsknapp).
2. Seeda `localStorage.setItem('ebbe-pokedex-v1','[25,4,151]')`, ladda om → dex på (432,640) + smällstjärna på (592,640).
3. Stridsknapp → väljarvy: 3 pokemon i rutnät. Välj Pikachu.
4. Arena: Pikachu nere-vänster (flippad, vänd mot motståndaren), motståndare uppe-höger, 3 hjärtan poppar in.
5. Attack ×3: utfall, kameraskak, hjärtan poppar i tur och ordning HÖGER→VÄNSTER eller VÄNSTER→HÖGER (notera ordningen — hearts[remaining] poppar index 2,1,0 = höger först), mellan attackerna gör motståndaren låtsas-utfall och Pikachu vinglar.
6. Seger: motståndaren tippar + tonar bort, stjärnor, jingel + cry, Pikachu studsar; efter ~2,2 s → tillbaka till väljarvyn.
7. Mash-test: spamma fighter under pågående attack — inga dubbla utfall (busy). Multi-tap i väljarvyn — bara en strid startar.
8. Home mitt i striden → startskärm utan fel; tillbaka in → fräsch väljarvy.
9. Konsol: noll fel.

**Step 6: Kör all test + bygg**

Run: `npm test` (16 gröna) och `npm run build` (rent).

- [ ] **Step 7: Commit**

```bash
git add src/scenes/BattleScene.js src/scenes/StartScene.js src/scenes/PreloadScene.js src/main.js
git commit -m "feat: stridsscen med väljarvy, hjärtan och segerfirande"
```

---

### Task D: Visuell QA fas 2 + full regression

Ingen kod (om inget hittas). Skärmdumps-QA enligt Eriks kvalitetskrav: inga grafiska buggar, korrekt sprite-linjering, hög spelglädje. Testmatris: alla steg i Task C Step 5 + helspelsflöde (fånga → pokédex → strid → fånga) + `npm test` + `npm run build`. Hittade buggar fixas med separata fix-commits och re-QA.

---

## Självgranskning mot specen (utförd vid planskrivning)

- Spec V2 punkt 1 (knapp endast med fångst) → Task C Step 2. Punkt 2 (väljarvy) → showPicker. Punkt 3 (arena, viktad slump, 3 hjärtan) → startBattle. Punkt 4 (attack, träffeffekt, låtsas-utfall, vingel) → attack/strike/fakeCounter. Punkt 5 (seger, omkulltipp, stjärnor, jingel+cry, studs, åter väljarvyn) → win + restart.
- Omspelbarhet: restart → väljarvy = två tryck till nästa match.
- Ingen förlust, ingen text, busy-guards mot mash: uppfyllt.
- Typkonsistens: createBattle/hit/won/remaining används likadant i test och scen; texture-nycklar heart/battle laddas i Preload före användning.
