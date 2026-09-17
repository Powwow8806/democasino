let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  return ctx
}

export function playTone(
  freq: number,
  duration = 0.12,
  type: OscillatorType = 'sine',
  gain = 0.08,
) {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.connect(g)
  g.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + duration)
}

export const sounds = {
  click: () => playTone(420, 0.06, 'triangle', 0.05),
  win: () => {
    playTone(523, 0.1, 'sine', 0.07)
    setTimeout(() => playTone(659, 0.1, 'sine', 0.07), 80)
    setTimeout(() => playTone(784, 0.15, 'sine', 0.08), 160)
  },
  lose: () => playTone(180, 0.25, 'sawtooth', 0.06),
  reveal: () => playTone(660, 0.05, 'square', 0.04),
  cashout: () => {
    playTone(880, 0.08, 'sine', 0.07)
    setTimeout(() => playTone(1175, 0.12, 'sine', 0.08), 70)
  },
  tick: () => playTone(900, 0.03, 'square', 0.03),
}
