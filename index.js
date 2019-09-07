const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const hist = document.getElementById('histogram')
const histCtx = hist.getContext('2d')
const histWidth = 320
const histHeight = 240

function simulate (options = {}) {
  const {
    width = 320, // Box width (px)
    height = 240, // Box height (px)
    r = 0.5, // Particle radius (px)
    tMax = 100000, // Max simulation time (ms)
    dt = 50, // Time interval between screen refreshes (ms)
    timestamp = 10, // Number of screen refreshes between timestamps
    n = 1000, // Number of particles
    vMean = 0.1, // Target mean velocity of particles (px/ms)
    dist = 'uniform', // Speed distribution of particles (uniform / delta)
    bins = Math.ceil(Math.log2(n)) + 1, // Number of intervals in histogram
    xMax = 3 * vMean, // Max value of x in histogram plot
    yMax = 1.5 * pdf(vMean) // Max value of y in histogram plot
  } = options

  // On-screen position of bottom-left corner of the box (px)
  const xLeft = 0.5 * (canvas.width - width)
  const yBottom = 0.5 * (canvas.height + height)

  let iterations = 0

  // Maxwell-Boltzmann distribution function (ms/px)
  function pdf (v) {
    return 2 * v * Math.exp(-((v / vMean) ** 2)) / (vMean ** 2)
  }

  function drawHist (freqs) {
    const yScale = histHeight / yMax
    const convert = (x, y) => [0.5 * (hist.width - histWidth) + x, 0.5 * (hist.height + histHeight) - y]
    histCtx.clearRect(0, 0, hist.width, hist.height)
    for (let i = 0; i < bins; i++) {
      histCtx.strokeRect(...convert(i / bins * histWidth, 0), histWidth / bins, -yScale * freqs[i])
    }
    histCtx.save()
    histCtx.beginPath()
    histCtx.strokeStyle = '#F00'
    histCtx.moveTo(...convert(0, 0))
    for (let i = 0; i < histWidth; i++) {
      histCtx.lineTo(...convert(i, yScale * pdf(xMax * i / histWidth)))
    }
    histCtx.stroke()
    histCtx.restore()
    histCtx.clearRect(...convert(0, histHeight), histWidth, -hist.height)
    histCtx.strokeRect(...convert(0, 0), histWidth, -histHeight)
  }

  function drawParticle (radius, x, y) {
    ctx.beginPath()
    ctx.arc(xLeft + x, yBottom - y, radius, 0, 2 * Math.PI)
    ctx.stroke()
  }

  function drawBox (particleList, elapsedTime = 0) {
    const velocity = new Array(bins).fill(0)
    const interval = xMax / bins
    ctx.clearRect(xLeft, yBottom - height, width, height)
    ctx.strokeRect(xLeft, yBottom - height, width, height)
    particleList.forEach((value) => {
      const tmp = Math.floor(Math.sqrt(value.v.args[0] ** 2 + value.v.args[1] ** 2) / interval)
      if (tmp < bins) {
        velocity[tmp]++
      }
      drawParticle(r, value.r.args[0] + elapsedTime * value.v.args[0], value.r.args[1] + elapsedTime * value.v.args[1])
    })
    drawHist(velocity.map((x) => x / interval / n))
  }

  function render (i, data) {
    const { startTime, di, particleList } = data
    iterations++
    if (i === di) {
      setTimeout(() => {
        if (workerJobDone) {
          workerJobDone = false
          if ((iterations + pendingData.di) * dt <= tMax) {
            worker.postMessage({ type: 'proceed' })
          } else {
            worker.terminate()
          }
          render(1, pendingData)
        } else {
          renderDone = true
        }
      }, iterations * dt - (iterations - 1) * dt) // Delay is stored as an integer internally
    } else {
      setTimeout(() => {
        render(i + 1, data)
      }, iterations * dt - (iterations - 1) * dt)
    }
    drawBox(particleList, i * dt - startTime)
  }

  const worker = new Worker('simulate.js')
  let renderDone = true
  let workerJobDone = false
  let pendingData = {}

  worker.onmessage = function (event) {
    switch (event.data.type) {
    case 'initialized':
      drawBox(event.data.particleList)
      if (tMax > 0) {
        worker.postMessage({ type: 'proceed' })
      } else {
        worker.terminate()
      }
      break
    case 'proceeded':
      if (renderDone) {
        renderDone = false
        if ((iterations + event.data.di) * dt <= tMax) {
          worker.postMessage({ type: 'proceed' })
        } else {
          worker.terminate()
        }
        render(1, event.data)
      } else {
        pendingData = event.data
        workerJobDone = true
      }
      break
    default:
    }
  }

  worker.postMessage({
    type: 'initialize',
    content: { width, height, r, dt, n, vMean, dist, timestamp }
  })

  return worker
}
