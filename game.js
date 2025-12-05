// ====================
// НИЖЕГОРОДСКАЯ КОЗА (ПОЛНАЯ ВЕРСИЯ)
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
let highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
let totalGames = parseInt(localStorage.getItem('totalGames')) || 0;
let totalPelmeni = parseInt(localStorage.getItem('totalPelmeni')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;
let collectedInThisGame = 0;

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

// Настройки пельменей (УЛУЧШЕННЫЕ!)
const PELMEN = {
    width: 40,      // Чуть больше
    height: 25,     // Форма пельменя
    points: 15,     // Больше очков
    spawnChance: 0.7 // 70% шанс появления
};

// Загружаем пельмень (КРАСИВЫЙ SVG!)
const PELMEN_IMG = new Image();
PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
    <!-- Основная форма пельменя -->
    <ellipse cx="50" cy="30" rx="45" ry="25" fill="#f8f8f8" stroke="#d4a574" stroke-width="3"/>
    <!-- Текстура -->
    <ellipse cx="50" cy="30" rx="35" ry="18" fill="none" stroke="#e6c9a8" stroke-width="1.5" stroke-dasharray="5,3"/>
    <!-- Складки по краям -->
    <path d="M15,30 Q25,15 35,30 Q45,45 55,30 Q65,15 75,30 Q85,45 85,30" 
          fill="none" stroke="#b08d57" stroke-width="2" stroke-linecap="round"/>
    <!-- Блеск -->
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

// ====================
// ОБРАБОТЧИКИ КНОПОК
// ====================
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        handleJump(e);
    }
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', resetGame);

// Кнопки рекорда
document.getElementById('showRecordBtn').addEventListener('click', showRecordPopup);
document.getElementById('showRecordAfterGame').addEventListener('click', showRecordPopup);
document.getElementById('closeRecordBtn').addEventListener('click', hideRecordPopup);

// Клик по оверлею закрывает попап
document.getElementById('recordOverlay').addEventListener('click', hideRecordPopup);

// ====================
// СИСТЕМА РЕКОРДОВ
// ====================
function updateHighScoreDisplay() {
    document.getElementById('currentHighScore').textContent = highScore;
    document.getElementById('popupHighScore').textContent = highScore;
    document.getElementById('totalPelmeni').textContent = totalPelmeni;
    document.getElementById('totalGames').textContent = totalGames;
    
    // Ачивки
    const achievements = [
        { id: 'achievement1', score: 100, text: '🥉 100+ очков' },
        { id: 'achievement2', score: 250, text: '🥈 250+ очков' },
        { id: 'achievement3', score: 500, text: '🥇 500+ очков' }
    ];
    
    achievements.forEach(ach => {
        const element = document.getElementById(ach.id);
        if (highScore >= ach.score) {
            element.classList.add('unlocked');
            element.classList.remove('locked');
        } else {
            element.classList.add('locked');
            element.classList.remove('unlocked');
        }
        element.textContent = ach.text + (highScore >= ach.score ? ' ✓' : '');
    });
}

function showRecordPopup() {
    updateHighScoreDisplay();
    document.getElementById('recordOverlay').style.display = 'flex';
    document.getElementById('recordPopup').style.display = 'block';
}

function hideRecordPopup() {
    document.getElementById('recordOverlay').style.display = 'none';
    document.getElementById('recordPopup').style.display = 'none';
}

// ====================
// ИГРОВАЯ ЛОГИКА
// ====================
function startGame() {
    if (gameStarted) return;
    
    gameStarted = true;
    gameOver = false;
    score = 0;
    collectedInThisGame = 0;
    pipes.length = 0;
    pelmeni.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    goat.isAtCeiling = false;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    // Увеличиваем счетчик игр
    totalGames++;
    localStorage.setItem('totalGames', totalGames);
    
    // Первая лавочка
    addPipe();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    collectedInThisGame = 0;
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
    
    // С вероятностью 70% добавляем пельмень (ЧАЩЕ!)
    if (Math.random() < PELMEN.spawnChance) {
        addPelmen(newPipe.x, newPipe.y);
    }
}

