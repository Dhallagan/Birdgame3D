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
let powerUps = [];

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

// Add sound effects
let jumpSound, scoreSound, crashSound;

// Add day/night cycle
let dayTime = true;
let cycleTime = 0;

// Add high score system
let highScore = 0;

// Add difficulty levels
let difficulty = 'medium'; // 'easy', 'medium', 'hard'

// Add a variable for tilt controls
let useTiltControls = false;

// Add a directionalLight variable at the top level
let directionalLight;

// Store clouds in an array to update their positions
let clouds = [];

// Add sun and moon variables
let sun, moon;
let skyColors = {
    day: new THREE.Color(0x87CEEB),    // Sky blue
    sunset: new THREE.Color(0xFF7F50),  // Coral/orange
    night: new THREE.Color(0x000033)    // Dark blue
};

// Add a variable to track active particle systems
let activeParticles = [];

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

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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

    // Load sounds
    loadSounds();

    // Load high score
    loadHighScore();

    // Create clouds
    createClouds();

    // Setup mobile controls
    setupMobileControls();

    // Create sun and moon
    createCelestialBodies();

    // Add debug controls
    window.addEventListener('keydown', function (event) {
        if (event.key === 'd') {
            // Toggle debug mode
            console.log('Sun position:', sun.position);
            console.log('Moon position:', moon.position);

            // Temporarily move camera to see celestial bodies
            camera.position.z = 20;
            camera.position.y = 5;
            camera.lookAt(0, 0, 0);

            // Reset camera after 3 seconds
            setTimeout(() => {
                camera.position.z = 5;
                camera.position.y = 0;
            }, 3000);
        }
    });
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

    // Possibly create a power-up
    createPowerUp();
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
    if (jumpSound && jumpSound.isPlaying) {
        jumpSound.stop();
    }
    if (jumpSound) {
        jumpSound.play();
    }
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

    // Clean up any active particles
    while (activeParticles.length > 0) {
        const particles = activeParticles.pop();
        scene.remove(particles);
    }
}

// End the game
function endGame() {
    gameOver = true;
    clearInterval(pipeSpawnInterval);
    finalScoreElement.textContent = `Score: ${score}`;
    gameOverElement.style.display = 'block';

    // Create crash particles at bird position
    createCrashParticles(bird.position.clone());

    // Play crash sound
    if (crashSound) {
        crashSound.play();
    }

    // Update high score
    updateHighScore();
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

            // Play score sound
            if (scoreSound) {
                scoreSound.play();
            }
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

    // Move clouds
    for (let i = 0; i < clouds.length; i++) {
        const cloud = clouds[i];

        // Move clouds at different speeds for parallax effect
        // Clouds further away (more negative z) move slower
        const cloudSpeed = speed * (0.5 + (cloud.position.z + 10) / 15);
        cloud.position.x -= cloudSpeed;

        // If cloud moves off-screen, reposition it to the right
        if (cloud.position.x < -15) {
            cloud.position.x = 25;
            cloud.position.y = Math.random() * 3 + 1;
            cloud.position.z = Math.random() * 5 - 10;
        }
    }

    // Move power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.mesh.position.x -= speed;
        powerUp.mesh.rotation.y += 0.02; // Rotate for visual effect

        // Check for collision with bird
        const birdBox = new THREE.Box3().setFromObject(bird);
        const powerUpBox = new THREE.Box3().setFromObject(powerUp.mesh);

        if (birdBox.intersectsBox(powerUpBox)) {
            // Apply power-up effect
            applyPowerUp(powerUp.type);

            // Remove power-up
            scene.remove(powerUp.mesh);
            powerUps.splice(i, 1);
        }

        // Remove power-ups that are off-screen
        if (powerUp.mesh.position.x < -10) {
            scene.remove(powerUp.mesh);
            powerUps.splice(i, 1);
        }
    }

    // Update last pipe position
    if (pipes.length > 0) {
        lastPipePosition = pipes[pipes.length - 1].top.position.x;
    }

    // Update day/night cycle
    updateDayNightCycle();

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

// Add a skybox for a more immersive environment
function createSkybox() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        'assets/skybox/right.jpg',
        'assets/skybox/left.jpg',
        'assets/skybox/top.jpg',
        'assets/skybox/bottom.jpg',
        'assets/skybox/front.jpg',
        'assets/skybox/back.jpg',
    ]);
    scene.background = texture;
}

// Add clouds to the background
function createClouds() {
    // Clear any existing clouds
    clouds.forEach(cloud => scene.remove(cloud));
    clouds = [];

    const cloudGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const cloudMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

    for (let i = 0; i < 20; i++) {
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

        // Position clouds across the entire visible area and beyond
        cloud.position.set(
            Math.random() * 40 - 10, // Position some clouds ahead of the player
            Math.random() * 3 + 1,
            Math.random() * 5 - 10
        );

        // Make clouds different sizes
        const scale = Math.random() * 1 + 0.5;
        cloud.scale.set(
            scale * (Math.random() * 0.5 + 1),
            scale * 0.5,
            scale * (Math.random() * 0.5 + 0.8)
        );

        scene.add(cloud);
        clouds.push(cloud);
    }
}

