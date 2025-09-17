let boardSize = 10;
let board = [];
let attempts = parseInt(localStorage.getItem("attempts_10")) || 0;
let wins = parseInt(localStorage.getItem("wins_10")) || 0;
let lives = 3;
let deck = [];
let selectedIndex = null;
let gameOver = false;
let timebombs = [];
let virusState = { active: false, infected: null };
const cellSize = 48;
document.getElementById("attempts").textContent = attempts;
document.getElementById("wins").textContent = wins;
document.getElementById("lives-count").textContent = lives;

function fisherYatesShuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    const tmp=arr[i];
    arr[i]=arr[j];
    arr[j]=tmp;
  }
}

function initBoard(){
  board = [];
  const be = document.getElementById("board");
  be.innerHTML = "";
  be.style.gridTemplateColumns = `repeat(${boardSize},${cellSize}px)`;
  for(let r=0;r<boardSize;r++){
    board[r]=[];
    for(let c=0;c<boardSize;c++){
      let cell = document.createElement("div");
      cell.classList.add("cell");
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener("click", () => {
        if(gameOver) return;
        if(selectedIndex === null) return;
        let tile = deck[selectedIndex];
        placeTileAt(r,c,tile,selectedIndex);
      });
      be.appendChild(cell);
      board[r][c] = { tile: null };
    }
  }
  placeFixedOs();
}

function placeFixedOs(){
  for(let r=0;r<boardSize;r++){
    let c = r;
    board[r][c].tile = { type: "letter", letter: "O", fixed: true };
    const cellElem = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if(cellElem){
      cellElem.textContent = "O";
      cellElem.classList.add("fixed");
    }
  }
  for(let r=0;r<boardSize;r++){
    let c = boardSize - 1 - r;
    if(board[r][c].tile === null || !board[r][c].tile){
      board[r][c].tile = { type: "letter", letter: "O", fixed: true };
      const cellElem = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
      if(cellElem){
        cellElem.textContent = "O";
        cellElem.classList.add("fixed");
      }
    }
  }
}

function buildDeck(){
  deck = [];
  const fillable = boardSize * boardSize;
  const poolSize = Math.max(90, fillable - 4);
  const lettersCount = Math.floor(poolSize * 0.82);
  const specialCount = poolSize - lettersCount;
  const letterDist = {F:0.34, O:0.33, X:0.33};
  for(let i=0;i<lettersCount;i++){
    const r=Math.random();
    let letter;
    if(r < letterDist.F) letter="F";
    else if(r < letterDist.F + letterDist.O) letter="O";
    else letter="X";
    deck.push({ type: "letter", letter: letter });
  }
  const specials = [{type:"bomb",radius:1},{type:"mega-bomb",radius:2},{type:"timebomb",fuse:2},{type:"corruptor"},{type:"clone"},{type:"virus"}];
  for(let i=0;i<specialCount;i++){
    let s = JSON.parse(JSON.stringify(specials[i % specials.length]));
    if(s.type==="virus"){
      if(deck.some(t=>t.type==="virus")) continue;
    }
    deck.push(s);
  }
  fisherYatesShuffle(deck);
  renderPool();
  updatePoolCounters();
}

function renderPool(){
  const pool = document.getElementById("pool");
  pool.innerHTML = "";
  for(let i=0;i<deck.length;i++){
    const t = deck[i];
    const div = document.createElement("div");
    div.classList.add("tile");
    div.dataset.index = i;
    div.innerHTML = '<div class="back"></div>';
    div.addEventListener("click", () => {
      if(gameOver) return;
      if(selectedIndex !== null){
        const prev = document.querySelector(`.tile[data-index="${selectedIndex}"]`);
        if(prev) prev.classList.remove("selected");
      }
      selectedIndex = parseInt(div.dataset.index);
      div.classList.add("selected");
      document.getElementById("message").textContent = "Place the selected tile on the board (reveals on place).";
    });
    pool.appendChild(div);
  }
}

function updatePoolCounters(){
  let counts={X:0,F:0,O:0, specials:0};
  deck.forEach(d=>{
    if(d.type==="letter") counts[d.letter]++;
    else counts.specials++;
  });
  document.getElementById("pool-counters").textContent =
    `Remaining - F:${counts.F} | O:${counts.O} | X:${counts.X} | Specials:${counts.specials}`;
}

