// Game variables
let scene, camera, renderer;
let bird, pipes = [];
let score = 0;
let gameStarted = false;
let gameOver = false;
let speed = 0.05;
let gravity = 0.0018;
let jumpForce = 0.05;
let birdVelocity = 0;
let pipeSpawnInterval;
let lastPipePosition = 0;
let gapSize = 2.0;

// DOM elements
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const toggleSettingsButton = document.getElementById('toggleSettings');
const settingsPanel = document.getElementById('settings');

// Settings sliders
const gravitySlider = document.getElementById('gravitySlider');
const jumpForceSlider = document.getElementById('jumpForceSlider');
const speedSlider = document.getElementById('speedSlider');
const gapSizeSlider = document.getElementById('gapSizeSlider');

// Settings values
const gravityValue = document.getElementById('gravityValue');
const jumpForceValue = document.getElementById('jumpForceValue');
const speedValue = document.getElementById('speedValue');
const gapSizeValue = document.getElementById('gapSizeValue');

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 0;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    // Create bird
    createBird();

    // Create ground
    createGround();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Add event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', onTouchStart);
    restartButton.addEventListener('click', restartGame);
    startButton.addEventListener('click', startGame);

    // Add settings event listeners
    toggleSettingsButton.addEventListener('click', toggleSettings);

    gravitySlider.addEventListener('input', updateGravity);
    jumpForceSlider.addEventListener('input', updateJumpForce);
    speedSlider.addEventListener('input', updateSpeed);
    gapSizeSlider.addEventListener('input', updateGapSize);

    // Update slider values to match initial settings
    gravitySlider.value = gravity;
    jumpForceSlider.value = jumpForce;
    speedSlider.value = speed;
    gapSizeSlider.value = gapSize;

    // Update displayed values
    gravityValue.textContent = gravity.toFixed(4);
    jumpForceValue.textContent = jumpForce.toFixed(2);
    speedValue.textContent = speed.toFixed(2);
    gapSizeValue.textContent = gapSize.toFixed(1);

    // Start animation loop
    animate();
}

// Create the bird
function createBird() {
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0xFFFF00 }); // Yellow bird
    bird = new THREE.Mesh(geometry, material);
    bird.position.set(-2, 0, 0);

    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.1, 0.1, 0.15);
    bird.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.1, -0.15);
    bird.add(rightEye);

    // Add beak
    const beakGeometry = new THREE.ConeGeometry(0.1, 0.2, 32);
    const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6600 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0.25, 0, 0);
    beak.rotation.z = -Math.PI / 2;
    bird.add(beak);

    scene.add(bird);
}

// Create the ground
function createGround() {
    const geometry = new THREE.BoxGeometry(100, 1, 3);
    const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown ground
    const ground = new THREE.Mesh(geometry, material);
    ground.position.y = -3;
    scene.add(ground);
}

// Create a pipe
function createPipe() {
    const pipeWidth = 0.8;
    const pipeDepth = 0.8;

    // Random gap position
    const gapPosition = Math.random() * 3 - 1.5;

    // Top pipe
    const topPipeHeight = 10 - (gapPosition + gapSize / 2);
    const topPipeGeometry = new THREE.BoxGeometry(pipeWidth, topPipeHeight, pipeDepth);
    const pipeMaterial = new THREE.MeshPhongMaterial({ color: 0x00AA00 }); // Green pipe
    const topPipe = new THREE.Mesh(topPipeGeometry, pipeMaterial);
    topPipe.position.set(10, gapPosition + gapSize / 2 + topPipeHeight / 2, 0);

    // Bottom pipe
    const bottomPipeHeight = 10 + (gapPosition - gapSize / 2);
    const bottomPipeGeometry = new THREE.BoxGeometry(pipeWidth, bottomPipeHeight, pipeDepth);
    const bottomPipe = new THREE.Mesh(bottomPipeGeometry, pipeMaterial);
    bottomPipe.position.set(10, gapPosition - gapSize / 2 - bottomPipeHeight / 2, 0);

    // Add pipes to scene and array
    scene.add(topPipe);
    scene.add(bottomPipe);

    pipes.push({
        top: topPipe,
        bottom: bottomPipe,
        passed: false
    });

    lastPipePosition = 10;
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle key press
function onKeyDown(event) {
    if (event.code === 'Space') {
        if (!gameStarted && !gameOver) {
            startGame();
        } else if (!gameOver) {
            jump();
        }
    }
}

// Handle touch
function onTouchStart() {
    if (!gameStarted && !gameOver) {
        startGame();
    } else if (!gameOver) {
        jump();
    }
}

// Make the bird jump
function jump() {
    birdVelocity = jumpForce;
}

// Start the game
function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    startScreen.style.display = 'none';

    // Reset bird position
    bird.position.set(-2, 0, 0);
    bird.rotation.set(0, 0, 0);
    birdVelocity = 0;

    // Clear existing pipes
    pipes.forEach(pipe => {
        scene.remove(pipe.top);
        scene.remove(pipe.bottom);
    });
    pipes = [];

    // Start spawning pipes
    createPipe();
    pipeSpawnInterval = setInterval(() => {
        if (lastPipePosition <= 5) {
            createPipe();
        }
    }, 100);

    // Show settings button when game starts
    toggleSettingsButton.style.display = 'block';
    settingsPanel.style.display = 'none';
}

