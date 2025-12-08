// ====================
// КОЗА В НИЖНЕМ - БЕЗ ШАУРМЫ, С КАКАШКАМИ И УСЛОЖНЕНИЯМИ!
// ====================

// Telegram Web App Detection
const isTelegram = typeof window.Telegram !== 'undefined' && window.Telegram.WebApp;

// Telegram variables
let tg = null;
let telegramUser = null;

if (isTelegram) {
    tg = window.Telegram.WebApp;
    telegramUser = tg.initDataUnsafe?.user;
    
    tg.expand();
    tg.setHeaderColor('#0a1538');
    tg.setBackgroundColor('#0a1538');
    tg.MainButton.setText('🔙 Закрыть игру');
    tg.MainButton.onClick(() => tg.close());
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Размеры канваса
function resizeCanvas() {
    const gameContainer = document.getElementById('game');
    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;
    
    ground.y = canvas.height - ground.height;
    
    if (!gameStarted || gameOver) {
        goat.y = canvas.height / 2;
    }
}

window.addEventListener('resize', resizeCanvas);

// Изображения
const BIRD_IMG = new Image();
BIRD_IMG.src = 'bird.png';
BIRD_IMG.onerror = function() {
    this.src = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#8B4513"/><circle cx="30" cy="40" r="10" fill="#8B4513"/><circle cx="70" cy="40" r="10" fill="#8B4513"/><ellipse cx="50" cy="70" rx="20" ry="15" fill="#8B4513"/><circle cx="40" cy="80" r="5" fill="#FFD700"/><circle cx="60" cy="80" r="5" fill="#FFD700"/><polygon points="40,25 45,15 50,25" fill="#FF0000"/><polygon points="50,25 55,15 60,25" fill="#FF0000"/></svg>`);
};

const PIPE_IMG = new Image();
PIPE_IMG.src = 'pipe.png';
PIPE_IMG.onerror = function() {
    this.src = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect x="0" y="0" width="100" height="60" fill="#8B4513"/><rect x="10" y="10" width="80" height="10" fill="#A0522D"/><rect x="20" y="25" width="60" height="10" fill="#A0522D"/></svg>`);
};

const BG_IMG = new Image();
BG_IMG.src = 'background.png';
BG_IMG.onerror = function() {
    this.src = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#87CEEB"/><stop offset="100%" style="stop-color:#1E90FF"/></linearGradient></defs><rect width="800" height="600" fill="url(#bg)"/><circle cx="100" cy="100" r="40" fill="#FFD700" opacity="0.8"/><circle cx="300" cy="150" r="30" fill="#FFD700" opacity="0.6"/></svg>`);
};

const GROUND_IMG = new Image();
GROUND_IMG.src = 'ground.png';
GROUND_IMG.onerror = function() {
    this.src = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 60"><defs><pattern id="grassPattern" width="50" height="60" patternUnits="userSpaceOnUse"><rect width="50" height="60" fill="#228B22"/><rect y="40" width="50" height="20" fill="#32CD32"/><circle cx="10" cy="45" r="3" fill="#228B22"/><circle cx="30" cy="48" r="2" fill="#228B22"/><circle cx="40" cy="46" r="4" fill="#228B22"/></pattern></defs><rect width="800" height="60" fill="url(#grassPattern)"/><rect y="55" width="800" height="5" fill="#1a5c1a"/></svg>`);
};

const PELMEN_IMG = new Image();
PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><ellipse cx="50" cy="30" rx="45" ry="25" fill="#FFD700" stroke="#b8860b" stroke-width="3"/></svg>`);

// 💩 Эмодзи какашки вместо птиц
const POOP_IMG = new Image();
POOP_IMG.src = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,20 C65,15 80,20 80,40 C80,60 65,75 50,80 C35,75 20,60 20,40 C20,20 35,15 50,20 Z" fill="#8B4513"/><ellipse cx="35" cy="45" rx="15" ry="10" fill="#A0522D"/><ellipse cx="65" cy="45" rx="15" ry="10" fill="#A0522D"/><ellipse cx="50" cy="60" rx="20" ry="12" fill="#A0522D"/></svg>`);

