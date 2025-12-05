// ====================
// КОЗА В НИЖНЕМ - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ====================

// Получаем canvas и context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Загружаем изображения
const BIRD_IMG = new Image();
BIRD_IMG.src = 'bird.png';

const PIPE_IMG = new Image();
PIPE_IMG.src = 'pipe.png';

const BG_IMG = new Image();
BG_IMG.src = 'background.png';

const GROUND_IMG = new Image();
GROUND_IMG.src = 'ground.png';

// Игровые переменные
let score = 0;
let highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;

// Позиция козы
const goat = {
    x: 150,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.5,
    jumpStrength: -10,
    rotation: 0,
    maxJumpHeight: 200,
    isAtCeiling: false
};

// Массив лавочек
const pipes = [];
const pelmeni = [];

// Настройки
const PIPE = {
    width: 100,
    height: 60,
    gap: 200,
    speed: 3,
    minY: 400,
    maxY: 500
};

const PELMEN = {
    width: 40,
    height: 25,
    points: 15,
    spawnChance: 0.7
};

// Пельмень
const PELMEN_IMG = new Image();
PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
    <ellipse cx="50" cy="30" rx="45" ry="25" fill="#f8f8f8" stroke="#d4a574" stroke-width="3"/>
    <ellipse cx="50" cy="30" rx="35" ry="18" fill="none" stroke="#e6c9a8" stroke-width="1.5" stroke-dasharray="5,3"/>
    <path d="M15,30 Q25,15 35,30 Q45,45 55,30 Q65,15 75,30 Q85,45 85,30" 
          fill="none" stroke="#b08d57" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="35" cy="20" rx="8" ry="4" fill="rgba(255,255,255,0.6)"/>
