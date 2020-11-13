import 'destyle.css'
import './index.scss'

// code goes here

function loaded() {
  const uploadButton = document.querySelector('main button') as HTMLButtonElement
  const clearButton = document.querySelector('#clear-image') as HTMLButtonElement

  const input = document.querySelector('input')
  input.onchange = () => {
    const img = new Image()
    img.onload = () => {
      drawImage(img)
      uploadButton.style.display = 'none'
    }
    img.src = URL.createObjectURL(input.files[0])
  }

  clearButton.onclick = () => {
    uploadButton.style.display = ''
    const canvas = document.querySelector('canvas')
    const ctxt = canvas.getContext('2d')
    ctxt.clearRect(0, 0, canvas.width, canvas.height)
    input.value = null
  }

  uploadButton.onclick = () => {
    input.click()
  }
}

function drawImage(img: HTMLImageElement) {
  const canvas = document.querySelector('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctxt = canvas.getContext('2d')
  ctxt.drawImage(img, 0, 0)
}

if (document.readyState === 'complete') {
  loaded()
} else {
  window.addEventListener('DOMContentLoaded', loaded)
}
