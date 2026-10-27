import { createHash, timingSafeEqual } from 'node:crypto'

const GITHUB_API = 'https://api.github.com'

// Vergelijkt twee strings zonder dat de responstijd verraadt hoeveel tekens kloppen.
function secretMatches(given, expected) {
  if (typeof given !== 'string' || !given) return false
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

// Telt runs van deze workflow die al wachten of lopen. Dient als rate-limit:
// zolang er één bezig is, start de knop geen nieuwe.
async function activeRunCount(base, token) {
  let total = 0
  for (const status of ['queued', 'in_progress']) {
    const response = await fetch(`${base}/runs?status=${status}&per_page=1`, {
      headers: githubHeaders(token)
    })
    if (!response.ok) throw new Error(`GitHub status ${response.status}`)
    const payload = await response.json()
    total += payload.total_count || 0
  }
  return total
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const secret = process.env.REFRESH_SECRET
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const workflow = process.env.GITHUB_WORKFLOW || 'update-data.yml'
  const ref = process.env.GITHUB_REF || 'main'

  // Zonder geheim staat het endpoint dicht (fail closed).
  if (!secret || !token || !owner || !repo) {
    return res.status(503).json({ message: 'Refresh is niet geconfigureerd.' })
  }

  if (!secretMatches(req.headers['x-refresh-secret'], secret)) {
    return res.status(401).json({ message: 'Ongeldige refresh-code.' })
  }

  const base = `${GITHUB_API}/repos/${owner}/${repo}/actions/workflows/${workflow}`

  try {
    if ((await activeRunCount(base, token)) > 0) {
      return res.status(429).json({ message: 'Er loopt al een update. Probeer het over een paar minuten opnieuw.' })
    }

    const response = await fetch(`${base}/dispatches`, {
      method: 'POST',
      headers: githubHeaders(token),
      body: JSON.stringify({ ref })
    })

    if (!response.ok) {
      // Details alleen in de Vercel-log, niet naar de browser.
      console.error('Workflow dispatch failed', response.status, await response.text())
      return res.status(502).json({ message: 'Starten van de update is mislukt.' })
    }

    return res.status(200).json({
      message: 'Update gestart. De nieuwe cijfers staan over een paar minuten live.'
    })
  } catch (error) {
    console.error('Refresh error', error)
    return res.status(502).json({ message: 'Starten van de update is mislukt.' })
  }
}