// ====================
// ИГРОВЫЕ ПЕРЕМЕННЫЕ
// ====================

let score = 0;
let highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;

// Система уровней - УСЛОЖНЕННАЯ
let currentLevel = 1;
let speedMultiplier = 1.0;
let levelUpEffect = 0;
let nextLevelAt = 150; // Быстрее переход на новый уровень

// Плавный старт
let startArcProgress = 0;
let isStartingArc = true;

// Счетчик столкновений с какашками (для банкротства)
let poopCollisions = 0;
let lastCollisionFrame = 0;

// Сложность игры
let gameDifficulty = {
    gravity: isTelegram ? 0.45 : 0.5,
    pipeGap: isTelegram ? 200 : 200,
    pipeMinY: 300,
    pipeMaxY: 450,
    birdSpawnChance: isTelegram ? 0.35 : 0.45,
    birdSpeed: isTelegram ? 2.5 : 3,
    pelmenSpawnChance: 0.6
};

// Коза
const goat = {
    x: 150,
    y: 300,
    width: isTelegram ? 45 : 50,
    height: isTelegram ? 45 : 50,
    velocity: 0,
    gravity: gameDifficulty.gravity,
    jumpStrength: isTelegram ? -9 : -8,
    rotation: 0,
    startY: 300,
    arcHeight: 100
};

// Лавочки
const BENCH = {
    width: 100,
    height: 60,
    gap: gameDifficulty.pipeGap,
    baseSpeed: isTelegram ? 2.8 : 3,
    minY: gameDifficulty.pipeMinY,
    maxY: gameDifficulty.pipeMaxY
};

// Пельмени - БАЗОВЫЕ значения
const PELMEN = {
    width: 35,
    height: 20,
    basePoints: 15, // УВЕЛИЧЕННЫЙ БАЗОВЫЙ БОНУС
    spawnChance: gameDifficulty.pelmenSpawnChance
};

// 💩 Какашки (вместо птиц) - БАЗОВЫЕ значения
const POOP = {
    width: 50,
    height: 50,
    basePoints: -30, // УВЕЛИЧЕННЫЙ БАЗОВЫЙ ШТРАФ
    baseSpawnChance: gameDifficulty.birdSpawnChance,
    baseSpeed: gameDifficulty.birdSpeed
};

// Земля
const ground = {
    x: 0,
    y: 540,
    height: 60,
    baseSpeed: isTelegram ? 2.8 : 3
};

// Массивы
const benches = [];
const pelmeni = [];
const poops = []; // Вместо enemyBirds

// ====================
// УСЛОЖНЕННЫЕ ФУНКЦИИ УРОВНЕЙ С ПРОПОРЦИОНАЛЬНОЙ СИСТЕМОЙ
// ====================

function getCurrentSpeed() {
    return ground.baseSpeed * speedMultiplier;
}

function getPoopSpawnChance() {
    // Быстрее растёт сложность
    return POOP.baseSpawnChance + (currentLevel - 1) * 0.15;
}

function getPoopSpeed() {
    // Больше прирост скорости
    return POOP.baseSpeed * (1 + (currentLevel - 1) * 0.3);
}

// УВЕЛИЧЕННЫЕ БОНУСЫ за уровень
function getPelmenPoints() {
    // На высоких уровнях пельмени дают НАМНОГО больше очков
    return PELMEN.basePoints + Math.floor((currentLevel - 1) * 8); // Быстрый рост
}

// УВЕЛИЧЕННЫЕ ШТРАФЫ за уровень
function getPoopPoints() {
    // На высоких уровнях какашки отнимают НАМНОГО больше очков
    return POOP.basePoints - Math.floor((currentLevel - 1) * 15); // Быстрый рост
}