function placeTileAt(r,c,tile,indexInDeck){
  const cellElem = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  if(board[r][c].tile && board[r][c].tile.type) return;
  selectedIndex = null;
  const poolElem = document.querySelector(`.tile[data-index="${indexInDeck}"]`);
  if(poolElem) poolElem.remove();
  const removed = deck.splice(indexInDeck,1)[0];
  renderPool();
  updatePoolCounters();
  revealTileAt(r,c,removed);
  resolveImmediateEffects();
  tickPersistentEffects();
  runChainReactions();
  const foxCells = findFOX();
  if(foxCells){
    highlightCells(foxCells);
    handleFoxFound(foxCells);
  } else {
    if(isBoardFull()){
      handleWin();
    }
  }
}

function revealTileAt(r,c,tile){
  board[r][c].tile = tile;
  const cellElem = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  cellElem.classList.add("flip","place-flash");
  setTimeout(()=>cellElem.classList.remove("place-flash"),420);
  cellElem.classList.remove("infected");
  cellElem.textContent = "";
  if(tile.type === "letter"){
    cellElem.textContent = tile.letter;
  } else if(tile.type === "bomb"){
    cellElem.innerHTML = '<span class="special-label">B</span>';
    queueExplosion(r,c,1);
  } else if(tile.type === "mega-bomb"){
    cellElem.innerHTML = '<span class="special-label">MB</span>';
    queueExplosion(r,c,2);
  } else if(tile.type === "timebomb"){
    cellElem.innerHTML = '<span class="special-label">T'+tile.fuse+'</span>';
    timebombs.push({r,c,fuse:tile.fuse});
  } else if(tile.type === "corruptor"){
    cellElem.innerHTML = '<span class="special-label">C</span>';
    animateCorruptor(r,c);
  } else if(tile.type === "clone"){
    cellElem.innerHTML = '<span class="special-label">CL</span>';
    animateClone(r,c);
  } else if(tile.type === "virus"){
    cellElem.innerHTML = '<span class="special-label">V</span>';
    animateVirusPlace(r,c);
  }
}

function queueExplosion(r,c,radius){
  const explosionSet = getChainExplosionSet(r,c,radius);
  animateExplosionSet(explosionSet);
  setTimeout(()=>{
    const collected = [];
    explosionSet.forEach(([rr,cc])=>{
      destroyTileAt(rr,cc,collected);
    });
    collected.forEach(letter => deck.push({type:'letter', letter}));
    fisherYatesShuffle(deck);
    renderPool();
    updatePoolCounters();
  },420);
}

function manhattanIncluded(sr,sc,nr,nc,radius){
  return Math.abs(sr-nr)+Math.abs(sc-nc) <= radius;
}

function getChainExplosionSet(sr,sc,srRadius){
  const set = new Set();
  const queue = [[sr,sc,srRadius]];
  while(queue.length){
    const [r,c,radius] = queue.shift();
    for(let rr=0; rr<boardSize; rr++){
      for(let cc=0; cc<boardSize; cc++){
        if(!manhattanIncluded(r,c,rr,cc,radius)) continue;
        const key = rr+','+cc;
        if(!set.has(key)){
          set.add(key);
          const t = board[rr][cc].tile;
          if(t && (t.type==="bomb" || t.type==="mega-bomb")){
            const r2 = t.type==="mega-bomb" ? 2 : 1;
            queue.push([rr,cc,r2]);
          }
        }
      }
    }
  }
  const arr = [];
  set.forEach(k=>{
    const [a,b] = k.split(',').map(x=>parseInt(x));
    arr.push([a,b]);
  });
  return arr;
}

function animateExplosionSet(cells){
  cells.forEach(([r,c])=>{
    const el = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if(!el) return;
    el.classList.add("explosion");
    const spark = document.createElement("div");
    spark.className = "spark";
    spark.style.position = "absolute";
    spark.style.width = "12px";
    spark.style.height = "12px";
    spark.style.borderRadius = "50%";
    spark.style.background = "radial-gradient(circle,#ffd6a6,#ff7a3d)";
    spark.style.left = "50%";
    spark.style.top = "50%";
    spark.style.transform = "translate(-50%,-50%)";
    el.appendChild(spark);
    setTimeout(()=>{ if(spark.parentNode) spark.parentNode.removeChild(spark); el.classList.remove("explosion"); },380);
  });
}

function resolveImmediateEffects(){
}

function runChainReactions(){
}

