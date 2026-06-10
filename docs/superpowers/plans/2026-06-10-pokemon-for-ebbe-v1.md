# Pokemon för Ebbe v1 — Implementationsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ett touchspel för iPad där en treåring hittar, fångar och samlar riktiga Pokemon — startskärm, gräsglänta, fångstsekvens och pokédex, helt utan läskrav.

**Architecture:** Phaser 3-spel med en scen per spelvy (Preload/Start/Catch/Pokedex). Ren logik (save, spawner) ligger i egna moduler utan Phaser-beroende och enhetstestas med Vitest. Alla Pokemon-assets (artwork + läten) hämtas från PokeAPI en gång av ett byggskript och lagras i `public/assets/` — noll nätverksanrop i runtime. Deploy som PWA (manifest + service worker) via GitHub Pages.

**Tech Stack:** Phaser 3.90.0, Vite 8.0.11, Vitest 4.1.5 (exakt pinnade — samma versioner som fungerar i pokemoncykelspel på den här maskinen), vanilla JS, node 25. ffmpeg (installeras i Task 2) för .ogg→.m4a-konvertering.

**Spec:** `docs/superpowers/specs/2026-06-10-pokemon-for-ebbe-design.md`

**Designkonstanter som återkommer i koden:**
- Spelyta 1024×768, `Phaser.Scale.FIT` + `CENTER_BOTH`.
- localStorage-nyckel: `ebbe-pokedex-v1`.
- Texture-nycklar: `pokemon-<id>`, `cry-<id>`, `pokeball`, `grass`, `star`, `home`, `dex`.
- Fångsten lyckas ALLTID. Ingen förlust, ingen text Ebbe måste läsa.

---

### Task 1: Projektskelett — Phaser + Vite snurrar

Validerar den riskablaste tekikbiten (byggkedjan) först.

**Files:**
- Create: `package.json`, `.gitignore`, `vite.config.js`, `index.html`, `src/main.js`

- [ ] **Step 1: Skapa package.json** (exakta versioner, inga `^`)

```json
{
  "name": "ebbes-pokemon",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview --host",
    "test": "vitest run",
    "fetch-assets": "node tools/fetch-assets.mjs"
  },
  "dependencies": {
    "phaser": "3.90.0"
  },
  "devDependencies": {
    "vite": "8.0.11",
    "vitest": "4.1.5"
  }
}
```

- [ ] **Step 2: Skapa .gitignore**

```
node_modules/
dist/
tmp-cries/
.DS_Store
```

- [ ] **Step 3: Skapa vite.config.js** (`base: './'` → relativa sökvägar, krävs för GitHub Pages)

```js
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
})
```

- [ ] **Step 4: Skapa index.html**

```html
<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Ebbes Pokemon</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #87ceeb; overflow: hidden; }
    #game { height: 100%; }
  </style>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Skapa src/main.js** (tillfällig boot-scen — ersätts helt i Task 6)

```js
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
```

- [ ] **Step 6: Installera och verifiera**

Run: `npm install` — Expected: lyckas utan fel.
Run: `npm run dev` i bakgrunden, öppna URL:en i webbläsare.
Expected: ljusblå sida med en röd cirkel i mitten. Inga fel i konsolen. Stoppa dev-servern.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .gitignore vite.config.js index.html src/main.js
git commit -m "feat: projektskelett Phaser+Vite, pinnade versioner"
```

---

### Task 2: Pokemonlista + nedladdning av assets

**Files:**
- Create: `src/data/pokemon.js`, `tools/fetch-assets.mjs`
- Skapas av skriptet: `public/assets/pokemon/<id>.png` (20 st), `public/assets/cries/<id>.m4a` (20 st)

- [ ] **Step 1: Skapa src/data/pokemon.js** (20 välkända gen 1; Mew är "rar" bara genom att vara med)

