# Bugs

Every bug found during development, recorded when it was found.
Each entry lists the symptom, root cause, fix, how it was found, the test added to prevent it, and the commit that fixed it.

## 1. Pressing Escape repeatedly at game over strands the player with no Play Again button

- **Symptom:** At game over, pressing Escape three times closed the game-over dialog. The page stayed in the game-over state with both grids locked, and the only Play Again button was inside the closed dialog, so the only way to start a new game was to reload. Reproduced in Chromium, Firefox and WebKit.
- **Root cause:** `GameOverDialog` called `preventDefault()` on the dialog's `cancel` event to keep it open. Browsers deliberately let repeated Escape presses without other user activation close a modal dialog anyway, ignoring `preventDefault()`, so a page cannot trap the user in a modal. Play Again was offered only inside the dialog.
- **Fix:** Stop fighting the browser. Escape now simply closes the dialog (which also lets the player study the revealed boards), and a game-over bar with the result and a Play Again button is shown above the boards for the whole game-over phase.
- **How found:** Code review of the dialog's Escape handling while preparing milestone 4, confirmed by manual testing with a Playwright script in all three browsers.
- **Test added:** The end-to-end test now presses Escape three times at game over and then starts a new game with the Play Again button on the page. `App.test.tsx` checks that a Play Again button outside the dialog is available at game over.
- **Fixed in:** _pending_