function animateCorruptor(r,c){
  const orth = [[-1,0],[1,0],[0,-1],[0,1]];
  const targets = [];
  orth.forEach(([dr,dc])=>{
    const nr=r+dr, nc=c+dc;
    if(nr>=0 && nr<boardSize && nc>=0 && nc<boardSize){
      const t = board[nr][nc].tile;
      if(t && t.type==="letter") targets.push([nr,nc,t]);
    }
  });
  const el = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  if(el) el.classList.add("pulse-corrupt");
  setTimeout(()=>{
    const collected = [];
    targets.forEach(([nr,nc,tileObj])=>{
      const cellE = document.querySelector(`.cell[data-row="${nr}"][data-col="${nc}"]`);
      if(!cellE) return;
      cellE.classList.add("pulse-corrupt");
      const candidates = ["F","O","X"].filter(x=>x!==tileObj.letter);
      fisherYatesShuffle(candidates);
      let changed=false;
      for(const cand of candidates){
        const prev = tileObj.letter;
        tileObj.letter = cand;
        const foxNow = findFOX();
        if(!foxNow){
          cellE.textContent = cand;
          changed = true;
          break;
        }
        tileObj.letter = prev;
      }
      setTimeout(()=> cellE.classList.remove("pulse-corrupt"),420);
    });
    destroyTileAt(r,c, collected);
    collected.forEach(letter => deck.push({type:'letter', letter}));
    fisherYatesShuffle(deck);
    renderPool();
    updatePoolCounters();
  },380);
}

function animateClone(r,c){
  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  const sources = [];
  dirs.forEach(([dr,dc])=>{
    const sr=r+dr, sc=c+dc;
    if(sr>=0 && sr<boardSize && sc>=0 && sc<boardSize){
      const t=board[sr][sc].tile;
      if(t && t.type==="letter") sources.push({sr,sc,t});
    }
  });
  if(sources.length===0){
    destroyTileAt(r,c,null);
    return;
  }
  const src = sources[Math.floor(Math.random()*sources.length)];
  const emptyAdj = [];
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>{
    const tr = src.sr+dr, tc = src.sc+dc;
    if(tr>=0 && tr<boardSize && tc>=0 && tc<boardSize){
      if(!board[tr][tc].tile) emptyAdj.push([tr,tc]);
    }
  });
  if(emptyAdj.length===0){
    let emptyCells = [];
    for(let rr=0;rr<boardSize;rr++)for(let cc=0;cc<boardSize;cc++){
      if(!board[rr][cc].tile) emptyCells.push([rr,cc]);
    }
    if(emptyCells.length===0){
      destroyTileAt(r,c,null);
      return;
    }
    const [ar,ac] = emptyCells[Math.floor(Math.random()*emptyCells.length)];
    animateCloneTransfer(src.sr,src.sc,ar,ac,src.t.letter);
    setTimeout(()=> destroyTileAt(r,c,null),420);
    return;
  }
  const [tr,tc] = emptyAdj[Math.floor(Math.random()*emptyAdj.length)];
  animateCloneTransfer(src.sr,src.sc,tr,tc,src.t.letter);
  setTimeout(()=> destroyTileAt(r,c,null),420);
}

function animateCloneTransfer(sr,sc,tr,tc,letter){
  const startEl = document.querySelector(`.cell[data-row="${sr}"][data-col="${sc}"]`);
  const targetEl = document.querySelector(`.cell[data-row="${tr}"][data-col="${tc}"]`);
  if(!startEl || !targetEl) return;
  startEl.classList.add("clone-flash");
  targetEl.classList.add("clone-flash");
  const tracer = document.createElement("div");
  tracer.className = "clone-tracer";
  document.body.appendChild(tracer);
  const sRect = startEl.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();
  tracer.style.left = (sRect.left + sRect.width/2) + "px";
  tracer.style.top = (sRect.top + sRect.height/2) + "px";
  requestAnimationFrame(()=>{
    tracer.style.transform = `translate(${tRect.left + tRect.width/2 - (sRect.left + sRect.width/2)}px, ${tRect.top + tRect.height/2 - (sRect.top + sRect.height/2)}px)`;
  });
  setTimeout(()=>{
    targetEl.textContent = letter;
    board[tr][tc].tile = { type:"letter", letter };
    startEl.classList.remove("clone-flash");
    targetEl.classList.remove("clone-flash");
    if(tracer.parentNode) tracer.parentNode.removeChild(tracer);
  },360);
}

function animateVirusPlace(r,c){
  const cellEl = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  if(cellEl) {
    cellEl.classList.add("virus-pulse");
    setTimeout(()=> cellEl.classList.remove("virus-pulse"),420);
  }
  setTimeout(()=>{
    destroyTileAt(r,c,null);
    if(!virusState.active){
      startVirusFrom(r,c);
    }
    fisherYatesShuffle(deck);
    renderPool();
    updatePoolCounters();
  },360);
}

