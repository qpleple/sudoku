let selectedCell = null;
let puzzle = [];
let solution = [];
let userInput = [];
let muted = false;
let soundsUnlocked = false;

// Sound effects - preload
const sounds = {
    tap: new Audio('sounds/tap.mp3?v=1'),
    correct: new Audio('sounds/correct.mp3?v=1'),
    wrong: new Audio('sounds/wrong.mp3?v=1'),
    win: new Audio('sounds/win.mp3?v=1'),
    newgame: new Audio('sounds/newgame.mp3?v=1'),
};

// Preload all sounds
Object.values(sounds).forEach(sound => {
    sound.load();
});

function unlockSounds() {
    if (soundsUnlocked) return;
    soundsUnlocked = true;

    // Play silent audio to unlock on iOS
    Object.values(sounds).forEach(sound => {
        sound.volume = 0;
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
            sound.volume = 1;
        }).catch(() => {});
    });
}

function playSound(name) {
    if (muted) return;
    const s = sounds[name];
    if (s) {
        s.currentTime = 0;
        s.play().catch(() => {});
    }
}

function toggleMute() {
    muted = !muted;
    document.getElementById('muteBtn').textContent = muted ? '🔇 Muted' : '🔊 Sound';
}

// Initialize
newGame();

function newGame() {
    unlockSounds();
    playSound('newgame');
    document.getElementById('message').innerHTML = '';
    generatePuzzle();
    renderGrid();
    renderNumberPad();
}

function generatePuzzle() {
    solution = generateSolution();
    puzzle = solution.map(row => [...row]);
    userInput = puzzle.map(row => [...row]);

    const cellsToRemove = 6;
    let removed = 0;

    while (removed < cellsToRemove) {
        const row = Math.floor(Math.random() * 4);
        const col = Math.floor(Math.random() * 4);

        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            userInput[row][col] = 0;
            removed++;
        }
    }
}

function generateSolution() {
    const grid = Array(4).fill(0).map(() => Array(4).fill(0));

    function isValid(grid, row, col, num) {
        for (let x = 0; x < 4; x++) {
            if (grid[row][x] === num) return false;
        }

        for (let x = 0; x < 4; x++) {
            if (grid[x][col] === num) return false;
        }

        const boxRow = Math.floor(row / 2) * 2;
        const boxCol = Math.floor(col / 2) * 2;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                if (grid[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    function solve(grid) {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (grid[row][col] === 0) {
                    const numbers = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
                    for (let num of numbers) {
                        if (isValid(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (solve(grid)) return true;
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    solve(grid);
    return grid;
}

function renderGrid() {
    const gridEl = document.getElementById('grid');
    gridEl.innerHTML = '';

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const cell = document.createElement('button');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (puzzle[row][col] !== 0) {
                cell.textContent = puzzle[row][col];
                cell.classList.add('fixed');
            } else {
                cell.textContent = userInput[row][col] || '';
                cell.onclick = () => selectCell(row, col);

                // Add drag-and-drop handlers
                cell.addEventListener('dragover', handleDragOver);
                cell.addEventListener('dragleave', handleDragLeave);
                cell.addEventListener('drop', handleDrop);
            }

            gridEl.appendChild(cell);
        }
    }
}

function renderNumberPad() {
    const padEl = document.getElementById('numberPad');
    padEl.innerHTML = '';

    for (let i = 1; i <= 4; i++) {
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.dataset.number = i;
        btn.textContent = i;
        btn.draggable = true;
        btn.onclick = () => placeNumber(i);

        // Add drag handlers for desktop
        btn.addEventListener('dragstart', handleDragStart);
        btn.addEventListener('dragend', handleDragEnd);

        // Add touch handlers for mobile
        btn.addEventListener('touchstart', handleTouchStart, { passive: false });
        btn.addEventListener('touchmove', handleTouchMove, { passive: false });
        btn.addEventListener('touchend', handleTouchEnd, { passive: false });

        padEl.appendChild(btn);
    }
}

function selectCell(row, col) {
    unlockSounds();
    if (puzzle[row][col] !== 0) return;

    selectedCell = { row, col };
    playSound('tap');
    updateCellHighlights();
}

function updateCellHighlights() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, idx) => {
        const row = Math.floor(idx / 4);
        const col = idx % 4;

        cell.classList.remove('selected', 'error');

        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            cell.classList.add('selected');
        }
    });
}

function placeNumber(num) {
    if (!selectedCell) {
        showMessage('👆 Pick a square first!');
        return;
    }

    const { row, col } = selectedCell;

    if (puzzle[row][col] !== 0) return;

    userInput[row][col] = num;

    if (num === solution[row][col]) {
        playSound('correct');
        const cells = document.querySelectorAll('.cell');
        const idx = row * 4 + col;
        cells[idx].classList.add('correct-pop');

        setTimeout(() => {
            renderGrid();
            checkWin();
        }, 300);
    } else {
        playSound('wrong');
        const cells = document.querySelectorAll('.cell');
        const idx = row * 4 + col;
        cells[idx].classList.add('error');
        cells[idx].textContent = num;

        setTimeout(() => {
            userInput[row][col] = 0;
            renderGrid();
            selectCell(row, col);
        }, 500);
    }
}

function clearCell() {
    if (!selectedCell) {
        showMessage('👆 Pick a square first!');
        return;
    }

    const { row, col } = selectedCell;
    if (puzzle[row][col] === 0) {
        userInput[row][col] = 0;
        renderGrid();
        selectCell(row, col);
    }
}

function showMessage(msg) {
    const msgEl = document.getElementById('message');
    msgEl.textContent = msg;
    setTimeout(() => msgEl.textContent = '', 2000);
}

function checkWin() {
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (userInput[row][col] !== solution[row][col]) {
                return;
            }
        }
    }

    selectedCell = null;
    playSound('win');
    createConfetti();
    updateCellHighlights();
}

