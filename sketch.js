let earth;
let comet;
let loadingScreen;
let configUI;

// Stage configuration (in seconds)
let STAGE_CONFIG = {
    delayBeforeAppear: 1,      // Time before comet appears
    timeToFirstTarget: 4,      // Time to reach first target (close to earth)
    stayAtFirstTarget: 5,      // Time to stay at first target
    timeToSecondTarget: 1      // Time to reach second target (away from earth)
};

let currentStage = 0; // 0: waiting, 1: moving to first, 2: staying, 3: moving to second
let stageStartFrame = 0;
let firstTargetPosition;
let secondTargetPosition;
let positionRestored = false; // Flag to track if position was restored from localStorage
let lastSavedPosition = null; // Track last saved position to avoid unnecessary saves
let lastSaveTime = 0; // Throttle position saves
const POSITION_SAVE_INTERVAL = 100; // Save position every 100ms (10 times per second)

// Tab ownership for animation view
let tabId = null; // Unique ID for this tab
let isShowingAnimation = false; // Whether this tab is showing the animation
let animationOwnerTabId = null; // Which tab currently owns the animation view
let lastCommandTimestamp = 0; // Track last processed command timestamp

// Comet size configuration
const COMET_SIZE_CONFIG = {
    minSize: 1,        // Minimum size when far from first target
    maxSize: 20,       // Maximum size when at first target
    maxDistance: null  // Will be calculated based on canvas diagonal
};

function SECONDS_TO_FRAMES(seconds) {
    const fps = 60;
    return seconds * fps;
}

function FRAMES_TO_SECONDS(frames) {
    const fps = 60;
    return frames / fps;
}

function calc_distance(x, y) {
    return p5.Vector.sub(y, x).mag();
}

function setup() {
    // Runs once - use full window size
    createCanvas(windowWidth, windowHeight);

    // Calculate max distance based on canvas diagonal
    COMET_SIZE_CONFIG.maxDistance = sqrt(width * width + height * height);

    earth = new Earth();
    loadingScreen = new LoadingScreen();

    // Comet starts at top-left corner (relative position)
    comet = new Comet(createVector(width * 0.05, height * 0.05), 10);
    comet.show(false); // Start hidden

    // First target: close to earth (center of screen)
    firstTargetPosition = createVector(width/2, height/2);
    
    // Second target: away from earth (top-right area)
    secondTargetPosition = createVector(width * 0.7, height * 0.3);

    currentStage = 0;
    stageStartFrame = frameCount;

    // Generate unique tab ID
    tabId = generateTabId();
    
    // Initialize config UI
    configUI = new ConfigUI(STAGE_CONFIG, resetAnimation, startFromStage, claimAnimationView, sendRemoteCommand);
    configUI.init();

    // Check if this tab should show animation or config-only
    checkAnimationOwnership();

    // Try to restore position from localStorage
    loadAndRestorePosition();

    // Set up cross-tab synchronization
    setupCrossTabSync();
    
    // Check for any pending remote commands immediately
    checkRemoteCommands();
}

function generateTabId() {
    // Generate a unique ID for this tab
    let id = sessionStorage.getItem('cosmicTabId');
    if (!id) {
        id = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem('cosmicTabId', id);
    }
    return id;
}

function checkAnimationOwnership() {
    try {
        const owner = localStorage.getItem('cosmicAnimationOwner');
        if (!owner) {
            // No owner yet, claim it
            claimAnimationView();
        } else if (owner === tabId) {
            // This tab owns it
            isShowingAnimation = true;
            if (configUI) {
                configUI.updateViewMode(true);
            }
        } else {
            // Another tab owns it, show config-only
            isShowingAnimation = false;
            if (configUI) {
                configUI.updateViewMode(false);
            }
        }
    } catch (e) {
        console.warn("Could not check animation ownership:", e);
        // Default to showing animation if we can't check
        isShowingAnimation = true;
        if (configUI) {
            configUI.updateViewMode(true);
        }
    }
}

function claimAnimationView() {
    try {
        localStorage.setItem('cosmicAnimationOwner', tabId);
        isShowingAnimation = true;
        if (configUI) {
            configUI.updateViewMode(isShowingAnimation);
        }
    } catch (e) {
        console.warn("Could not claim animation view:", e);
    }
}

