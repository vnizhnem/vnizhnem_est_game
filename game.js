// ====================
// НИЖЕГОРОДСКАЯ КОЗА (ИСПРАВЛЕННАЯ ВЕРСИЯ)
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
    rotation: 0,
    maxJumpHeight: 200, // МАКСИМАЛЬНАЯ ВЫСОТА ПРЫЖКА!
    isAtCeiling: false
};

// Массив лавочек (препятствий)
const pipes = [];

// Массив пельменей-бонусов
const pelmeni = [];

// Настройки лавочек
const PIPE = {
    width: 100,     // Ширина лавочки
    height: 60,     // Высота лавочки (как вы решили)
    gap: 200,       // Расстояние между лавочками
    speed: 3,       // Скорость движения
    minY: 400,      // Минимальная Y позиция (выше земли)
    maxY: 500       // Максимальная Y позиция
};

// Настройки пельменей
const PELMEN = {
    width: 30,
    height: 30,
    points: 10
};

// Загружаем пельмень (SVG изображение)
const PELMEN_IMG = new Image();
PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#ff6b6b" stroke-width="3"/>
    <circle cx="35" cy="40" r="8" fill="#ff6b6b"/>
    <circle cx="65" cy="40" r="8" fill="#ff6b6b"/>
    <path d="M30,65 Q50,85 70,65" fill="none" stroke="#ff6b6b" stroke-width="4"/>
    <circle cx="40" cy="30" r="3" fill="#ffffff"/>
    <circle cx="60" cy="30" r="3" fill="#ffffff"/>
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
    pelmeni.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    goat.isAtCeiling = false;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    // Первая лавочка
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
    
    // С вероятностью 50% добавляем пельмень над лавочкой
    if (Math.random() > 0.5) {
        addPelmen(newPipe.x, newPipe.y);
    }
}

function addPelmen(pipeX, pipeY) {
    // Пельмень появляется над лавочкой
    pelmeni.push({
        x: pipeX + PIPE.width / 2 - PELMEN.width / 2,
        y: pipeY - 60, // Над лавочкой
        width: PELMEN.width,
        height: PELMEN.height,
        collected: false,
        float: 0 // Для плавающей анимации
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
    
    // ОГРАНИЧЕНИЕ ВЫСОТЫ - ФИКС БАГА!
    if (goat.y < goat.maxJumpHeight) {
        goat.y = goat.maxJumpHeight;
        goat.velocity = 0;
        goat.isAtCeiling = true;
    } else {
        goat.isAtCeiling = false;
    }
    
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
    
    // Пельмени
    for (let i = pelmeni.length - 1; i >= 0; i--) {
        const pelmen = pelmeni[i];
        
        if (pelmen.collected) continue;
        
        // Анимация плавания
        pelmen.float += 0.1;
        pelmen.y += Math.sin(pelmen.float) * 0.5;
        
        // Движение с той же скоростью
        pelmen.x -= PIPE.speed;
        
        // Коллизия с козой
        if (
            goat.x + goat.width > pelmen.x &&
            goat.x < pelmen.x + pelmen.width &&
            goat.y + goat.height > pelmen.y &&
            goat.y < pelmen.y + pelmen.height
        ) {
            pelmen.collected = true;
            score += PELMEN.points;
            document.getElementById('score').textContent = score;
            
            // Удаляем через 300 мс для анимации
            setTimeout(() => {
                const index = pelmeni.indexOf(pelmen);
                if (index > -1) pelmeni.splice(index, 1);
            }, 300);
        }
        
        // Удаление за экраном
        if (pelmen.x + pelmen.width < 0) {
            pelmeni.splice(i, 1);
        }
    }
    
    // Коллизия с землей
    if (goat.y + goat.height > ground.y) {
        goat.y = ground.y - goat.height;
        gameOver = true;
        endGame();
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
    
    // Индикатор максимальной высоты (красная линия)
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
    
    // Лавочки
    pipes.forEach(pipe => {
        ctx.drawImage(PIPE_IMG, pipe.x, pipe.y, pipe.width, pipe.height);
    });
    
    // Пельмени
    pelmeni.forEach(pelmen => {
        if (!pelmen.collected) {
            // Анимация вращения
            ctx.save();
            ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2);
            ctx.rotate(pelmen.float * 0.5);
            ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            ctx.restore();
        }
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
    
    // Проверка пельменя
    PELMEN_IMG.onload = () => console.log('Пельмень загружен!');
    PELMEN_IMG.onerror = () => console.error('Ошибка загрузки пельменя');
};