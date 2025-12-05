// ====================
// КОЗА В НИЖНЕМ - БОЛЬШЕ ПТИЦ!
// ====================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Размеры канваса
function resizeCanvas() {
    const gameContainer = document.getElementById('game');
    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;
    
    // Обновляем позицию земли
    ground.y = canvas.height - ground.height;
    
    // Обновляем позицию козы
    if (!gameStarted || gameOver) {
        goat.y = canvas.height / 2;
    }
}

window.addEventListener('resize', resizeCanvas);

// Изображения с запасными вариантами
const BIRD_IMG = new Image();
BIRD_IMG.src = 'bird.png';
BIRD_IMG.onerror = function() {
    this.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="#8B4513"/>
            <circle cx="30" cy="40" r="10" fill="#8B4513"/>
            <circle cx="70" cy="40" r="10" fill="#8B4513"/>
            <ellipse cx="50" cy="70" rx="20" ry="15" fill="#8B4513"/>
            <circle cx="40" cy="80" r="5" fill="#FFD700"/>
            <circle cx="60" cy="80" r="5" fill="#FFD700"/>
            <polygon points="40,25 45,15 50,25" fill="#FF0000"/>
            <polygon points="50,25 55,15 60,25" fill="#FF0000"/>
        </svg>
    `);
};

const PIPE_IMG = new Image();
PIPE_IMG.src = 'pipe.png';
PIPE_IMG.onerror = function() {
    this.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
            <rect x="0" y="0" width="100" height="60" fill="#8B4513"/>
            <rect x="10" y="10" width="80" height="10" fill="#A0522D"/>
            <rect x="20" y="25" width="60" height="10" fill="#A0522D"/>
        </svg>
    `);
};

const BG_IMG = new Image();
BG_IMG.src = 'background.png';
BG_IMG.onerror = function() {
    this.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#87CEEB"/>
                    <stop offset="100%" style="stop-color:#1E90FF"/>
                </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#bg)"/>
            <circle cx="100" cy="100" r="40" fill="#FFD700" opacity="0.8"/>
            <circle cx="300" cy="150" r="30" fill="#FFD700" opacity="0.6"/>
        </svg>
    `);
};

const GROUND_IMG = new Image();
GROUND_IMG.src = 'ground.png';
GROUND_IMG.onerror = function() {
    // Запасное изображение земли - УЛУЧШЕННОЕ, чтобы не было щелей
    this.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 60">
            <defs>
                <pattern id="grassPattern" width="50" height="60" patternUnits="userSpaceOnUse">
                    <rect width="50" height="60" fill="#228B22"/>
                    <rect y="40" width="50" height="20" fill="#32CD32"/>
                    <circle cx="10" cy="45" r="3" fill="#228B22"/>
                    <circle cx="30" cy="48" r="2" fill="#228B22"/>
                    <circle cx="40" cy="46" r="4" fill="#228B22"/>
                </pattern>
            </defs>
            <rect width="800" height="60" fill="url(#grassPattern)"/>
            <rect y="55" width="800" height="5" fill="#1a5c1a"/>
        </svg>
    `);
};

// Пельмени
const PELMEN_IMG = new Image();
PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
    <ellipse cx="50" cy="30" rx="45" ry="25" fill="#FFD700" stroke="#b8860b" stroke-width="3"/>
</svg>
`);

// Вражеские птицы
const ENEMY_BIRD_IMG = new Image();
ENEMY_BIRD_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="35" fill="#333333"/>
    <circle cx="70" cy="40" r="15" fill="#222222"/>
    <circle cx="75" cy="38" r="4" fill="#ffffff"/>
    <polygon points="85,40 95,35 95,45" fill="#ff9900"/>
</svg>
`);

// Игровые переменные
let score = 0;
let highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;

// Коза
const goat = {
    x: 150,
    y: 300,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.5,
    jumpStrength: -8,
    rotation: 0
};

// Лавочки - ФИКС: ставим ПРЯМО НА ЗЕМЛЮ
const benches = [];
const BENCH = {
    width: 100,
    height: 60,
    gap: 200,
    speed: 3
};

// Пельмени
const pelmeni = [];
const PELMEN = {
    width: 35,
    height: 20,
    points: 10,
    spawnChance: 0.6
};

// Птицы враги
const enemyBirds = [];
const ENEMY_BIRD = {
    width: 60,
    height: 40,
    points: -20,
    spawnChance: 0.45,
    speed: 3
};

// Земля - ФИКС: увеличиваем высоту и делаем без щелей
const ground = {
    x: 0,
    y: 540, // Позиция фиксированная
    height: 60, // Увеличили высоту
    speed: 3
};