function startVirusFrom(r,c){
  virusState.active = true;
  const target = findClosestAdjacentLetter(r,c);
  if(target){
    const [tr,tc] = target;
    if(!board[tr][tc].tile) { virusState.active = false; return; }
    board[tr][tc].tile._infected = 2;
    const cellElem = document.querySelector(`.cell[data-row="${tr}"][data-col="${tc}"]`);
    if(cellElem){
      cellElem.classList.add("infected");
      cellElem.classList.add("virus-pulse");
      let counter = cellElem.querySelector(".infected-counter");
      if(!counter){
        counter = document.createElement("div");
        counter.classList.add("infected-counter");
        cellElem.appendChild(counter);
      }
      counter.textContent = "2";
      virusState.infected = { r: tr, c: tc };
    }
  } else {
    virusState.active = false;
  }
}

function findClosestAdjacentLetter(r,c){
  const candidates = [];
  for(let rr=0;rr<boardSize;rr++){
    for(let cc=0;cc<boardSize;cc++){
      const t = board[rr][cc].tile;
      if(t && t.type==="letter") candidates.push([rr,cc]);
    }
  }
  if(candidates.length===0) return null;
  candidates.sort((a,b)=>{
    const da = Math.abs(a[0]-r)+Math.abs(a[1]-c);
    const db = Math.abs(b[0]-r)+Math.abs(b[1]-c);
    return da-db;
  });
  return candidates[0];
}

function tickPersistentEffects(){
  const toExplode = [];
  for(let i=0;i<timebombs.length;i++){
    timebombs[i].fuse--;
    const {r,c,fuse} = timebombs[i];
    const cellElem = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if(cellElem){
      cellElem.innerHTML = `<span class="special-label">T${fuse}</span>`;
    }
    if(fuse <= 0){
      toExplode.push({r,c});
    }
  }
  timebombs = timebombs.filter(t=>t.fuse>0);
  toExplode.forEach(({r,c})=>{
    queueExplosion(r,c,1);
  });

  if(virusState.active && virusState.infected){
    const ir = virusState.infected.r, ic = virusState.infected.c;
    const t = board[ir][ic].tile;
    if(t && t._infected){
      t._infected--;
      const cellElem = document.querySelector(`.cell[data-row="${ir}"][data-col="${ic}"]`);
      if(cellElem){
        let counter = cellElem.querySelector(".infected-counter");
        if(!counter){
          counter = document.createElement("div");
          counter.classList.add("infected-counter");
          cellElem.appendChild(counter);
        }
        counter.textContent = String(t._infected);
      }
      if(t._infected <= 0){
        const collected = [];
        destroyTileAt(ir,ic,collected);
        collected.forEach(letter => deck.push({type:'letter', letter}));
        const nextTarget = findAdjacentTo(ir,ic);
        if(nextTarget){
          const [nr,nc] = nextTarget;
          if(board[nr][nc].tile){
            board[nr][nc].tile._infected = 2;
            virusState.infected = { r: nr, c: nc };
            const ncell = document.querySelector(`.cell[data-row="${nr}"][data-col="${nc}"]`);
            if(ncell){
              ncell.classList.add("infected");
              ncell.classList.add("virus-pulse");
              let counter = ncell.querySelector(".infected-counter");
              if(!counter){
                counter = document.createElement("div");
                counter.classList.add("infected-counter");
                ncell.appendChild(counter);
              }
              counter.textContent = "2";
            }
          } else {
            virusState.active = false;
            virusState.infected = null;
          }
        } else {
          virusState.active = false;
          virusState.infected = null;
        }
        fisherYatesShuffle(deck);
        renderPool();
        updatePoolCounters();
      }
    } else {
      virusState.infected = null;
    }
  }
}

function findAdjacentTo(r,c){
  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  const list = [];
  dirs.forEach(([dr,dc])=>{
    const nr=r+dr, nc=c+dc;
    if(nr>=0 && nr<boardSize && nc>=0 && nc<boardSize){
      const t = board[nr][nc].tile;
      if(t && t.type==="letter") list.push([nr,nc]);
    }
  });
  if(list.length===0) return null;
  return list[Math.floor(Math.random()*list.length)];
}

