// Gemeinsame Browser-Navigation für Smokes, die aus dem Schreibraum in die
// Quellenbibliothek wechseln. Auf schmalen Ansichten folgt sie dem sichtbaren
// Seitenleisten-Schalter und wartet zustandsbasiert auf beide Animationen.

export async function ensureProjectSidebarOpen(page) {
  if (await page.locator('#sidebarReopen').isVisible()) {
    await page.locator('#sidebarReopen').click()
    await page.locator('#ondaSidebar').evaluate(async node => {
      await Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {})))
    })
  }
}

export async function collapseProjectSidebar(page, { touch = false } = {}) {
  await ensureProjectSidebarOpen(page)
  const control = page.locator('#sidebarCollapse')
  if (touch) await control.tap()
  else await control.click()
  await page.locator('#ondaSidebar').evaluate(async node => {
    await Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {})))
  })
}

export async function openMaterialLibrary(page) {
  if (!await page.locator('#materialSources').isVisible()) {
    await page.evaluate(() => window.AIWT.openDoc(window.AIWT.state.active))
  }
  await ensureProjectSidebarOpen(page)
  await page.locator('#materialSources').click()
  await page.locator('#materialModal').waitFor({ state: 'visible' })
  await page.locator('#materialModal').evaluate(async node => {
    await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
  })
}