```js
export const POKEMON = [
  { id: 1, name: 'Bulbasaur' },
  { id: 4, name: 'Charmander' },
  { id: 7, name: 'Squirtle' },
  { id: 12, name: 'Butterfree' },
  { id: 16, name: 'Pidgey' },
  { id: 25, name: 'Pikachu' },
  { id: 35, name: 'Clefairy' },
  { id: 39, name: 'Jigglypuff' },
  { id: 52, name: 'Meowth' },
  { id: 54, name: 'Psyduck' },
  { id: 58, name: 'Growlithe' },
  { id: 77, name: 'Ponyta' },
  { id: 104, name: 'Cubone' },
  { id: 113, name: 'Chansey' },
  { id: 129, name: 'Magikarp' },
  { id: 131, name: 'Lapras' },
  { id: 133, name: 'Eevee' },
  { id: 143, name: 'Snorlax' },
  { id: 147, name: 'Dratini' },
  { id: 151, name: 'Mew' },
]
```

- [ ] **Step 2: Installera ffmpeg om det saknas** (behövs för .ogg→.m4a — iOS Safari spelar inte .ogg pålitligt)

Run: `command -v ffmpeg || brew install ffmpeg`
Expected: ffmpeg finns efteråt (`ffmpeg -version` svarar). Kan ta några minuter.

- [ ] **Step 3: Skapa tools/fetch-assets.mjs**

```js
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { POKEMON } from '../src/data/pokemon.js'

const ART = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
const CRY = id => `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`

async function download(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} för ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

await mkdir('public/assets/pokemon', { recursive: true })
await mkdir('public/assets/cries', { recursive: true })
await mkdir('tmp-cries', { recursive: true })

for (const p of POKEMON) {
  await writeFile(`public/assets/pokemon/${p.id}.png`, await download(ART(p.id)))
  await writeFile(`tmp-cries/${p.id}.ogg`, await download(CRY(p.id)))
  execFileSync('ffmpeg', [
    '-y', '-i', `tmp-cries/${p.id}.ogg`,
    '-c:a', 'aac', '-b:a', '96k',
    `public/assets/cries/${p.id}.m4a`,
  ], { stdio: 'pipe' })
  console.log(`${p.id} ${p.name} klar`)
}

await rm('tmp-cries', { recursive: true })
console.log('Alla assets nedladdade.')
```

- [ ] **Step 4: Kör skriptet**

Run: `npm run fetch-assets`
Expected: 20 rader "`<id> <namn> klar`" + "Alla assets nedladdade."

- [ ] **Step 5: Verifiera antal filer**

Run: `ls public/assets/pokemon | wc -l && ls public/assets/cries | wc -l`
Expected: `20` och `20`.

- [ ] **Step 6: Lyssna på ett läte** (sanity check att konverteringen funkar)

Run: `afplay public/assets/cries/25.m4a`
Expected: Pikachus läte hörs.

- [ ] **Step 7: Commit** (assets committas — de behövs för bygget och är ~5 MB totalt)

```bash
git add src/data/pokemon.js tools/fetch-assets.mjs public/assets
git commit -m "feat: pokemonlista + nedladdade artwork/läten från PokeAPI"
```

---

### Task 3: save.js — localStorage med kraschskydd (TDD)

**Files:**
- Create: `src/systems/save.js`
- Test: `tests/save.test.js`

- [ ] **Step 1: Skriv failande test**

```js
import { describe, it, expect } from 'vitest'
import { loadCaught, addCaught } from '../src/systems/save.js'

function fakeStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v) },
  }
}

describe('save', () => {
  it('ger tom lista när inget är sparat', () => {
    expect(loadCaught(fakeStorage())).toEqual([])
  })

  it('ger tom lista vid korrupt data istället för att krascha', () => {
    expect(loadCaught(fakeStorage({ 'ebbe-pokedex-v1': 'inte{{json' }))).toEqual([])
  })

  it('ger tom lista om sparad data inte är en array', () => {
    expect(loadCaught(fakeStorage({ 'ebbe-pokedex-v1': '{"a":1}' }))).toEqual([])
  })

  it('lägger till och läser tillbaka fångade pokemon', () => {
    const s = fakeStorage()
    addCaught(25, s)
    addCaught(1, s)
    expect(loadCaught(s)).toEqual([25, 1])
  })

  it('dubblerar inte samma pokemon', () => {
    const s = fakeStorage()
    addCaught(25, s)
    addCaught(25, s)
    expect(loadCaught(s)).toEqual([25])
  })

  it('kraschar inte om setItem kastar (fullt/avstängt localStorage)', () => {
    const s = { getItem: () => null, setItem: () => { throw new Error('kvotfullt') } }
    expect(() => addCaught(25, s)).not.toThrow()
  })
})
```