function createConfetti() {
    const colors = ['#FF6B9D', '#FFA07A', '#98D8C8', '#A7C7E7', '#FFD93D', '#B19CD9'];

    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

// Drag and drop handlers
let draggedNumber = null;
let touchDragNumber = null;
let currentHoverCell = null;
let dragGhost = null;

function handleDragStart(e) {
    draggedNumber = parseInt(e.target.dataset.number);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const row = parseInt(e.currentTarget.dataset.row);
    const col = parseInt(e.currentTarget.dataset.col);

    if (draggedNumber && puzzle[row][col] === 0) {
        placeNumberInCell(row, col, draggedNumber);
    }

    draggedNumber = null;
}

// Touch handlers for mobile
function handleTouchStart(e) {
    e.preventDefault();

    // Unlock sounds on first touch
    unlockSounds();

    touchDragNumber = parseInt(e.target.dataset.number);
    e.target.style.opacity = '0.5';

    // Create drag ghost element
    dragGhost = document.createElement('div');
    dragGhost.className = 'drag-ghost';
    dragGhost.textContent = touchDragNumber;

    // Set color based on number
    const colors = ['#E91E63', '#FF6D00', '#00BFA5', '#2196F3'];
    dragGhost.style.background = colors[touchDragNumber - 1];

    document.body.appendChild(dragGhost);

    // Position at touch point
    const touch = e.touches[0];
    dragGhost.style.left = touch.clientX + 'px';
    dragGhost.style.top = touch.clientY + 'px';
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];

    // Move drag ghost with touch
    if (dragGhost) {
        dragGhost.style.left = touch.clientX + 'px';
        dragGhost.style.top = touch.clientY + 'px';
    }

    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);

    // Remove highlight from previous cell
    if (currentHoverCell && currentHoverCell !== elementUnder) {
        currentHoverCell.classList.remove('drag-over');
    }

    // Add highlight to current cell
    if (elementUnder && elementUnder.classList.contains('cell') && !elementUnder.classList.contains('fixed')) {
        elementUnder.classList.add('drag-over');
        currentHoverCell = elementUnder;
    } else {
        currentHoverCell = null;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    e.target.style.opacity = '1';

    // Remove drag ghost
    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }

    const touch = e.changedTouches[0];
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);

    if (currentHoverCell) {
        currentHoverCell.classList.remove('drag-over');
    }

    if (elementUnder && elementUnder.classList.contains('cell') && !elementUnder.classList.contains('fixed')) {
        const row = parseInt(elementUnder.dataset.row);
        const col = parseInt(elementUnder.dataset.col);

        if (touchDragNumber && puzzle[row][col] === 0) {
            placeNumberInCell(row, col, touchDragNumber);
        }
    }

    touchDragNumber = null;
    currentHoverCell = null;
}

function placeNumberInCell(row, col, num) {
    userInput[row][col] = num;

    if (num === solution[row][col]) {
        playSound('correct');
        const cells = document.querySelectorAll('.cell');
        const idx = row * 4 + col;
        cells[idx].classList.add('correct-pop');

        setTimeout(() => {
            renderGrid();
            checkWin();
        }, 300);
    } else {
        playSound('wrong');
        const cells = document.querySelectorAll('.cell');
        const idx = row * 4 + col;
        cells[idx].classList.add('error');
        cells[idx].textContent = num;

        setTimeout(() => {
            userInput[row][col] = 0;
            renderGrid();
        }, 500);
    }
}

// Touch handling - allow default behavior for clicks to work on mobile