// ====================
// УПРАВЛЕНИЕ
// ====================
function handleJump() {
    if (!gameStarted) {
        startGame();
    } else if (!gameOver) {
        goat.velocity = goat.jumpStrength;
    } else {
        resetGame();
    }
}

// Обработчик кликов
function handleGameClick(e) {
    // Проверяем, не кликнули ли по Telegram-ссылке
    if (e.target.closest('.telegram-button') || 
        e.target.closest('.telegram-footer') ||
        e.target.closest('.footer-text')) {
        return;
    }
    
    // Проверяем, не кликнули ли по кнопке
    if (e.target.id === 'startBtn' || e.target.id === 'restartBtn') {
        return;
    }
    
    handleJump();
}

// Обработчики событий
document.addEventListener('click', handleGameClick);

document.addEventListener('touchstart', function(e) {
    if (e.target.closest('.telegram-button') || 
        e.target.closest('.telegram-footer') ||
        e.target.closest('.footer-text')) {
        return;
    }
    
    if (e.target.id === 'startBtn' || e.target.id === 'restartBtn') {
        return;
    }
    
    e.preventDefault();
    handleJump();
}, { passive: false });

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
    }
});

// Кнопки
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', resetGame);

// ====================
// ИГРОВАЯ ЛОГИКА
// ====================
function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
    enemyBirds.length = 0;
    
    // Сбрасываем позицию козы
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    goat.rotation = 0;
    
    frames = 0;
    
    // Показываем/скрываем экраны
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    // Обновляем размер канваса
    resizeCanvas();
    
    // Добавляем первую лавочку
    addBench();
    
    // Запускаем игровой цикл
    gameLoop();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
    enemyBirds.length = 0;
    
    // Сбрасываем позицию козы
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    goat.rotation = 0;
    
    // Обновляем размер канваса
    resizeCanvas();
    
    // Показываем стартовый экран
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('score').textContent = '0';
    document.getElementById('currentHighScore').textContent = highScore;
}

function addBench() {
    // Лавочка стоит ПРЯМО НА ЗЕМЛЕ
    benches.push({
        x: canvas.width,
        y: ground.y - BENCH.height, // Ставим на землю
        width: BENCH.width,
        height: BENCH.height,
        passed: false
    });
}

function addPelmen() {
    pelmeni.push({
        x: canvas.width + Math.random() * 100,
        y: Math.random() * (canvas.height - 300) + 150,
        width: PELMEN.width,
        height: PELMEN.height,
        collected: false,
        float: Math.random() * Math.PI * 2,
        type: 'good'
    });
}

function addEnemyBird() {
    enemyBirds.push({
        x: canvas.width + 50,
        y: Math.random() * (canvas.height - 200) + 100,
        width: ENEMY_BIRD.width,
        height: ENEMY_BIRD.height,
        hit: false,
        float: Math.random() * Math.PI * 2,
        type: 'bad',
        speed: ENEMY_BIRD.speed + Math.random() * 1,
        wave: Math.random() * Math.PI * 2
    });
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    // Физика козы
    goat.velocity += goat.gravity;
    goat.y += goat.velocity;
    
    goat.rotation = goat.velocity * 0.1;
    if (goat.rotation > 0.5) goat.rotation = 0.5;
    if (goat.rotation < -0.5) goat.rotation = -0.5;
    
    // Потолок
    if (goat.y < 20) {
        goat.y = 20;
        goat.velocity = 0;
    }
    
    // Земля
    ground.x -= ground.speed;
    if (ground.x <= -canvas.width) ground.x = 0;
    
    // Лавочки
    for (let i = benches.length - 1; i >= 0; i--) {
        const bench = benches[i];
        bench.x -= BENCH.speed;
        
        if (!bench.passed && bench.x + bench.width < goat.x) {
            bench.passed = true;
            score += 5;
            document.getElementById('score').textContent = score;
            
            if (benches.length < 3) {
                addBench();
            }
        }
        
        if (bench.x + bench.width < 0) benches.splice(i, 1);
        
        // Столкновение с лавочкой
        if (goat.x + goat.width > bench.x &&
            goat.x < bench.x + bench.width &&
            goat.y + goat.height > bench.y &&
            goat.y < bench.y + bench.height) {
            gameOver = true;
            endGame();
        }
    }
    
    // Пельмени
    for (let i = pelmeni.length - 1; i >= 0; i--) {
        const pelmen = pelmeni[i];
        pelmen.x -= BENCH.speed;
        pelmen.float += 0.05;
        
        if (!pelmen.collected &&
            goat.x + goat.width - 10 > pelmen.x &&
            goat.x + 10 < pelmen.x + pelmen.width &&
            goat.y + goat.height - 10 > pelmen.y &&
            goat.y + 10 < pelmen.y + pelmen.height) {
            
            pelmen.collected = true;
            score += PELMEN.points;
            pelmen.effect = '+' + PELMEN.points;
            pelmen.effectTime = frames;
            
            document.getElementById('score').textContent = score;
        }
        
        if (pelmen.x + pelmen.width < -50) {
            pelmeni.splice(i, 1);
        }
    }
    
    // Птицы
    for (let i = enemyBirds.length - 1; i >= 0; i--) {
        const bird = enemyBirds[i];
        bird.x -= bird.speed;
        bird.float += 0.1;
        bird.wave += 0.05;
        
        // Птицы летят волнами
        bird.y += Math.sin(bird.wave) * 2;
        
        if (!bird.hit &&
            goat.x + goat.width - 15 > bird.x &&
            goat.x + 15 < bird.x + bird.width &&
            goat.y + goat.height - 15 > bird.y &&
            goat.y + 15 < bird.y + bird.height) {
            
            bird.hit = true;
            score += ENEMY_BIRD.points;
            if (score < 0) score = 0;
            bird.effect = ENEMY_BIRD.points;
            bird.effectTime = frames;
            
            document.getElementById('score').textContent = score;
            
            // Отталкивание козы при столкновении
            goat.velocity = -6;
        }
        
        if (bird.x + bird.width < -100) {
            enemyBirds.splice(i, 1);
        }
    }
    
    // Падение на землю
    if (goat.y + goat.height > ground.y) {
        gameOver = true;
        endGame();
    }
    
    // Добавление объектов
    if (frames % 120 === 0) {
        addBench();
        if (Math.random() < PELMEN.spawnChance) addPelmen();
        if (Math.random() < ENEMY_BIRD.spawnChance) addEnemyBird();
    }
    
    // Дополнительный шанс появления птиц
    if (frames % 80 === 0 && Math.random() < 0.25) {
        addEnemyBird();
    }
}