- [ ] **Step 2: Kör testet — ska faila**

Run: `npm test`
Expected: FAIL — modulen `../src/systems/save.js` finns inte.

- [ ] **Step 3: Implementera src/systems/save.js**

```js
const KEY = 'ebbe-pokedex-v1'

export function loadCaught(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(KEY))
    if (!Array.isArray(parsed)) return []
    return parsed.filter(n => Number.isInteger(n))
  } catch {
    return []
  }
}

export function addCaught(id, storage = globalThis.localStorage) {
  const caught = loadCaught(storage)
  if (!caught.includes(id)) caught.push(id)
  try {
    storage.setItem(KEY, JSON.stringify(caught))
  } catch {
    // Trasigt/fullt localStorage får aldrig krascha spelet — fångsten gäller för sessionen.
  }
  return caught
}
```

- [ ] **Step 4: Kör testet — ska passera**

Run: `npm test`
Expected: PASS, 6 test gröna.

- [ ] **Step 5: Commit**

```bash
git add src/systems/save.js tests/save.test.js
git commit -m "feat: save-modul med kraschskyddat localStorage (TDD)"
```

---

### Task 4: spawner.js — viktad slumpning (TDD)

Ofångade pokemon väger 3, fångade väger 1 → nya dyker upp oftare men samlingen blir aldrig "tom på överraskningar".

**Files:**
- Create: `src/systems/spawner.js`
- Test: `tests/spawner.test.js`

- [ ] **Step 1: Skriv failande test**

```js
import { describe, it, expect } from 'vitest'
import { pickPokemon } from '../src/systems/spawner.js'

describe('pickPokemon', () => {
  it('väljer första posten när rng=0', () => {
    expect(pickPokemon([1, 4, 7], [], () => 0)).toBe(1)
  })

  it('väljer sista posten när rng nära 1', () => {
    expect(pickPokemon([1, 4, 7], [], () => 0.9999)).toBe(7)
  })

  it('viktar ofångade 3x mot fångade', () => {
    // ids: [1 (fångad, vikt 1), 4 (ofångad, vikt 3)] → pool [1, 4, 4, 4]
    // rng 0.0 → index 0 → 1; rng 0.3 → index 1 → 4
    expect(pickPokemon([1, 4], [1], () => 0)).toBe(1)
    expect(pickPokemon([1, 4], [1], () => 0.3)).toBe(4)
    expect(pickPokemon([1, 4], [1], () => 0.9)).toBe(4)
  })

  it('fungerar när alla är fångade', () => {
    expect(pickPokemon([1, 4], [1, 4], () => 0.6)).toBe(4)
  })

  it('returnerar alltid ett id ur listan (fuzz)', () => {
    const ids = [1, 4, 7, 25]
    for (let i = 0; i < 200; i++) {
      expect(ids).toContain(pickPokemon(ids, [4, 25]))
    }
  })
})
```

- [ ] **Step 2: Kör testet — ska faila**

Run: `npm test`
Expected: FAIL — modulen `../src/systems/spawner.js` finns inte. (save-testen ska fortfarande vara gröna.)

- [ ] **Step 3: Implementera src/systems/spawner.js**

```js
export function pickPokemon(allIds, caughtIds, rng = Math.random) {
  const caught = new Set(caughtIds)
  const pool = allIds.flatMap(id => (caught.has(id) ? [id] : [id, id, id]))
  return pool[Math.floor(rng() * pool.length)]
}
```

- [ ] **Step 4: Kör testet — ska passera**

Run: `npm test`
Expected: PASS, 11 test gröna totalt.

- [ ] **Step 5: Commit**

```bash
git add src/systems/spawner.js tests/spawner.test.js
git commit -m "feat: viktad pokemon-spawner (TDD)"
```

---

### Task 5: UI-grafik (SVG), bakgrund och ljudeffekter

Ingen asset-jakt: all icke-pokemon-grafik är handskrivna SVG:er, ljudeffekterna syntetiseras med WebAudio. Verifieras visuellt i Task 6–8.

