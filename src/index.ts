import 'destyle.css'
import './index.scss'
import SmusherWorker from './smusher.worker'

function loaded() {
  const canvas = document.querySelector('canvas')
  const canvasContext = canvas.getContext('2d')

  const smusher = new SmusherWorker()
  const uploadButton = document.querySelector('main button') as HTMLButtonElement
  const clearButton = document.querySelector('#clear-image') as HTMLButtonElement

  const redraw = (imageMessage: MessageEvent<Uint8ClampedArray>) => {
    canvasContext.putImageData(new ImageData(imageMessage.data, canvas.width, canvas.height), 0, 0)
  }

  const input = document.querySelector('input')
  input.onchange = () => {
    const img = new Image()
    img.onload = () => {
      drawImage(smusher, canvas, img)
      smusher.onmessage = redraw
      uploadButton.style.display = 'none'
    }
    img.src = URL.createObjectURL(input.files[0])
  }

  clearButton.onclick = () => {
    smusher.onmessage = null
    smusher.postMessage({ type: 'stop' })
    uploadButton.style.display = ''
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)
    input.value = null
  }

  uploadButton.onclick = () => {
    input.click()
  }
}

function drawImage(smusher: Worker, canvas: HTMLCanvasElement, img: HTMLImageElement) {
  canvas.width = img.width
  canvas.height = img.height
  const ctxt = canvas.getContext('2d')
  ctxt.drawImage(img, 0, 0)
  const { data } = ctxt.getImageData(0, 0, canvas.width, canvas.height)
  smusher.postMessage({ type: 'start', imageData: data })
}

if (document.readyState === 'complete') {
  loaded()
} else {
  window.addEventListener('DOMContentLoaded', loaded)
}