function endGame() {
    gameOver = true;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('goatHighScore', highScore);
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// ====================
// ОТРИСОВКА
// ====================
function draw() {
    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон
    ctx.drawImage(BG_IMG, 0, 0, canvas.width, canvas.height);
    
    // Пельмени
    pelmeni.forEach(pelmen => {
        if (!pelmen.collected) {
            ctx.save();
            ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2);
            ctx.rotate(Math.sin(pelmen.float) * 0.2);
            ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            ctx.restore();
        } else if (pelmen.effect) {
            const age = frames - pelmen.effectTime;
            if (age < 30) {
                ctx.save();
                ctx.globalAlpha = 1 - age / 30;
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(pelmen.effect, pelmen.x + pelmen.width/2, pelmen.y - age);
                ctx.restore();
            }
        }
    });
    
    // Птицы враги
    enemyBirds.forEach(bird => {
        ctx.save();
        ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
        
        if (Math.sin(bird.float * 3) > 0) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
        }
        
        const scaleY = 0.9 + Math.abs(Math.sin(bird.float)) * 0.2;
        ctx.scale(1, scaleY);
        
        ctx.drawImage(ENEMY_BIRD_IMG, -bird.width/2, -bird.height/2, bird.width, bird.height);
        ctx.restore();
        
        if (bird.effect) {
            const age = frames - bird.effectTime;
            if (age < 30) {
                ctx.save();
                ctx.globalAlpha = 1 - age / 30;
                ctx.fillStyle = '#FF0000';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(bird.effect, bird.x + bird.width/2, bird.y - age);
                ctx.restore();
            }
        }
    });
    
    // ЗЕМЛЯ - рисуем ПЕРВОЙ (фон для лавочек)
    for (let i = 0; i <= Math.ceil(canvas.width / canvas.width) + 1; i++) {
        // Рисуем землю с перекрытием, чтобы не было щелей
        ctx.drawImage(GROUND_IMG, ground.x + i * canvas.width, ground.y, canvas.width + 2, ground.height);
    }
    
    // ЛАВОЧКИ - рисуем ПОСЛЕ земли (стоят на земле)
    benches.forEach(bench => {
        ctx.drawImage(PIPE_IMG, bench.x, bench.y, bench.width, bench.height);
    });
    
    // Коза
    ctx.save();
    ctx.translate(goat.x + goat.width/2, goat.y + goat.height/2);
    ctx.rotate(goat.rotation);
    ctx.drawImage(BIRD_IMG, -goat.width/2, -goat.height/2, goat.width, goat.height);
    ctx.restore();
}

// Игровой цикл
function gameLoop() {
    update();
    draw();
    
    if (gameStarted && !gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    // Устанавливаем рекорд
    highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
    document.getElementById('currentHighScore').textContent = highScore;
    
    // Настраиваем размер канваса
    resizeCanvas();
    
    // Рисуем начальный экран
    draw();
});