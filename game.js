// ====================
// КОЗА В НИЖНЕМ - С КАКАШКАМИ И МОНЕТКАМИ!
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

// МОНЕТКИ с РУБЛЯМИ ₽
const COIN_IMG = new Image();
COIN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FFD700"/><circle cx="50" cy="50" r="40" fill="#FFA500"/><circle cx="50" cy="50" r="30" fill="#FFD700"/><text x="50" y="55" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="30" fill="#8B4513">₽</text></svg>`);

// 💩 Какашки
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

// Система уровней
let currentLevel = 1;
let speedMultiplier = 1.0;
let levelUpEffect = 0;
let nextLevelAt = 150;

// Плавный старт
let startArcProgress = 0;
let isStartingArc = true;

// СИСТЕМА ЖИЗНЕЙ
let lives = 3;
let maxLives = 3;
let lifeRegenInterval = 150;
let lastLifeGainScore = 0;
let poopHits = 0;
let hitsToLoseLife = 4;

// СИСТЕМА ЗАЩИТЫ И КОМБО
let defense = 0; // % защиты от урона (0-50%)
let comboMultiplier = 1.0; // Множитель за комбо
let coinsCollectedWithoutHit = 0; // Монеток собрано без столкновения
let comboTime = 0; // Время действия комбо

// Сложность игры
let gameDifficulty = {
    gravity: isTelegram ? 0.45 : 0.5,
    pipeGap: isTelegram ? 200 : 200,
    pipeMinY: 300,
    pipeMaxY: 450,
    birdSpawnChance: isTelegram ? 0.35 : 0.45,
    birdSpeed: isTelegram ? 2.5 : 3,
    coinSpawnChance: 0.6
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

// МОНЕТКИ с рублями
const COIN = {
    width: 35,
    height: 35,
    basePoints: 15,
    spawnChance: gameDifficulty.coinSpawnChance
};

// Какашки
const POOP = {
    width: 50,
    height: 50,
    basePoints: -30,
    baseSpawnChance: gameDifficulty.birdSpawnChance,
    baseSpeed: gameDifficulty.birdSpeed,
    maxDamage: -50 // Максимальный урон
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
const coins = [];
const poops = [];

// ====================
// БАЛАНСНЫЕ ФУНКЦИИ
// ====================

function getCurrentSpeed() {
    return ground.baseSpeed * speedMultiplier;
}

function getPoopSpawnChance() {
    // Медленнее растет частота спавна
    return POOP.baseSpawnChance + (currentLevel - 1) * 0.1;
}

function getPoopSpeed() {
    return POOP.baseSpeed * (1 + (currentLevel - 1) * 0.2);
}

function getCoinPoints() {
    // Увеличиваем награду за монетки на 20% за уровень
    const base = COIN.basePoints;
    const levelBonus = 1 + (currentLevel - 1) * 0.2;
    const comboBonus = comboMultiplier;
    return Math.floor(base * levelBonus * comboBonus);
}

function getPoopPoints() {
    // БАЛАНС: урон растет медленнее и имеет защиту
    const baseDamage = POOP.basePoints;
    const levelMultiplier = 1 + (currentLevel - 1) * 0.08; // +8% за уровень вместо +50%
    const damage = baseDamage * levelMultiplier;
    
    // Защита: каждый 3 уровень уменьшает урон на 10%
    const defenseBonus = Math.floor(currentLevel / 3) * 0.1;
    const finalDamage = damage * (1 - defenseBonus);
    
    // Ограничиваем максимальный урон
    return Math.max(POOP.maxDamage, Math.floor(finalDamage));
}

function getHitsToLoseLife() {
    // Увеличиваем живучесть на высоких уровнях
    if (score < 100) return 4;
    if (score < 300) return 5;
    if (score < 600) return 6;
    if (score < 1000) return 7;
    return 8;
}

function updateLevel() {
    if (score >= nextLevelAt) {
        currentLevel++;
        
        // Более мягкий рост скорости
        speedMultiplier = 1.0 + (currentLevel - 1) * 0.25;
        
        // Меньше увеличиваем гравитацию
        goat.gravity = gameDifficulty.gravity * (1 + (currentLevel - 1) * 0.1);
        
        // Сохраняем силу прыжка
        goat.jumpStrength = (isTelegram ? -9 : -8) * (1 - (currentLevel - 1) * 0.05);
        
        nextLevelAt = 150 + (currentLevel - 1) * 120;
        levelUpEffect = 90;
        
        // Награда за уровень: дополнительная жизнь каждые 3 уровень
        if (currentLevel % 3 === 0 && lives < maxLives) {
            lives++;
            lifeGainEffect = 60;
        }
        
        if (isTelegram && navigator.vibrate) {
            navigator.vibrate([150, 80, 150, 80, 150]);
        }
        
        // Не спавним какашку при переходе уровня
    }
}

// ====================
// СИСТЕМА КОМБО И ЗАЩИТЫ
// ====================

function updateComboSystem() {
    // Уменьшаем время комбо
    if (comboTime > 0) {
        comboTime--;
        if (comboTime === 0) {
            comboMultiplier = 1.0;
            coinsCollectedWithoutHit = 0;
        }
    }
    
    // Обновляем защиту
    defense = Math.floor(currentLevel / 3) * 0.1;
}

function addCombo() {
    coinsCollectedWithoutHit++;
    
    // Каждые 3 монетки подряд дают комбо
    if (coinsCollectedWithoutHit % 3 === 0) {
        comboMultiplier = 1.5;
        comboTime = 180; // 3 секунды при 60 FPS
    }
    
    // Каждые 5 монеток подряд дают супер-комбо
    if (coinsCollectedWithoutHit % 5 === 0) {
        comboMultiplier = 2.0;
        comboTime = 300; // 5 секунд
    }
}

function resetCombo() {
    coinsCollectedWithoutHit = 0;
    comboMultiplier = 1.0;
    comboTime = 0;
}

// ====================
// СИСТЕМА ЖИЗНЕЙ
// ====================

function updateLives() {
    // Восстановление жизни каждые 200 очков
    if (lives < maxLives && score - lastLifeGainScore >= lifeRegenInterval) {
        lives++;
        lastLifeGainScore = score;
        lifeGainEffect = 60;
        
        if (isTelegram && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    hitsToLoseLife = getHitsToLoseLife();
}

function loseLife() {
    if (lives > 0) {
        lives--;
        poopHits = 0;
        resetCombo(); // Сбрасываем комбо при потере жизни
        
        if (isTelegram && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        if (lives <= 0) {
            gameOver = true;
            endGame("КОНЧИЛИСЬ ЖИЗНИ! 💔");
            return true;
        }
    }
    return false;
}

let lifeGainEffect = 0;

// ====================
// ПЛАВНЫЙ СТАРТ
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
                    lives: lives,
                    timestamp: new Date().toISOString()
                }));
            }
        }
    } catch (error) {
        console.log('Error saving to Telegram:', error);
    }
}

