// ====================
// КОЗА В НИЖНЕМ - С ЛЕВЕЛАМИ И ОТЛОЖЕННЫМ СТАРТОМ!
// ====================

// Telegram Web App Detection
const isTelegram = typeof window.Telegram !== 'undefined' && window.Telegram.WebApp;

// Telegram variables
let tg = null;
let telegramUser = null;

if (isTelegram) {
    tg = window.Telegram.WebApp;
    telegramUser = tg.initDataUnsafe?.user;
    console.log('Telegram Web App detected! User:', telegramUser);
    
    // Expand to full screen
    tg.expand();
    
    // Set Telegram theme colors
    tg.setHeaderColor('#0a1538');
    tg.setBackgroundColor('#0a1538');
    
    // Configure Main Button
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

// ====================
// НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ УРОВНЕЙ И ОТЛОЖЕННОГО СТАРТА
// ====================

// Игровые переменные
let score = 0;
let highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;

// Система уровней
let currentLevel = 1;
let speedMultiplier = 1.0;
let levelUpEffect = 0;
let nextLevelAt = 200; // Первый уровень на 200 очках

// Отложенный старт
let countdown = 0; // 0 = нет отсчета, 3..2..1..GO!
let countdownTimer = 0;
let isCountdownActive = false;

// Коза
const goat = {
    x: 150,
    y: 300,
    width: isTelegram ? 45 : 50,
    height: isTelegram ? 45 : 50,
    velocity: 0,
    gravity: isTelegram ? 0.45 : 0.5,
    jumpStrength: isTelegram ? -9 : -8,
    rotation: 0
};

// Лавочки - БАЗОВЫЕ значения
const BENCH = {
    width: 100,
    height: 60,
    gap: 200,
    baseSpeed: isTelegram ? 2.8 : 3,
    minY: 300,
    maxY: 450
};

// Пельмени
const PELMEN = {
    width: 35,
    height: 20,
    points: 10,
    spawnChance: 0.6
};

// Птицы враги - БАЗОВЫЕ значения
const ENEMY_BIRD = {
    width: 60,
    height: 40,
    points: -20,
    baseSpawnChance: isTelegram ? 0.35 : 0.45,
    baseSpeed: isTelegram ? 2.5 : 3
};

// Земля - БАЗОВЫЕ значения
const ground = {
    x: 0,
    y: 540,
    height: 60,
    baseSpeed: isTelegram ? 2.8 : 3
};

// Массивы объектов
const benches = [];
const pelmeni = [];
const enemyBirds = [];

// ====================
// ФУНКЦИИ УРОВНЕЙ
// ====================

function getCurrentSpeed() {
    return ground.baseSpeed * speedMultiplier;
}

function getBirdSpawnChance() {
    // Увеличиваем шанс появления птиц с уровнем
    return ENEMY_BIRD.baseSpawnChance + (currentLevel - 1) * 0.07;
}

function getBirdSpeed() {
    // Увеличиваем скорость птиц с уровнем
    return ENEMY_BIRD.baseSpeed * (1 + (currentLevel - 1) * 0.15);
}

function updateLevel() {
    // Проверяем, достигли ли нового уровня
    if (score >= nextLevelAt) {
        currentLevel++;
        speedMultiplier = 1.0 + (currentLevel - 1) * 0.2; // +20% скорости за уровень (было 15%)
        
        // Устанавливаем следующий порог (каждый следующий уровень требует +150 очков)
        nextLevelAt = 200 + (currentLevel - 1) * 150;
        
        // Запускаем эффект перехода уровня
        levelUpEffect = 90; // 90 кадров анимации (3 секунды при 30fps)
        
        // Вибрация при переходе уровня в Telegram
        if (isTelegram && navigator.vibrate) {
            navigator.vibrate([150, 80, 150, 80, 150]);
        }
        
        console.log(`🎮 Уровень ${currentLevel}! Скорость: x${speedMultiplier.toFixed(2)}`);
    }
}

// ====================
// ОТЛОЖЕННЫЙ СТАРТ
// ====================

function startCountdown() {
    countdown = 4; // 3..2..1..GO! (4 шага)
    countdownTimer = 0;
    isCountdownActive = true;
    
    // Останавливаем гравитацию козы на время отсчета
    goat.velocity = 0;
    goat.y = canvas.height / 2;
    
    console.log('Отсчет начат: 3...');
}

function updateCountdown() {
    if (!isCountdownActive) return;
    
    countdownTimer++;
    
    // Меняем число каждые 60 кадров (2 секунды)
    if (countdownTimer >= 60) {
        countdown--;
        countdownTimer = 0;
        
        // Вибрация при смене цифры в Telegram
        if (isTelegram && navigator.vibrate) {
            navigator.vibrate(100);
        }
        
        if (countdown === 0) {
            // Старт!
            isCountdownActive = false;
            console.log('СТАРТ!');
            
            // Вибрация при старте в Telegram
            if (isTelegram && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        }
    }
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
            
            // Update display
            const currentHighScoreEl = document.getElementById('currentHighScore');
            if (currentHighScoreEl) {
                currentHighScoreEl.textContent = userScore;
            }
            
            // Send to bot
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
            
            // Vibrate on new record
            if (navigator.vibrate && userScore > 50) {
                navigator.vibrate([100, 50, 100]);
            }
        }
        
        return Math.max(userScore, currentBest);
    } catch (error) {
        console.log('Error saving to Telegram:', error);
        return 0;
    }
}