function addPelmen(pipeX, pipeY) {
    // Пельмень появляется В ДОСТУПНОМ МЕСТЕ (не у потолка!)
    const minY = pipeY - 80;  // Минимум на 80px выше лавочки
    const maxY = goat.maxJumpHeight + 80; // Максимум ниже потолка
    
    const pelmenY = Math.random() * (maxY - minY) + minY;
    
    // Пельмень может быть как слева, так и справа от лавочки
    const offset = Math.random() > 0.5 ? -40 : 40;
    
    pelmeni.push({
        x: pipeX + PIPE.width / 2 - PELMEN.width / 2 + offset,
        y: pelmenY,
        width: PELMEN.width,
        height: PELMEN.height,
        collected: false,
        float: Math.random() * Math.PI * 2, // Разная начальная фаза
        speed: 0.5 + Math.random() * 0.5,   // Разная скорость анимации
        side: offset > 0 ? 'right' : 'left', // С какой стороны
        scale: 0.8 + Math.random() * 0.4    // Разный размер
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
    
    // ПЕЛЬМЕНИ (УЛУЧШЕННАЯ ЛОГИКА)
    for (let i = pelmeni.length - 1; i >= 0; i--) {
        const pelmen = pelmeni[i];
        
        if (pelmen.collected) continue;
        
        // Плавная анимация плавания
        pelmen.float += pelmen.speed * 0.05;
        pelmen.y += Math.sin(pelmen.float) * 0.8;
        
        // Легкое движение в сторону
        if (pelmen.side === 'left') {
            pelmen.x -= 0.3;
        } else {
            pelmen.x += 0.3;
        }
        
        // Основное движение с игрой
        pelmen.x -= PIPE.speed;
        
        // Коллизия с козой (УВЕЛИЧЕННАЯ ЗОНА!)
        const collisionMargin = 15;
        if (
            goat.x + goat.width - collisionMargin > pelmen.x &&
            goat.x + collisionMargin < pelmen.x + pelmen.width &&
            goat.y + goat.height - collisionMargin > pelmen.y &&
            goat.y + collisionMargin < pelmen.y + pelmen.height
        ) {
            pelmen.collected = true;
            collectedInThisGame++;
            score += PELMEN.points;
            document.getElementById('score').textContent = score;
            
            // Сохраняем общее количество пельменей
            totalPelmeni++;
            localStorage.setItem('totalPelmeni', totalPelmeni);
            
            // Запоминаем время сбора для анимации
            pelmen.collectTime = Date.now();
            pelmen.collectX = pelmen.x;
            pelmen.collectY = pelmen.y;
            
            // Удаляем через 250 мс (чтобы увидеть анимацию)
            setTimeout(() => {
                const index = pelmeni.indexOf(pelmen);
                if (index > -1) pelmeni.splice(index, 1);
            }, 250);
        }
        
        // Удаление за экраном
        if (pelmen.x + pelmen.width < -50 || pelmen.x > canvas.width + 50) {
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
        updateHighScoreDisplay();
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
    
    // ПЕЛЬМЕНИ (КРАСИВАЯ ОТРИСОВКА)
    pelmeni.forEach(pelmen => {
        if (!pelmen.collected) {
            // Сохраняем состояние контекста
            ctx.save();
            
            // Перемещаем к центру пельменя
            ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2);
            
            // Плавное вращение
            ctx.rotate(pelmen.float * 0.3);
            
            // Легкая пульсация
            const pulse = 1 + Math.sin(pelmen.float * 2) * 0.1;
            ctx.scale(pelmen.scale * pulse, pelmen.scale * pulse);
            
            // Рисуем пельмень
            ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            
            // Восстанавливаем контекст
            ctx.restore();
        } else {
            // Анимация сбора пельменя
            const timeSinceCollect = Date.now() - (pelmen.collectTime || 0);
            if (timeSinceCollect < 250) {
                const progress = timeSinceCollect / 250;
                const opacity = 1 - progress;
                const scale = 1 + progress * 0.5;
                const yOffset = -progress * 30;
                
                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.translate(
                    (pelmen.collectX || pelmen.x) + pelmen.width/2,
                    (pelmen.collectY || pelmen.y) + pelmen.height/2 + yOffset
                );
                ctx.scale(scale, scale);
                ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
                ctx.restore();
                
                // Текст "+15"
                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 24px "Press Start 2P", Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `+${PELMEN.points}`,
                    (pelmen.collectX || pelmen.x) + pelmen.width/2,
                    (pelmen.collectY || pelmen.y) - 20 - progress * 20
                );
                ctx.restore();
            }
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
    
    // Проверка пельменя
    PELMEN_IMG.onload = () => console.log('Пельмень загружен!');
    PELMEN_IMG.onerror = () => console.error('Ошибка загрузки пельменя');
    
    // Обновление отображения рекорда
    updateHighScoreDisplay();
};