// End the game
function endGame() {
    gameOver = true;
    clearInterval(pipeSpawnInterval);
    finalScoreElement.textContent = `Score: ${score}`;
    gameOverElement.style.display = 'block';
}

// Restart the game
function restartGame() {
    gameOverElement.style.display = 'none';
    startGame();
}

// Check for collisions
function checkCollisions() {
    // Ground collision
    if (bird.position.y < -2.8) {
        endGame();
        return;
    }

    // Ceiling collision
    if (bird.position.y > 3) {
        endGame();
        return;
    }

    // Pipe collisions
    for (const pipe of pipes) {
        const birdBox = new THREE.Box3().setFromObject(bird);
        const topPipeBox = new THREE.Box3().setFromObject(pipe.top);
        const bottomPipeBox = new THREE.Box3().setFromObject(pipe.bottom);

        if (birdBox.intersectsBox(topPipeBox) || birdBox.intersectsBox(bottomPipeBox)) {
            endGame();
            return;
        }

        // Score when passing a pipe
        if (!pipe.passed && pipe.top.position.x < bird.position.x) {
            pipe.passed = true;
            score++;
            scoreElement.textContent = `Score: ${score}`;
        }
    }
}

// Update game state
function update() {
    if (!gameStarted || gameOver) return;

    // Apply gravity to bird
    birdVelocity -= gravity;
    bird.position.y += birdVelocity;

    // Rotate bird based on velocity
    bird.rotation.z = THREE.MathUtils.clamp(birdVelocity * 3, -Math.PI / 4, Math.PI / 4);

    // Move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.top.position.x -= speed;
        pipe.bottom.position.x -= speed;

        // Remove pipes that are off-screen
        if (pipe.top.position.x < -10) {
            scene.remove(pipe.top);
            scene.remove(pipe.bottom);
            pipes.splice(i, 1);
        }
    }

    // Update last pipe position
    if (pipes.length > 0) {
        lastPipePosition = pipes[pipes.length - 1].top.position.x;
    }

    // Check for collisions
    checkCollisions();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Toggle settings panel
function toggleSettings() {
    if (settingsPanel.style.display === 'none') {
        settingsPanel.style.display = 'block';
        toggleSettingsButton.style.display = 'none';
    } else {
        settingsPanel.style.display = 'none';
        toggleSettingsButton.style.display = 'block';
    }
}

// Update gravity
function updateGravity() {
    gravity = parseFloat(gravitySlider.value);
    gravityValue.textContent = gravity.toFixed(4);
}

// Update jump force
function updateJumpForce() {
    jumpForce = parseFloat(jumpForceSlider.value);
    jumpForceValue.textContent = jumpForce.toFixed(2);
}

// Update game speed
function updateSpeed() {
    speed = parseFloat(speedSlider.value);
    speedValue.textContent = speed.toFixed(2);
}

// Update gap size
function updateGapSize() {
    gapSize = parseFloat(gapSizeSlider.value);
    gapSizeValue.textContent = gapSize.toFixed(1);
}

// Initialize the game when the page loads
window.onload = init; 