function resetAnimation() {
    // Reset comet to initial position
    const initialPos = createVector(width * 0.05, height * 0.05);
    comet.position = initialPos;
    comet.startPosition = initialPos;
    comet.target = initialPos;
    comet.speed = 0;
    comet.totalDistance = 0;
    comet.trail = [];
    comet.show(false);
    
    // Reset stage
    currentStage = 0;
    stageStartFrame = frameCount;
    positionRestored = false;
    
    // Clear saved position from localStorage
    clearSavedPosition();
}

function startFromStage(stage, seconds = 0) {
    const initialPos = createVector(width * 0.05, height * 0.05);
    const secondsOffset = seconds || 0;
    const framesOffset = SECONDS_TO_FRAMES(secondsOffset);
    
    if (stage === 0) {
        // Stage 0: Waiting for comet to appear
        comet.position = initialPos;
        comet.startPosition = initialPos;
        comet.target = initialPos;
        comet.speed = 0;
        comet.totalDistance = 0;
        comet.trail = [];
        comet.show(false);
        currentStage = 0;
        stageStartFrame = frameCount - framesOffset;
    } else if (stage === 1) {
        // Stage 1: Moving to first target
        comet.position = initialPos;
        comet.startPosition = initialPos;
        comet.show(true);
        const speed = calc_distance(firstTargetPosition, comet.position) / SECONDS_TO_FRAMES(STAGE_CONFIG.timeToFirstTarget);
        comet.setTarget(firstTargetPosition, speed);
        currentStage = 1;
        stageStartFrame = frameCount - framesOffset;
        
        // If jumping forward in time, update comet position
        if (secondsOffset > 0) {
            const progress = Math.min(secondsOffset / STAGE_CONFIG.timeToFirstTarget, 1);
            const direction = p5.Vector.sub(firstTargetPosition, initialPos);
            comet.position = p5.Vector.add(initialPos, p5.Vector.mult(direction, progress));
            comet.update();
        }
    } else if (stage === 2) {
        // Stage 2: Staying at first target
        comet.position = createVector(firstTargetPosition.x, firstTargetPosition.y);
        comet.startPosition = firstTargetPosition;
        comet.target = firstTargetPosition;
        comet.speed = 0;
        comet.totalDistance = 0;
        comet.trail = [];
        comet.show(false); // Hide comet at first target
        currentStage = 2;
        stageStartFrame = frameCount - framesOffset;
    } else if (stage === 3) {
        // Stage 3: Moving to second target
        comet.position = createVector(firstTargetPosition.x, firstTargetPosition.y);
        comet.startPosition = firstTargetPosition;
        comet.show(true); // Show comet when moving to second target
        const speed = calc_distance(secondTargetPosition, comet.position) / SECONDS_TO_FRAMES(STAGE_CONFIG.timeToSecondTarget);
        comet.setTarget(secondTargetPosition, speed);
        currentStage = 3;
        stageStartFrame = frameCount - framesOffset;
        
        // If jumping forward in time, update comet position
        if (secondsOffset > 0) {
            const progress = Math.min(secondsOffset / STAGE_CONFIG.timeToSecondTarget, 1);
            const direction = p5.Vector.sub(secondTargetPosition, firstTargetPosition);
            comet.position = p5.Vector.add(firstTargetPosition, p5.Vector.mult(direction, progress));
            comet.update();
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
    // Recalculate max distance
    COMET_SIZE_CONFIG.maxDistance = sqrt(width * width + height * height);
    
    // Update Earth position
    if (earth) {
        earth.updatePosition();
    }
    
    // Update target positions
    firstTargetPosition = createVector(width/2, height/2);
    secondTargetPosition = createVector(width * 0.7, height * 0.3);
    
    // Update config panel position
    if (configUI) {
        configUI.updatePanelPosition();
    }
}

function draw() {
    // Runs every frame (default ~60 fps)
    background(30);

    // Check for remote commands (both animation and config-only tabs)
    checkRemoteCommands();

    if (isShowingAnimation) {
        // Show animation view
        updateStages();
        
        // Save current position to localStorage (throttled)
        const now = Date.now();
        if (now - lastSaveTime >= POSITION_SAVE_INTERVAL) {
            saveCurrentPosition();
            lastSaveTime = now;
        }
        
        earth.render();
        comet.update();
        loadingScreen.render(currentStage, stageStartFrame, comet, firstTargetPosition, secondTargetPosition, STAGE_CONFIG);

        // Render config UI (overlay)
        if (configUI) {
            configUI.render();
        }

        if (keyIsDown("h") || keyIsDown("H")) {
            comet.show(false);
        }
    } else {
        // Show config-only view
        if (configUI) {
            configUI.renderConfigOnly();
        }
    }
}

function saveCurrentPosition() {
    try {
        const elapsedFrames = frameCount - stageStartFrame;
        const elapsedSeconds = FRAMES_TO_SECONDS(elapsedFrames);
        
        const positionData = {
            stage: currentStage,
            seconds: elapsedSeconds,
            timestamp: Date.now() // Add timestamp to detect changes
        };
        
        // Only save if position actually changed (to reduce storage events)
        const positionKey = `${currentStage}-${elapsedSeconds.toFixed(2)}`;
        if (lastSavedPosition !== positionKey) {
            localStorage.setItem("cosmicCurrentPosition", JSON.stringify(positionData));
            lastSavedPosition = positionKey;
        }
    } catch (e) {
        console.warn("Could not save position to localStorage:", e);
    }
}

function setupCrossTabSync() {
    // Listen for storage events from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'cosmicAnimationOwner' && e.newValue) {
            // Animation ownership changed
            if (e.newValue === tabId) {
                // This tab now owns the animation
                isShowingAnimation = true;
                if (configUI) {
                    configUI.updateViewMode(true);
                }
            } else {
                // Another tab owns the animation
                isShowingAnimation = false;
                if (configUI) {
                    configUI.updateViewMode(false);
                }
            }
        } else if (e.key === 'cosmicAnimationCommand' && e.newValue && isShowingAnimation) {
            // Remote command received (only process if we're showing animation)
            try {
                const command = JSON.parse(e.newValue);
                // Only process if it's a new command (different timestamp)
                if (command.timestamp && command.timestamp > lastCommandTimestamp) {
                    lastCommandTimestamp = command.timestamp;
                    executeRemoteCommand(command);
                }
            } catch (err) {
                console.warn("Could not execute remote command:", err);
            }
        } else if (e.key === 'cosmicCurrentPosition' && e.newValue && isShowingAnimation) {
            // Position changed in another tab (only sync if we're showing animation)
            try {
                const positionData = JSON.parse(e.newValue);
                const stage = positionData.stage || 0;
                const seconds = positionData.seconds || 0;
                
                // Only sync if the data is valid
                if (stage >= 0 && stage <= 3 && seconds >= 0) {
                    startFromStage(stage, seconds);
                }
            } catch (err) {
                console.warn("Could not sync position from other tab:", err);
            }
        } else if (e.key === 'cosmicStageConfig' && e.newValue) {
            // Config changed in another tab
            try {
                const parsed = JSON.parse(e.newValue);
                // Update the config object
                STAGE_CONFIG.delayBeforeAppear = parsed.delayBeforeAppear ?? STAGE_CONFIG.delayBeforeAppear;
                STAGE_CONFIG.timeToFirstTarget = parsed.timeToFirstTarget ?? STAGE_CONFIG.timeToFirstTarget;
                STAGE_CONFIG.stayAtFirstTarget = parsed.stayAtFirstTarget ?? STAGE_CONFIG.stayAtFirstTarget;
                STAGE_CONFIG.timeToSecondTarget = parsed.timeToSecondTarget ?? STAGE_CONFIG.timeToSecondTarget;
                
                // Update the UI inputs
                if (configUI) {
                    configUI.updateInputValues();
                }
            } catch (err) {
                console.warn("Could not sync config from other tab:", err);
            }
        }
    });
    
    // Also check for commands on each frame (for same-tab commands)
    // This handles the case where a config-only tab sends a command
    // and we need to process it even if storage event doesn't fire
}