**Files:**
- Create: `public/assets/ui/pokeball.svg`, `public/assets/ui/grass.svg`, `public/assets/ui/star.svg`, `public/assets/ui/home.svg`, `public/assets/ui/dex.svg`, `src/systems/backdrop.js`, `src/systems/audio.js`

- [ ] **Step 1: Skapa public/assets/ui/pokeball.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="47" fill="#ffffff" stroke="#222222" stroke-width="5"/>
  <path d="M3,50 A47,47 0 0 1 97,50 Z" fill="#e3350d"/>
  <rect x="3" y="46" width="94" height="8" fill="#222222"/>
  <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#222222" stroke-width="5"/>
  <circle cx="50" cy="50" r="6" fill="#ffffff" stroke="#222222" stroke-width="3"/>
</svg>
```

- [ ] **Step 2: Skapa public/assets/ui/grass.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
  <g fill="#2e8b3d">
    <path d="M10 80 Q20 30 35 10 Q38 45 45 80 Z"/>
    <path d="M40 80 Q55 20 60 5 Q70 40 75 80 Z"/>
    <path d="M70 80 Q85 25 100 12 Q95 50 105 80 Z"/>
  </g>
  <g fill="#3da34f">
    <path d="M25 80 Q35 40 45 25 Q50 55 55 80 Z"/>
    <path d="M55 80 Q70 35 85 28 Q80 60 88 80 Z"/>
  </g>
</svg>
```

- [ ] **Step 3: Skapa public/assets/ui/star.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M50 5 L61 38 L97 38 L68 59 L79 93 L50 72 L21 93 L32 59 L3 38 L39 38 Z" fill="#ffd700"/>
</svg>
```

- [ ] **Step 4: Skapa public/assets/ui/home.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#ffffff" fill-opacity="0.85"/>
  <path d="M50 22 L80 50 L72 50 L72 78 L57 78 L57 60 L43 60 L43 78 L28 78 L28 50 L20 50 Z" fill="#333355"/>
</svg>
```

- [ ] **Step 5: Skapa public/assets/ui/dex.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#ffffff" fill-opacity="0.85"/>
  <rect x="25" y="25" width="22" height="22" rx="4" fill="#e3350d"/>
  <rect x="53" y="25" width="22" height="22" rx="4" fill="#3da34f"/>
  <rect x="25" y="53" width="22" height="22" rx="4" fill="#3578e5"/>
  <rect x="53" y="53" width="22" height="22" rx="4" fill="#ffd700"/>
</svg>
```

- [ ] **Step 6: Skapa src/systems/backdrop.js** (himmel + gräsmark, delas av alla scener)

```js
export function drawBackdrop(scene) {
  const g = scene.add.graphics()
  g.fillGradientStyle(0x7ec8f0, 0x7ec8f0, 0xbfe9ff, 0xbfe9ff, 1)
  g.fillRect(0, 0, 1024, 520)
  g.fillStyle(0x6abf5e)
  g.fillRect(0, 520, 1024, 248)
}
```

- [ ] **Step 7: Skapa src/systems/audio.js** (WebAudio-syntar — pop när pokemon dyker upp, jingel vid fångst)

```js
let ctx

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, start, dur, type, vol) {
  const c = ac()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, c.currentTime + start)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(c.currentTime + start)
  osc.stop(c.currentTime + start + dur)
}

export function playPop() {
  tone(440, 0, 0.08, 'square', 0.15)
  tone(880, 0.04, 0.1, 'square', 0.12)
}

