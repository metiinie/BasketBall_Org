import { toPng } from 'html-to-image'

/**
 * Capture the standings social card DOM element and download as PNG.
 * @param {string} elementId  - DOM element ID to capture (default: 'standings-social-card')
 * @param {string} filename   - Output filename
 */
export async function exportStandingsImage(
  elementId = 'standings-social-card',
  filename = 'EBF_Standings.png'
) {
  const node = document.getElementById(elementId)
  if (!node) {
    console.error(`[EBF] Export element #${elementId} not found in DOM`)
    return
  }

  try {
    const dataUrl = await toPng(node, {
      quality: 1.0,
      pixelRatio: 2,          // Reduced from 3 to 2 to prevent memory limits
      // We explicitly DO NOT set a hardcoded backgroundColor, so the card respects light/dark theme.
      // We DO NOT set overflow: 'visible', so the card's native 'rounded-2xl' overflow-hidden perfectly clips it.
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  } catch (e) {
    console.error('[EBF] Image export failed:', e)
    throw e
  }
}
