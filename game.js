// ====================
// КОЗА В НИЖНЕМ - БАЛАНСИРОВАННАЯ ВЕРСИЯ
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

// ОПАСНЫЕ пельмени (красные, у потолка)
const BAD_PELMEN_IMG = new Image();
BAD_PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
    <ellipse cx="50" cy="30" rx="45" ry="25" fill="#ff4444" stroke="#cc0000" stroke-width="3"/>
    <ellipse cx="35" cy="20" rx="8" ry="4" fill="rgba(255,255,255,0.8)"/>
    <path d="M25,40 L35,50 L45,40" stroke="#fff" stroke-width="3" fill="none"/>
    <path d="M55,40 L65,50 L75,40" stroke="#fff" stroke-width="3" fill="none"/>
</svg>
`);

// Игровые переменные
let score = 0;
let highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;

// Для двойного тапа
let lastTapTime = 0;
let tapCount = 0;

// КОЗА
const goat = {
    x: 150,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.5,
    jumpStrength: -9,
    superJumpStrength: -15, // Сильнее при двойном тапе
    rotation: 0,
    maxJumpHeight: 100, // Максимум (красные пельмени будут чуть выше)
    isAtCeiling: false
};

// ЛАВОЧКИ (снизу)
const benches = [];
const BENCH = {
    width: 100,
    height: 60,
    gap: 200,
    speed: 3,
    minY: 400,
    maxY: 500
};

// ПЕЛЬМЕНИ
const pelmeni = [];
const PELMEN = {
    width: 35,
    height: 20,
    goodPoints: 10,
    badPoints: -20,
    goodSpawnChance: 0.7,
    badSpawnChance: 0.4,
    goodMinY: 200,   // Золотые - в средней зоне
    goodMaxY: 400,
    badMinY: 50,     // Красные - у самого потолка
    badMaxY: 120
};

// ЗЕМЛЯ
const ground = {
    x: 0,
    y: canvas.height - 50,
    height: 50,
    speed: 3
};

// ====================
// УПРАВЛЕНИЕ С ДВОЙНЫМ ТАПОМ
// ====================
function handleTap(e) {
    if (e.type === 'touchstart') e.preventDefault();
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastTapTime;
    
    tapCount++;
    
    if (tapCount === 1) {
        lastTapTime = currentTime;
        
        setTimeout(() => {
            if (tapCount === 1) {
                // ОДИНАРНЫЙ ТАП
                if (!gameStarted) {
                    startGame();
                } else if (!gameOver) {
                    goat.velocity = goat.jumpStrength;
                } else {
                    resetGame();
                }
            }
            tapCount = 0;
        }, 300);
        
    } else if (tapCount === 2 && timeDiff < 300) {
        // ДВОЙНОЙ ТАП (быстрый!)
        tapCount = 0;
        
        if (gameStarted && !gameOver) {
            goat.velocity = goat.superJumpStrength;
            // Эффект двойного тапа
            showDoubleTapEffect(goat.x, goat.y);
        }
    }
}

// Эффект двойного тапа
function showDoubleTapEffect(x, y) {
    const effect = {
        x: x,
        y: y,
        radius: 20,
        alpha: 0.8,
        life: 30
    };
    
    function animateEffect() {
        if (effect.life > 0) {
            effect.radius += 2;
            effect.alpha -= 0.05;
            effect.life--;
            setTimeout(animateEffect, 16);
        }
    }
    animateEffect();
    
    // Сохраняем для отрисовки
    if (!window.effects) window.effects = [];
    window.effects.push(effect);
}

// Обработчики
document.addEventListener('touchstart', handleTap, { passive: false });
document.addEventListener('click', handleTap);

// Клавиатура
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        handleTap(e);
    }
});

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
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    goat.isAtCeiling = false;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    addBench();
    addPelmeni();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    goat.isAtCeiling = false;
    
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('score').textContent = '0';
}

function addBench() {
    const y = Math.random() * (BENCH.maxY - BENCH.minY) + BENCH.minY;
    benches.push({
        x: canvas.width,
        y: y,
        width: BENCH.width,
        height: BENCH.height,
        passed: false
    });
}

function addPelmeni() {
    // ЗОЛОТЫЕ пельмени (хорошие)
    if (Math.random() < PELMEN.goodSpawnChance) {
        pelmeni.push({
            x: canvas.width + Math.random() * 150,
            y: Math.random() * (PELMEN.goodMaxY - PELMEN.goodMinY) + PELMEN.goodMinY,
            width: PELMEN.width,
            height: PELMEN.height,
            isGood: true,
            collected: false,
            float: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.5
        });
    }
    
    // КРАСНЫЕ пельмени (опасные, у потолка)
    if (Math.random() < PELMEN.badSpawnChance) {
        pelmeni.push({
            x: canvas.width + Math.random() * 200,
            y: Math.random() * (PELMEN.badMaxY - PELMEN.badMinY) + PELMEN.badMinY,
            width: PELMEN.width,
            height: PELMEN.height,
            isGood: false,
            collected: false,
            float: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.3,
            warning: true // Мигает как предупреждение
        });
    }
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
    
    // ПОТОЛОК (с красными пельменями!)
    if (goat.y < goat.maxJumpHeight) {
        goat.y = goat.maxJumpHeight;
        goat.velocity = 0;
        goat.isAtCeiling = true;
    } else {
        goat.isAtCeiling = false;
    }
    
    // Движение земли
    ground.x -= ground.speed;
    if (ground.x <= -canvas.width) ground.x = 0;
    
    // ЛАВОЧКИ
    for (let i = benches.length - 1; i >= 0; i--) {
        const bench = benches[i];
        bench.x -= BENCH.speed;
        
        // Прохождение
        if (!bench.passed && bench.x + bench.width < goat.x) {
            bench.passed = true;
            score += 5;
            document.getElementById('score').textContent = score;
            
            if (benches.length < 3) addBench();
        }
        
        // Удаление
        if (bench.x + bench.width < 0) benches.splice(i, 1);
        
        // КОЛЛИЗИЯ
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
        
        // Движение и анимация
        pelmen.float += pelmen.speed * 0.05;
        pelmen.x -= BENCH.speed;
        
        // Мигание для красных пельменей
        if (!pelmen.isGood) {
            pelmen.warning = Math.sin(frames * 0.1) > 0;
        }
        
        // КОЛЛИЗИЯ С ПЕЛЬМЕНЕМ
        if (!pelmen.collected &&
            goat.x + goat.width - 10 > pelmen.x &&
            goat.x + 10 < pelmen.x + pelmen.width &&
            goat.y + goat.height - 10 > pelmen.y &&
            goat.y + 10 < pelmen.y + pelmen.height) {
            
            pelmen.collected = true;
            
            if (pelmen.isGood) {
                score += PELMEN.goodPoints;
                pelmen.effect = '+10';
                pelmen.effectColor = '#FFD700';
            } else {
                score += PELMEN.badPoints;
                if (score < 0) score = 0;
                pelmen.effect = '-20';
                pelmen.effectColor = '#ff4444';
            }
            
            document.getElementById('score').textContent = score;
            
            // Удаляем через время
            setTimeout(() => {
                const index = pelmeni.indexOf(pelmen);
                if (index > -1) pelmeni.splice(index, 1);
            }, 400);
        }
        
        // Удаление
        if (pelmen.x + pelmen.width < -50) {
            pelmeni.splice(i, 1);
        }
    }
    
    // ЗЕМЛЯ
    if (goat.y + goat.height > ground.y) {
        goat.y = ground.y - goat.height;
        gameOver = true;
        endGame();
    }
    
    // Автоматическое добавление
    if (frames % 120 === 0) addBench();
    if (frames % 90 === 0) addPelmeni();
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
    
    // КРАСНАЯ ЗОНА ОПАСНОСТИ (у потолка)
    if (gameStarted && !gameOver) {
        ctx.fillStyle = 'rgba(255, 50, 50, 0.15)';
        ctx.fillRect(0, 0, canvas.width, goat.maxJumpHeight + 50);
        
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(0, goat.maxJumpHeight + 50);
        ctx.lineTo(canvas.width, goat.maxJumpHeight + 50);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // ЛАВОЧКИ
    benches.forEach(bench => {
        ctx.drawImage(PIPE_IMG, bench.x, bench.y, bench.width, bench.height);
    });
    
    // ПЕЛЬМЕНИ
    pelmeni.forEach(pelmen => {
        if (!pelmen.collected) {
            ctx.save();
            ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2);
            ctx.rotate(pelmen.float * 0.3);
            
            if (pelmen.isGood) {
                // Золотой пельмень
                ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            } else {
                // Красный пельмень (мигает)
                if (!pelmen.warning) {
                    ctx.globalAlpha = 0.6;
                }
                ctx.drawImage(BAD_PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            }
            
            ctx.restore();
        } else {
            // Эффект сбора
            if (pelmen.effect) {
                ctx.save();
                ctx.translate(pelmen.x + pelmen.width/2, pelmen.y - 20);
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = pelmen.effectColor;
                ctx.font = 'bold 22px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(pelmen.effect, 0, 0);
                ctx.restore();
            }
        }
    });
    
    // Эффекты двойного тапа
    if (window.effects) {
        window.effects = window.effects.filter(effect => {
            if (effect.life > 0) {
                ctx.save();
                ctx.globalAlpha = effect.alpha;
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                return true;
            }
            return false;
        });
    }
    
    // ЗЕМЛЯ
    ctx.drawImage(GROUND_IMG, ground.x, ground.y, canvas.width, ground.height);
    ctx.drawImage(GROUND_IMG, ground.x + canvas.width, ground.y, canvas.width, ground.height);
    
    // КОЗА
    ctx.save();
    ctx.translate(goat.x + goat.width / 2, goat.y + goat.height / 2);
    ctx.rotate(goat.rotation);
    
    // Если у потолка - красный оттенок
    if (goat.isAtCeiling) {
        ctx.filter = 'brightness(1.3) saturate(1.5)';
    }
    
    ctx.drawImage(BIRD_IMG, -goat.width / 2, -goat.height / 2, goat.width, goat.height);
    ctx.restore();
    
    // ПОДСКАЗКА ПРО ДВОЙНОЙ ТАП
    if (gameStarted && !gameOver && frames % 120 < 60) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👆👆 Двойной тап для рывка вверх!', canvas.width/2, 40);
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
    [BIRD_IMG, PIPE_IMG, BG_IMG, GROUND_IMG, PELMEN_IMG, BAD_PELMEN_IMG].forEach(img => {
        img.onload = () => console.log('Изображение загружено');
    });
    
    // Рекорд
    document.getElementById('highScore').textContent = highScore;
};