function updateLevel() {
    if (score >= nextLevelAt) {
        currentLevel++;
        
        // Сильнее увеличиваем сложность
        speedMultiplier = 1.0 + (currentLevel - 1) * 0.3;
        
        // Увеличиваем гравитацию с уровнем
        goat.gravity = gameDifficulty.gravity * (1 + (currentLevel - 1) * 0.15);
        
        // Уменьшаем силу прыжка с уровнем
        goat.jumpStrength = (isTelegram ? -9 : -8) * (1 - (currentLevel - 1) * 0.08);
        
        nextLevelAt = 150 + (currentLevel - 1) * 100; // Быстрее растут требования
        
        levelUpEffect = 90;
        
        if (isTelegram && navigator.vibrate) {
            navigator.vibrate([150, 80, 150, 80, 150]);
        }
        
        // Добавляем внезапную какашку при переходе уровня
        if (Math.random() < 0.8) {
            addPoop();
        }
    }
}

// ====================
// ПЛАВНЫЙ СТАРТ С ДУГОЙ
// ====================

function updateStartArc() {
    if (!isStartingArc) return;
    
    startArcProgress += 0.008;
    
    if (startArcProgress >= 1) {
        isStartingArc = false;
        goat.velocity = 2;
        return;
    }
    
    const progress = startArcProgress;
    const parabolaProgress = progress * 2 - 1;
    const heightMultiplier = 1 - parabolaProgress * parabolaProgress;
    
    goat.y = goat.startY - goat.arcHeight * heightMultiplier;
    goat.rotation = -parabolaProgress * 0.3;
}

// ====================
// TELEGRAM FUNCTIONS
// ====================

function saveScoreToTelegram(userScore) {
    if (!isTelegram || !telegramUser) return;
    
    try {
        const userId = telegramUser.id;
        const storageKey = `tg_${userId}_best_score`;
        const currentBest = parseInt(localStorage.getItem(storageKey) || '0');
        
        if (userScore > currentBest) {
            localStorage.setItem(storageKey, userScore);
            
            const currentHighScoreEl = document.getElementById('currentHighScore');
            if (currentHighScoreEl) currentHighScoreEl.textContent = userScore;
            
            if (tg && tg.sendData) {
                tg.sendData(JSON.stringify({
                    action: 'save_score',
                    userId: userId,
                    username: telegramUser.username || telegramUser.first_name || 'Игрок',
                    score: userScore,
                    level: currentLevel,
                    timestamp: new Date().toISOString()
                }));
            }
            
            if (navigator.vibrate && userScore > 50) {
                navigator.vibrate([100, 50, 100]);
            }
        }
    } catch (error) {
        console.log('Error saving to Telegram:', error);
    }
}

function shareGameTelegram() {
    if (!isTelegram || !tg) return;
    
    const shareText = `🎮 Я достиг ${currentLevel} уровня и набрал ${score} очков в игре "Коза в Нижнем"! Сможешь побить? 💩`;
    
    try {
        if (tg.shareGame) {
            tg.shareGame({ title: 'Коза в Нижнем', text: shareText, url: 'https://t.me/vnizhnem_est' });
        } else {
            tg.openTelegramLink(`https://t.me/share/url?url=https://t.me/vnizhnem_est&text=${encodeURIComponent(shareText)}`);
        }
    } catch (error) {
        console.log('Error sharing game:', error);
    }
}

function openTelegramChannel() {
    if (!isTelegram || !tg) return;
    
    try {
        tg.openTelegramLink('https://t.me/vnizhnem_est');
    } catch (error) {
        console.log('Error opening channel:', error);
    }
}

// ====================
// УПРАВЛЕНИЕ
// ====================

function handleJump() {
    if (!gameStarted) {
        startGame();
    } else if (!gameOver) {
        if (isStartingArc) {
            isStartingArc = false;
            goat.velocity = goat.jumpStrength * 0.7;
        } else {
            goat.velocity = goat.jumpStrength;
        }
        
        if (isTelegram && navigator.vibrate) {
            navigator.vibrate(50);
        }
    } else {
        resetGame();
    }
}

