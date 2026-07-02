// Game Setup & Constants
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 24; // 24x24 grid
const CELL_SIZE = canvas.width / GRID_SIZE; // 20px per cell

// Speed map for difficulties (milliseconds per tick)
const DIFFICULTY_SPEEDS = {
    easy: 140,
    medium: 100,
    hard: 65
};

// Mode borders/glow
const MODE_COLORS = {
    classic: { border: '#00f0ff', glow: 'rgba(0, 240, 255, 0.5)' },
    obstacles: { border: '#ff3333', glow: 'rgba(255, 51, 51, 0.5)' },
    portals: { border: '#bd00ff', glow: 'rgba(189, 0, 255, 0.5)' }
};

// Web Audio API Synthesizer Class
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmInterval = null;
        this.bgmStep = 0;
        
        // Retro synth-wave bassline notes (frequencies in Hz)
        // C2, Eb2, G2, F2, Bb2 etc.
        this.bassNotes = [65.41, 65.41, 77.78, 98.00, 87.31, 87.31, 116.54, 98.00];
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playClick() {
        if (this.isMuted) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playEat() {
        if (this.isMuted) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.05); // E5
        osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.1); // G5
        
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playGoldenEat() {
        if (this.isMuted) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.3); // A6
        
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playDeath() {
        if (this.isMuted) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const noise = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.6);
        
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(100, this.ctx.currentTime);
        noise.frequency.linearRampToValueAtTime(10, this.ctx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
        
        osc.connect(gain);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        noise.start();
        osc.stop(this.ctx.currentTime + 0.6);
        noise.stop(this.ctx.currentTime + 0.6);
    }

    startBGM() {
        if (this.bgmInterval) return;
        this.init();
        
        this.bgmStep = 0;
        this.bgmInterval = setInterval(() => {
            if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;
            
            // Simple retro synthwave step bass
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            const baseFreq = this.bassNotes[this.bgmStep % this.bassNotes.length];
            osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
            
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
            
            this.bgmStep++;
        }, 220); // Sync rhythm speed
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

const synth = new SoundSynth();

// Game State Variables
let snake = [];
let direction = { x: 0, y: -1 }; // Initial moving up
let nextDirection = { x: 0, y: -1 };
let foods = []; // Array of food items
let obstacles = []; // Array of obstacle coords
let portals = []; // Two portal objects {x, y, partnerIndex}
let score = 0;
let highScore = 0;
let currentMode = 'classic';
let currentDifficulty = 'medium';
let gameSpeed = DIFFICULTY_SPEEDS.medium;

let isRunning = false;
let isPaused = false;
let isGameOver = false;
let speedBoostTimer = 0; // Ticks of speed boost remaining

let lastTickTime = 0;
let animationFrameId = null;

// Particle System
let particles = [];

function spawnParticles(x, y, color) {
    const px = x * CELL_SIZE + CELL_SIZE / 2;
    const py = y * CELL_SIZE + CELL_SIZE / 2;
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        particles.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 3 + 2,
            color: color,
            alpha: 1.0,
            decay: Math.random() * 0.03 + 0.02
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95; // friction
        p.vy *= 0.95;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// Local Storage for High Score
function loadHighScore() {
    const key = `neon_snake_high_${currentMode}_${currentDifficulty}`;
    highScore = parseInt(localStorage.getItem(key)) || 0;
    document.getElementById('high-score').textContent = String(highScore).padStart(3, '0');
}

function updateHighScore() {
    const key = `neon_snake_high_${currentMode}_${currentDifficulty}`;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(key, highScore);
        document.getElementById('high-score').textContent = String(highScore).padStart(3, '0');
        return true; // New high score achieved
    }
    return false;
}

// Generate Random Empty Position on Grid
function getRandomGridPosition() {
    let position;
    let isOccupied = true;
    
    while (isOccupied) {
        position = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        
        // Check collision with snake
        isOccupied = snake.some(segment => segment.x === position.x && segment.y === position.y);
        
        // Check collision with obstacles
        if (!isOccupied && currentMode === 'obstacles') {
            isOccupied = obstacles.some(obs => obs.x === position.x && obs.y === position.y);
        }
        
        // Check collision with existing foods
        if (!isOccupied) {
            isOccupied = foods.some(food => food.x === position.x && food.y === position.y);
        }
        
        // Check collision with portals
        if (!isOccupied && currentMode === 'portals') {
            isOccupied = portals.some(portal => portal.x === position.x && portal.y === position.y);
        }
    }
    
    return position;
}

// Create Food Items
function spawnFood(type = 'normal') {
    const pos = getRandomGridPosition();
    const food = {
        x: pos.x,
        y: pos.y,
        type: type,
        spawnedAt: Date.now(),
        expiresAt: type === 'normal' ? null : Date.now() + 5000 // 5 seconds expiry for special items
    };
    foods.push(food);
}

// Generate Game Environment (Obstacles, Portals)
function initEnvironment() {
    obstacles = [];
    portals = [];
    foods = [];
    
    if (currentMode === 'obstacles') {
        // Generate pre-set obstacles pattern (e.g. cross or random blocks)
        // Let's do random symmetrical blocks (symmetrical makes it look nicer)
        const blockCount = 6;
        for (let i = 0; i < blockCount; i++) {
            const rx = Math.floor(Math.random() * (GRID_SIZE / 2 - 4)) + 2;
            const ry = Math.floor(Math.random() * (GRID_SIZE / 2 - 4)) + 2;
            
            // Draw blocks in 4 quadrants
            obstacles.push({ x: rx, y: ry });
            obstacles.push({ x: GRID_SIZE - 1 - rx, y: ry });
            obstacles.push({ x: rx, y: GRID_SIZE - 1 - ry });
            obstacles.push({ x: GRID_SIZE - 1 - rx, y: GRID_SIZE - 1 - ry });
        }
    } else if (currentMode === 'portals') {
        // Create 2 portals: Portal A and Portal B
        // Place them at fixed nice locations (left/right sides)
        portals = [
            { x: 4, y: Math.floor(GRID_SIZE / 2), color: '#00f0ff', glow: 'rgba(0, 240, 255, 0.6)', partnerIndex: 1 },
            { x: GRID_SIZE - 5, y: Math.floor(GRID_SIZE / 2), color: '#ff8e00', glow: 'rgba(255, 142, 0, 0.6)', partnerIndex: 0 }
        ];
    }
    
    // Always spawn at least one normal food
    spawnFood('normal');
}

// Start Game
function startGame() {
    synth.init();
    
    // Reset Snake
    const centerY = Math.floor(GRID_SIZE / 2);
    snake = [
        { x: 10, y: centerY },
        { x: 10, y: centerY + 1 },
        { x: 10, y: centerY + 2 }
    ];
    
    direction = { x: 0, y: -1 };
    nextDirection = { x: 0, y: -1 };
    score = 0;
    speedBoostTimer = 0;
    particles = [];
    isGameOver = false;
    isPaused = false;
    isRunning = true;
    
    document.getElementById('current-score').textContent = '000';
    document.getElementById('overlay-start').classList.add('hidden');
    document.getElementById('overlay-gameover').classList.add('hidden');
    document.getElementById('overlay-paused').classList.add('hidden');
    
    // Dynamic border color depending on Mode
    const container = document.getElementById('canvas-container');
    container.style.borderColor = MODE_COLORS[currentMode].border;
    container.style.boxShadow = MODE_COLORS[currentMode].glow;
    
    loadHighScore();
    initEnvironment();
    
    synth.startBGM();
    lastTickTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Pause Game
function pauseGame() {
    if (!isRunning || isGameOver) return;
    
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('btn-pause');
    
    if (isPaused) {
        document.getElementById('overlay-paused').classList.remove('hidden');
        document.getElementById('svg-pause').classList.add('hidden');
        document.getElementById('svg-play').classList.remove('hidden');
        synth.stopBGM();
    } else {
        document.getElementById('overlay-paused').classList.add('hidden');
        document.getElementById('svg-pause').classList.remove('hidden');
        document.getElementById('svg-play').classList.add('hidden');
        synth.startBGM();
        lastTickTime = performance.now();
    }
}

// Game Over
function triggerGameOver(reason) {
    isGameOver = true;
    isRunning = false;
    synth.stopBGM();
    synth.playDeath();
    
    document.getElementById('gameover-reason').textContent = reason;
    document.getElementById('final-score').textContent = score;
    
    const isNewHigh = updateHighScore();
    const tag = document.getElementById('new-high-score-tag');
    if (isNewHigh) {
        tag.classList.remove('hidden');
    } else {
        tag.classList.add('hidden');
    }
    
    document.getElementById('overlay-gameover').classList.remove('hidden');
    cancelAnimationFrame(animationFrameId);
}

// Controls handling
function handleDirectionChange(newDir) {
    if (!isRunning || isPaused || isGameOver) return;
    
    // Prevent 180-degree immediate turns
    const goingOpposite = (newDir.x === -direction.x && newDir.x !== 0) || 
                          (newDir.y === -direction.y && newDir.y !== 0);
    
    if (!goingOpposite) {
        nextDirection = newDir;
    }
}

// Keyboard controls
window.addEventListener('keydown', e => {
    // Keyboard arrows or WASD
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            handleDirectionChange({ x: 0, y: -1 });
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            handleDirectionChange({ x: 0, y: 1 });
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            handleDirectionChange({ x: -1, y: 0 });
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            handleDirectionChange({ x: 1, y: 0 });
            e.preventDefault();
            break;
        case ' ': // Space bar for Pause
            pauseGame();
            e.preventDefault();
            break;
    }
});

// Virtual D-pad controls for mobile
document.getElementById('dpad-up').addEventListener('pointerdown', () => handleDirectionChange({ x: 0, y: -1 }));
document.getElementById('dpad-down').addEventListener('pointerdown', () => handleDirectionChange({ x: 0, y: 1 }));
document.getElementById('dpad-left').addEventListener('pointerdown', () => handleDirectionChange({ x: -1, y: 0 }));
document.getElementById('dpad-right').addEventListener('pointerdown', () => handleDirectionChange({ x: 1, y: 0 }));

// Main loop using requestAnimationFrame
function gameLoop(currentTime) {
    if (!isRunning) return;
    
    animationFrameId = requestAnimationFrame(gameLoop);
    
    if (isPaused) return;
    
    // Calculate adaptive speed (faster if speed boost is active)
    let currentSpeed = DIFFICULTY_SPEEDS[currentDifficulty];
    if (speedBoostTimer > 0) {
        currentSpeed = Math.floor(currentSpeed * 0.65); // 35% faster
    }
    
    const delta = currentTime - lastTickTime;
    
    if (delta >= currentSpeed) {
        lastTickTime = currentTime - (delta % currentSpeed);
        tick();
    }
    
    // Smooth visual updates (like particles) happen at screen refresh rate
    render();
}

// Game State Update (single grid tick)
function tick() {
    direction = nextDirection;
    
    // Speed boost timer cooldown
    if (speedBoostTimer > 0) {
        speedBoostTimer--;
    }
    
    // Calculate new head position
    const head = snake[0];
    const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
    };
    
    // 1. Check wall collisions
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        triggerGameOver("벽에 충돌했습니다!");
        return;
    }
    
    // 2. Check obstacles collision (Obstacles Mode)
    if (currentMode === 'obstacles') {
        const hitObstacle = obstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y);
        if (hitObstacle) {
            triggerGameOver("방해물에 부딪혔습니다!");
            return;
        }
    }
    
    // 3. Check portal logic (Portals Mode)
    if (currentMode === 'portals') {
        for (let i = 0; i < portals.length; i++) {
            const portal = portals[i];
            if (newHead.x === portal.x && newHead.y === portal.y) {
                const partner = portals[portal.partnerIndex];
                // Move snake head to partner location
                // Teleport offset: set newHead to partner location
                newHead.x = partner.x;
                newHead.y = partner.y;
                // Add a small offset visual particle effect at both portals
                spawnParticles(portal.x, portal.y, portal.color);
                spawnParticles(partner.x, partner.y, partner.color);
                synth.playClick();
                break; // Teleported
            }
        }
    }
    
    // 4. Check self-collision
    // Allow head to be where the tail was ONLY if we are not growing
    const selfCollision = snake.some((segment, idx) => {
        // Skip last segment if head is not on food
        if (idx === snake.length - 1) return false;
        return segment.x === newHead.x && segment.y === newHead.y;
    });
    
    if (selfCollision) {
        triggerGameOver("지렁이의 몸에 부딪혔습니다!");
        return;
    }
    
    // Add new head
    snake.unshift(newHead);
    
    // 5. Food check
    let ateFood = false;
    
    // Clean up expired special food
    const now = Date.now();
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        if (food.expiresAt && now > food.expiresAt) {
            foods.splice(i, 1);
            // Respawn a normal food if we deleted a normal one (which shouldn't happen, but just in case)
            if (food.type === 'normal') spawnFood('normal');
        }
    }
    
    // Check if snake ate any food
    for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        if (newHead.x === food.x && newHead.y === food.y) {
            ateFood = true;
            
            // Handle food effects
            if (food.type === 'normal') {
                score += 10;
                synth.playEat();
                spawnParticles(food.x, food.y, '#39ff14');
                // Remove food and spawn another normal food
                foods.splice(i, 1);
                spawnFood('normal');
                
                // Roll chance for special food (15% for Gold, 15% for Speed if no special food is active)
                const specialActive = foods.some(f => f.type !== 'normal');
                if (!specialActive) {
                    const roll = Math.random();
                    if (roll < 0.15) {
                        spawnFood('gold');
                    } else if (roll < 0.30) {
                        spawnFood('speed');
                    }
                }
            } else if (food.type === 'gold') {
                score += 30;
                synth.playGoldenEat();
                spawnParticles(food.x, food.y, '#ffd700');
                foods.splice(i, 1);
            } else if (food.type === 'speed') {
                score += 20;
                synth.playGoldenEat();
                spawnParticles(food.x, food.y, '#bd00ff');
                speedBoostTimer = 50; // Speed boost duration: 50 ticks
                foods.splice(i, 1);
            }
            
            document.getElementById('current-score').textContent = String(score).padStart(3, '0');
            break;
        }
    }
    
    if (!ateFood) {
        // If no food eaten, pop tail to maintain length
        snake.pop();
    }
}

