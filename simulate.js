const vector = {
  args: [],
  multiply: function (c) {
    return Vector.create(this.args.map(x => c * x))
  },
  linearOp: function (v, [c1, c2] = [1, 1]) {
    if (this.args.length !== v.args.length) return null
    return Vector.create(this.args.map((value, index) => c1 * value + c2 * v.args[index]))
  },
  add: function (v) {
    return this.linearOp(v)
  },
  subtract: function (v) {
    return this.linearOp(v, [1, -1])
  },
  dot: function (v) {
    if (this.args.length !== v.args.length) return null
    return this.args.reduce((acc, cur, index) => (acc + cur * v.args[index]), 0)
  },
  isZero: function () {
    return this.args.reduce((acc, cur) => acc && cur === 0, true)
  }
}

const Vector = {
  create: function (args = []) {
    return Object.assign(Object.create(vector), { args })
  }
}

const particleListA = []
const particleListB = []

let options = {}
let initialized = false

let iterations = 0
let timeAhead = 0
let listSelect = false
let simStart = 0

function createParticle (x, y, r, theta) {
  return {
    r: Vector.create([x, y]),
    v: Vector.create([r * Math.cos(theta), r * Math.sin(theta)])
  }
}

function initialize (content) {
  options = content
  const {
    width,
    height,
    n,
    vMean,
    dist
  } = options
  const nCol = Math.ceil((7 + Math.sqrt(49 + 48 * n)) / 24) * 4 - 1
  const xMargin = width / (nCol + 1)
  const yMargin = height / (Math.ceil(n / nCol) + 1)
  if (dist === 'delta') {
    for (let i = 0; i < n; i++) {
      particleListA.push(createParticle((i % nCol + 1) * xMargin, Math.floor(i / nCol + 1) * yMargin, vMean, 2 * Math.PI * Math.random()))
    }
  } else {
    for (let i = 0; i < n; i++) {
      particleListA.push(createParticle((i % nCol + 1) * xMargin, Math.floor(i / nCol + 1) * yMargin, 2 * vMean * Math.random(), 2 * Math.PI * Math.random()))
    }
  }
  simStart = Date.now()
  initialized = true
  postMessage({
    type: 'initialized',
    particleList: particleListA
  })
}