function handleGameClick(e) {
    if (e.target.closest('.telegram-button') || e.target.closest('.telegram-footer') ||
        e.target.closest('.tg-share-button') || e.target.closest('.tg-channel-button') ||
        e.target.id === 'startBtn' || e.target.id === 'restartBtn' ||
        e.target.id === 'tgShareBtn' || e.target.id === 'tgChannelBtn') {
        return;
    }
    
    handleJump();
}

document.addEventListener('click', handleGameClick);
document.addEventListener('touchstart', function(e) {
    if (e.target.closest('.telegram-button') || e.target.closest('.telegram-footer') ||
        e.target.closest('.tg-share-button') || e.target.closest('.tg-channel-button') ||
        e.target.id === 'startBtn' || e.target.id === 'restartBtn' ||
        e.target.id === 'tgShareBtn' || e.target.id === 'tgChannelBtn') {
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

// ====================
// ИГРОВАЯ ЛОГИКА (УСЛОЖНЕННАЯ С ПРОПОРЦИОНАЛЬНОЙ СИСТЕМОЙ)
// ====================

function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    currentLevel = 1;
    speedMultiplier = 1.0;
    levelUpEffect = 0;
    nextLevelAt = 150;
    startArcProgress = 0;
    isStartingArc = true;
    poopCollisions = 0; // Сброс счетчика столкновений
    lastCollisionFrame = 0;
    
    // Сброс сложности
    goat.gravity = gameDifficulty.gravity;
    goat.jumpStrength = isTelegram ? -9 : -8;
    
    benches.length = 0;
    pelmeni.length = 0;
    poops.length = 0;
    
    goat.y = canvas.height / 2;
    goat.startY = canvas.height / 2;
    goat.velocity = 0;
    goat.rotation = 0;
    
    frames = 0;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    resizeCanvas();
    
    if (isTelegram && tg && tg.MainButton) {
        tg.MainButton.show();
    }
    
    gameLoop();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    currentLevel = 1;
    speedMultiplier = 1.0;
    levelUpEffect = 0;
    nextLevelAt = 150;
    isStartingArc = false;
    poopCollisions = 0;
    lastCollisionFrame = 0;
    
    // Сброс сложности
    goat.gravity = gameDifficulty.gravity;
    goat.jumpStrength = isTelegram ? -9 : -8;
    
    benches.length = 0;
    pelmeni.length = 0;
    poops.length = 0;
    
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    goat.rotation = 0;
    
    resizeCanvas();
    
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('score').textContent = '0';
    
    if (isTelegram && telegramUser) {
        const userId = telegramUser.id;
        const storageKey = `tg_${userId}_best_score`;
        const telegramBestScore = localStorage.getItem(storageKey) || 0;
        document.getElementById('currentHighScore').textContent = telegramBestScore;
    } else {
        document.getElementById('currentHighScore').textContent = highScore;
    }
}

function addBench() {
    const benchHeight = BENCH.height + (currentLevel - 1) * 5; // Лавочки растут с уровнем
    
    benches.push({
        x: canvas.width,
        y: ground.y - benchHeight,
        width: BENCH.width,
        height: benchHeight,
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
        type: 'good',
        points: getPelmenPoints() // Динамические очки
    });
}

function addPoop() {
    // Сложнее траектория - иногда летят прямо на игрока
    let targetY = goat.y;
    if (Math.random() < 0.4) {
        targetY = goat.y + (Math.random() * 100 - 50);
    } else {
        targetY = Math.random() * (canvas.height - 200) + 100;
    }
    
    poops.push({
        x: canvas.width + 50,
        y: targetY,
        width: POOP.width,
        height: POOP.height,
        hit: false,
        float: Math.random() * Math.PI * 2,
        type: 'bad',
        points: getPoopPoints(), // Динамический штраф
        speed: getPoopSpeed() + Math.random() * 1.0, // Более случайная скорость
        wave: Math.random() * Math.PI * 2,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.2 // Вращение какашки
    });
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    // Обновляем стартовую дугу
    if (isStartingArc) {
        updateStartArc();
        return;
    }
    
    // Обновляем уровень
    updateLevel();
    
    if (levelUpEffect > 0) levelUpEffect--;
    
    // НОВОЕ: Проверка на банкротство - смерть при 0 очков после частых столкновений
    if (score <= 0 && poopCollisions >= 3 && (frames - lastCollisionFrame) < 180) {
        gameOver = true;
        endGame("БАНКРОТ! 💸\nСлишком много какашек при нуле очков!");
        return;
    }
    
    // Сброс счетчика столкновений, если игрок заработал очки
    if (score > 50) {
        poopCollisions = Math.max(0, poopCollisions - 1);
    }
    
    // Физика козы
    goat.velocity += goat.gravity;
    goat.y += goat.velocity;
    
    goat.rotation = goat.velocity * 0.1;
    if (goat.rotation > 0.5) goat.rotation = 0.5;
    if (goat.rotation < -0.5) goat.rotation = -0.5;
    
    if (goat.y < 20) {
        goat.y = 20;
        goat.velocity = 0;
    }
    
    const currentSpeed = getCurrentSpeed();
    ground.x -= currentSpeed;
    if (ground.x <= -canvas.width) ground.x = 0;
    
    // Лавочки
    for (let i = benches.length - 1; i >= 0; i--) {
        const bench = benches[i];
        bench.x -= currentSpeed;
        
        if (!bench.passed && bench.x + bench.width < goat.x) {
            bench.passed = true;
            score += 5;
            document.getElementById('score').textContent = score;
            
            if (benches.length < 3) addBench();
        }
        
        if (bench.x + bench.width < 0) benches.splice(i, 1);
        
        // Столкновение с лавочкой
        if (goat.x + goat.width > bench.x &&
            goat.x < bench.x + bench.width &&
            goat.y + goat.height > bench.y &&
            goat.y < bench.y + bench.height) {
            gameOver = true;
            endGame("УПАЛ НА ЛАВОЧКУ! 🪑");
            return;
        }
    }
    
    // Пельмени
    for (let i = pelmeni.length - 1; i >= 0; i--) {
        const pelmen = pelmeni[i];
        pelmen.x -= currentSpeed;
        pelmen.float += 0.05;
        
        if (!pelmen.collected &&
            goat.x + goat.width - 10 > pelmen.x &&
            goat.x + 10 < pelmen.x + pelmen.width &&
            goat.y + goat.height - 10 > pelmen.y &&
            goat.y + 10 < pelmen.y + pelmen.height) {
            
            pelmen.collected = true;
            const points = pelmen.points;
            score += points;
            pelmen.effect = '+' + points;
            pelmen.effectTime = frames;
            
            document.getElementById('score').textContent = score;
            
            if (isTelegram && navigator.vibrate && score % 50 === 0) {
                navigator.vibrate([30, 30, 30]);
            }
        }
        
        if (pelmen.x + pelmen.width < -50) pelmeni.splice(i, 1);
    }
    
    // 💩 Какашки
    for (let i = poops.length - 1; i >= 0; i--) {
        const poop = poops[i];
        poop.x -= poop.speed;
        poop.float += 0.1;
        poop.wave += 0.05;
        poop.y += Math.sin(poop.wave) * 2;
        poop.rotation += poop.rotationSpeed;
        
        // Столкновение с какашкой
        if (!poop.hit &&
            goat.x + goat.width - 15 > poop.x &&
            goat.x + 15 < poop.x + poop.width &&
            goat.y + goat.height - 15 > poop.y &&
            goat.y + 15 < poop.y + poop.height) {
            
            poop.hit = true;
            const points = poop.points;
            score += points;
            if (score < 0) score = 0;
            poop.effect = points;
            poop.effectTime = frames;
            
            // Увеличиваем счетчик столкновений
            poopCollisions++;
            lastCollisionFrame = frames;
            
            // Эффект отталкивания при попадании
            goat.velocity = -10;
            
            document.getElementById('score').textContent = score;
            
            if (isTelegram && navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        }
        
        if (poop.x + poop.width < -100) poops.splice(i, 1);
    }
    
    // Смерть от падения или вылета вверх
    if (goat.y + goat.height > ground.y || goat.y < -50) {
        gameOver = true;
        endGame(goat.y < -50 ? "УЛЕТЕЛ В КОСМОС! 🚀" : "УПАЛ НА ЗЕМЛЮ! 💥");
        return;
    }
    
    // УСЛОЖНЕННАЯ СИСТЕМА СПАВНА
    const spawnInterval = Math.max(50, 90 - (currentLevel - 1) * 12); // Быстрее спавн
    
    if (frames % spawnInterval === 0) {
        addBench();
        
        // Меньше пельменей с повышением уровня
        if (Math.random() < (PELMEN.spawnChance - (currentLevel - 1) * 0.08)) {
            addPelmen();
        }
        
        // Больше какашек с повышением уровня
        if (Math.random() < getPoopSpawnChance()) {
            addPoop();
        }
    }
    
    // Иногда спавним дополнительную какашку
    if (frames % Math.max(30, 50 - (currentLevel - 1) * 8) === 0 && Math.random() < 0.5) {
        addPoop();
    }
}

function endGame(reason = "ИГРА ОКОНЧЕНА!") {
    gameOver = true;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('goatHighScore', highScore);
    }
    
    if (isTelegram && telegramUser) saveScoreToTelegram(score);
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = Math.max(highScore, 
        isTelegram && telegramUser ? localStorage.getItem(`tg_${telegramUser.id}_best_score`) || 0 : highScore
    );
    
    document.getElementById('gameOverScreen').style.display = 'flex';
    
    // Добавляем причину проигрыша
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen && !gameOverScreen.querySelector('.death-reason')) {
        const reasonElement = document.createElement('div');
        reasonElement.className = 'death-reason';
        reasonElement.innerHTML = `<p style="color:#FF4500; font-size:22px; margin-top:15px; font-weight:bold;">${reason}</p>`;
        
        const finalScores = gameOverScreen.querySelector('.final-scores');
        if (finalScores) finalScores.after(reasonElement);
    }
    
    // Добавляем информацию об уровне и статистику
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen && !gameOverScreen.querySelector('.level-info')) {
        const levelInfo = document.createElement('div');
        levelInfo.className = 'level-info';
        levelInfo.innerHTML = `
            <p style="color:#FFD700; font-size:20px; margin-top:10px;">🏆 Достигнут уровень: ${currentLevel}</p>
            <p style="color:#8B4513; font-size:16px; margin-top:5px;">Избежано какашек: ${Math.floor(score/25)}</p>
            <p style="color:#FF4500; font-size:16px; margin-top:5px;">Столкновений с какашками: ${poopCollisions}</p>
            ${currentLevel >= 2 ? `<p style="color:#32CD32; font-size:14px; margin-top:5px;">Бонус за уровень: +${getPelmenPoints()} очков/пельмень</p>` : ''}
            ${currentLevel >= 3 ? `<p style="color:#FF0000; font-size:14px; margin-top:5px;">Штраф за уровень: ${getPoopPoints()} очков/какашка</p>` : ''}
        `;
        
        const reasonElement = gameOverScreen.querySelector('.death-reason') || gameOverScreen.querySelector('.final-scores');
        if (reasonElement) reasonElement.after(levelInfo);
    }
    
    if (isTelegram && navigator.vibrate) {
        navigator.vibrate([300, 100, 300]);
    }
    
    const tgButtons = document.querySelector('.tg-buttons');
    if (tgButtons) tgButtons.style.display = 'flex';
}