export function playJingle() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.3))
}
```

- [ ] **Step 8: Commit**

```bash
git add public/assets/ui src/systems/backdrop.js src/systems/audio.js
git commit -m "feat: UI-grafik (SVG), bakgrund och syntade ljudeffekter"
```

---

### Task 6: Scenstomme — Preload, Start och navigering

**Files:**
- Create: `src/scenes/PreloadScene.js`, `src/scenes/StartScene.js`, `src/scenes/CatchScene.js` (stub), `src/scenes/PokedexScene.js` (stub)
- Modify: `src/main.js` (ersätts helt)

- [ ] **Step 1: Skapa src/scenes/PreloadScene.js**

```js
import Phaser from 'phaser'
import { POKEMON } from '../data/pokemon.js'

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene') }

  preload() {
    const bar = this.add.rectangle(512, 384, 10, 40, 0xe3350d)
    this.load.on('progress', v => { bar.width = 600 * v })

    // Hellre tydligt stopp under utveckling än ett halvtrasigt spel för Ebbe.
    this.load.on('loaderror', file => {
      throw new Error(`Kunde inte ladda: ${file.key} (${file.url})`)
    })

    this.load.svg('pokeball', 'assets/ui/pokeball.svg', { width: 220, height: 220 })
    this.load.svg('grass', 'assets/ui/grass.svg', { width: 240, height: 160 })
    this.load.svg('star', 'assets/ui/star.svg', { width: 48, height: 48 })
    this.load.svg('home', 'assets/ui/home.svg', { width: 90, height: 90 })
    this.load.svg('dex', 'assets/ui/dex.svg', { width: 90, height: 90 })

    for (const p of POKEMON) {
      this.load.image(`pokemon-${p.id}`, `assets/pokemon/${p.id}.png`)
      this.load.audio(`cry-${p.id}`, `assets/cries/${p.id}.m4a`)
    }
  }

  create() {
    this.scene.start('StartScene')
  }
}
```

- [ ] **Step 2: Skapa src/scenes/StartScene.js**

```js
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
```

- [ ] **Step 3: Skapa stub src/scenes/CatchScene.js** (fylls i Task 7–8)

```js
import Phaser from 'phaser'
import { drawBackdrop } from '../systems/backdrop.js'

export class CatchScene extends Phaser.Scene {
  constructor() { super('CatchScene') }

  create() {
    drawBackdrop(this)
    const home = this.add.image(70, 70, 'home').setInteractive()
    home.on('pointerdown', () => this.scene.start('StartScene'))
  }
}
```

- [ ] **Step 4: Skapa stub src/scenes/PokedexScene.js** (fylls i Task 9)

```js
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
```

- [ ] **Step 5: Ersätt src/main.js helt**

```js
import Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene.js'
import { StartScene } from './scenes/StartScene.js'
import { CatchScene } from './scenes/CatchScene.js'
import { PokedexScene } from './scenes/PokedexScene.js'

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
  scene: [PreloadScene, StartScene, CatchScene, PokedexScene],
})
```

- [ ] **Step 6: Verifiera i webbläsare**

Run: `npm run dev`
Expected: laddningsbalk → startskärm med pulserande pokeboll + pokédexknapp. Tryck på pokebollen → tom gräsglänta med hemknapp. Hem → start → pokédexknappen → tom pokédex med hemknapp. Inga konsolfel.

- [ ] **Step 7: Commit**

```bash
git add src/main.js src/scenes
git commit -m "feat: scenstomme med preload, startskärm och navigering"
```

---

### Task 7: CatchScene — gräs som prasslar, pokemon dyker upp

**Files:**
- Modify: `src/scenes/CatchScene.js` (ersätts helt)

- [ ] **Step 1: Ersätt src/scenes/CatchScene.js helt**

```js
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
```

- [ ] **Step 2: Verifiera i webbläsare**

Run: `npm run dev`
Expected: fyra vajande grästuvor. Tryck på en → den skakar, en pokemon hoppar fram med pop-ljud + sitt läte. Fler tryck ignoreras (busy-spärren). Hem- och pokédexknappar fungerar fortfarande.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/CatchScene.js
git commit -m "feat: gräsglänta där pokemon dyker upp med läte"
```

---

### Task 8: CatchScene — fångstsekvensen

Kast → insugning → skak → stjärnor + jingel + spara → ny runda. Fångsten lyckas alltid (designkrav).

**Files:**
- Modify: `src/scenes/CatchScene.js` (ersätt `showBall`-stubben med metoderna nedan, lägg till importerna)

- [ ] **Step 1: Uppdatera importerna i src/scenes/CatchScene.js**

```js
import { loadCaught, addCaught } from '../systems/save.js'
import { playPop, playJingle } from '../systems/audio.js'
```

- [ ] **Step 2: Ersätt den tomma showBall-metoden med fyra metoder**

