class LoadingScreen {
    constructor() {
        // This class will access global variables from sketch.js
    }

    getStageProgress(currentStage, stageStartFrame, comet, firstTargetPosition, secondTargetPosition, STAGE_CONFIG) {
        const elapsedFrames = frameCount - stageStartFrame;
        let progress = 0;
        
        if (currentStage === 0) {
            progress = elapsedFrames / SECONDS_TO_FRAMES(STAGE_CONFIG.delayBeforeAppear);
        } else if (currentStage === 1) {
            // Progress based on distance traveled
            const totalDistance = calc_distance(comet.startPosition, firstTargetPosition);
            const remainingDistance = calc_distance(comet.position, firstTargetPosition);
            if (totalDistance > 0) {
                progress = 1 - (remainingDistance / totalDistance);
            }
        } else if (currentStage === 2) {
            progress = elapsedFrames / SECONDS_TO_FRAMES(STAGE_CONFIG.stayAtFirstTarget);
        } else if (currentStage === 3) {
            // Progress based on distance traveled
            const totalDistance = calc_distance(comet.startPosition, secondTargetPosition);
            const remainingDistance = calc_distance(comet.position, secondTargetPosition);
            if (totalDistance > 0) {
                progress = 1 - (remainingDistance / totalDistance);
            }
        }
        
        return constrain(progress, 0, 1);
    }

    render(currentStage, stageStartFrame, comet, firstTargetPosition, secondTargetPosition, STAGE_CONFIG) {
        const elapsedFrames = frameCount - stageStartFrame;
        let timeRemaining = 0;
        let stageName = "";
        
        if (currentStage === 0) {
            timeRemaining = STAGE_CONFIG.delayBeforeAppear - FRAMES_TO_SECONDS(elapsedFrames);
            stageName = "Comet appearing in";
        } else if (currentStage === 1) {
            const distance = calc_distance(comet.position, firstTargetPosition);
            const speed = comet.speed;
            if (speed > 0) {
                timeRemaining = distance / speed / 60; // Convert frames to seconds
            }
            stageName = "Moving towards Earth";
        } else if (currentStage === 2) {
            timeRemaining = STAGE_CONFIG.stayAtFirstTarget - FRAMES_TO_SECONDS(elapsedFrames);
            stageName = "Hovering around Earth";
        } else if (currentStage === 3) {
            const distance = calc_distance(comet.position, secondTargetPosition);
            const speed = comet.speed;
            if (speed > 0) {
                timeRemaining = distance / speed / 60; // Convert frames to seconds
            }
            stageName = "Moving away";
        }
        
        // Display countdown at bottom (relative to screen size)
        fill(100);
        textAlign(CENTER);
        textSize(max(12, width * 0.025)); // Responsive text size
        
        // Format time with minutes if > 60 seconds
        let timeText = "";
        const totalSeconds = max(0, floor(timeRemaining));
        if (totalSeconds >= 60) {
            const minutes = floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            timeText = `${minutes} m ${seconds} s`;
        } else {
            timeText = `${totalSeconds} s`;
        }
        
        const countdownText = `${stageName}: ${timeText}`;
        text(countdownText, width / 2, height - height * 0.1);
        
        // Render progress bar
        const progress = this.getStageProgress(currentStage, stageStartFrame, comet, firstTargetPosition, secondTargetPosition, STAGE_CONFIG);
        this.renderProgressBar(progress);
    }

    renderProgressBar(progress) {
        const barWidth = width * 0.6;
        const barHeight = max(6, height * 0.015); // Responsive bar height
        const barX = (width - barWidth) / 2;
        const barY = height - height * 0.06; // Relative to screen height
        
        // Background bar
        fill(50);
        noStroke();
        rect(barX, barY, barWidth, barHeight, 4);
        
        // Progress bar
        fill(200);
        rect(barX, barY, barWidth * progress, barHeight, 4);
        
        // Border
        noFill();
        stroke(150);
        strokeWeight(1);
        rect(barX, barY, barWidth, barHeight, 4);
    }
}

