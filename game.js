// ====================
// КОЗА В НИЖНЕМ - С ОПАСНЫМИ ПТИЦАМИ!
// ====================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Изображения
const BIRD_IMG = new Image();
BIRD_IMG.src = 'bird.png';

const PIPE_IMG = new Image();
PIPE_IMG.src = 'pipe.png';

const BG_IMG = new Image();
BG_IMG.src = 'background.png';

const GROUND_IMG = new Image();
GROUND_IMG.src = 'ground.png';

// Пельмени
const PELMEN_IMG = new Image();
PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
    <ellipse cx="50" cy="30" rx="45" ry="25" fill="#FFD700" stroke="#b8860b" stroke-width="3"/>
    <ellipse cx="35" cy="20" rx="8" ry="4" fill="rgba(255,255,255,0.8)"/>
</svg>
`);

// ОПАСНЫЕ ПТИЦЫ (ворона/чайка)
const ENEMY_BIRD_IMG = new Image();
ENEMY_BIRD_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <!-- Тело птицы -->
    <ellipse cx="50" cy="50" rx="35" ry="25" fill="#333333"/>
    <!-- Крыло 1 -->
    <ellipse cx="30" cy="50" rx="25" ry="15" fill="#444444" transform="rotate(-30, 30, 50)"/>
    <!-- Крыло 2 -->
    <ellipse cx="70" cy="50" rx="25" ry="15" fill="#444444" transform="rotate(30, 70, 50)"/>
    <!-- Голова -->
    <circle cx="70" cy="35" r="12" fill="#222222"/>
    <!-- Глаз -->
    <circle cx="73" cy="33" r="3" fill="#ffffff"/>
    <!-- Клюв -->
    <polygon points="85,35 95,30 95,40" fill="#ff9900"/>
    <!-- Хвост -->
    <polygon points="15,50 25,40 25,60" fill="#555555"/>
</svg>
`);

// Игровые переменные
let score = 0;
let highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;

// КОЗА
const goat = {
    x: 150,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.5,
    jumpStrength: -8,
    rotation: 0,
    maxHeight: 100
};

// Лавочки
const benches = [];
const BENCH = {
    width: 100,
    height: 60,
    gap: 200,
    speed: 3,
    minY: 400,
    maxY: 500
};

// Пельмени
const pelmeni = [];
const PELMEN = {
    width: 35,
    height: 20,
    points: 10,
    spawnChance: 0.7
};

// ВРАЖЕСКИЕ ПТИЦЫ
const enemyBirds = [];
const ENEMY_BIRD = {
    width: 60,
    height: 40,
    points: -25, // Сильнее штраф!
    spawnChance: 0.3,
    minSpeed: 2,
    maxSpeed: 4
};

// Земля
const ground = {
    x: 0,
    y: canvas.height - 50,
    height: 50,
    speed: 3
};

// ====================
// УПРАВЛЕНИЕ
// ====================
function handleJump(e) {
    if (e && e.type === 'touchstart') e.preventDefault();
    
    if (!gameStarted) {
        startGame();
    } else if (!gameOver) {
        goat.velocity = goat.jumpStrength;
    } else {
        resetGame();
    }
}

// Тапы и клики
document.addEventListener('click', handleJump);
document.addEventListener('touchstart', handleJump, { passive: false });

// Клавиатура
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
    if (gameStarted) return;
    
    gameStarted = true;
    gameOver = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
    enemyBirds.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    addBench();
    if (Math.random() < 0.5) addPelmen();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
    enemyBirds.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('score').textContent = '0';
}

function addBench() {
    benches.push({
        x: canvas.width,
        y: Math.random() * (BENCH.maxY - BENCH.minY) + BENCH.minY,
        width: BENCH.width,
        height: BENCH.height,
        passed: false
    });
}

function addPelmen() {
    pelmeni.push({
        x: canvas.width + Math.random() * 100,
        y: Math.random() * 300 + 150, // 150-450
        width: PELMEN.width,
        height: PELMEN.height,
        collected: false,
        float: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5
    });
}

