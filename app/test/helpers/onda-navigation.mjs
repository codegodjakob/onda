// Gemeinsame Browser-Navigation für Smokes, die aus dem Schreibraum in die
// Quellenbibliothek wechseln. Auf schmalen Ansichten folgt sie der festen Klinke
// (#sidebarToggle) und wartet zustandsbasiert auf beide Animationen.
//
// Seit dem 7. August 2026 gibt es EINEN Knopf statt zweier: #sidebarCollapse und
// #sidebarReopen konnten nie an derselben Stelle stehen, weil sie in verschiedenen
// Kästen hingen. Der Zustand steht am aria-expanded der einen Klinke.

async function warteAufDieLeiste(page) {
  await page.locator('#ondaSidebar').evaluate(async node => {
    await Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {})))
  })
}

export async function ensureProjectSidebarOpen(page) {
  const klinke = page.locator('#sidebarToggle')
  if (await klinke.getAttribute('aria-expanded') === 'false') {
    await klinke.click()
    await warteAufDieLeiste(page)
  }
}

export async function collapseProjectSidebar(page, { touch = false } = {}) {
  await ensureProjectSidebarOpen(page)
  const control = page.locator('#sidebarToggle')
  if (touch) await control.tap()
  else await control.click()
  await warteAufDieLeiste(page)
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
