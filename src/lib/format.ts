export function formatMoney(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatMult(n: number): string {
  if (!Number.isFinite(n)) return '0.00×'
  return `${n.toFixed(2)}×`
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