```js
  showBall(mon, id) {
    const ball = this.add.image(512, 700, 'pokeball').setScale(0.6).setInteractive()
    this.tweens.add({ targets: ball, y: 685, duration: 500, yoyo: true, repeat: -1 })
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
```

- [ ] **Step 3: Verifiera hela fångstloopen i webbläsare**

Run: `npm run dev`
Expected: pokemon dyker upp → studsande pokeboll nere → tryck → bollen flyger i båge, pokemonen sugs in, bollen skakar 4 svängar → stjärnexplosion + jingel → pokemonen visas stort med läte → scenen börjar om med nya tuvor.

- [ ] **Step 4: Verifiera att fångsten sparas**

I webbläsarkonsolen: `localStorage.getItem('ebbe-pokedex-v1')`
Expected: en JSON-array som innehåller id:t för pokemonen du just fångade.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/CatchScene.js
git commit -m "feat: fångstsekvens med kast, skak, stjärnor och autosave"
```

---

### Task 9: PokedexScene — samlingen

**Files:**
- Modify: `src/scenes/PokedexScene.js` (ersätts helt)

- [ ] **Step 1: Ersätt src/scenes/PokedexScene.js helt**

```js
import Phaser from 'phaser'
import { POKEMON } from '../data/pokemon.js'
import { loadCaught } from '../systems/save.js'
import { drawBackdrop } from '../systems/backdrop.js'

export class PokedexScene extends Phaser.Scene {
  constructor() { super('PokedexScene') }

  create() {
    drawBackdrop(this)
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
    const cover = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.6).setInteractive()
    const big = this.add.image(512, 350, `pokemon-${p.id}`).setScale(0)
    const name = this.add.text(512, 670, p.name, {
      fontSize: '64px', fontFamily: 'sans-serif', color: '#ffffff',
    }).setOrigin(0.5)
    this.tweens.add({ targets: big, scale: 1, duration: 300, ease: 'back.out' })
    this.sound.play(`cry-${p.id}`, { volume: 0.6 })
    cover.once('pointerdown', () => {
      cover.destroy()
      big.destroy()
      name.destroy()
    })
  }
}
```

- [ ] **Step 2: Verifiera i webbläsare**

Run: `npm run dev`
Expected: rutnät 5×4 — fångade i färg, ofångade som mörka silhuetter. Tryck på en fångad → mörk överlagring, stor bild, namn, läte; tryck igen → stängs. Tryck på silhuett → ingenting. Hemknappen krockar inte visuellt med rutnätet (justera annars `y`-startvärdet 200 uppåt/nedåt).

- [ ] **Step 3: Kör alla test igen** (regression)

Run: `npm test`
Expected: PASS, 11 test gröna.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/PokedexScene.js
git commit -m "feat: pokédex med silhuetter och detaljvy med läte"
```

---

### Task 10: PWA — manifest, ikon och offline via service worker

**Files:**
- Create: `public/manifest.webmanifest`, `public/sw.js`, `public/assets/icon.png`
- Modify: `index.html`

- [ ] **Step 1: Skapa ikon från Pikachu-artwork** (sips ingår i macOS)

Run: `sips -z 512 512 public/assets/pokemon/25.png --out public/assets/icon.png`
Expected: `public/assets/icon.png` finns, 512×512.

- [ ] **Step 2: Skapa public/manifest.webmanifest**

```json
{
  "name": "Ebbes Pokemon",
  "short_name": "Pokemon",
  "display": "fullscreen",
  "orientation": "landscape",
  "background_color": "#87ceeb",
  "theme_color": "#87ceeb",
  "start_url": ".",
  "icons": [
    { "src": "assets/icon.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Skapa public/sw.js** (network-first för sidladdning så uppdateringar når fram, cache-first för assets — Vites filnamn är innehållshashade)

```js
const CACHE = 'ebbe-pokemon-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, copy))
          return res
        })
        .catch(() => caches.match(e.request))
    )
    return
  }

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(e.request)
      if (hit) return hit
      const res = await fetch(e.request)
      if (res.ok) cache.put(e.request, res.clone())
      return res
    })
  )
})
```

- [ ] **Step 4: Uppdatera index.html** — lägg till i `<head>` (efter apple-touch-raderna):

```html
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="apple-touch-icon" href="assets/icon.png">
```

och längst ner i `<body>`, efter main.js-scriptet:

```html
  <script>
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js')
  </script>