function executeRemoteCommand(command) {
    if (command.type === 'reset') {
        resetAnimation();
    } else if (command.type === 'startFromStage') {
        const stage = command.stage || 0;
        const seconds = command.seconds || 0;
        startFromStage(stage, seconds);
    }
}

function sendRemoteCommand(command) {
    try {
        const commandData = {
            ...command,
            timestamp: Date.now()
        };
        localStorage.setItem('cosmicAnimationCommand', JSON.stringify(commandData));
        // Clear the command after a short delay to allow storage event to fire
        setTimeout(() => {
            localStorage.removeItem('cosmicAnimationCommand');
        }, 100);
    } catch (e) {
        console.warn("Could not send remote command:", e);
    }
}

// Check for commands on each frame (handles same-tab and cross-tab)
function checkRemoteCommands() {
    try {
        const commandStr = localStorage.getItem('cosmicAnimationCommand');
        if (commandStr) {
            const command = JSON.parse(commandStr);
            // Only process if it's a new command (different timestamp)
            if (command.timestamp && command.timestamp > lastCommandTimestamp) {
                lastCommandTimestamp = command.timestamp;
                if (isShowingAnimation) {
                    executeRemoteCommand(command);
                }
            }
        }
    } catch (e) {
        // Ignore errors
    }
}