function findFOX(){
  const dirs = [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
  for(let r=0;r<boardSize;r++){
    for(let c=0;c<boardSize;c++){
      const t0 = board[r][c].tile;
      if(!t0 || t0.type !== "letter") continue;
      for(const [dr,dc] of dirs){
        const r1 = r+dr, c1 = c+dc;
        const r2 = r+dr*2, c2 = c+dc*2;
        if(r1>=0 && r1<boardSize && c1>=0 && c1<boardSize && r2>=0 && r2<boardSize && c2>=0 && c2<boardSize){
          const t1 = board[r1][c1].tile;
          const t2 = board[r2][c2].tile;
          if(t1 && t2 && t1.type==="letter" && t2.type==="letter"){
            const s = t0.letter + t1.letter + t2.letter;
            if(s === "FOX" || s === "XOF"){
              return [[r,c],[r1,c1],[r2,c2]];
            }
          }
        }
      }
    }
  }
  return null;
}

function highlightCells(cells){
  cells.forEach(([r,c])=>{
    const el = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if(el) el.classList.add("highlight");
  });
}

function clearHighlights(){
  document.querySelectorAll(".cell.highlight").forEach(el=>el.classList.remove("highlight"));
}

function handleFoxFound(cells){
  gameOver = true;
  document.getElementById("message").textContent = "FOX detected! Life lost.";
  document.getElementById("life-modal").style.display = "flex";
  document.getElementById("continue-btn").focus();
  document.getElementById("continue-btn").onclick = () => {
    document.getElementById("life-modal").style.display = "none";
    lives--;
    document.getElementById("lives-count").textContent = lives;
    const collected = [];
    cells.forEach(([r,c])=>{
      destroyTileAt(r,c,collected);
    });
    collected.forEach(letter => deck.push({type:'letter', letter}));
    fisherYatesShuffle(deck);
    renderPool();
    updatePoolCounters();
    clearHighlights();
    if(lives <= 0){
      restartGame();
      return;
    }
    gameOver = false;
    document.getElementById("message").textContent = "Continue playing.";
    if(isBoardFull()) handleWin();
  };
  document.getElementById("restart-btn").onclick = () => {
    document.getElementById("life-modal").style.display = "none";
    restartGame();
  };
}

function handleWin(){
  gameOver = true;
  attempts++;
  wins++;
  localStorage.setItem("attempts_10", attempts);
  localStorage.setItem("wins_10", wins);
  document.getElementById("attempts").textContent = attempts;
  document.getElementById("wins").textContent = wins;
  document.getElementById("message").textContent = "You win! No FOX on the filled board.";
  document.getElementById("reset").style.display = "block";
}

function isBoardFull(){
  for(let r=0;r<boardSize;r++){
    for(let c=0;c<boardSize;c++){
      if(!board[r][c].tile) return false;
    }
  }
  return true;
}

function destroyTileAt(r,c,collectArr){
  const t = board[r][c].tile;
  if(!t) return;
  if(collectArr && t.type === "letter"){
    collectArr.push(t.letter);
  }
  board[r][c].tile = null;
  const cellElem = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  if(cellElem){
    cellElem.classList.remove("fixed","infected","virus-pulse","flip","pulse-corrupt","clone-flash","highlight");
    const cCounter = cellElem.querySelector(".infected-counter");
    if(cCounter) cCounter.remove();
    cellElem.innerHTML = "";
    cellElem.textContent = "";
  }
}

function removeTileAt(r,c){
  destroyTileAt(r,c,null);
}

function restartGame(){
  gameOver = false;
  timebombs = [];
  virusState = { active: false, infected: null };
  lives = 3;
  document.getElementById("lives-count").textContent = lives;
  document.getElementById("message").textContent = "";
  document.getElementById("reset").style.display = "none";
  initBoard();
  buildDeck();
}

document.getElementById("reset").addEventListener("click", restartGame);
document.getElementById("restart").addEventListener("click", restartGame);

document.getElementById("help-btn").addEventListener("click", ()=>{
  document.getElementById("tutorial-popup").style.display = "flex";
});
document.getElementById("close-tutorial").addEventListener("click", ()=>{
  document.getElementById("tutorial-popup").style.display = "none";
  localStorage.setItem("tutorialSeen","true");
});
if(!localStorage.getItem("tutorialSeen")) document.getElementById("tutorial-popup").style.display = "flex";
const cookiePopup = document.getElementById("cookie-popup");
if(!localStorage.getItem("cookiesAccepted")) cookiePopup.style.display = "flex";
document.getElementById("accept-cookies").addEventListener("click", ()=>{
  localStorage.setItem("cookiesAccepted","true");
  cookiePopup.style.display = "none";
});
document.getElementById("decline-cookies").addEventListener("click", ()=>{
  cookiePopup.style.display = "none";
});

initBoard();
buildDeck();