// Render Logic
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw subtle cyber background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
    
    // 2. Draw obstacles (Obstacles Mode)
    if (currentMode === 'obstacles') {
        obstacles.forEach(obs => {
            ctx.save();
            ctx.fillStyle = '#ff2222';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ff2222';
            
            // Draw square block with neon red outline and red fill
            const pad = 2;
            ctx.fillRect(obs.x * CELL_SIZE + pad, obs.y * CELL_SIZE + pad, CELL_SIZE - pad*2, CELL_SIZE - pad*2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(obs.x * CELL_SIZE + pad + 1, obs.y * CELL_SIZE + pad + 1, CELL_SIZE - pad*2 - 2, CELL_SIZE - pad*2 - 2);
            
            // X mark inside
            ctx.beginPath();
            ctx.moveTo(obs.x * CELL_SIZE + pad, obs.y * CELL_SIZE + pad);
            ctx.lineTo((obs.x + 1) * CELL_SIZE - pad, (obs.y + 1) * CELL_SIZE - pad);
            ctx.moveTo((obs.x + 1) * CELL_SIZE - pad, obs.y * CELL_SIZE + pad);
            ctx.lineTo(obs.x * CELL_SIZE + pad, (obs.y + 1) * CELL_SIZE - pad);
            ctx.stroke();
            ctx.restore();
        });
    }
    
    // 3. Draw Portals (Portals Mode)
    if (currentMode === 'portals') {
        const time = Date.now() / 150;
        portals.forEach(portal => {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = portal.color;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.strokeStyle = portal.color;
            ctx.lineWidth = 3;
            
            const px = portal.x * CELL_SIZE + CELL_SIZE / 2;
            const py = portal.y * CELL_SIZE + CELL_SIZE / 2;
            
            // Draw portal base
            ctx.beginPath();
            ctx.arc(px, py, CELL_SIZE * 0.7 + Math.sin(time) * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw inner rotating element
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(px, py, CELL_SIZE * 0.4, time, time + Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
    }
    
    // 4. Draw Food Items
    foods.forEach(food => {
        ctx.save();
        const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
        const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
        
        // Pulse food size
        const time = Date.now() / 120;
        const scale = 1.0 + Math.sin(time) * 0.15;
        const radius = (CELL_SIZE / 2.5) * scale;
        
        if (food.type === 'normal') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#39ff14';
            ctx.fillStyle = '#39ff14';
            ctx.beginPath();
            ctx.arc(fx, fy, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(fx, fy, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (food.type === 'gold') {
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#ffd700';
            ctx.fillStyle = '#ffd700';
            
            // Draw golden diamond shape
            ctx.beginPath();
            ctx.moveTo(fx, fy - radius);
            ctx.lineTo(fx + radius, fy);
            ctx.lineTo(fx, fy + radius);
            ctx.lineTo(fx - radius, fy);
            ctx.closePath();
            ctx.fill();
            
            // Inner Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(fx, fy, radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
        } else if (food.type === 'speed') {
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#bd00ff';
            ctx.fillStyle = '#bd00ff';
            
            // Draw lightning/star-like shape
            ctx.beginPath();
            ctx.moveTo(fx, fy - radius);
            ctx.lineTo(fx + radius * 0.5, fy - radius * 0.2);
            ctx.lineTo(fx + radius * 0.8, fy);
            ctx.lineTo(fx + radius * 0.2, fy + radius * 0.2);
            ctx.lineTo(fx, fy + radius);
            ctx.lineTo(fx - radius * 0.2, fy + radius * 0.2);
            ctx.lineTo(fx - radius * 0.8, fy);
            ctx.lineTo(fx - radius * 0.5, fy - radius * 0.2);
            ctx.closePath();
            ctx.fill();
            
            // Inner Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(fx, fy, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
    
    // 5. Draw Snake
    snake.forEach((segment, index) => {
        ctx.save();
        const px = segment.x * CELL_SIZE;
        const py = segment.y * CELL_SIZE;
        const pad = 1.5;
        
        // Define color gradient along the snake body
        // Head is Neon Cyan, shifting to electric purple/blue at the tail
        const progress = index / snake.length;
        
        // Custom neon-gradient logic
        let segmentColor;
        let glowColor;
        if (speedBoostTimer > 0) {
            // Speed boost active - neon purple/pink pulsing
            const pulse = Math.abs(Math.sin(Date.now() / 80));
            segmentColor = `hsl(${280 + pulse * 40}, 100%, ${50 + progress * 20}%)`;
            glowColor = `rgba(189, 0, 255, ${0.8 - progress * 0.4})`;
        } else {
            // Standard - Cyan to Indigo gradient
            segmentColor = `hsl(${180 + progress * 80}, 100%, 50%)`;
            glowColor = `rgba(0, 240, 255, ${0.8 - progress * 0.5})`;
        }
        
        ctx.fillStyle = segmentColor;
        ctx.shadowBlur = index === 0 ? 15 : 6;
        ctx.shadowColor = glowColor;
        
        // Draw head vs body
        if (index === 0) {
            // Draw head with direction-aware rounding
            const r = 8; // Border radius
            ctx.beginPath();
            
            // Draw rounded corners depending on head direction
            // ctx.roundRect is standard in modern browsers
            if (ctx.roundRect) {
                ctx.roundRect(px + pad, py + pad, CELL_SIZE - pad*2, CELL_SIZE - pad*2, r);
            } else {
                ctx.fillRect(px + pad, py + pad, CELL_SIZE - pad*2, CELL_SIZE - pad*2);
            }
            ctx.fill();
            
            // Draw Snake Eyes!
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000000';
            const eyeSize = 3.5;
            const eyeOffset = 5;
            
            // Position eyes based on movement direction
            let eye1 = { x: 0, y: 0 }, eye2 = { x: 0, y: 0 };
            
            if (direction.x !== 0) {
                // Moving Left/Right
                const ex = direction.x > 0 ? CELL_SIZE - eyeOffset : eyeOffset;
                eye1 = { x: px + ex, y: py + eyeOffset };
                eye2 = { x: px + ex, y: py + CELL_SIZE - eyeOffset };
            } else {
                // Moving Up/Down
                const ey = direction.y > 0 ? CELL_SIZE - eyeOffset : eyeOffset;
                eye1 = { x: px + eyeOffset, y: py + ey };
                eye2 = { x: px + CELL_SIZE - eyeOffset, y: py + ey };
            }
            
            ctx.beginPath();
            ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
            ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye Pupils (electric white)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eye1.x, eye1.y, 1.2, 0, Math.PI * 2);
            ctx.arc(eye2.x, eye2.y, 1.2, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            // Draw body segments slightly smaller as they approach the tail
            const scale = 1.0 - (progress * 0.25); // Decrease size by up to 25% at tail
            const size = (CELL_SIZE - pad * 2) * scale;
            const offset = (CELL_SIZE - size) / 2;
            
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(px + offset, py + offset, size, size, 4);
            } else {
                ctx.fillRect(px + offset, py + offset, size, size);
            }
            ctx.fill();
        }
        
        ctx.restore();
    });
    
    // 6. Draw Explosion Particles
    updateParticles();
    drawParticles();
}

// Settings changes event handlers
document.getElementById('mode-select').addEventListener('change', e => {
    currentMode = e.target.value;
    synth.playClick();
    loadHighScore();
    
    // If not running, change styling immediately
    if (!isRunning) {
        const container = document.getElementById('canvas-container');
        container.style.borderColor = MODE_COLORS[currentMode].border;
        container.style.boxShadow = MODE_COLORS[currentMode].glow;
    }
});

document.getElementById('difficulty-select').addEventListener('change', e => {
    currentDifficulty = e.target.value;
    synth.playClick();
    loadHighScore();
});

// Setup actions buttons listeners
document.getElementById('btn-mute').addEventListener('click', () => {
    const isMuted = synth.toggleMute();
    
    const muteOffIcon = document.getElementById('svg-mute-off');
    const muteOnIcon = document.getElementById('svg-mute-on');
    
    if (isMuted) {
        muteOffIcon.classList.add('hidden');
        muteOnIcon.classList.remove('hidden');
    } else {
        muteOffIcon.classList.remove('hidden');
        muteOnIcon.classList.add('hidden');
        synth.init();
    }
});

document.getElementById('btn-pause').addEventListener('click', pauseGame);

// Overlay Buttons
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-resume').addEventListener('click', pauseGame);

// Load high score initially
loadHighScore();

// Initial background rendering on canvas
ctx.fillStyle = 'rgba(5, 5, 12, 0.95)';
ctx.fillRect(0, 0, canvas.width, canvas.height);
// Draw grid once
ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
ctx.lineWidth = 1;
for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(canvas.width, i * CELL_SIZE);
    ctx.stroke();
}