</svg>
`);

// Земля
const ground = {
    x: 0,
    y: canvas.height - 50,
    height: 50,
    speed: 3
};

// ====================
// ОБНОВЛЕНИЕ РЕКОРДА
// ====================
function updateHighScoreDisplay() {
    document.getElementById('highScore').textContent = highScore;
}

// ====================
// УПРАВЛЕНИЕ
// ====================
function handleJump(e) {
    if (e.type === 'touchstart') e.preventDefault();
    
    if (!gameStarted) {
        startGame();
    } else if (!gameOver) {
        goat.velocity = goat.jumpStrength;
    } else {
        resetGame();
    }
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        handleJump(e);
    }
});

document.addEventListener('touchstart', handleJump, { passive: false });
document.addEventListener('click', handleJump);

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', resetGame);

// ====================
// ИГРОВАЯ ЛОГИКА
// ====================
function startGame() {
    if (gameStarted) return;
    
    gameStarted = true;
    gameOver = false;
    score = 0;
    pipes.length = 0;
    pelmeni.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    goat.isAtCeiling = false;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    addPipe();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    pipes.length = 0;
    pelmeni.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    goat.isAtCeiling = false;
    
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('score').textContent = '0';
}

function addPipe() {
    const y = Math.random() * (PIPE.maxY - PIPE.minY) + PIPE.minY;
    const newPipe = {
        x: canvas.width,
        y: y,
        width: PIPE.width,
        height: PIPE.height,
        passed: false
    };
    
    pipes.push(newPipe);
    
    if (Math.random() < PELMEN.spawnChance) {
        addPelmen(newPipe.x, newPipe.y);
    }
}

function addPelmen(pipeX, pipeY) {
    const minY = pipeY - 80;
    const maxY = goat.maxJumpHeight + 80;
    const pelmenY = Math.random() * (maxY - minY) + minY;
    const offset = Math.random() > 0.5 ? -40 : 40;
    
    pelmeni.push({
        x: pipeX + PIPE.width / 2 - PELMEN.width / 2 + offset,
        y: pelmenY,
        width: PELMEN.width,
        height: PELMEN.height,
        collected: false,
        float: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        side: offset > 0 ? 'right' : 'left',
        scale: 0.8 + Math.random() * 0.4
    });
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    goat.velocity += goat.gravity;
    goat.y += goat.velocity;
    
    goat.rotation = goat.velocity * 0.1;
    if (goat.rotation > 0.5) goat.rotation = 0.5;
    if (goat.rotation < -0.5) goat.rotation = -0.5;
    
    if (goat.y < goat.maxJumpHeight) {
        goat.y = goat.maxJumpHeight;
        goat.velocity = 0;
        goat.isAtCeiling = true;
    } else {
        goat.isAtCeiling = false;
    }
    
    ground.x -= ground.speed;
    if (ground.x <= -canvas.width) ground.x = 0;
    
    // Лавочки
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= PIPE.speed;
        
        if (!pipe.passed && pipe.x + pipe.width < goat.x) {
            pipe.passed = true;
            score++;
            document.getElementById('score').textContent = score;
            if (pipes.length < 3) addPipe();
        }
        
        if (pipe.x + pipe.width < 0) pipes.splice(i, 1);
        
        if (goat.x + goat.width > pipe.x &&
            goat.x < pipe.x + pipe.width &&
            goat.y + goat.height > pipe.y &&
            goat.y < pipe.y + pipe.height) {
            gameOver = true;
            endGame();
        }
    }
    
    // Пельмени
    for (let i = pelmeni.length - 1; i >= 0; i--) {
        const pelmen = pelmeni[i];
        if (pelmen.collected) continue;
        
        pelmen.float += pelmen.speed * 0.05;
        pelmen.y += Math.sin(pelmen.float) * 0.8;
        if (pelmen.side === 'left') pelmen.x -= 0.3;
        else pelmen.x += 0.3;
        pelmen.x -= PIPE.speed;
        
        if (goat.x + goat.width - 15 > pelmen.x &&
            goat.x + 15 < pelmen.x + pelmen.width &&
            goat.y + goat.height - 15 > pelmen.y &&
            goat.y + 15 < pelmen.y + pelmen.height) {
            pelmen.collected = true;
            score += PELMEN.points;
            document.getElementById('score').textContent = score;
            
            pelmen.collectTime = Date.now();
            setTimeout(() => {
                const index = pelmeni.indexOf(pelmen);
                if (index > -1) pelmeni.splice(index, 1);
            }, 250);
        }
        
        if (pelmen.x + pelmen.width < -50 || pelmen.x > canvas.width + 50) {
            pelmeni.splice(i, 1);
        }
    }
    
    if (goat.y + goat.height > ground.y) {
        goat.y = ground.y - goat.height;
        gameOver = true;
        endGame();
    }
    
    if (frames % 120 === 0) addPipe();
}

function endGame() {
    gameOver = true;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('goatHighScore', highScore);
        updateHighScoreDisplay();
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// ====================
// ОТРИСОВКА
// ====================
function draw() {
    ctx.drawImage(BG_IMG, 0, 0, canvas.width, canvas.height);
    
    if (gameStarted && !gameOver) {
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, goat.maxJumpHeight);
        ctx.lineTo(canvas.width, goat.maxJumpHeight);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    pipes.forEach(pipe => {
        ctx.drawImage(PIPE_IMG, pipe.x, pipe.y, pipe.width, pipe.height);
    });
    
    pelmeni.forEach(pelmen => {
        if (!pelmen.collected) {
            ctx.save();
            ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2);
            ctx.rotate(pelmen.float * 0.3);
            const pulse = 1 + Math.sin(pelmen.float * 2) * 0.1;
            ctx.scale(pelmen.scale * pulse, pelmen.scale * pulse);
            ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            ctx.restore();
        }
    });
    
    ctx.drawImage(GROUND_IMG, ground.x, ground.y, canvas.width, ground.height);
    ctx.drawImage(GROUND_IMG, ground.x + canvas.width, ground.y, canvas.width, ground.height);
    
    ctx.save();
    ctx.translate(goat.x + goat.width / 2, goat.y + goat.height / 2);
    ctx.rotate(goat.rotation);
    ctx.drawImage(BIRD_IMG, -goat.width / 2, -goat.height / 2, goat.width, goat.height);
    ctx.restore();
}

// ====================
// ЗАПУСК
// ====================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

window.onload = function() {
    // Telegram Web App
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        tg.expand();
        tg.isVerticalSwipesEnabled = false;
    }
    
    // Запуск игры
    gameLoop();
    
    // Загрузка изображений
    [BIRD_IMG, PIPE_IMG, BG_IMG, GROUND_IMG].forEach(img => {
        img.onload = () => console.log('Изображение загружено');
        img.onerror = () => console.error('Ошибка загрузки:', img.src);
    });
    
    PELMEN_IMG.onload = () => console.log('Пельмень загружен');
    
    // Показываем рекорд при загрузке
    updateHighScoreDisplay();
};