// ====================
// ОТРИСОВКА
// ====================

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон с эффектом уровня
    if (levelUpEffect > 0 && levelUpEffect % 10 < 5) {
        ctx.fillStyle = 'rgba(139, 69, 19, 0.15)'; // Коричневый вместо золотого
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.drawImage(BG_IMG, 0, 0, canvas.width, canvas.height);
    
    // Пельмени
    pelmeni.forEach(pelmen => {
        if (!pelmen.collected) {
            ctx.save();
            ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2);
            ctx.rotate(Math.sin(pelmen.float) * 0.2);
            ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            
            // Показываем стоимость пельменя на высоких уровнях
            if (currentLevel >= 2) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`+${pelmen.points}`, 0, -25);
            }
            
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
    
    // 💩 Какашки
    poops.forEach(poop => {
        ctx.save();
        ctx.translate(poop.x + poop.width/2, poop.y + poop.height/2);
        ctx.rotate(poop.rotation);
        
        // Мерцающий эффект для опасных какашек
        if (Math.sin(poop.float * 3) > 0) {
            ctx.shadowColor = '#8B4513';
            ctx.shadowBlur = 15;
        }
        
        // Пульсация
        const scale = 0.9 + Math.abs(Math.sin(poop.float)) * 0.2;
        ctx.scale(scale, scale);
        ctx.drawImage(POOP_IMG, -poop.width/2, -poop.height/2, poop.width, poop.height);
        
        // Показываем штраф на высоких уровнях
        if (currentLevel >= 3) {
            ctx.fillStyle = '#8B4513';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${poop.points}`, 0, -30);
        }
        
        ctx.restore();
        
        if (poop.effect) {
            const age = frames - poop.effectTime;
            if (age < 30) {
                ctx.save();
                ctx.globalAlpha = 1 - age / 30;
                ctx.fillStyle = '#8B4513';
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                
                // Эмодзи какашки рядом с текстом
                ctx.fillText(`💩 ${poop.effect}`, poop.x + poop.width/2, poop.y - age - 10);
                ctx.restore();
            }
        }
    });
    
    // Земля
    for (let i = 0; i <= Math.ceil(canvas.width / canvas.width) + 1; i++) {
        ctx.drawImage(GROUND_IMG, ground.x + i * canvas.width, ground.y, canvas.width + 2, ground.height);
    }
    
    // Лавочки
    benches.forEach(bench => {
        ctx.drawImage(PIPE_IMG, bench.x, bench.y, bench.width, bench.height);
    });
    
    // Коза
    ctx.save();
    ctx.translate(goat.x + goat.width/2, goat.y + goat.height/2);
    ctx.rotate(goat.rotation);
    ctx.drawImage(BIRD_IMG, -goat.width/2, -goat.height/2, goat.width, goat.height);
    
    // Telegram корона
    if (isTelegram && telegramUser && score > 100) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', 0, -40);
    }
    
    ctx.restore();
    
    // ====================
    // ИНФОРМАЦИЯ ОБ УРОВНЕ И СЛОЖНОСТИ
    // ====================
    const infoHeight = 70; // Увеличили высоту для дополнительной информации
    const infoY = canvas.height - infoHeight - 10;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width - 180, infoY, 170, infoHeight);
    ctx.strokeStyle = '#8B4513'; // Коричневый
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width - 180, infoY, 170, infoHeight);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Уровень: ${currentLevel}`, canvas.width - 170, infoY + 15);
    
    ctx.fillStyle = currentLevel >= 4 ? '#FF4500' : '#00FF00';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Скорость: x${speedMultiplier.toFixed(2)}`, canvas.width - 170, infoY + 35);
    
    // Показываем бонусы/штрафы
    if (currentLevel >= 2) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Пельмени: +${getPelmenPoints()}`, canvas.width - 170, infoY + 55);
    }
    
    if (currentLevel >= 3) {
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Какашки: ${getPoopPoints()}`, canvas.width - 170, infoY + 75);
    }
    
    // Подсказка во время стартовой дуги
    if (isStartingArc) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const pulse = Math.sin(frames * 0.1) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
        
        ctx.fillText('ЛОВИ РИТМ!', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Избегай какашек 💩', canvas.width / 2, canvas.height / 2);
        ctx.fillText('и собирай пельмени!', canvas.width / 2, canvas.height / 2 + 40);
        
        const progressWidth = 300;
        const progressX = (canvas.width - progressWidth) / 2;
        const progressY = canvas.height / 2 + 80;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(progressX, progressY, progressWidth, 10);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(progressX, progressY, progressWidth * startArcProgress, 10);
        
        ctx.restore();
    }
    
    // Эффект перехода уровня
    if (levelUpEffect > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, levelUpEffect / 30);
        
        // Разные сообщения для разных уровней
        let levelMessage = `УРОВЕНЬ ${currentLevel}!`;
        let bonusMessage = "";
        
        if (currentLevel >= 4) {
            levelMessage = `💀 УРОВЕНЬ ${currentLevel}!`;
            bonusMessage = `Штраф: ${getPoopPoints()} очков!`;
            ctx.fillStyle = '#FF4500';
        } else if (currentLevel >= 2) {
            bonusMessage = `Бонус: +${getPelmenPoints()} очков!`;
            ctx.fillStyle = '#FFD700';
        } else {
            ctx.fillStyle = '#FFD700';
        }
        
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(levelMessage, canvas.width / 2, canvas.height / 4);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`Скорость +30%`, canvas.width / 2, canvas.height / 4 + 40);
        
        if (bonusMessage) {
            ctx.fillText(bonusMessage, canvas.width / 2, canvas.height / 4 + 70);
        }
        
        // На высоких уровнях предупреждение о какашках
        if (currentLevel >= 3) {
            ctx.fillText(`Какашек стало больше!`, canvas.width / 2, canvas.height / 4 + 100);
        }
        
        ctx.restore();
    }
    
    // Предупреждение о высокой сложности
    if (currentLevel >= 5) {
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(frames * 0.2) * 0.2;
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💀 ВЫСОКАЯ СЛОЖНОСТЬ!', canvas.width / 2, 60);
        
        // Предупреждение о банкротстве
        if (score <= 50) {
            ctx.fillStyle = '#FF4500';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`Осторожно! Меньше ${50 - score} до банкротства!`, canvas.width / 2, 90);
        }
        
        ctx.restore();
    }
    
    // НОВОЕ: Предупреждение о низком счете и частых столкновениях
    if (score <= 30 && score > 0) {
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(frames * 0.1) * 0.2;
        ctx.fillStyle = '#FF4500';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️ НИЗКИЙ СЧЕТ: ${score}`, canvas.width / 2, 120);
        ctx.fillText(`Столкновений: ${poopCollisions}/3`, canvas.width / 2, 150);
        ctx.restore();
    }
}