function proceed () {
  const {
    width,
    height,
    r,
    dt,
    timestamp
  } = options

  for (;;) {  
    const curr = listSelect ? particleListB : particleListA
    const next = listSelect ? particleListA : particleListB
    const victim = [-1, -1]
    let dtMin = null
    let tmp = null // Candidates for dtMin
    let wallDirection = null // Direction of normal vector; 0 is x, 1 is y

    //Performance mode implementation
    //  1. Proceed with dt
    //  2. Handle collision between particles
    //  3. Handle collision with boundary
    
    //  1. Proceed with dt
    for (let i = 0; i < curr.length; i++) {
      next[i] = { r: curr[i].r.linearOp(curr[i].v, [1, dt]), v: curr[i].v }
    }
    
    
    //  2. Handle collision between particles
    for (let i = 0; i < curr.length; i++) {
        for (let j = i+1; j < curr.length; j++) {
            let d = Math.sqrt(Math.pow(next[i].r.args[0] - next[j].r.args[0],2) + Math.pow(next[i].r.args[1] - next[j].r.args[1],2))
            if (d <= r) {
                const a = next[i]
                const b = next[j]
                const dr = b.r.subtract(a.r)
                const dv = b.v.subtract(a.v)
                const dva = dr.multiply(dv.dot(dr) / dr.dot(dr))
                a.v = a.v.add(dva)
                b.v = b.v.subtract(dva)
            }
        }
    }
    
    //  3. Handle collision with boundary
    for (let i = 0; i < curr.length; i++) {
        if (next[i].r.args[0] + r >= width && next[i].v.args[0] >= 0) {
            next[i].v.args[0] *= -1
        }
        if (next[i].r.args[0] - r <= 0 && next[i].v.args[0] <= 0) {
            next[i].v.args[0] *= -1
        }
        if (next[i].r.args[1] + r >= height && next[i].v.args[1] >= 0) {
            next[i].v.args[1] *= -1
        }
        if (next[i].r.args[1] - r <= 0 && next[i].v.args[1] <= 0) {
            next[i].v.args[1] *= -1
        }
    }
    
      
    listSelect = !listSelect
    
    dtMin = dt
      
    if (timeAhead + dtMin >= dt) {
      const startTime = timeAhead
      timeAhead += dtMin
      const di = Math.floor(timeAhead / dt)
      timeAhead = timeAhead % dt
      iterations += di
      if (iterations % timestamp === 0) {
        console.log(`Elapsed time since simulation start = ${ Date.now() - simStart }`)
      }
      postMessage({
        type: 'proceeded',
        startTime,
        di,
        particleList: curr
      })
      break
    }
      
    timeAhead += dtMin
    
    
    
    
    
    
    //----------------------------------------------------------------------
      /*
    for (let i = 0; i < curr.length; i++) {
      if (!curr[i].v.isZero()) {
        const vWallCollisionTime = (curr[i].v.args[0] >= 0) ? (width - curr[i].r.args[0] - r) / curr[i].v.args[0] : (curr[i].r.args[0] - r) / -curr[i].v.args[0]
        const hWallCollisionTime = (curr[i].v.args[1] >= 0) ? (height - curr[i].r.args[1] - r) / curr[i].v.args[1] : (curr[i].r.args[1] - r) / -curr[i].v.args[1]
        // Time left for the collision of curr[i] and the wall to happen, if there are no other particles
        tmp = (vWallCollisionTime < hWallCollisionTime) ? vWallCollisionTime : hWallCollisionTime
        if (dtMin === null || tmp < dtMin) {
          dtMin = tmp
          wallDirection = (vWallCollisionTime < hWallCollisionTime) ? 0 : 1
          victim[0] = i
          victim[1] = -1
        }
      }

      for (let j = i; j < curr.length; j++) {
        const dr = curr[j].r.subtract(curr[i].r)
        const dv = curr[j].v.subtract(curr[i].v)
        const a = dv.dot(dv)
        const b = 2 * dr.dot(dv)
        const c = dr.dot(dr) - 4 * r * r
        if (a === 0) {
          continue
        }
        const minDistTime = -0.5 * b / a
        const distSquareDiff = a * minDistTime * minDistTime + b * minDistTime + c
        if (distSquareDiff < 0) {
          // Time left for the collision of curr[i] and curr[j] to happen, if there are no other particles
          const tmp = 0.5 * (-b - Math.sqrt(b * b - 4 * a * c)) / a // We want the earlier solution
          if (0 <= tmp && tmp < dtMin) { // tmp is always non-negative
            dtMin = tmp
            victim[0] = i
            victim[1] = j
          }
        }
      }
    }

    for (let i = 0; i < curr.length; i++) {
      next[i] = { r: curr[i].r.linearOp(curr[i].v, [1, dtMin]), v: curr[i].v }
    }
    if (victim[1] === -1) {
      if (victim[0] === -1) {
        throw new Error('Error: the system has no energy')
      }
      const newV = next[victim[0]].v.args.slice()
      newV[wallDirection] = -newV[wallDirection]
      next[victim[0]].v = Vector.create(newV)
    } else {
      const a = next[victim[0]]
      const b = next[victim[1]]
      const dr = b.r.subtract(a.r)
      const dv = b.v.subtract(a.v)
      const dva = dr.multiply(dv.dot(dr) / dr.dot(dr))
      a.v = a.v.add(dva)
      b.v = b.v.subtract(dva)
    }

    const collisionTime = Math.floor(dtMin + timeAhead + iterations * dt).toString()
    console.log(`[${ collisionTime.padStart(8) }] Collision of Particle ${ victim[0].toString().padStart(6) } and ${ ((victim[1] === -1) ? 'Wall' : victim[1].toString()).padStart(6) }`)
    listSelect = !listSelect

    if (timeAhead + dtMin >= dt) {
      const startTime = timeAhead
      timeAhead += dtMin
      const di = Math.floor(timeAhead / dt)
      timeAhead = timeAhead % dt
      iterations += di
      if (iterations % timestamp === 0) {
        console.log(`Elapsed time since simulation start = ${ Date.now() - simStart }`)
      }
      postMessage({
        type: 'proceeded',
        startTime,
        di,
        particleList: curr
      })
      break
    }
    timeAhead += dtMin
      */
      //----------------------------------------------------
  }
}

onmessage = function (event) {
  switch (event.data.type) {
  case 'initialize':
    initialize(event.data.content)
    break
  case 'proceed':
    if (initialized) {
      proceed()
    }
    break
  default:
  }
}