function loadAndRestorePosition() {
    try {
        const saved = localStorage.getItem("cosmicCurrentPosition");
        if (saved) {
            const positionData = JSON.parse(saved);
            const stage = positionData.stage || 0;
            const seconds = positionData.seconds || 0;
            
            // Restore the position using startFromStage
            if (stage >= 0 && stage <= 3 && seconds >= 0) {
                startFromStage(stage, seconds);
                positionRestored = true;
            }
        }
    } catch (e) {
        console.warn("Could not load position from localStorage:", e);
    }
}

function syncPositionFromStorage() {
    // This function can be called to manually sync position from storage
    // Useful for periodic syncing or when needed
    loadAndRestorePosition();
}

function clearSavedPosition() {
    try {
        localStorage.removeItem("cosmicCurrentPosition");
    } catch (e) {
        console.warn("Could not clear position from localStorage:", e);
    }
}

function updateStages() {
    const elapsedFrames = frameCount - stageStartFrame;
    
    if (currentStage === 0) {
        // Stage 0: Waiting for comet to appear
        comet.show(false);
        if (elapsedFrames >= SECONDS_TO_FRAMES(STAGE_CONFIG.delayBeforeAppear)) {
            // Start moving to first target
            currentStage = 1;
            stageStartFrame = frameCount;
            comet.show(true);
            const speed = calc_distance(firstTargetPosition, comet.position) / SECONDS_TO_FRAMES(STAGE_CONFIG.timeToFirstTarget);
            comet.setTarget(firstTargetPosition, speed);
        }
    } else if (currentStage === 1) {
        // Stage 1: Moving to first target
        const distance = calc_distance(comet.position, firstTargetPosition);
        if (distance < 1) {
            // Reached first target, hide comet and start staying
            currentStage = 2;
            stageStartFrame = frameCount;
            comet.setTarget(firstTargetPosition, 0); // Stop moving
            comet.show(false); // Hide comet when it reaches first target
        }
    } else if (currentStage === 2) {
        // Stage 2: Staying at first target
        if (elapsedFrames >= SECONDS_TO_FRAMES(STAGE_CONFIG.stayAtFirstTarget)) {
            // Start moving to second target
            currentStage = 3;
            stageStartFrame = frameCount;
            comet.show(true); // Show comet again to start moving
            const speed = calc_distance(secondTargetPosition, comet.position) / SECONDS_TO_FRAMES(STAGE_CONFIG.timeToSecondTarget);
            comet.setTarget(secondTargetPosition, speed);
        }
    } else if (currentStage === 3) {
        // Stage 3: Moving to second target
        const distance = calc_distance(comet.position, secondTargetPosition);
        if (distance < 1) {
            // Reached second target, hide comet
            comet.setTarget(secondTargetPosition, 0); // Stop moving
            comet.show(false); // Hide comet when it reaches second target
        }
    }
}