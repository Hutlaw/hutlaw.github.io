let boardSize,abilitiesEnabled;
let attempts,wins;
let scoreKeyAttempts,scoreKeyWins;
const abilityChargesMapping={3:1,4:2,5:3,6:4};
let revealCharges,removeCharges,hintCharges;
let removeMode=false;
let board=[];
let selectedTile=null;
let gameOver=false;
const savedSettings=localStorage.getItem("gameSettings");
if(savedSettings){
  const s=JSON.parse(savedSettings);
  boardSize=parseInt(s.boardSize);
  abilitiesEnabled=s.abilitiesEnabled;
}else{
  boardSize=4;
  abilitiesEnabled=false;
}
updateScoreKeys();
attempts=parseInt(localStorage.getItem(scoreKeyAttempts))||0;
wins=parseInt(localStorage.getItem(scoreKeyWins))||0;
document.getElementById("attempts").textContent=attempts;
document.getElementById("wins").textContent=wins;
function resetAbilityCharges(){
  let c=abilityChargesMapping[boardSize];
  revealCharges=c;removeCharges=c;hintCharges=c;
  updateAbilityDisplay();
}
function updateAbilityDisplay(){
  document.getElementById("reveal-charges").textContent=revealCharges;
  document.getElementById("remove-charges").textContent=removeCharges;
  document.getElementById("hint-charges").textContent=hintCharges;
}
function updateScoreKeys(){
  scoreKeyAttempts=`attempts_${boardSize}_${abilitiesEnabled}`;
  scoreKeyWins=`wins_${boardSize}_${abilitiesEnabled}`;
}
function getCellSize(){
  return{3:100,4:80,5:60,6:50}[boardSize];
}
function initBoard(){
  board=[];
  const be=document.getElementById("board");
  be.innerHTML="";
  const size=getCellSize();
  be.style.gridTemplateColumns=`repeat(${boardSize},${size}px)`;
  for(let r=0;r<boardSize;r++){
    board[r]=[];
    for(let c=0;c<boardSize;c++){
      let cell=document.createElement("div");
      cell.classList.add("cell");
      cell.style.width=`${size}px`;
      cell.style.height=`${size}px`;
      cell.dataset.row=r;cell.dataset.col=c;
      if(r===c){
        board[r][c]="O";
        cell.textContent="O";
        cell.classList.add("fixed");
      }else board[r][c]="";
      cell.addEventListener("click",()=>{
        if(gameOver)return;
        if(removeMode&&!cell.classList.contains("fixed")&&board[r][c]!==""){
          let letter=board[r][c];
          board[r][c]="";
          cell.textContent="";
          addTileToPool(letter);
          removeMode=false;
          document.getElementById("remove").classList.remove("selected");
          if(removeCharges>0){removeCharges--;updateAbilityDisplay();}
          return;
        }
        if(selectedTile&&board[r][c]===""){
          board[r][c]=selectedTile.letter;
          cell.textContent=selectedTile.letter;
          cell.classList.add("flip");
          selectedTile.element.classList.remove("selected");
          selectedTile.element.remove();
          selectedTile=null;
          updatePoolCounters();
          if(checkFox()){
            gameOver=true;attempts++;
            localStorage.setItem(scoreKeyAttempts,attempts);
            document.getElementById("attempts").textContent=attempts;
            document.getElementById("message").textContent="You lost! Fox found.";
            document.getElementById("reset").style.display="block";
          }else if(isBoardFull()){
            gameOver=true;attempts++;wins++;
            localStorage.setItem(scoreKeyAttempts,attempts);
            localStorage.setItem(scoreKeyWins,wins);
            document.getElementById("attempts").textContent=attempts;
            document.getElementById("wins").textContent=wins;
            document.getElementById("message").textContent="You win! No fox.";
            document.getElementById("reset").style.display="block";
          }
        }
      });
      be.appendChild(cell);
    }
  }
}
function addTileToPool(letter){
  const pool=document.getElementById("pool");
  let t=document.createElement("div");
  t.classList.add("tile");
  t.dataset.letter=letter;
  t.innerHTML='<div class="back"></div>';
  t.addEventListener("click",()=>{
    if(gameOver)return;
    document.querySelectorAll(".tile").forEach(x=>x.classList.remove("selected"));
    t.classList.add("selected");
    selectedTile={letter:letter,element:t};
  });
  pool.appendChild(t);
  updatePoolCounters();
}
function initPool(){
  const pool=document.getElementById("pool");
  pool.innerHTML="";
  const total=boardSize*(boardSize-1);
  let numO=(boardSize<5?2:4);
  let numX=numF=(total-numO)/2;
  let letters=[];
  for(let i=0;i<numX;i++)letters.push("X");
  for(let i=0;i<numF;i++)letters.push("F");
  for(let i=0;i<numO;i++)letters.push("O");
  letters.sort(()=>Math.random()-0.5);
  letters.forEach(l=>addTileToPool(l));
}
function updatePoolCounters(){
  let counts={X:0,F:0,O:0};
  document.querySelectorAll("#pool .tile").forEach(t=>counts[t.dataset.letter]++);
  document.getElementById("pool-counters").textContent=
    `Remaining - X:${counts.X} | F:${counts.F} | O:${counts.O}`;
}
function isBoardFull(){
  for(let r=0;r<boardSize;r++)for(let c=0;c<boardSize;c++)if(board[r][c]==="")return false;
  return true;
}
function checkFox(){
  const dirs=[[0,1],[1,0],[1,1],[1,-1]];
  for(let r=0;r<boardSize;r++)for(let c=0;c<boardSize;c++){
    if(!board[r][c])continue;
    for(let [dr,dc] of dirs){
      let letters=board[r][c],cells=[[r,c]];
      for(let k=1;k<3;k++){
        let nr=r+dr*k,nc=c+dc*k;
        if(nr>=0&&nr<boardSize&&nc>=0&&nc<boardSize){
          letters+=board[nr][nc];
          cells.push([nr,nc]);
        }
      }
      if(letters.length===3&&(letters==="FOX"||letters==="XOF")){
        cells.forEach(([rr,cc])=>{
          document.querySelector(`.cell[data-row="${rr}"][data-col="${cc}"]`)
            .classList.add("highlight");
        });
        return true;
      }
    }
  }
  return false;
}
function resetGame(){
  ["board","pool","pool-counters"].forEach(id=>document.getElementById(id).classList.add("fade"));
  setTimeout(()=>{
    gameOver=false;removeMode=false;
    document.getElementById("message").textContent="";
    document.getElementById("reset").style.display="none";
    initBoard();initPool();
    if(abilitiesEnabled)resetAbilityCharges();
    ["board","pool","pool-counters"].forEach(id=>document.getElementById(id).classList.remove("fade"));
  },500);
}
document.getElementById("reveal").addEventListener("click",()=>{
  if(!abilitiesEnabled||revealCharges<=0)return;
  let tiles=[...document.querySelectorAll("#pool .tile")];
  if(!tiles.length)return;
  let t=tiles[Math.floor(Math.random()*tiles.length)];
  let orig=t.innerHTML;
  t.innerHTML=t.dataset.letter;
  setTimeout(()=>t.innerHTML=orig,3000);
  revealCharges--;updateAbilityDisplay();
});
document.getElementById("remove").addEventListener("click",()=>{
  if(!abilitiesEnabled||removeCharges<=0)return;
  removeMode=!removeMode;
  document.getElementById("remove").classList.toggle("selected",removeMode);
});
document.getElementById("hint").addEventListener("click",()=>{
  if(!abilitiesEnabled||hintCharges<=0)return;
  let bestCell=null,bestRisk=Infinity;
  for(let r=0;r<boardSize;r++)for(let c=0;c<boardSize;c++){
    if(!board[r][c]){
      let risk=getCellRisk(r,c);
      if(risk<bestRisk){
        bestRisk=risk;
        bestCell=document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
      }
    }
  }
  if(bestCell){
    bestCell.classList.add("hint");
    setTimeout(()=>bestCell.classList.remove("hint"),2000);
  }
  hintCharges--;updateAbilityDisplay();
});
function getCellRisk(r,c){
  let risk=0;
  [[0,1],[1,0],[1,1],[1,-1]].forEach(([dr,dc])=>{
    let r1=r-dr,c1=c-dc,r2=r+dr,c2=c+dc;
    if(r1>=0&&r1<boardSize&&c1>=0&&c1<boardSize&&r2>=0&&r2<boardSize&&c2>=0&&c2<boardSize)risk++;
  });
  return risk;
}
const settingsBtn=document.getElementById("settings-btn");
const settingsPopup=document.getElementById("settings-popup");
const boardSizeSelect=document.getElementById("board-size");
const abilitiesToggle=document.getElementById("abilities-toggle");
const saveSettingsBtn=document.getElementById("save-settings");
const cancelSettingsBtn=document.getElementById("cancel-settings");
settingsBtn.addEventListener("click",()=>{
  boardSizeSelect.value=boardSize;
  abilitiesToggle.checked=abilitiesEnabled;
  settingsPopup.style.display="flex";
});
saveSettingsBtn.addEventListener("click",()=>{
  boardSize=parseInt(boardSizeSelect.value);
  abilitiesEnabled=abilitiesToggle.checked;
  localStorage.setItem("gameSettings",JSON.stringify({boardSize,abilitiesEnabled}));
  updateScoreKeys();
  attempts=parseInt(localStorage.getItem(scoreKeyAttempts))||0;
  wins=parseInt(localStorage.getItem(scoreKeyWins))||0;
  document.getElementById("attempts").textContent=attempts;
  document.getElementById("wins").textContent=wins;
  document.getElementById("abilities").style.display=abilitiesEnabled?"flex":"none";
  settingsPopup.style.display="none";
  resetGame();
});
cancelSettingsBtn.addEventListener("click",()=>settingsPopup.style.display="none");
const cookiePopup=document.getElementById("cookie-popup");
const acceptCookiesBtn=document.getElementById("accept-cookies");
const declineCookiesBtn=document.getElementById("decline-cookies");
if(!localStorage.getItem("cookiesAccepted"))cookiePopup.style.display="flex";
acceptCookiesBtn.addEventListener("click",()=>{
  localStorage.setItem("cookiesAccepted","true");
  cookiePopup.style.display="none";
});
declineCookiesBtn.addEventListener("click",()=>cookiePopup.style.display="none");
document.getElementById("reset").addEventListener("click",resetGame);
const helpBtn=document.getElementById("help-btn");
const tutorial=document.getElementById("tutorial-popup");
const closeTut=document.getElementById("close-tutorial");
if(!localStorage.getItem("tutorialSeen"))tutorial.style.display="flex";
helpBtn.addEventListener("click",()=>tutorial.style.display="flex");
closeTut.addEventListener("click",()=>{
  tutorial.style.display="none";
  localStorage.setItem("tutorialSeen","true");
});
if(abilitiesEnabled){document.getElementById("abilities").style.display="flex";resetAbilityCharges();}
else document.getElementById("abilities").style.display="none";
initBoard();initPool();