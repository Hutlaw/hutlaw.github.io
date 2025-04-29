const canvas = document.getElementById('life')
const ctx = canvas.getContext('2d')
let size = 12, cols, rows
let grid, nextGrid, running = false, interval = 1000 / 30
let patternType = 'toggle'
let generation = 0
let bloomOn = true
const patterns = {
  glider: { coords: [[1,0],[2,1],[0,2],[1,2],[2,2]] },
  gun: { coords: [
    [5,1],[5,2],[6,1],[6,2],[5,11],[6,11],[7,11],[4,12],[3,13],[3,14],
    [8,12],[9,13],[9,14],[6,15],[4,16],[5,17],[6,17],[7,17],[6,18],
    [8,16],[3,21],[4,21],[5,21],[3,22],[4,22],[5,22],[2,23],[6,23],
    [1,25],[2,25],[6,25],[7,25],[3,35],[4,35],[3,36],[4,36]
  ]},
  pulsar: { rle: `26b2o$25b2o$4bo5bo9bo4b2o$4bo5bo9bo4bo$4b2o3b2o9b2o2b3o$24bobobo$3o2b2ob2o2b3ob3o2b2ob2o2b3o$2bobobobobobo5bobobo$4b3ob3o9b3o2b2o$5bo3bo11bo4bo$4b2o3b2o9b2o4bo$4b2o3b2o9b2o$3b2o5b2o7b2o!` }
}
const genEl = document.getElementById('generation-count')
const popEl = document.getElementById('population-count')
const bloomToggle = document.getElementById('bloom-toggle')

function resize() {
  canvas.width = innerWidth
  canvas.height = innerHeight
  cols = Math.floor(canvas.width / size)
  rows = Math.floor(canvas.height / size)
  grid = Array.from({length:cols}, ()=>Array(rows).fill(0))
  nextGrid = Array.from({length:cols}, ()=>Array(rows).fill(0))
}

function randomize() {
  for (let x=0; x<cols; x++)
    for (let y=0; y<rows; y++)
      grid[x][y] = Math.random() < 0.3 ? 1 : 0
}

function clearGrid() {
  grid.forEach(col => col.fill(0))
}

function countPopulation() {
  let sum = 0
  for (let x=0; x<cols; x++)
    for (let y=0; y<rows; y++)
      sum += grid[x][y]
  return sum
}

function step() {
  for (let x=0; x<cols; x++) {
    for (let y=0; y<rows; y++) {
      let sum = 0
      for (let i=-1; i<=1; i++)
        for (let j=-1; j<=1; j++)
          if ((i||j) && grid[(x+i+cols)%cols][(y+j+rows)%rows])
            sum++
      nextGrid[x][y] = (sum===3 || (grid[x][y] && sum===2)) ? 1 : 0
    }
  }
  [grid, nextGrid] = [nextGrid, grid]
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (bloomOn) ctx.globalCompositeOperation = 'lighter'
  for (let x=0; x<cols; x++) {
    for (let y=0; y<rows; y++) {
      if (grid[x][y]) {
        const hue = (performance.now()/15 + x*7 + y*7) % 360
        const fill = `hsl(${hue},100%,65%)`
        ctx.fillStyle = fill
        if (bloomOn) {
          ctx.shadowBlur = size
          ctx.shadowColor = `hsla(${hue},100%,65%,0.5)`
        } else {
          ctx.shadowBlur = 0
        }
        ctx.fillRect(x*size, y*size, size-1, size-1)
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over'
}

function loop() {
  if (!running) return
  step()
  generation++
  genEl.textContent = generation
  draw()
  popEl.textContent = countPopulation()
  setTimeout(() => requestAnimationFrame(loop), interval)
}

function placePattern(x0, y0) {
  if (patternType === 'toggle') {
    grid[x0][y0] ^= 1
    return
  }
  const p = patterns[patternType]
  if (p.coords) {
    p.coords.forEach(([dx,dy]) => {
      const x = (x0 + dx + cols) % cols
      const y = (y0 + dy + rows) % rows
      grid[x][y] = 1
    })
  } else if (p.rle) {
    let row = 0, col = 0, num = ''
    p.rle.split('$').forEach(line => {
      col = 0
      num = ''
      for (let ch of line) {
        if (/\d/.test(ch)) num += ch
        else {
          const run = parseInt(num) || 1
          if (ch === 'b') col += run
          else if (ch === 'o') {
            for (let i=0; i<run; i++) {
              const x = (x0 + col + cols) % cols
              const y = (y0 + row + rows) % rows
              grid[x][y] = 1
              col++
            }
          }
          num = ''
        }
      }
      row++
    })
  }
}

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor((e.clientX - rect.left) / size)
  const y = Math.floor((e.clientY - rect.top) / size)
  placePattern(x, y)
  draw()
})
canvas.addEventListener('mousemove', e => {
  if (e.buttons) canvas.dispatchEvent(new MouseEvent('mousedown', e))
})

document.getElementById('start').addEventListener('click', ()=>{ running = true; loop() })
document.getElementById('pause').addEventListener('click', ()=>{ running = false })
document.getElementById('random').addEventListener('click', ()=>{ randomize(); generation = 0; genEl.textContent = generation; draw(); popEl.textContent = countPopulation() })
document.getElementById('clear').addEventListener('click', ()=>{ clearGrid(); generation = 0; genEl.textContent = generation; draw(); popEl.textContent = countPopulation() })
document.getElementById('speed').addEventListener('input', e=>{ interval = 1000 / e.target.value })
document.getElementById('cellsize').addEventListener('input', e=>{ size = +e.target.value; resize(); draw() })
document.getElementById('pattern').addEventListener('change', e=>{ patternType = e.target.value })
bloomToggle.addEventListener('change', e=>{ bloomOn = e.target.checked })
document.getElementById('menu-toggle').addEventListener('click', ()=>{ document.getElementById('controls').classList.toggle('collapsed') })

resize()
randomize()
generation = 0
genEl.textContent = generation
draw()
popEl.textContent = countPopulation()