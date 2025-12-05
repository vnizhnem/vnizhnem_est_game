// ====================
// КОЗА В НИЖНЕМ - РАННЕР ВЕРСИЯ!
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
    <ellipse cx="50" cy="30" rx="45" ry="25" fill="#f8f8f8" stroke="#d4a574" stroke-width="3"/>
    <ellipse cx="35" cy="20" rx="8" ry="4" fill="rgba(255,255,255,0.6)"/>
</svg>
`);

// Отравленные пельмени (красные)
const BAD_PELMEN_IMG = new Image();
BAD_PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
    <ellipse cx="50" cy="30" rx="45" ry="25" fill="#ff6b6b" stroke="#d32f2f" stroke-width="3"/>
    <ellipse cx="35" cy="20" rx="8" ry="4" fill="rgba(255,255,255,0.6)"/>
</svg>
`);

// Игровые переменные
let score = 0;
let highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;
let lastJumpTime = 0;
let isSuperJump = false;

// КОЗА (бежит по земле)
const goat = {
    x: 100,
    y: canvas.height - 100, // Бежит по земле
    width: 60,
    height: 60,
    velocityY: 0,
    gravity: 1.2,
    jumpPower: -18,
    superJumpPower: -28,
    rotation: 0,
    isJumping: false,
    groundY: canvas.height - 100
};

// ЛАВОЧКИ (на земле)
const benches = [];
const BENCH = {
    width: 100,
    height: 60,
    gap: 250,
    speed: 5
};

// ПЕЛЬМЕНИ (летают)
const pelmeni = [];
const PELMEN = {
    width: 35,
    height: 20,
    goodPoints: 15,
    badPoints: -10,
    spawnChance: 0.6,
    goodHeight: 250,   // Высота обычных пельменей
    badHeight: 350     // Высота отравленных (выше)
};

// ЗЕМЛЯ
const ground = {
    x: 0,
    y: canvas.height - 50,
    height: 50,
    speed: 5
};

// ====================
// УПРАВЛЕНИЕ С ДВОЙНЫМ ТАПОМ
// ====================
let tapCount = 0;
let tapTimeout;

function handleTap(e) {
    if (e.type === 'touchstart') e.preventDefault();
    
    tapCount++;
    
    if (tapCount === 1) {
        tapTimeout = setTimeout(() => {
            // Одинарный тап
            if (!gameStarted) {
                startGame();
            } else if (!gameOver) {
                performJump(false);
            } else {
                resetGame();
            }
            tapCount = 0;
        }, 250);
    } else if (tapCount === 2) {
        clearTimeout(tapTimeout);
        // Двойной тап - супер-прыжок!
        if (gameStarted && !gameOver) {
            performJump(true);
        }
        tapCount = 0;
    }
}

function performJump(isSuper) {
    if (goat.isJumping) return;
    
    goat.isJumping = true;
    isSuperJump = isSuper;
    goat.velocityY = isSuper ? goat.superJumpPower : goat.jumpPower;
    lastJumpTime = Date.now();
}

// Обработчики
document.addEventListener('touchstart', handleTap, { passive: false });
document.addEventListener('click', handleTap);

// Клавиатура (пробел)
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else if (!gameOver) {
            performJump(e.repeat); // Зажатый пробел = супер-прыжок?
        } else {
            resetGame();
        }
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
    goat.y = goat.groundY;
    goat.velocityY = 0;
    goat.isJumping = false;
    isSuperJump = false;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    addBench();
    addPelmen();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
    goat.y = goat.groundY;
    goat.velocityY = 0;
    goat.isJumping = false;
    isSuperJump = false;
    
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('score').textContent = '0';
}

function addBench() {
    benches.push({
        x: canvas.width,
        y: ground.y - BENCH.height,
        width: BENCH.width,
        height: BENCH.height,
        passed: false
    });
}