function shareGameTelegram() {
    if (!isTelegram || !tg) return;
    
    const shareText = `🎮 Я достиг ${currentLevel} уровня и набрал ${score} очков в игре "Коза в Нижнем"! 💩`;
    
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
// ИГРОВАЯ ЛОГИКА
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
    
    // Сброс жизней и комбо
    lives = 3;
    lastLifeGainScore = 0;
    lifeGainEffect = 0;
    poopHits = 0;
    hitsToLoseLife = getHitsToLoseLife();
    resetCombo();
    defense = 0;
    
    goat.gravity = gameDifficulty.gravity;
    goat.jumpStrength = isTelegram ? -9 : -8;
    
    benches.length = 0;
    coins.length = 0;
    poops.length = 0;
    
    goat.y = canvas.height / 2;
    goat.startY = canvas.height / 2;
    goat.velocity = 0;
    goat.rotation = 0;
    
    frames = 0;
    
    document.getElementById('score').textContent = '0';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    
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
    
    // Сброс жизней и комбо
    lives = 3;
    lastLifeGainScore = 0;
    lifeGainEffect = 0;
    poopHits = 0;
    hitsToLoseLife = getHitsToLoseLife();
    resetCombo();
    defense = 0;
    
    goat.gravity = gameDifficulty.gravity;
    goat.jumpStrength = isTelegram ? -9 : -8;
    
    benches.length = 0;
    coins.length = 0;
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
    const benchHeight = BENCH.height + (currentLevel - 1) * 3; // Меньше растет
    
    benches.push({
        x: canvas.width,
        y: ground.y - benchHeight,
        width: BENCH.width,
        height: benchHeight,
        passed: false
    });
}

