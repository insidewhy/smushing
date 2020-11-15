type WorkerMessage =
  | {
      type: 'start'
      imageData: Uint8ClampedArray
    }
  | { type: 'stop' }

function rgbToHsv(r: number, g: number, b: number) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h: number
  if (delta === 0) {
    h = 0
  } else if (r === max) {
    h = ((g - b) / delta) % 6
  } else if (g === max) {
    h = (b - r) / delta + 2
  } else if (b === max) {
    h = (r - g) / delta + 4
  }

  h = Math.round(h * 60)
  if (h < 0) h += 360

  const s = Math.round((max === 0 ? 0 : delta / max) * 100)
  const v = Math.round((max / 255) * 100)

  return { h, s, v }
}

function hsvToRgb(h: number, s: number, v: number) {
  const vDiv100 = v / 100
  const c = vDiv100 * (s / 100)
  const hh = h / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  const m = vDiv100 - c

  const p = Math.floor(hh)
  const rgb =
    p === 0
      ? [c, x, 0]
      : p === 1
      ? [x, c, 0]
      : p === 2
      ? [0, c, x]
      : p === 3
      ? [0, x, c]
      : p === 4
      ? [x, 0, c]
      : p === 5
      ? [c, 0, x]
      : []

  return {
    r: Math.round(255 * (rgb[0] + m)),
    g: Math.round(255 * (rgb[1] + m)),
    b: Math.round(255 * (rgb[2] + m)),
  }
}

const SMUSH_FACTOR = 50
const HALF_SMUSH_FACTOR = SMUSH_FACTOR / 2

class Smusher {
  private rgbaData: Uint8ClampedArray
  private stopped = false

  constructor(private hsvData: Uint8ClampedArray) {
    this.update = this.update.bind(this)
    this.rgbaData = new Uint8ClampedArray(this.hsvData.length)
  }

  start() {
    // convert imageData to hsv
    for (let i = 0; i < this.hsvData.length; i += 4) {
      const { h, s, v } = rgbToHsv(this.hsvData[i], this.hsvData[i + 1], this.hsvData[i + 2])
      this.hsvData[i] = h
      this.hsvData[i + 1] = s
      this.hsvData[i + 2] = v
      // copy alpha to rgba copy, it doesn't change
      this.rgbaData[i + 3] = this.hsvData[i + 3]
    }

    requestAnimationFrame(this.update)
  }

  update() {
    if (this.stopped) {
      return
    }

    for (let i = 0; i < this.hsvData.length; i += 4) {
      this.hsvData[i] = (this.hsvData[i] + (Math.random() * SMUSH_FACTOR - HALF_SMUSH_FACTOR)) % 255
      const { r, g, b } = hsvToRgb(this.hsvData[i], this.hsvData[i + 1], this.hsvData[i + 2])
      this.rgbaData[i] = r
      this.rgbaData[i + 1] = g
      this.rgbaData[i + 2] = b
    }

    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;((globalThis as unknown) as Worker).postMessage(this.rgbaData)
    requestAnimationFrame(this.update)
  }

  stop() {
    this.stopped = true
  }
}

let smusher: Smusher | undefined

self.addEventListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
  switch (data.type) {
    case 'start':
      if (smusher) {
        smusher.stop()
      }
      smusher = new Smusher(data.imageData)
      smusher.start()
      break

    case 'stop':
      if (smusher) {
        smusher.stop()
        smusher = null
      }
      break
  }
})

export default (self as unknown) as { new (): Worker }