function addPelmen() {
    // Обычный пельмень (хороший)
    if (Math.random() < PELMEN.spawnChance) {
        pelmeni.push({
            x: canvas.width + Math.random() * 100,
            y: canvas.height - PELMEN.goodHeight,
            width: PELMEN.width,
            height: PELMEN.height,
            isGood: true,
            collected: false,
            float: Math.random() * Math.PI * 2
        });
    }
    
    // Отравленный пельмень (плохой) - реже
    if (Math.random() < 0.3) {
        pelmeni.push({
            x: canvas.width + Math.random() * 100,
            y: canvas.height - PELMEN.badHeight,
            width: PELMEN.width,
            height: PELMEN.height,
            isGood: false,
            collected: false,
            float: Math.random() * Math.PI * 2
        });
    }
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    // ФИЗИКА КОЗЫ
    goat.velocityY += goat.gravity;
    goat.y += goat.velocityY;
    
    // Вращение для сальто
    if (isSuperJump) {
        goat.rotation += 0.3;
        if (goat.rotation > Math.PI * 2) goat.rotation = 0;
    } else {
        goat.rotation = goat.velocityY * 0.05;
    }
    
    // Приземление
    if (goat.y >= goat.groundY) {
        goat.y = goat.groundY;
        goat.velocityY = 0;
        goat.isJumping = false;
        isSuperJump = false;
        goat.rotation = 0;
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
            
            if (benches.length < 4) addBench();
        }
        
        // Удаление
        if (bench.x + bench.width < 0) benches.splice(i, 1);
        
        // КОЛЛИЗИЯ С ЛАВОЧКОЙ
        if (goat.x + goat.width - 20 > bench.x &&
            goat.x + 20 < bench.x + bench.width &&
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
        pelmen.float += 0.05;
        
        // Коллизия с пельменем
        if (!pelmen.collected &&
            goat.x + goat.width - 15 > pelmen.x &&
            goat.x + 15 < pelmen.x + pelmen.width &&
            goat.y + goat.height - 15 > pelmen.y &&
            goat.y + 15 < pelmen.y + pelmen.height) {
            
            pelmen.collected = true;
            
            if (pelmen.isGood) {
                score += PELMEN.goodPoints;
                // Эффект сбора
                pelmen.collectTime = Date.now();
            } else {
                score += PELMEN.badPoints;
                if (score < 0) score = 0;
                pelmen.collectTime = Date.now();
            }
            
            document.getElementById('score').textContent = score;
            
            setTimeout(() => {
                const index = pelmeni.indexOf(pelmen);
                if (index > -1) pelmeni.splice(index, 1);
            }, 300);
        }
        
        // Удаление
        if (pelmen.x + pelmen.width < -50) {
            pelmeni.splice(i, 1);
        }
    }
    
    // Автоматическое добавление
    if (frames % 100 === 0) addBench();
    if (frames % 80 === 0) addPelmen();
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
    
    // Земля
    ctx.drawImage(GROUND_IMG, ground.x, ground.y, canvas.width, ground.height);
    ctx.drawImage(GROUND_IMG, ground.x + canvas.width, ground.y, canvas.width, ground.height);
    
    // Лавочки
    benches.forEach(bench => {
        ctx.drawImage(PIPE_IMG, bench.x, bench.y, bench.width, bench.height);
    });
    
    // Пельмени
    pelmeni.forEach(pelmen => {
        if (!pelmen.collected) {
            ctx.save();
            ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2);
            ctx.rotate(pelmen.float * 0.5);
            
            if (pelmen.isGood) {
                ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            } else {
                ctx.drawImage(BAD_PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            }
            
            ctx.restore();
        } else {
            // Анимация сбора
            const timeSinceCollect = Date.now() - (pelmen.collectTime || 0);
            if (timeSinceCollect < 300) {
                const progress = timeSinceCollect / 300;
                const opacity = 1 - progress;
                const scale = 1 + progress;
                const yOffset = -progress * 30;
                
                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2 + yOffset);
                ctx.scale(scale, scale);
                
                if (pelmen.isGood) {
                    ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
                    
                    // Текст +15
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('+15', 0, -40);
                } else {
                    ctx.drawImage(BAD_PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
                    
                    // Текст -10
                    ctx.fillStyle = '#ff4444';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('-10', 0, -40);
                }
                
                ctx.restore();
            }
        }
    });
    
    // КОЗА
    ctx.save();
    ctx.translate(goat.x + goat.width/2, goat.y + goat.height/2);
    ctx.rotate(goat.rotation);
    
    // Если супер-прыжок - добавляем эффект
    if (isSuperJump) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
    }
    
    ctx.drawImage(BIRD_IMG, -goat.width/2, -goat.height/2, goat.width, goat.height);
    ctx.restore();
    
    // Индикатор супер-прыжка
    if (gameStarted && !gameOver && goat.isJumping && isSuperJump) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(goat.x + goat.width/2, goat.y + goat.height/2, 40, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('СУПЕР-ПРЫЖОК!', goat.x + goat.width/2, goat.y - 20);
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
        img.onerror = () => console.error('Ошибка:', img.src);
    });
    
    // Рекорд
    document.getElementById('highScore').textContent = highScore;
};