// Игровой цикл
function gameLoop() {
    update();
    draw();
    
    if (gameStarted && !gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// ====================
// ИНИЦИАЛИЗАЦИЯ И ПРИВЯЗКА КНОПОК
// ====================

function initializeGame() {
    highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
    
    if (isTelegram && telegramUser) {
        const userId = telegramUser.id;
        const telegramBestScore = localStorage.getItem(`tg_${userId}_best_score`) || 0;
        document.getElementById('currentHighScore').textContent = telegramBestScore;
    } else {
        document.getElementById('currentHighScore').textContent = highScore;
    }
    
    resizeCanvas();
    draw();
    
    if (isTelegram && tg && tg.MainButton) {
        tg.MainButton.show();
    }
    
    // Привязка кнопок
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    } else {
        console.error('Кнопка startBtn не найдена!');
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', resetGame);
    }
    
    // Telegram buttons
    const shareBtn = document.getElementById('tgShareBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareGameTelegram);
    
    const channelBtn = document.getElementById('tgChannelBtn');
    if (channelBtn) channelBtn.addEventListener('click', openTelegramChannel);
    
    console.log('Game loaded with enhanced level system and bankruptcy mechanics!');
}

// Запуск инициализации при загрузке страницы
window.addEventListener('load', initializeGame);

// Export functions for Telegram
if (isTelegram) {
    window.shareGameTelegram = shareGameTelegram;
    window.openTelegramChannel = openTelegramChannel;
    window.saveScoreToTelegram = saveScoreToTelegram;
}