function shareGameTelegram() {
    if (!isTelegram || !tg) return;
    
    const shareText = `🎮 Я достиг ${currentLevel} уровня и набрал ${score} очков в игре "Коза в Нижнем"! Сможешь побить?`;
    
    try {
        if (tg.shareGame) {
            tg.shareGame({
                title: 'Коза в Нижнем',
                text: shareText,
                url: 'https://t.me/vnizhnem_est'
            });
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
    } else if (!gameOver && !isCountdownActive) {
        goat.velocity = goat.jumpStrength;
        
        // Vibrate on jump in Telegram
        if (isTelegram && navigator.vibrate) {
            navigator.vibrate(50);
        }
    } else if (gameOver) {
        resetGame();
    }
}

// Обработчик кликов
function handleGameClick(e) {
    // Проверяем, не кликнули ли по Telegram-ссылке
    if (e.target.closest('.telegram-button') || 
        e.target.closest('.telegram-footer') ||
        e.target.closest('.tg-share-button') ||
        e.target.closest('.tg-channel-button')) {
        return;
    }
    
    // Проверяем, не кликнули ли по кнопке
    if (e.target.id === 'startBtn' || e.target.id === 'restartBtn' ||
        e.target.id === 'tgShareBtn' || e.target.id === 'tgChannelBtn') {
        return;
    }
    
    handleJump();
}

// Обработчики событий
document.addEventListener('click', handleGameClick);

document.addEventListener('touchstart', function(e) {
    // Проверяем Telegram-specific элементы
    if (e.target.closest('.telegram-button') || 
        e.target.closest('.telegram-footer') ||
        e.target.closest('.tg-share-button') ||
        e.target.closest('.tg-channel-button')) {
        return;
    }
    
    if (e.target.id === 'startBtn' || e.target.id === 'restartBtn' ||
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

// Кнопки
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', resetGame);

// Telegram buttons
document.addEventListener('DOMContentLoaded', function() {
    // Share button
    const shareBtn = document.getElementById('tgShareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            shareGameTelegram();
        });
    }
    
    // Channel button
    const channelBtn = document.getElementById('tgChannelBtn');
    if (channelBtn) {
        channelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openTelegramChannel();
        });
    }
    
    // Load Telegram user's best score
    if (isTelegram && telegramUser) {
        const userId = telegramUser.id;
        const storageKey = `tg_${userId}_best_score`;
        const telegramBestScore = localStorage.getItem(storageKey) || 0;
        
        // Update display
        const currentHighScoreEl = document.getElementById('currentHighScore');
        if (currentHighScoreEl) {
            currentHighScoreEl.textContent = telegramBestScore;
        }
        
        // Show Telegram username if available
        if (telegramUser.first_name) {
            const title = document.querySelector('h1');
            if (title) {
                title.innerHTML = `🐐 Привет, ${telegramUser.first_name}!`;
                setTimeout(() => {
                    title.innerHTML = '🐐 Коза в Нижнем';
                }, 3000);
            }
        }
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
    nextLevelAt = 200;
    
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
    
    // Показываем кнопку закрытия в Telegram
    if (isTelegram && tg && tg.MainButton) {
        tg.MainButton.show();
    }
    
    // Запускаем отсчет
    startCountdown();
    
    // Запускаем игровой цикл
    gameLoop();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    currentLevel = 1;
    speedMultiplier = 1.0;
    levelUpEffect = 0;
    nextLevelAt = 200;
    isCountdownActive = false;
    
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
    
    // Обновляем рекорд для Telegram
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
    benches.push({
        x: canvas.width,
        y: ground.y - BENCH.height,
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
        speed: getBirdSpeed() + Math.random() * 0.5,
        wave: Math.random() * Math.PI * 2
    });
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    // Обновляем отсчет если активен
    if (isCountdownActive) {
        updateCountdown();
        return; // Не обновляем игру пока идет отсчет
    }
    
    // Обновляем уровень
    updateLevel();
    
    // Уменьшаем эффект перехода уровня
    if (levelUpEffect > 0) {
        levelUpEffect--;
    }
    
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
    
    // Земля с учетом множителя скорости
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
        pelmen.x -= currentSpeed;
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
            
            // Vibrate on collect in Telegram
            if (isTelegram && navigator.vibrate && score % 50 === 0) {
                navigator.vibrate([30, 30, 30]);
            }
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
            
            // Vibrate on hit in Telegram
            if (isTelegram && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
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
    
    // Добавление объектов с учетом уровня
    const spawnInterval = Math.max(70, 110 - (currentLevel - 1) * 8); // Чаще на высоких уровнях
    
    if (frames % spawnInterval === 0) {
        addBench();
        if (Math.random() < PELMEN.spawnChance) addPelmen();
        if (Math.random() < getBirdSpawnChance()) addEnemyBird();
    }
    
    // Дополнительный шанс появления птиц (чаще на высоких уровнях)
    if (frames % Math.max(50, 70 - (currentLevel - 1) * 4) === 0 && Math.random() < 0.3) {
        addEnemyBird();
    }
}

function endGame() {
    gameOver = true;
    
    // Update global high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('goatHighScore', highScore);
    }
    
    // Save to Telegram
    if (isTelegram && telegramUser) {
        saveScoreToTelegram(score);
    }
    
    // Update display
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = Math.max(highScore, 
        isTelegram && telegramUser ? localStorage.getItem(`tg_${telegramUser.id}_best_score`) || 0 : highScore
    );
    
    // Show game over screen
    document.getElementById('gameOverScreen').style.display = 'flex';
    
    // Добавляем информацию об уровне в экран проигрыша
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen && !gameOverScreen.querySelector('.level-info')) {
        const levelInfo = document.createElement('div');
        levelInfo.className = 'level-info';
        levelInfo.innerHTML = `<p style="color:#FFD700; font-size:20px; margin-top:10px;">🏆 Достигнут уровень: ${currentLevel}</p>`;
        
        const finalScores = gameOverScreen.querySelector('.final-scores');
        if (finalScores) {
            finalScores.after(levelInfo);
        }
    }
    
    // Vibrate on game over
    if (isTelegram && navigator.vibrate) {
        navigator.vibrate([300, 100, 300]);
    }
    
    // Show Telegram buttons
    const tgButtons = document.querySelector('.tg-buttons');
    if (tgButtons) {
        tgButtons.style.display = 'flex';
    }
}

// ====================
// ОТРИСОВКА
// ====================
function draw() {
    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон с эффектом уровня (мигание при переходе)
    if (levelUpEffect > 0 && levelUpEffect % 10 < 5) {
        // Мигающий фон при переходе уровня
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
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
    
    // ЗЕМЛЯ
    for (let i = 0; i <= Math.ceil(canvas.width / canvas.width) + 1; i++) {
        ctx.drawImage(GROUND_IMG, ground.x + i * canvas.width, ground.y, canvas.width + 2, ground.height);
    }
    
    // ЛАВОЧКИ
    benches.forEach(bench => {
        ctx.drawImage(PIPE_IMG, bench.x, bench.y, bench.width, bench.height);
    });
    
    // Коза
    ctx.save();
    ctx.translate(goat.x + goat.width/2, goat.y + goat.height/2);
    ctx.rotate(goat.rotation);
    ctx.drawImage(BIRD_IMG, -goat.width/2, -goat.height/2, goat.width, goat.height);
    
    // Telegram indicator (small crown for Telegram users)
    if (isTelegram && telegramUser && score > 100) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', 0, -40);
    }
    
    ctx.restore();
    
    // ====================
    // ОТОБРАЖЕНИЕ ИНФОРМАЦИИ ОБ УРОВНЕ (ПРАВЫЙ ВЕРХНИЙ УГОЛ)
    // ====================
    
    // Фон для информации об уровне
    const infoX = canvas.width - 220;
    const infoY = 10;
    const infoWidth = 210;
    const infoHeight = 90;
    
    // Полупрозрачный черный фон
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(infoX, infoY, infoWidth, infoHeight);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(infoX, infoY, infoWidth, infoHeight);
    
    // Текущий уровень
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Уровень: ${currentLevel}`, infoX + 10, infoY + 25);
    
    // Множитель скорости
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`Скорость: x${speedMultiplier.toFixed(2)}`, infoX + 10, infoY + 50);
    
    // Прогресс до следующего уровня
    if (score < nextLevelAt) {
        const progress = (score % 200) / 200;
        const progressWidth = 190;
        const progressHeight = 12;
        const progressY = infoY + 70;
        
        // Фон прогресс-бара
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(infoX + 10, progressY, progressWidth, progressHeight);
        
        // Заполнение прогресс-бара
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(infoX + 10, progressY, progressWidth * progress, progressHeight);
        
        // Очки до следующего уровня
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${nextLevelAt - score} до след. уровня`,
            infoX + infoWidth / 2,
            progressY + 22
        );
    } else {
        // Максимальный уровень достигнут
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            'МАКСИМАЛЬНЫЙ УРОВЕНЬ!',
            infoX + infoWidth / 2,
            infoY + 75
        );
    }
    
    // ====================
    // ОТОБРАЖЕНИЕ ОТСЧЕТА ПЕРЕД СТАРТОМ
    // ====================
    if (isCountdownActive && countdown > 0) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Большие цифры отсчета
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let countdownText;
        if (countdown === 4) countdownText = '3';
        else if (countdown === 3) countdownText = '2';
        else if (countdown === 2) countdownText = '1';
        else if (countdown === 1) countdownText = 'GO!';
        
        // Пульсирующая анимация
        const pulse = Math.sin(frames * 0.2) * 0.2 + 1;
        ctx.font = `bold ${120 * pulse}px Arial`;
        
        ctx.fillText(countdownText, canvas.width / 2, canvas.height / 2);
        
        // Подсказка под цифрой
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Готовься!', canvas.width / 2, canvas.height / 2 + 100);
        
        ctx.restore();
    }
    
    // Эффект перехода уровня
    if (levelUpEffect > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, levelUpEffect / 30);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🚀 УРОВЕНЬ ${currentLevel}!`, canvas.width / 2, canvas.height / 3);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Скорость +20%`, canvas.width / 2, canvas.height / 3 + 50);
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

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    // Устанавливаем рекорд
    highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
    
    // For Telegram users, load their best score
    if (isTelegram && telegramUser) {
        const userId = telegramUser.id;
        const telegramBestScore = localStorage.getItem(`tg_${userId}_best_score`) || 0;
        document.getElementById('currentHighScore').textContent = telegramBestScore;
    } else {
        document.getElementById('currentHighScore').textContent = highScore;
    }
    
    // Настраиваем размер канваса
    resizeCanvas();
    
    // Initial draw
    draw();
    
    // Show Telegram Main Button
    if (isTelegram && tg && tg.MainButton) {
        tg.MainButton.show();
    }
    
    console.log('Game loaded with DELAYED START and LEVEL SYSTEM!');
    console.log('Telegram mode:', isTelegram ? 'ON' : 'OFF');
    console.log('Level system: +20% speed every 200 points');
    console.log('Delayed start: 3...2...1...GO! (2 seconds each)');
});

// Export functions for Telegram
if (isTelegram) {
    window.shareGameTelegram = shareGameTelegram;
    window.openTelegramChannel = openTelegramChannel;
    window.saveScoreToTelegram = saveScoreToTelegram;
}