```

- [ ] **Step 5: Verifiera offline-läge**

Run: `npm run build && npm run preview`
I webbläsaren: ladda sidan, spela en fångst (så assets cachas). DevTools → Network → Offline. Ladda om.
Expected: spelet laddar och fungerar offline.

- [ ] **Step 6: Commit**

```bash
git add public/manifest.webmanifest public/sw.js public/assets/icon.png index.html
git commit -m "feat: PWA med manifest, ikon och offline-cache"
```

---

### Task 11: Deploy till GitHub Pages

**BESLUTSPUNKT:** GitHub Pages på *privat* repo kräver betalplan (Pro). Spec säger att spelet inte ska publiceras publikt — ett publikt repo med Nintendo-assets är gråzon. Försök privat först; om Pages inte aktiveras, **fråga Erik**: publikt repo (obskyr URL, vanligt för hobbyprojekt) eller annan host.

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Skapa .github/workflows/deploy.yml**

```yaml
name: Deploy till GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Pages-deploy via Actions"
```

- [ ] **Step 3: Skapa privat repo och pusha**

Run: `gh repo create ebbes-pokemon --private --source . --push`
Expected: repo skapat, main pushad.

- [ ] **Step 4: Aktivera Pages med workflow-bygge**

Run: `gh api -X POST "repos/{owner}/ebbes-pokemon/pages" -f build_type=workflow`
Expected: HTTP 201. **Om detta failar (403/404 pga privat repo utan Pro): STOPPA och fråga Erik** (publikt repo eller annan host?).

- [ ] **Step 5: Trigga och invänta deploy**

Run: `gh workflow view` / `gh run watch` (pushen i Step 3 triggade redan workflown; kör annars `gh workflow run "Deploy till GitHub Pages"`)
Expected: grön körning.

- [ ] **Step 6: Verifiera URL:en i webbläsare**

Run: `gh api "repos/{owner}/ebbes-pokemon/pages" --jq .html_url`
Öppna URL:en.
Expected: spelet laddar och en fångst fungerar.

---

### Task 12: Verifiering på riktig iPad (manuell, med Erik)

Ingen kod — checklista mot specens framgångskriterier. Buggar som hittas fixas och committas.

- [ ] **Step 1:** Öppna Pages-URL:en i Safari på iPaden. Expected: laddningsbalk → startskärm.
- [ ] **Step 2:** Genomför en fångst med fingret. Expected: hela sekvensen fungerar med touch; läte + jingel hörs (ljud kräver första tryck — startskärmens pokeboll räknas).
- [ ] **Step 3:** Öppna pokédexen. Expected: fångsten syns i färg, resten silhuetter.
- [ ] **Step 4:** Dela → "Lägg till på hemskärmen". Öppna från ikonen. Expected: fullskärm utan Safari-UI, ikonen är Pikachu.
- [ ] **Step 5:** Stäng appen helt, sätt iPaden i flygplansläge, öppna igen. Expected: spelet fungerar offline.
- [ ] **Step 6:** Kontrollera att pokédexen finns kvar efter omstart av appen. Expected: tidigare fångster kvar.
- [ ] **Step 7:** Ebbe-testet: kan han hitta → fånga → titta i pokédexen själv efter en demonstration? Anteckna friktion (för små träffytor? för snabba animationer?) som justeringar.

---

## Självgranskning mot specen (utförd vid planskrivning)

- Startskärm → Task 6. Gräsglänta → Task 7. Fångst (lyckas alltid, skak, stjärnor, ljud) → Task 8. Pokédex med silhuetter + läte → Task 9. Autosave → Task 3 + 8. Viktad spawn → Task 4 + 7. Assets lokalt, .m4a → Task 2. Offline + hemskärm → Task 10. Deploy → Task 11. Framgångskriterier 1–3 → Task 12.
- Strid, evolution m.m. ingår inte — v2 enligt spec.
- Felhantering: korrupt save (Task 3), loaderror (Task 6) — matchar specens avsnitt.