function addCoin() {
    coins.push({
        x: canvas.width + Math.random() * 100,
        y: Math.random() * (canvas.height - 300) + 150,
        width: COIN.width,
        height: COIN.height,
        collected: false,
        float: Math.random() * Math.PI * 2,
        type: 'good'
    });
}

function addPoop() {
    // УМНЫЙ СПАВН: не спавним какашки, если игрок в опасности
    if (lives === 1 && Math.random() < 0.7) return;
    if (poops.length >= 3 && Math.random() < 0.6) return;
    
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
        speed: getPoopSpeed() + Math.random() * 0.8,
        wave: Math.random() * Math.PI * 2,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.15
    });
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    if (isStartingArc) {
        updateStartArc();
        return;
    }
    
    updateLevel();
    updateLives();
    updateComboSystem();
    
    if (levelUpEffect > 0) levelUpEffect--;
    if (lifeGainEffect > 0) lifeGainEffect--;
    
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
        
        if (goat.x + goat.width > bench.x &&
            goat.x < bench.x + bench.width &&
            goat.y + goat.height > bench.y &&
            goat.y < bench.y + bench.height) {
            gameOver = true;
            endGame("УПАЛ НА ЛАВОЧКУ! 🪑");
            return;
        }
    }
    
    // МОНЕТКИ с рублями
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.x -= currentSpeed;
        coin.float += 0.05;
        
        if (!coin.collected &&
            goat.x + goat.width - 10 > coin.x &&
            goat.x + 10 < coin.x + coin.width &&
            goat.y + goat.height - 10 > coin.y &&
            goat.y + 10 < coin.y + coin.height) {
            
            coin.collected = true;
            const points = getCoinPoints();
            score += points;
            coin.effect = '+' + points;
            coin.effectTime = frames;
            
            document.getElementById('score').textContent = score;
            
            // Добавляем комбо
            addCombo();
            
            if (isTelegram && navigator.vibrate && score % 50 === 0) {
                navigator.vibrate([30, 30, 30]);
            }
        }
        
        if (coin.x + coin.width < -50) coins.splice(i, 1);
    }
    
    // Какашки
    for (let i = poops.length - 1; i >= 0; i--) {
        const poop = poops[i];
        poop.x -= poop.speed;
        poop.float += 0.1;
        poop.wave += 0.05;
        poop.y += Math.sin(poop.wave) * 2;
        poop.rotation += poop.rotationSpeed;
        
        if (!poop.hit &&
            goat.x + goat.width - 15 > poop.x &&
            goat.x + 15 < poop.x + poop.width &&
            goat.y + goat.height - 15 > poop.y &&
            goat.y + 15 < poop.y + poop.height) {
            
            poop.hit = true;
            
            // БАЛАНСИРОВАННАЯ ЛОГИКА СТОЛКНОВЕНИЯ
            if (score <= 0) {
                // Если очков нет - теряем жизнь
                poop.effect = "💔";
                resetCombo(); // Сбрасываем комбо
                if (loseLife()) return;
            } else {
                // Если есть очки - снимаем очки (с учетом защиты)
                const basePointsLost = getPoopPoints();
                const actualPointsLost = Math.floor(basePointsLost * (1 - defense));
                score += actualPointsLost;
                if (score < 0) score = 0;
                poop.effect = actualPointsLost;
                
                // Сбрасываем комбо при любом столкновении
                resetCombo();
                
                // Увеличиваем счетчик попаданий
                poopHits++;
                
                // Проверяем, не пора ли отнять жизнь
                if (poopHits >= hitsToLoseLife) {
                    poopHits = 0; // Сбрасываем счетчик
                    if (loseLife()) return;
                }
            }
            
            poop.effectTime = frames;
            
            // Эффект отталкивания
            goat.velocity = -7; // Меньше отталкивание
            
            // ОБНОВЛЯЕМ СЧЕТ
            document.getElementById('score').textContent = score;
            
            if (isTelegram && navigator.vibrate) {
                navigator.vibrate([80, 40, 80]);
            }
        }
        
        if (poop.x + poop.width < -100) poops.splice(i, 1);
    }
    
    // Смерть от падения
    if (goat.y + goat.height > ground.y || goat.y < -50) {
        gameOver = true;
        endGame(goat.y < -50 ? "УЛЕТЕЛ В КОСМОС! 🚀" : "УПАЛ НА ЗЕМЛЮ! 💥");
        return;
    }
    
    // Спавн объектов
    const spawnInterval = Math.max(60, 100 - (currentLevel - 1) * 8); // Медленнее спавн
    
    if (frames % spawnInterval === 0) {
        addBench();
        
        if (Math.random() < (COIN.spawnChance - (currentLevel - 1) * 0.05)) {
            addCoin();
        }
        
        if (Math.random() < getPoopSpawnChance()) {
            addPoop();
        }
    }
    
    // Дополнительные какашки (реже)
    if (frames % Math.max(40, 60 - (currentLevel - 1) * 5) === 0 && Math.random() < 0.3) {
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
    
    if (isTelegram && navigator.vibrate) {
        navigator.vibrate([300, 100, 300]);
    }
}

