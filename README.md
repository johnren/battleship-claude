# battleship-claude

**Play it live: https://johnren.github.io/battleship-claude/**

Single-player Battleship in the browser: you against a computer opponent that uses a hunt/target strategy. Built with React, Vite and TypeScript, with no backend.

## How to play

1. **Place your fleet.** Pick a ship (Carrier 5, Battleship 4, Cruiser 3, Submarine 3, Destroyer 2), hover over **Your fleet** to preview it, and click to place it. A green preview is valid. A red one is off the board or overlapping and cannot be placed.
   - **Rotate** with the Rotate button, the **R** key or the **spacebar**.
   - On a touch screen, tap once to preview and tap the same cell again to confirm.
   - With a keyboard, Tab to a cell to preview and press Enter to place.
   - **Randomize** places the whole fleet for you. **Reset** clears it. Select a placed ship in the picker to move it.
   - **Start** is enabled once all five ships are placed.
2. **Fire.** You shoot first. Click (or Tab + Enter) a cell in **Enemy waters**. Each shot is reported as a hit, a miss, or a sink with the ship's name. A hit does not give you another turn.
3. **The computer fires back** about 600 ms later. Both grids are locked meanwhile, and the indicator in the top right shows whose turn it is.
4. **Win** by hitting all 17 enemy ship cells. At game over the computer's remaining ships are revealed, and you can **Play Again**.

Add `?seed=123` (any integer) to the URL to make the computer's fleet and its shots repeatable. That's useful for reproducing a bug.

## Run locally

Requires Node 24 (current LTS; see `.nvmrc`).

```sh
npm ci
npm run dev          # http://localhost:5173/battleship-claude/
```

| Command            | What it does                                                   |
| ------------------ | -------------------------------------------------------------- |
| `npm test`         | Vitest unit and component tests                                |
| `npm run lint`     | ESLint                                                         |
| `npm run build`    | Type-check (`tsc -b`) and production build to `dist/`          |
| `npm run test:e2e` | Build, then run the Playwright end-to-end test against `dist/` |
| `npm run preview`  | Serve the production build                                     |
| `npm run format`   | Prettier                                                       |

Before the first e2e run, install the browser with `npx playwright install chromium`.

### Versions

| Tool                          | Version        |
| ----------------------------- | -------------- |
| Node.js                       | 24 LTS (24.21) |
| npm                           | 11             |
| React / React DOM             | 19.3           |
| TypeScript (strict)           | 6.0            |
| Vite                          | 8.3            |
| @vitejs/plugin-react          | 6.1            |
| Vitest                        | 5.0            |
| jsdom                         | 30.1           |
| @testing-library/react        | 16.3           |
| Playwright (@playwright/test) | 1.64           |
| ESLint                        | 10.12          |
| typescript-eslint             | 8.71           |
| Prettier                      | 3.9            |

## Architecture

```
src/
  game/          Pure TypeScript game logic, no React (enforced by an ESLint rule)
    types.ts       Coord { row, col } (both 0–9), ships, boards, shot results
    ships.ts       The fleet and board size
    rng.ts         Seedable PRNG (mulberry32) whose state is a single number
    board.ts       Ship cells, placement validation, placing ships
    placement.ts   Random fleet placement (same validation as manual placement)
    firing.ts      Firing: hit / miss / sunk, rejecting repeated and off-board shots
    win.ts         Win detection
    ai.ts          Computer opponent (hunt/target)
    gameReducer.ts All game state and transitions, as an immutable reducer
  components/    React UI (App, Board, PlacementControls, FleetStatus, MessageLog, GameOverDialog, …)
  hooks/         useComputerTurn (600 ms delayed shot), usePlacementKeys (R / Space)
  utils/         Coordinate labels ("B7"), reading ?seed=
e2e/             Playwright smoke test
```