// Load sounds
function loadSounds() {
    const audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    // Create sound objects
    jumpSound = new THREE.Audio(audioListener);
    scoreSound = new THREE.Audio(audioListener);
    crashSound = new THREE.Audio(audioListener);

    // Load sound files
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load('sounds/jump.mp3', function (buffer) {
        jumpSound.setBuffer(buffer);
        jumpSound.setVolume(0.5);
    });

    audioLoader.load('sounds/score.mp3', function (buffer) {
        scoreSound.setBuffer(buffer);
        scoreSound.setVolume(0.5);
    });

    audioLoader.load('sounds/crash.mp3', function (buffer) {
        crashSound.setBuffer(buffer);
        crashSound.setVolume(0.5);
    });
}

// Add particle effects when bird crashes
function createCrashParticles(position) {
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 50;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;

        colors[i * 3] = 1;  // R
        colors[i * 3 + 1] = 1;  // G
        colors[i * 3 + 2] = 0;  // B (yellow particles)
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Add to active particles array
    activeParticles.push(particles);

    // Animate particles
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
        velocities.push({
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.2,
            z: (Math.random() - 0.5) * 0.2
        });
    }

    let animationFrameId;
    let lifetime = 0;
    const maxLifetime = 120; // About 2 seconds at 60fps

    function animateParticles() {
        lifetime++;

        // Stop animation after max lifetime
        if (lifetime > maxLifetime) {
            scene.remove(particles);
            const index = activeParticles.indexOf(particles);
            if (index > -1) {
                activeParticles.splice(index, 1);
            }
            return;
        }

        const positions = particleGeometry.attributes.position.array;

        // Fade out particles over time
        particleMaterial.opacity = 1 - (lifetime / maxLifetime);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;

            // Apply gravity to particles
            velocities[i].y -= 0.001;
        }

        particleGeometry.attributes.position.needsUpdate = true;

        animationFrameId = requestAnimationFrame(animateParticles);
    }

    animateParticles();

    // Return a function to stop the animation if needed
    return function stopAnimation() {
        cancelAnimationFrame(animationFrameId);
        scene.remove(particles);
        const index = activeParticles.indexOf(particles);
        if (index > -1) {
            activeParticles.splice(index, 1);
        }
    };
}

// Add power-ups
function createPowerUp() {
    // 10% chance to create a power-up
    if (Math.random() > 0.1) return;

    const types = ['shield', 'slowTime', 'extraLife'];
    const type = types[Math.floor(Math.random() * types.length)];

    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    let material;

    switch (type) {
        case 'shield':
            material = new THREE.MeshPhongMaterial({ color: 0x00FFFF });
            break;
        case 'slowTime':
            material = new THREE.MeshPhongMaterial({ color: 0xFF00FF });
            break;
        case 'extraLife':
            material = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
            break;
    }

    const powerUp = new THREE.Mesh(geometry, material);

    // Position power-up between pipes
    const lastPipe = pipes[pipes.length - 1];
    if (lastPipe) {
        const gapPosition = (lastPipe.top.position.y - lastPipe.top.geometry.parameters.height / 2 +
            lastPipe.bottom.position.y + lastPipe.bottom.geometry.parameters.height / 2) / 2;

        powerUp.position.set(lastPipe.top.position.x, gapPosition, 0);
    } else {
        powerUp.position.set(10, 0, 0);
    }

    scene.add(powerUp);
    powerUps.push({ mesh: powerUp, type: type });
}

// Create sun and moon in the init function
function createCelestialBodies() {
    // Create sun with glow effect
    const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 1
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(15, -5, -15); // Moved closer to camera
    scene.add(sun);

    // Add sun glow
    const sunGlowGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFDD00,
        transparent: true,
        opacity: 0.4
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sun.add(sunGlow);

    // Create moon with subtle glow
    const moonGeometry = new THREE.SphereGeometry(1, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({
        color: 0xEEEEEE,
        emissive: 0x555555,
        emissiveIntensity: 0.5
    });
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(-15, 10, -15); // Moved closer to camera
    scene.add(moon);

    // Add moon glow
    const moonGlowGeometry = new THREE.SphereGeometry(1.3, 32, 32);
    const moonGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xCCCCFF,
        transparent: true,
        opacity: 0.3
    });
    const moonGlow = new THREE.Mesh(moonGlowGeometry, moonGlowMaterial);
    moon.add(moonGlow);
}