function addEnemyBird() {
    // Птица летит по синусоиде
    const startY = Math.random() * 300 + 100; // 100-400
    const amplitude = 50 + Math.random() * 50; // Размах крыльев траектории
    const speed = ENEMY_BIRD.minSpeed + Math.random() * (ENEMY_BIRD.maxSpeed - ENEMY_BIRD.minSpeed);
    
    enemyBirds.push({
        x: canvas.width + 50,
        y: startY,
        width: ENEMY_BIRD.width,
        height: ENEMY_BIRD.height,
        hit: false,
        startY: startY,
        amplitude: amplitude,
        speed: speed,
        phase: Math.random() * Math.PI * 2, // Начальная фаза
        wingFlap: 0,
        direction: Math.random() > 0.5 ? 1 : -1 // Направление движения по Y
    });
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    // ФИЗИКА КОЗЫ
    goat.velocity += goat.gravity;
    goat.y += goat.velocity;
    
    // Вращение
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
    
    // ЛАВОЧКИ
    for (let i = benches.length - 1; i >= 0; i--) {
        const bench = benches[i];
        bench.x -= BENCH.speed;
        
        if (!bench.passed && bench.x + bench.width < goat.x) {
            bench.passed = true;
            score += 5;
            document.getElementById('score').textContent = score;
            
            if (benches.length < 3) {
                addBench();
                if (Math.random() < 0.7) addPelmen();
                if (Math.random() < ENEMY_BIRD.spawnChance) addEnemyBird();
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
    
    // ПЕЛЬМЕНИ
    for (let i = pelmeni.length - 1; i >= 0; i--) {
        const pelmen = pelmeni[i];
        pelmen.x -= BENCH.speed;
        pelmen.float += pelmen.speed * 0.05;
        
        // Коллизия с пельменем
        if (!pelmen.collected &&
            goat.x + goat.width - 10 > pelmen.x &&
            goat.x + 10 < pelmen.x + pelmen.width &&
            goat.y + goat.height - 10 > pelmen.y &&
            goat.y + 10 < pelmen.y + pelmen.height) {
            
            pelmen.collected = true;
            score += PELMEN.points;
            pelmen.effect = `+${PELMEN.points}`;
            pelmen.effectTime = Date.now();
            
            document.getElementById('score').textContent = score;
            
            setTimeout(() => {
                const idx = pelmeni.indexOf(pelmen);
                if (idx > -1) pelmeni.splice(idx, 1);
            }, 400);
        }
        
        if (pelmen.x + pelmen.width < -50) {
            pelmeni.splice(i, 1);
        }
    }
    
    // ВРАЖЕСКИЕ ПТИЦЫ
    for (let i = enemyBirds.length - 1; i >= 0; i--) {
        const bird = enemyBirds[i];
        
        // Движение по синусоиде
        bird.x -= bird.speed;
        bird.phase += 0.05;
        bird.y = bird.startY + Math.sin(bird.phase) * bird.amplitude * bird.direction;
        
        // Анимация крыльев
        bird.wingFlap += 0.2;
        
        // Коллизия с птицей
        if (!bird.hit &&
            goat.x + goat.width - 15 > bird.x &&
            goat.x + 15 < bird.x + bird.width &&
            goat.y + goat.height - 15 > bird.y &&
            goat.y + 15 < bird.y + bird.height) {
            
            bird.hit = true;
            score += ENEMY_BIRD.points;
            if (score < 0) score = 0;
            bird.effect = `${ENEMY_BIRD.points}`;
            bird.effectTime = Date.now();
            
            document.getElementById('score').textContent = score;
            
            // Отталкивание козы
            goat.velocity = -5;
            
            setTimeout(() => {
                const idx = enemyBirds.indexOf(bird);
                if (idx > -1) enemyBirds.splice(idx, 1);
            }, 500);
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
    
    // Автодобавление объектов
    if (frames % 120 === 0) addBench();
    if (frames % 90 === 0 && Math.random() < PELMEN.spawnChance) addPelmen();
    if (frames % 150 === 0 && Math.random() < ENEMY_BIRD.spawnChance) addEnemyBird();
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
    // Фон
    ctx.drawImage(BG_IMG, 0, 0, canvas.width, canvas.height);
    
    // ЛАВОЧКИ
    benches.forEach(bench => {
        ctx.drawImage(PIPE_IMG, bench.x, bench.y, bench.width, bench.height);
    });
    
    // ПЕЛЬМЕНИ
    pelmeni.forEach(pelmen => {
        if (!pelmen.collected) {
            ctx.save();
            ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2);
            ctx.rotate(pelmen.float);
            
            // Легкое свечение
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            ctx.shadowBlur = 0;
            
            ctx.restore();
        } else if (pelmen.effect) {
            // Эффект сбора
            const time = Date.now() - pelmen.effectTime;
            if (time < 400) {
                const progress = time / 400;
                const alpha = 1 - progress;
                const yOffset = -progress * 30;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 22px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(pelmen.effect, pelmen.x + pelmen.width/2, pelmen.y + yOffset);
                ctx.restore();
            }
        }
    });
    
    // ВРАЖЕСКИЕ ПТИЦЫ
    enemyBirds.forEach(bird => {
        ctx.save();
        ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
        
        // Анимация крыльев (птица машет)
        const wingOffset = Math.sin(bird.wingFlap) * 5;
        ctx.scale(1, 0.9 + Math.abs(Math.sin(bird.wingFlap)) * 0.1);
        
        // Красное свечение для опасности
        if (Math.sin(bird.wingFlap * 2) > 0.7) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
        }
        
        ctx.drawImage(ENEMY_BIRD_IMG, -bird.width/2, -bird.height/2 + wingOffset, bird.width, bird.height);
        ctx.restore();
        
        // Эффект после удара
        if (bird.hit && bird.effect) {
            const time = Date.now() - bird.effectTime;
            if (time < 500) {
                const progress = time / 500;
                const alpha = 1 - progress;
                const scale = 1 + progress;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(bird.x + bird.width/2, bird.y - 20);
                ctx.scale(scale, scale);
                ctx.fillStyle = '#ff4444';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(bird.effect, 0, 0);
                ctx.restore();
            }
        }
    });
    
    // ЗЕМЛЯ
    ctx.drawImage(GROUND_IMG, ground.x, ground.y, canvas.width, ground.height);
    ctx.drawImage(GROUND_IMG, ground.x + canvas.width, ground.y, canvas.width, ground.height);
    
    // КОЗА
    ctx.save();
    ctx.translate(goat.x + goat.width/2, goat.y + goat.height/2);
    ctx.rotate(goat.rotation);
    
    // Если только что ударили птицу - красный оттенок
    if (frames % 20 < 10 && enemyBirds.some(b => b.hit && (Date.now() - (b.effectTime || 0) < 1000))) {
        ctx.filter = 'brightness(1.5) saturate(2)';
    }
    
    ctx.drawImage(BIRD_IMG, -goat.width/2, -goat.height/2, goat.width, goat.height);
    ctx.restore();
    
    // ПОДСКАЗКА О ПТИЦАХ
    if (gameStarted && !gameOver && frames % 200 < 100 && enemyBirds.length === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ Осторожно! Появятся опасные птицы!', canvas.width/2, 50);
    }
}

// ====================
// ЗАПУСК
// ====================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Инициализация
window.onload = function() {
    // Telegram
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        tg.expand();
        tg.isVerticalSwipesEnabled = false;
    }
    
    // Запуск
    gameLoop();
    
    // Загрузка изображений
    const images = [BIRD_IMG, PIPE_IMG, BG_IMG, GROUND_IMG, PELMEN_IMG, ENEMY_BIRD_IMG];
    let loaded = 0;
    images.forEach(img => {
        img.onload = () => {
            loaded++;
            if (loaded === images.length) console.log('Все изображения загружены!');
        };
        img.onerror = (e) => console.error('Ошибка загрузки:', img.src);
    });
    
    // Рекорд
    document.getElementById('highScore').textContent = highScore;
};