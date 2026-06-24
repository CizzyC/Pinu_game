# Pinu Codex Migration Notes

Last updated: 2026-06-24

This document is a handoff snapshot for continuing the Pinu project on a new computer with Codex.

## Repository Layout

- Outer repository: `/Users/admini/Documents/Pinu`
  - Remote: `https://github.com/CizzyC/Pinu_demo.git`
  - Current branch during handoff: `codex/pinu-bingo-layout-fix`
- Game repository: `/Users/admini/Documents/Pinu/Pinu_game`
  - Remote: `https://github.com/CizzyC/Pinu_game.git`
  - Current branch during handoff: `codex/pinu-bingo-layout-fix`

`Pinu_game` is an independent Git repository inside the outer `Pinu` repository. Treat commits and pushes for the two repositories separately.

## Important Files

- `AGENTS.md`: project-specific Codex workflow and coding rules.
- `index.html`: single-file playable Pinu Word Bingo prototype.
- `docs/bingo-challenge-requirements.md`: current product and UI requirements for the Bingo challenge.
- `docs/README.md`: docs folder overview.
- `README.md`: game project overview.

## Current Product State

The active prototype is a mobile-style Pinu Word Bingo challenge in `index.html`.

Current experience includes:

- Pinu-style home, tasks, profile, and game screens.
- Home screen daily challenge card labeled `Word Bingo`.
- Tasks tab with a pinned `Word Bingo` challenge and daily quest list.
- Bingo game screen with timer, called words, board state, Bingo claiming, score, and results.
- Updated requirements describing the simplified tasks tab and Word Bingo entry points.

Recent local changes prepared for migration:

- Refined the home challenge card layout and visuals.
- Added a close button for the home `Word Bingo` card.
- Updated task page title, streak display, pinned challenge card, and daily quest rows.
- Updated screenshot asset references from `Pinu_首页.PNG` / `Pinu_个人档案.PNG` to `首页.PNG` / `个人档案.PNG`.
- Updated `docs/bingo-challenge-requirements.md` to describe the current task-page scope.

## How To Continue On A New Computer

1. Log in to the same Codex/OpenAI account.
2. Clone the outer repository:

```bash
mkdir -p ~/Documents
cd ~/Documents
git clone https://github.com/CizzyC/Pinu_demo.git Pinu
cd Pinu
git checkout codex/pinu-bingo-layout-fix
```

3. If `Pinu_game` is not present as a normal folder after cloning, clone it separately:

```bash
cd ~/Documents/Pinu
git clone https://github.com/CizzyC/Pinu_game.git Pinu_game
cd Pinu_game
git checkout codex/pinu-bingo-layout-fix
```

4. Open the prototype locally:

```bash
open ~/Documents/Pinu/Pinu_game/index.html
```

## Verification Checklist

After migration, verify:

- `git status --short --branch` is clean in `~/Documents/Pinu/Pinu_game`.
- `git status --short --branch` is clean in `~/Documents/Pinu`.
- `index.html` opens in a browser.
- The home `Word Bingo` card appears and the `PLAY` button starts the game.
- The Tasks tab shows the pinned challenge and daily quest list.
- The profile screenshot path resolves if local screenshot assets are present.

## Codex Continuation Prompt

Use this prompt in a new Codex thread if the previous conversation history is not available:

```text
We are continuing the Pinu project. Please read Pinu_game/AGENTS.md and Pinu_game/CODEX_MIGRATION_NOTES.md first. The current focus is the mobile-style Pinu Word Bingo prototype in Pinu_game/index.html. Keep changes surgical, match existing style, and verify before committing.
```

## Notes

- Do not commit `.DS_Store`, dependency folders, logs, or local temporary files.
- If screenshot assets are not tracked in Git, copy the local `项目截图` folder separately or update asset paths before continuing.
- Because `Pinu_game` is a nested repository, push `Pinu_game` first, then commit the updated nested repository pointer in the outer `Pinu` repository.
