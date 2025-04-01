let boardSize, abilitiesEnabled;
let attempts, wins;
let scoreKeyAttempts, scoreKeyWins;
const abilityChargesMapping = {3: 1, 4: 2, 5: 3, 6: 4};
let revealCharges, removeCharges, hintCharges;
let removeMode = false;
let board = [];
let selectedTile = null;
let gameOver = false;
const savedSettings = localStorage.getItem("gameSettings");
if (savedSettings) {
  const s = JSON.parse(savedSettings);
  boardSize = parseInt(s.boardSize);
  abilitiesEnabled = s.abilitiesEnabled;
} else {
  boardSize = 4;
  abilitiesEnabled = false;
}
updateScoreKeys();
attempts = parseInt(localStorage.getItem(scoreKeyAttempts)) || 0;
wins = parseInt(localStorage.getItem(scoreKeyWins)) || 0;
document.getElementById("attempts").textContent = attempts;
document.getElementById("wins").textContent = wins;
function resetAbilityCharges() {
  let charges = abilityChargesMapping[boardSize];
  revealCharges = charges;
  removeCharges = charges;
  hintCharges = charges;
  updateAbilityDisplay();
}
function updateAbilityDisplay() {
  document.getElementById("reveal-charges").textContent = revealCharges;
  document.getElementById("remove-charges").textContent = removeCharges;
  document.getElementById("hint-charges").textContent = hintCharges;
}
function updateScoreKeys() {
  scoreKeyAttempts = "attempts_" + boardSize + "_" + (abilitiesEnabled ? "true" : "false");
  scoreKeyWins = "wins_" + boardSize + "_" + (abilitiesEnabled ? "true" : "false");
}
function getCellSize() {
  if (boardSize === 3) return 100;
  else if (boardSize === 4) return 80;
  else if (boardSize === 5) return 60;
  else if (boardSize === 6) return 50;
}
function initBoard() {
  board = [];
  const boardElement = document.getElementById("board");
  boardElement.innerHTML = "";
  const cellSize = getCellSize();
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, ${cellSize}px)`;
  for (let r = 0; r < boardSize; r++) {
    board[r] = [];
    for (let c = 0; c < boardSize; c++) {
      let cell = document.createElement("div");
      cell.classList.add("cell");
      cell.style.width = cellSize + "px";
      cell.style.height = cellSize + "px";
      cell.dataset.row = r;
      cell.dataset.col = c;
      if (r === c) {
        board[r][c] = "O";
        cell.textContent = "O";
        cell.classList.add("fixed");
      } else {
        board[r][c] = "";
      }
      cell.addEventListener("click", () => {
        if (gameOver) return;
        if (removeMode && !cell.classList.contains("fixed") && board[r][c] !== "") {
          let letter = board[r][c];
          board[r][c] = "";
          cell.textContent = "";
          addTileToPool(letter);
          removeMode = false;
          document.getElementById("remove").classList.remove("selected");
          if (removeCharges > 0) {
            removeCharges--;
            updateAbilityDisplay();
          }
          return;
        }
        if (selectedTile && board[r][c] === "") {
          board[r][c] = selectedTile.letter;
          cell.textContent = selectedTile.letter;
          cell.classList.add("flip");
          selectedTile.element.classList.remove("selected");
          selectedTile.element.remove();
          selectedTile = null;
          updatePoolCounters();
          if (checkFox()) {
            gameOver = true;
            attempts++;
            localStorage.setItem(scoreKeyAttempts, attempts);
            document.getElementById("attempts").textContent = attempts;
            document.getElementById("message").textContent = "You lost! Fox found.";
            document.getElementById("reset").style.display = "block";
          } else if (isBoardFull()) {
            gameOver = true;
            attempts++;
            wins++;
            localStorage.setItem(scoreKeyAttempts, attempts);
            localStorage.setItem(scoreKeyWins, wins);
            document.getElementById("attempts").textContent = attempts;
            document.getElementById("wins").textContent = wins;
            document.getElementById("message").textContent = "You win! No fox.";
            document.getElementById("reset").style.display = "block";
          }
        }
      });
      boardElement.appendChild(cell);
    }
  }
}
function addTileToPool(letter) {
  const poolElement = document.getElementById("pool");
  let tile = document.createElement("div");
  tile.classList.add("tile");
  tile.dataset.letter = letter;
  tile.innerHTML = '<div class="back"></div>';
  tile.addEventListener("click", () => {
    if (gameOver) return;
    document.querySelectorAll(".tile").forEach(t => t.classList.remove("selected"));
    tile.classList.add("selected");
    selectedTile = { letter: letter, element: tile };
  });
  poolElement.appendChild(tile);
  updatePoolCounters();
}
function initPool() {
  const poolElement = document.getElementById("pool");
  poolElement.innerHTML = "";
  const totalPieces = boardSize * (boardSize - 1);
  let numO, numX, numF;
  if (boardSize === 3) { numO = 2; }
  else if (boardSize === 4) { numO = 2; }
  else if (boardSize === 5) { numO = 4; }
  else if (boardSize === 6) { numO = 4; }
  numX = numF = (totalPieces - numO) / 2;
  let letters = [];
  for (let i = 0; i < numX; i++) { letters.push("X"); }
  for (let i = 0; i < numF; i++) { letters.push("F"); }
  for (let i = 0; i < numO; i++) { letters.push("O"); }
  letters.sort(() => Math.random() - 0.5);
  letters.forEach(letter => {
    let tile = document.createElement("div");
    tile.classList.add("tile");
    tile.dataset.letter = letter;
    tile.innerHTML = '<div class="back"></div>';
    tile.addEventListener("click", () => {
      if (gameOver) return;
      if (removeMode) return;
      document.querySelectorAll(".tile").forEach(t => t.classList.remove("selected"));
      tile.classList.add("selected");
      selectedTile = { letter: letter, element: tile };
    });
    poolElement.appendChild(tile);
  });
  updatePoolCounters();
}
function updatePoolCounters() {
  const poolTiles = document.querySelectorAll("#pool .tile");
  let counts = { X: 0, F: 0, O: 0 };
  poolTiles.forEach(tile => {
    let l = tile.dataset.letter;
    counts[l]++;
  });
  const poolCounters = document.getElementById("pool-counters");
  poolCounters.textContent = "Remaining - X: " + counts["X"] + " | F: " + counts["F"] + " | O: " + counts["O"];
}
function isBoardFull() {
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === "") return false;
    }
  }
  return true;
}
function checkFox() {
  const directions = [[0,1], [1,0], [1,1], [1,-1]];
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === "") continue;
      for (let d = 0; d < directions.length; d++) {
        let dr = directions[d][0], dc = directions[d][1];
        let letters = board[r][c];
        let cells = [[r, c]];
        for (let k = 1; k < 3; k++) {
          let nr = r + dr * k;
          let nc = c + dc * k;
          if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
            letters += board[nr][nc];
            cells.push([nr, nc]);
          }
        }
        if (letters.length === 3) {
          if (letters === "FOX" || letters === "XOF") {
            cells.forEach(coord => {
              let cellEl = document.querySelector('.cell[data-row="'+coord[0]+'"][data-col="'+coord[1]+'"]');
              if (cellEl) cellEl.classList.add("highlight");
            });
            return true;
          }
        }
      }
    }
  }
  return false;
}
function resetGame() {
  document.getElementById("board").classList.add("fade");
  document.getElementById("pool").classList.add("fade");
  document.getElementById("pool-counters").classList.add("fade");
  setTimeout(() => {
    gameOver = false;
    removeMode = false;
    document.getElementById("message").textContent = "";
    document.getElementById("reset").style.display = "none";
    initBoard();
    initPool();
    if (abilitiesEnabled) resetAbilityCharges();
    document.getElementById("board").classList.remove("fade");
    document.getElementById("pool").classList.remove("fade");
    document.getElementById("pool-counters").classList.remove("fade");
  }, 500);
}
document.getElementById("reveal").addEventListener("click", () => {
  if (!abilitiesEnabled || revealCharges <= 0) return;
  const poolTiles = document.querySelectorAll("#pool .tile");
  if (poolTiles.length === 0) return;
  const randomTile = poolTiles[Math.floor(Math.random() * poolTiles.length)];
  const originalHTML = randomTile.innerHTML;
  randomTile.innerHTML = randomTile.dataset.letter;
  setTimeout(() => { randomTile.innerHTML = originalHTML; }, 3000);
  revealCharges--;
  updateAbilityDisplay();
});
document.getElementById("remove").addEventListener("click", () => {
  if (!abilitiesEnabled || removeCharges <= 0) return;
  removeMode = !removeMode;
  document.getElementById("remove").classList.toggle("selected", removeMode);
});
document.getElementById("hint").addEventListener("click", () => {
  if (!abilitiesEnabled || hintCharges <= 0) return;
  let bestCell = null, bestRisk = Infinity;
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === "") {
        let risk = getCellRisk(r, c);
        if (risk < bestRisk) {
          bestRisk = risk;
          bestCell = document.querySelector('.cell[data-row="'+r+'"][data-col="'+c+'"]');
        }
      }
    }
  }
  if (bestCell) {
    bestCell.classList.add("hint");
    setTimeout(() => { bestCell.classList.remove("hint"); }, 2000);
  }
  hintCharges--;
  updateAbilityDisplay();
});
function getCellRisk(row, col) {
  let risk = 0;
  const directions = [[0,1], [1,0], [1,1], [1,-1]];
  directions.forEach(dir => {
    let r1 = row - dir[0], c1 = col - dir[1];
    let r2 = row + dir[0], c2 = col + dir[1];
    if (r1 >= 0 && r1 < boardSize && c1 >= 0 && c1 < boardSize &&
        r2 >= 0 && r2 < boardSize && c2 >= 0 && c2 < boardSize) {
      risk++;
    }
  });
  return risk;
}
const settingsBtn = document.getElementById("settings-btn");
const settingsPopup = document.getElementById("settings-popup");
const boardSizeSelect = document.getElementById("board-size");
const abilitiesToggle = document.getElementById("abilities-toggle");
const saveSettingsBtn = document.getElementById("save-settings");
const cancelSettingsBtn = document.getElementById("cancel-settings");
settingsBtn.addEventListener("click", () => {
  boardSizeSelect.value = boardSize;
  abilitiesToggle.checked = abilitiesEnabled;
  settingsPopup.style.display = "flex";
});
saveSettingsBtn.addEventListener("click", () => {
  boardSize = parseInt(boardSizeSelect.value);
  abilitiesEnabled = abilitiesToggle.checked;
  localStorage.setItem("gameSettings", JSON.stringify({boardSize, abilitiesEnabled}));
  updateScoreKeys();
  attempts = parseInt(localStorage.getItem(scoreKeyAttempts)) || 0;
  wins = parseInt(localStorage.getItem(scoreKeyWins)) || 0;
  document.getElementById("attempts").textContent = attempts;
  document.getElementById("wins").textContent = wins;
  document.getElementById("abilities").style.display = abilitiesEnabled ? "flex" : "none";
  settingsPopup.style.display = "none";
  resetGame();
});
cancelSettingsBtn.addEventListener("click", () => {
  settingsPopup.style.display = "none";
});
const cookiePopup = document.getElementById("cookie-popup");
const acceptCookiesBtn = document.getElementById("accept-cookies");
const declineCookiesBtn = document.getElementById("decline-cookies");
if (!localStorage.getItem("cookiesAccepted")) {
  cookiePopup.style.display = "flex";
}
acceptCookiesBtn.addEventListener("click", () => {
  localStorage.setItem("cookiesAccepted", "true");
  cookiePopup.style.display = "none";
});
declineCookiesBtn.addEventListener("click", () => {
  cookiePopup.style.display = "none";
});
document.getElementById("reset").addEventListener("click", resetGame);
if (abilitiesEnabled) {
  document.getElementById("abilities").style.display = "flex";
  resetAbilityCharges();
} else {
  document.getElementById("abilities").style.display = "none";
}
initBoard();
initPool();
