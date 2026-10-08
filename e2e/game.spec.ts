import { expect, test } from '@playwright/test'

test('plays a seeded game from placement to game over', async ({ page }) => {
  await page.goto('./?seed=123')
  await expect(page.getByRole('heading', { name: 'Battleship' })).toBeVisible()

  const start = page.getByRole('button', { name: 'Start' })
  await expect(start).toBeDisabled()
  await page.getByRole('button', { name: 'Randomize' }).click()
  await expect(start).toBeEnabled()
  await start.click()

  const status = page.getByRole('status')
  const dialog = page.getByRole('dialog')
  const enemy = page.getByRole('region', { name: 'Enemy waters' })
  await expect(status).toHaveText('Your turn')

  let shots = 0
  while (!(await dialog.isVisible())) {
    // Fire at the first cell not yet fired at, then wait for the computer to reply or the game to end.
    await enemy
      .getByRole('button', { name: /, not fired at$/ })
      .first()
      .click()
    shots++
    expect(shots).toBeLessThanOrEqual(100)
    await expect(status.getByText('Your turn', { exact: true }).or(dialog)).toBeVisible()
  }

  await expect(dialog.getByRole('heading', { name: /^(Victory|Defeat)$/ })).toBeVisible()
  await expect(dialog).toContainText(`Shots fired${shots}`)
  await expect(dialog).toContainText('Hit accuracy')

  // Escape closes the dialog (browsers force this on repeated presses); Play Again must stay reachable.
  await expect(dialog.getByRole('button', { name: 'Play Again' })).toBeFocused()
  for (let i = 0; i < 3; i++) await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.getByRole('region', { name: 'Game over' }).getByRole('button', { name: 'Play Again' }).click()
  await expect(status).toHaveText('Placing ships')
  await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled()
  await expect(page.locator('.log-entry')).toHaveCount(0)
})
