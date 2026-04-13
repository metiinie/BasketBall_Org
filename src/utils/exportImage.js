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
      pixelRatio: 3,          // High-DPI for crisp mobile screenshots
      backgroundColor: '#0d1b2a',
      style: {
        // Remove any scroll overflow that would clip the image
        overflow: 'visible',
      },
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
