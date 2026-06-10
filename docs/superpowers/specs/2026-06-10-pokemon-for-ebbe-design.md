# Design: Pokemon för Ebbe (3 år)

**Datum:** 2026-06-10
**Status:** Godkänd av Erik

## Mål

Ett Pokemon Red-inspirerat spel som en treåring (Ebbe) kan spela själv på iPad.
Kärnloop: hitta pokemon → fånga → titta i pokédexen. Helt utan läskrav —
bara bilder, ikoner och ljud.

## Krav och avgränsningar

- **Enhet:** iPad, touch, Safari (läggs på hemskärmen som webapp).
- **Grafik:** riktiga Pokemon — sprites/artwork/läten från PokeAPI. Endast privat
  bruk, publiceras aldrig publikt (Nintendos figurer).
- **Designprincip:** en treåring kan inte misslyckas. Inga förluster, ingen text,
  inga menyer som kräver läsning.
- **Historiska fällor som designen skyddar mot:**
  - *För stort scope* → hård v1-gräns (se nedan), strid är v2.
  - *Tekniska problem* → låsta beroendeversioner, ingen TypeScript,
    inga nätverksanrop i runtime, minimal Vite-konfig.

## Spelupplevelsen (v1)

1. **Startskärm** — en stor pokeboll-knapp. Tryck → spela.
2. **Gräsgläntan (CatchScene)** — 3–4 vajande grästuvor. Tryck på en tuva →
   en pokemon hoppar fram. Slumpas ur en pool på ~20 kända gen 1-pokemon,
   viktat så att ofångade dyker upp oftare.
3. **Fångsten** — tryck på pokebollen → den flyger i en båge, pokemonen sugs in,
   bollen skakar, sedan stjärnor + konfetti + glatt ljud. Fångsten lyckas alltid;
   spänningen ligger i bollskaket, inte i risken.
4. **Pokédexen** — rutnät: fångade i färg, ofångade som mörka silhuetter.
   Tryck på en fångad → stor bild + pokemonens läte.

Framsteg sparas automatiskt i localStorage.

### V2 (byggs först när v1 fungerar på iPaden)

Förenklad strid: välj din pokemon → motståndare dyker upp → tryck på din pokemon
för att attackera → motståndarens tre hjärtan försvinner ett i taget → konfetti.
Ingen förlust möjlig — motståndaren låtsas-attackerar men kan inte vinna.

### Uttryckligen INTE i v1

Strid, evolution, items, levlar, fler än ~20 pokemon, ljudinställningar,
UI-testramverk.

## Teknik

- **Stack:** Phaser 3 + Vite + vanilla JS. Exakta versioner låses i package.json.
- **Struktur** — små filer, en Phaser-scen per spelscen:

```
src/
  main.js            — Phaser-config, registrerar scener
  scenes/
    PreloadScene.js  — laddar alla bilder/ljud, visar laddningsbild
    StartScene.js    — pokeboll-knappen
    CatchScene.js    — gräsgläntan + fångstsekvensen
    PokedexScene.js  — rutnätet + detaljvy
  systems/
    save.js          — localStorage: läs/skriv fångade pokemon
    spawner.js       — viktad slumpning av nästa pokemon
  data/
    pokemon.js       — listan: ~20 st {id, namn, sprite, läte}
```

- **Assets:** sprites och läten hämtas från PokeAPI *en gång* vid projektbygget
  (skript i `tools/`) och lagras i `assets/`. Spelet gör noll nätverksanrop i
  runtime → funkar offline, inga API-fel på iPaden. Läten konverteras till .m4a
  (iOS Safari hanterar inte .ogg pålitligt — verifieras på riktig iPad).
- **Save:** localStorage med try/catch — trasig save ger tom pokédex, inte krasch.
- **Deploy:** `vite build` → GitHub Pages via `gh`. Webmanifest för
  fullskärm/hemskärmsikon på iPad.

## Felhantering

Allt är lokalt, så felkällorna är få:

- localStorage som saknas/är korrupt → starta med tom samling.
- Asset som inte laddar → PreloadScene loggar fel; spelet startar inte halvt
  (hellre tydligt stopp vid utveckling än konstigt beteende för Ebbe).

## Testning

- **Vitest** enbart på ren logik: `spawner.js` (viktning, slumppool) och
  `save.js` (läs/skriv/korrupt data).
- Scener verifieras manuellt i webbläsare och på riktig iPad.
- Inga UI-testramverk (scope-skydd).

## Framgångskriterier

1. Ebbe kan själv: starta spelet, hitta en pokemon, fånga den och se den
   i pokédexen — utan vuxenhjälp efter första visningen.
2. Spelet startar på iPad från hemskärmsikon, i fullskärm, även offline.
3. Pokédexen finns kvar efter att spelet stängts och öppnats igen.
