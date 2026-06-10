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
