// Vercel Routing Middleware: zet één wachtwoord op de hele site, inclusief de
// JSON onder /output/ en /api/. Draait alleen op Vercel, niet in `npm run dev`.
// Wachtwoord staat in de Vercel-variabele SITE_PASSWORD; de gebruikersnaam
// maakt niet uit. Zonder SITE_PASSWORD staat de site dicht.
import { createHash, timingSafeEqual } from 'node:crypto'

export const config = {
  runtime: 'nodejs'
}

const REALM = 'Ajax Radio Dashboard'

function sha256(value) {
  return createHash('sha256').update(value).digest()
}

function passwordFromHeader(header) {
  if (!header || !header.startsWith('Basic ')) return null
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const colon = decoded.indexOf(':')
    return colon === -1 ? null : decoded.slice(colon + 1)
  } catch {
    return null
  }
}

function unauthorized(message, status = 401) {
  const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
  if (status === 401) headers['WWW-Authenticate'] = `Basic realm="${REALM}", charset="UTF-8"`
  return new Response(message, { status, headers })
}

export default function middleware(request) {
  const expected = process.env.SITE_PASSWORD
  if (!expected) {
    return unauthorized('Dashboard is niet geconfigureerd.', 503)
  }

  const given = passwordFromHeader(request.headers.get('authorization'))
  if (given === null || !timingSafeEqual(sha256(given), sha256(expected))) {
    return unauthorized('Wachtwoord vereist.')
  }

  // Niets teruggeven = de aanvraag gaat door naar de site.
  return undefined
}
