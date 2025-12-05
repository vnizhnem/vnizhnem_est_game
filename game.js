// ====================
// НИЖЕГОРОДСКАЯ КОЗА
// ====================

// Получаем canvas и context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Загружаем изображения
const BIRD_IMG = new Image();
BIRD_IMG.src = 'bird.png'; // Ваша коза

const PIPE_IMG = new Image();
PIPE_IMG.src = 'pipe.png'; // Ваша лавочка (100×60px)

const BG_IMG = new Image();
BG_IMG.src = 'background.png'; // Фон города

const GROUND_IMG = new Image();
GROUND_IMG.src = 'ground.png'; // Земля/набережная

// Игровые переменные
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
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
    rotation: 0
};

// Массив лавочек (препятствий)
const pipes = [];

// Настройки лавочек
const PIPE = {
    width: 100,     // Ширина лавочки
    height: 60,     // Высота лавочки (как вы решили)
    gap: 200,       // Расстояние между лавочками
    speed: 3,       // Скорость движения
    minY: 400,      // Минимальная Y позиция (выше земли)
    maxY: 500       // Максимальная Y позиция
};

// Земля
const ground = {
    x: 0,
    y: canvas.height - 50,
    height: 50,
    speed: 3
};

// ====================
// ТЕЛЕГРАМ ИНТЕГРАЦИЯ
// ====================
function initTelegram() {
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        tg.expand();
        tg.isVerticalSwipesEnabled = false;
        
        // Обработка кликов для игры
        document.addEventListener('touchstart', handleJump, { passive: false });
        document.addEventListener('click', handleJump);
        
        console.log('Telegram Web App инициализирован');
    }
}

// ====================
// УПРАВЛЕНИЕ
// ====================
function handleJump(e) {
    if (e.type === 'touchstart') {
        e.preventDefault();
    }
    
    if (!gameStarted) {
        startGame();
    } else if (!gameOver) {
        goat.velocity = goat.jumpStrength;
    } else {
        resetGame();
    }
}

// Клавиатура
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        handleJump(e);
    }
});

// Кнопки
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
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    
    // Первая лавочка
    addPipe();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    pipes.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
}

function addPipe() {
    const y = Math.random() * (PIPE.maxY - PIPE.minY) + PIPE.minY;
    
    pipes.push({
        x: canvas.width,
        y: y,
        width: PIPE.width,
        height: PIPE.height,
        passed: false
    });
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    // Движение козы
    goat.velocity += goat.gravity;
    goat.y += goat.velocity;
    
    // Вращение козы
    goat.rotation = goat.velocity * 0.1;
    if (goat.rotation > 0.5) goat.rotation = 0.5;
    if (goat.rotation < -0.5) goat.rotation = -0.5;
    
    // Движение земли
    ground.x -= ground.speed;
    if (ground.x <= -canvas.width) {
        ground.x = 0;
    }
    
    // Лавочки
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        
        // Движение
        pipe.x -= PIPE.speed;
        
        // Проверка прохождения
        if (!pipe.passed && pipe.x + pipe.width < goat.x) {
            pipe.passed = true;
            score++;
            document.getElementById('score').textContent = score;
            
            // Новая лавочка
            if (pipes.length < 3) {
                addPipe();
            }
        }
        
        // Удаление за экраном
        if (pipe.x + pipe.width < 0) {
            pipes.splice(i, 1);
        }
        
        // Коллизия
        if (
            goat.x + goat.width > pipe.x &&
            goat.x < pipe.x + pipe.width &&
            goat.y + goat.height > pipe.y &&
            goat.y < pipe.y + pipe.height
        ) {
            gameOver = true;
            endGame();
        }
    }
    
    // Коллизия с землей
    if (goat.y + goat.height > ground.y) {
        goat.y = ground.y - goat.height;
        gameOver = true;
        endGame();
    }
    
    // Коллизия с потолком
    if (goat.y < 0) {
        goat.y = 0;
        goat.velocity = 0;
    }
    
    // Автоматическое добавление лавочек
    if (frames % 120 === 0) {
        addPipe();
    }
}

function endGame() {
    gameOver = true;
    
    // Обновление рекорда
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
    }
    
    // Показать экран Game Over
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// ====================
// ОТРИСОВКА
// ====================
function draw() {
    // Фон
    ctx.drawImage(BG_IMG, 0, 0, canvas.width, canvas.height);
    
    // Лавочки
    pipes.forEach(pipe => {
        ctx.drawImage(PIPE_IMG, pipe.x, pipe.y, pipe.width, pipe.height);
    });
    
    // Земля
    ctx.drawImage(GROUND_IMG, ground.x, ground.y, canvas.width, ground.height);
    ctx.drawImage(GROUND_IMG, ground.x + canvas.width, ground.y, canvas.width, ground.height);
    
    // Коза
    ctx.save();
    ctx.translate(goat.x + goat.width / 2, goat.y + goat.height / 2);
    ctx.rotate(goat.rotation);
    ctx.drawImage(BIRD_IMG, -goat.width / 2, -goat.height / 2, goat.width, goat.height);
    ctx.restore();
}

// ====================
// ИГРОВОЙ ЦИКЛ
// ====================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ====================
// ЗАГРУЗКА И ЗАПУСК
// ====================
window.onload = function() {
    // Инициализация Telegram
    initTelegram();
    
    // Запуск игрового цикла
    gameLoop();
    
    // Проверка загрузки изображений
    let imagesLoaded = 0;
    const totalImages = 4;
    
    [BIRD_IMG, PIPE_IMG, BG_IMG, GROUND_IMG].forEach(img => {
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                console.log('Все изображения загружены!');
            }
        };
        
        img.onerror = () => {
            console.error('Ошибка загрузки изображения:', img.src);
        };
    });
    
    // Обновление рекорда на стартовом экране
    document.getElementById('highScore').textContent = highScore;
};