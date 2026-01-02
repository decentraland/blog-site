function formatUtcDate(value?: string): string {
  if (!value) return ''
  const raw = value
  const date = new Date(raw.includes('T') ? raw : `${raw}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) {
    return raw
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(date)
}

export { formatUtcDate }
