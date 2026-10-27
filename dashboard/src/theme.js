// Vaste kleuren voor het hele dashboard. Dezelfde waarden staan als CSS-variabelen in index.css.
export const COLORS = {
  red: '#c8102e', // Ajax-rood: hoofdkleur en eerste grafiekreeks
  redDark: '#a60d25',
  redLight: '#f2a7b3',
  ink: '#111111',
  grey: '#9ca3af',
  greyLight: '#d4d4d4',
  win: '#2e9e5b',
  draw: '#e2a13a',
  loss: '#d32f2f'
}

// Volgorde voor grafieken met meerdere reeksen.
export const SERIES = [COLORS.red, COLORS.ink, COLORS.grey, COLORS.redLight, COLORS.greyLight, '#6b7280', '#7f0a1d']

// Platformkleuren op label, zodat de trendgrafiek en het wedstrijddetail dezelfde kleuren tonen.
export const PLATFORM_COLORS = {
  'iOS-app': COLORS.red,
  'Android-app': COLORS.ink,
  Webbrowser: COLORS.grey,
  'Relay/herdistributie': COLORS.redLight,
  Overig: COLORS.greyLight
}

export const TOOLTIP_LABEL_STYLE = { color: COLORS.ink }