// ====================
// ОТРИСОВКА
// ====================

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон с эффектом уровня
    if (levelUpEffect > 0 && levelUpEffect % 10 < 5) {
        ctx.fillStyle = 'rgba(139, 69, 19, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Рисуем фон
    ctx.drawImage(BG_IMG, 0, 0, canvas.width, canvas.height);
    
    // МОНЕТКИ с рублями
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.save();
            ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2);
            ctx.rotate(Math.sin(coin.float) * 0.3);
            
            // Эффект блеска
            if (Math.sin(coin.float * 2) > 0) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 10;
            }
            
            ctx.drawImage(COIN_IMG, -coin.width/2, -coin.height/2, coin.width, coin.height);
            
            ctx.restore();
        } else if (coin.effect) {
            const age = frames - coin.effectTime;
            if (age < 30) {
                ctx.save();
                ctx.globalAlpha = 1 - age / 30;
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(coin.effect, coin.x + coin.width/2, coin.y - age);
                ctx.restore();
            }
        }
    });
    
    // Какашки
    poops.forEach(poop => {
        ctx.save();
        ctx.translate(poop.x + poop.width/2, poop.y + poop.height/2);
        ctx.rotate(poop.rotation);
        
        // Мерцание
        if (Math.sin(poop.float * 3) > 0) {
            ctx.shadowColor = '#8B4513';
            ctx.shadowBlur = 15;
        }
        
        // Пульсация
        const scale = 0.9 + Math.abs(Math.sin(poop.float)) * 0.2;
        ctx.scale(scale, scale);
        ctx.drawImage(POOP_IMG, -poop.width/2, -poop.height/2, poop.width, poop.height);
        
        ctx.restore();
        
        // Эффект при попадании
        if (poop.effect) {
            const age = frames - poop.effectTime;
            if (age < 30) {
                ctx.save();
                ctx.globalAlpha = 1 - age / 30;
                ctx.fillStyle = poop.effect === "💔" ? '#FF0000' : '#8B4513';
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(poop.effect, poop.x + poop.width/2, poop.y - age - 10);
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
    
    // Эффект комбо
    if (comboMultiplier > 1.0) {
        const pulse = Math.sin(frames * 0.2) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
    }
    
    ctx.drawImage(BIRD_IMG, -goat.width/2, -goat.height/2, goat.width, goat.height);
    
    // Корона для Telegram
    if (isTelegram && telegramUser && score > 100) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', 0, -40);
    }
    
    ctx.restore();
    
    // ====================
    // НИЖНЯЯ ПАНЕЛЬ (GROUND) С УРОВНЕМ И ЖИЗНЯМИ
    // ====================
    
    // Фон для нижней панели (ground)
    const groundPanelY = ground.y;
    const groundPanelHeight = 60;
    
    // Рисуем уровень на нижней панели (левый нижний угол)
    const levelPanelWidth = 100;
    const levelPanelX = 15;
    const levelPanelY = groundPanelY + 10;
    
    // Фон панели уровня
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(levelPanelX, levelPanelY, levelPanelWidth, 40);
    ctx.strokeStyle = '#00FF00'; // Зеленая рамка
    ctx.lineWidth = 2;
    ctx.strokeRect(levelPanelX, levelPanelY, levelPanelWidth, 40);
    
    // Уровень
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LVL ${currentLevel}`, levelPanelX + levelPanelWidth / 2, levelPanelY + 20);
    
    // Рисуем жизни на нижней панели (правый нижний угол)
    const livesPanelWidth = 120;
    const livesPanelX = canvas.width - livesPanelWidth - 15;
    const livesPanelY = groundPanelY + 10;
    
    // Фон панели жизней
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(livesPanelX, livesPanelY, livesPanelWidth, 40);
    ctx.strokeStyle = '#FF0000'; // Красная рамка
    ctx.lineWidth = 2;
    ctx.strokeRect(livesPanelX, livesPanelY, livesPanelWidth, 40);
    
    // Сердечки
    const heartSize = 16;
    const heartSpacing = 22;
    const heartsStartX = livesPanelX + 25;
    const heartsY = livesPanelY + 20;
    
    for (let i = 0; i < maxLives; i++) {
        if (i < lives) {
            ctx.fillStyle = '#FF0000';
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.strokeStyle = 'rgba(139, 0, 0, 0.3)';
            ctx.lineWidth = 1;
        }
        
        drawHeart(ctx, heartsStartX + i * heartSpacing, heartsY, heartSize);
        
        // Эффект при получении жизни
        if (lifeGainEffect > 0 && i === lives - 1) {
            const pulse = Math.sin(frames * 0.2) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#FFD700';
            drawHeart(ctx, heartsStartX + i * heartSpacing, heartsY, heartSize * 1.2);
            ctx.globalAlpha = 1.0;
        }
    }
    
    // Функция рисования сердца
    function drawHeart(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(0, size/3);
        ctx.bezierCurveTo(0, -topCurveHeight, -size/2, -topCurveHeight, -size/2, size/3);
        ctx.bezierCurveTo(-size/2, size/1.5, 0, size/1.2, 0, size);
        ctx.bezierCurveTo(0, size/1.2, size/2, size/1.5, size/2, size/3);
        ctx.bezierCurveTo(size/2, -topCurveHeight, 0, -topCurveHeight, 0, size/3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    
    // Отображение комбо
    if (comboMultiplier > 1.0) {
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`КОМБО x${comboMultiplier.toFixed(1)}`, canvas.width / 2, 30);
        
        // Прогресс-бар комбо
        const barWidth = 200;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 50;
        const barHeight = 8;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(barX, barY, barWidth * (comboTime / 300), barHeight);
        
        ctx.restore();
    }
    
    // Стартовый экран
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
        
        ctx.fillText('ЛОВИ РИТМ!', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Избегай какашек 💩', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Собирай монетки ₽!', canvas.width / 2, canvas.height / 2 + 35);
        
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
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`УРОВЕНЬ ${currentLevel}!`, canvas.width / 2, canvas.height / 4);
        
        // Показываем бонусы за уровень
        const bonusText = [];
        if (defense > 0) bonusText.push(`Защита +${Math.floor(defense * 100)}%`);
        if (currentLevel % 3 === 0) bonusText.push(`+1 Жизнь`);
        
        if (bonusText.length > 0) {
            ctx.font = 'bold 20px Arial';
            ctx.fillText(bonusText.join(' | '), canvas.width / 2, canvas.height / 4 + 40);
        } else {
            ctx.font = 'bold 20px Arial';
            ctx.fillText(`Скорость +25%`, canvas.width / 2, canvas.height / 4 + 40);
        }
        
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
// ПРИВЯЗКА КНОПОК
// ====================

document.addEventListener('DOMContentLoaded', function() {
    // Привязка игровых кнопок
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
    
    // Инициализация
    highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
    
    if (isTelegram && telegramUser) {
        const userId = telegramUser.id;
        const telegramBestScore = localStorage.getItem(`tg_${userId}_best_score`) || 0;
        document.getElementById('currentHighScore').textContent = telegramBestScore;
    } else {
        document.getElementById('currentHighScore').textContent = highScore;
    }
    
    // Обновляем текст на стартовом экране (если есть элементы)
    const instructions = document.querySelectorAll('.instruction');
    if (instructions.length > 1) {
        instructions[0].textContent = 'Избегай какашек 💩';
        instructions[1].textContent = 'Собирай монетки ₽!';
    }
    
    // Обновляем текст в HTML если есть
    const coinTexts = document.querySelectorAll('.coin-text');
    coinTexts.forEach(el => {
        if (el.textContent.includes('$') || el.textContent.includes('пельмен')) {
            el.textContent = el.textContent.replace('$', '₽').replace('пельмени', 'монетки');
        }
    });
    
    resizeCanvas();
    draw();
    
    if (isTelegram && tg && tg.MainButton) {
        tg.MainButton.show();
    }
});

// Export functions for Telegram
if (isTelegram) {
    window.shareGameTelegram = shareGameTelegram;
    window.openTelegramChannel = openTelegramChannel;
    window.saveScoreToTelegram = saveScoreToTelegram;
}