- **State.** `App` holds the whole game in `useReducer(gameReducer)`. The reducer is pure and returns new objects, never mutating. The RNG state is stored as a number in the game state, so even random steps are pure functions of state.
- **Coordinates.** Coordinates are `{ row, col }` everywhere in the logic. They're converted to labels like "B7" only in the UI.
- **One shot per turn.** `PLAYER_FIRE` is accepted only on the player's turn and for a cell not yet fired at, and it passes the turn in the same update. Extra rapid clicks are ignored, and repeated shots don't use up the turn.
- **Cancelling the computer's move.** `useComputerTurn` sets a 600 ms timer when the computer's turn starts and clears it whenever the phase, turn or game changes. Each `COMPUTER_FIRE` action also carries a `gameId` that Play Again increments, so a stale move from a previous game is ignored by the reducer even if it arrives.
- **Tests.** The tests sit next to the code. They cover placement edges and wrapping, firing, sunk/win detection, 100 simulated AI games, the reducer (turn locking, Play Again), the computer-turn timer, and the App's main flows.
- **CI/CD.** `.github/workflows/deploy.yml` runs lint → unit tests → build → e2e on every push and pull request. Only a push to `main` where all of these pass deploys `dist/` to GitHub Pages. Vite's `base` is `/battleship-claude/`.

## How the computer opponent works

The computer only knows what a human opponent would know: its own shots, whether each was a hit or a miss, and which ship was sunk. Its state (`AiState` in `src/game/ai.ts`) never contains the player's board. `chooseShot(ai, rng)` takes only that state. The reducer then fires the chosen shot at the player's board and reports the result back through `recordResult`.

- **Hunt mode.** It fires at a random untried cell where `row + col` is even (a checkerboard). The smallest ship is 2 long, so every ship covers at least one such cell. If none are left, it uses any untried cell.
- **Target mode.** After a hit it tries the cells above, below, left and right. Once two or more hits line up, it fires just past either end of the line until the ship sinks.
- **After a sink,** it marks the line of hits through the sinking shot, as long as the sunk ship, as resolved. If other hits remain it keeps targeting them, otherwise it goes back to hunting. It decides whether hits are unresolved by counting (total hits > total length of ships sunk). The count is exact even when ships touch and it can't tell which hits belonged to which ship, so it never goes back to hunting while a ship it has hit is still afloat. In that ambiguous case it targets around all of its hits.
- **Randomness.** It comes from a seedable generator. `?seed=N` seeds the computer's fleet and shots. The player's Randomize button uses a separate stream derived from the same seed, so pressing it doesn't change the computer's fleet or how it picks shots.

In 2,000 simulated games against random fleets it needs about 51 shots on average (range 20–68). Random firing needs about 96.

## Decisions on ambiguities in the spec

Where the spec left room, I chose the simplest reasonable option:

- **44 px cells vs. a 400 px board.** The spec asks for every cell to be 44 px tall on touch screens, but also caps a board at 400 px wide with square cells that shrink to fit the screen. Ten 44 px cells can't fit in 400 px, so the size cap and fit-to-screen win. Cells are about 36 px at full size and about 30 px at 375 px wide. Buttons are always at least 44 px tall.
- **Enemy fleet status.** The enemy's list shows which ships are afloat or sunk, and fills a ship's squares only when it sinks. As in the classic game, a hit is reported without naming the ship ("Hit at B7."), so showing partial damage would give that away. Your own fleet shows damage as it happens.
- **Seeds and Play Again.** With `?seed=` in the URL, Play Again starts the same seeded game again, so a bug stays reproducible. Without it, each new game gets a fresh random seed. The computer's shots also depend on your fleet (through hit/miss results), so a fully repeatable game needs the same seed and the same placement (e.g. Randomize pressed the same number of times).
- **Space during placement** is captured on the whole page, so it rotates instead of scrolling or pressing a focused button. During placement, buttons are activated with Enter or a click.
- **Escape at game over** closes the dialog so you can study the revealed boards. A game-over bar above the boards keeps the result and Play Again visible (see BUGS.md #1).
- **Turn indicator** shows "Placing ships" during placement and "Game over" at the end, in addition to the specified "Your turn" and "Enemy firing…".
- **Messages for the computer's shots** use "They missed at C3.", "They hit your Battleship at E5." and "They sank your Cruiser!".
- **Moving a placed ship.** Selecting it in the picker and placing it again moves it.
- **Hit cells** on both boards use the water background with the red ✕. The ✕ isn't readable on the grey ship color.
- **Sunk cells** use the main text color for the kept ✕, because red on the dark-red sunk fill has too little contrast. Every text color meets WCAG AA. The specified red ✕ on water is a non-text marker at 2.95:1, just under the 3:1 guideline. It's kept because the spec sets that color, and each cell's accessible label also says "hit".
- **The e2e test** runs in Chromium in CI. Firefox and WebKit were checked by playing full games with Playwright during development.
- **Prettier** was added as a formatting tool. It isn't part of the game.