// Update day/night cycle
function updateDayNightCycle() {
    cycleTime += 0.0002;
    if (cycleTime > 1) cycleTime = 0;

    // Calculate sun and moon positions based on cycle time
    // Sun moves in a semicircle from left to right
    const sunAngle = Math.PI * cycleTime;
    sun.position.x = 20 * Math.cos(sunAngle);
    sun.position.y = 15 * Math.sin(sunAngle) - 5; // Higher arc

    // Moon moves opposite to the sun
    const moonAngle = Math.PI * (cycleTime + 1);
    moon.position.x = 20 * Math.cos(moonAngle);
    moon.position.y = 15 * Math.sin(moonAngle) - 5; // Higher arc

    // Make sun and moon face the camera
    sun.lookAt(camera.position);
    moon.lookAt(camera.position);

    // Adjust lighting based on time of day
    if (cycleTime < 0.25) {
        // Dawn: gradually increase light
        const t = cycleTime * 4; // normalize to 0-1
        directionalLight.intensity = 0.3 + t * 0.5;
        scene.background = new THREE.Color().lerpColors(
            skyColors.night,
            skyColors.sunset,
            t
        );
    }
    else if (cycleTime < 0.3) {
        // Sunrise: transition from sunrise to day
        const t = (cycleTime - 0.25) * 20; // normalize to 0-1
        directionalLight.intensity = 0.8;
        scene.background = new THREE.Color().lerpColors(
            skyColors.sunset,
            skyColors.day,
            t
        );
    }
    else if (cycleTime < 0.7) {
        // Day: full brightness
        directionalLight.intensity = 0.8;
        scene.background = skyColors.day;
    }
    else if (cycleTime < 0.75) {
        // Sunset: transition from day to sunset
        const t = (cycleTime - 0.7) * 20; // normalize to 0-1
        directionalLight.intensity = 0.8 - t * 0.3;
        scene.background = new THREE.Color().lerpColors(
            skyColors.day,
            skyColors.sunset,
            t
        );
    }
    else if (cycleTime < 0.8) {
        // Dusk: transition from sunset to night
        const t = (cycleTime - 0.75) * 20; // normalize to 0-1
        directionalLight.intensity = 0.5 - t * 0.2;
        scene.background = new THREE.Color().lerpColors(
            skyColors.sunset,
            skyColors.night,
            t
        );
    }
    else {
        // Night: low light
        directionalLight.intensity = 0.3;
        scene.background = skyColors.night;
    }
}

// Improve mobile controls
function setupMobileControls() {
    // Add touch controls for mobile
    document.addEventListener('touchstart', onTouchStart);

    // Add device orientation controls
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function (event) {
            // Only use tilt controls if enabled in settings
            if (useTiltControls && gameStarted && !gameOver) {
                const tilt = event.beta; // Front-to-back tilt in degrees

                // Apply a small upward force based on forward tilt
                if (tilt < 45) { // Only apply when phone is tilted forward
                    birdVelocity += (45 - tilt) * 0.0003;
                }
            }
        });
    }
}

// Update high score
function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBird3dHighScore', highScore);

        // Update high score display
        document.getElementById('highScore').textContent = `High Score: ${highScore}`;
    }
}

function loadHighScore() {
    const savedHighScore = localStorage.getItem('flappyBird3dHighScore');
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
        document.getElementById('highScore').textContent = `High Score: ${highScore}`;
    }
}

// Add difficulty levels
function setDifficulty(level) {
    difficulty = level;

    switch (level) {
        case 'easy':
            gravity = 0.0012;
            jumpForce = 0.07;
            speed = 0.04;
            gapSize = 2.5;
            break;
        case 'medium':
            gravity = 0.0018;
            jumpForce = 0.05;
            speed = 0.05;
            gapSize = 2.0;
            break;
        case 'hard':
            gravity = 0.0025;
            jumpForce = 0.04;
            speed = 0.07;
            gapSize = 1.7;
            break;
    }

    // Update sliders
    gravitySlider.value = gravity;
    jumpForceSlider.value = jumpForce;
    speedSlider.value = speed;
    gapSizeSlider.value = gapSize;

    // Update displayed values
    gravityValue.textContent = gravity.toFixed(4);
    jumpForceValue.textContent = jumpForce.toFixed(2);
    speedValue.textContent = speed.toFixed(2);
    gapSizeValue.textContent = gapSize.toFixed(1);
}

// Apply power-up effect
function applyPowerUp(type) {
    switch (type) {
        case 'shield':
            // Make bird temporarily invincible
            bird.material.color.set(0x00FFFF);
            setTimeout(() => {
                bird.material.color.set(0xFFFF00);
            }, 5000);
            break;

        case 'slowTime':
            // Slow down game speed temporarily
            const originalSpeed = speed;
            speed = speed / 2;
            setTimeout(() => {
                speed = originalSpeed;
            }, 5000);
            break;

        case 'extraLife':
            // Increment score
            score += 5;
            scoreElement.textContent = `Score: ${score}`;
            if (scoreSound) {
                scoreSound.play();
            }
            break;
    }
}

// Initialize the game when the page loads
window.onload = init; 