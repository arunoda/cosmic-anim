class Comet {
    constructor(startPosition, size) {
        this.startPosition = createVector(startPosition.x, startPosition.y);
        this.position = createVector(startPosition.x, startPosition.y);
        this.target = this.position;
        this.speed = 0;
        this.size = size;
        this.totalDistance = 0;
        this.allowRender = true;

        // Visual trail
        this.trail = [];
        this.maxTrailLength = 80;
        this.lastVelocity = createVector(0, 0);
    }

    show(canShow) {
        this.allowRender = canShow;
    }

    setTarget(targetPosition, speed) {
        this.startPosition = createVector(this.position.x, this.position.y);
        this.target = targetPosition;
        this.speed = speed;

        this.totalDistance = calc_distance(this.target, this.startPosition);

        // When starting a new moving leg of the journey, reset the tail
        // so that the approach to each target looks similar.
        if (this.speed > 0) {
            this.trail = [this.position.copy()];
        }
    }

    update() {
        if (!this.allowRender) {
            return;
        }

        // --- Motion ---
        const toTarget = p5.Vector.sub(this.target, this.position);
        const distance = toTarget.mag();

        const thresholdDistance = min(10, this.totalDistance / 10);
        let velocity;
        if (distance < thresholdDistance) {
            // If very close to target, use a scaled direction or zero velocity
            if (distance < 0.01) {
                velocity = createVector(0, 0);
            } else {
                const targetDirection = p5.Vector.normalize(toTarget);
                velocity = p5.Vector.mult(
                    targetDirection,
                    min(this.speed, distance * 0.1)
                );
            }
        } else {
            // Normalize only if distance is significant
            const targetDirection = p5.Vector.normalize(toTarget);
            velocity = p5.Vector.mult(targetDirection, this.speed);
        }

        this.position.add(velocity);
        this.lastVelocity = velocity.copy();

        // Keep a short position history to render the tail.
        // Only add new points when we actually move a bit, but the
        // tail will continue to render even when velocity is very small.
        if (velocity.mag() > 0.05) {
            this.trail.push(this.position.copy());
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        // Update size based on distance from first target
        this.updateSize();

        // --- Rendering ---
        this.renderTail();
        this.renderHead();
    }

    updateSize() {
        const distanceFromFirstTarget = calc_distance(
            this.position,
            firstTargetPosition
        );
        // Normalize distance (0 = at first target, 1 = at max distance)
        const normalizedDistance = min(
            distanceFromFirstTarget / COMET_SIZE_CONFIG.maxDistance,
            1
        );
        // Size is larger when closer to first target (inverse relationship)
        this.size = lerp(
            COMET_SIZE_CONFIG.maxSize,
            COMET_SIZE_CONFIG.minSize,
            normalizedDistance
        );
    }

    renderHead() {
        // Bright icy nucleus with a soft halo
        noStroke();

        // Outer halo
        const haloSize = this.size * 2.6;
        fill(255, 40);
        circle(this.position.x, this.position.y, haloSize);

        // Mid glow
        const glowSize = this.size * 1.8;
        fill(255, 100);
        circle(this.position.x, this.position.y, glowSize);

        // Solid core
        const coreSize = this.size * 0.9;
        fill(255);
        circle(this.position.x, this.position.y, coreSize);
    }

    renderTail() {
        if (this.trail.length < 2) return;

        // Use journey distance (from start to current position) to
        // control how prominent and long the tail is, independent of velocity.
        const journeyTraveled = calc_distance(this.startPosition, this.position);
        let journeyProgress = 0;
        if (this.totalDistance && this.totalDistance > 0) {
            journeyProgress = journeyTraveled / this.totalDistance;
        }
        journeyProgress = constrain(journeyProgress, 0, 1);

        // Use more of the trail in the middle of the journey, less at start/end.
        let effectiveLength = floor(
            this.trail.length * (0.2 + 0.8 * journeyProgress)
        );
        effectiveLength = constrain(effectiveLength, 2, this.trail.length);

        const startIndex = this.trail.length - effectiveLength;
        const segmentCount = effectiveLength - 1;

        // Smooth overall fade-in and fade-out of the whole tail over the journey.
        // Peaks around the middle of the path.
        const journeyAlphaScale = 0.3 + 0.7 * sin(journeyProgress * PI);

        stroke(255);
        noFill();

        // Slightly larger base weight for a thicker tail
        const baseWeight = max(1.2, this.size * 0.28);
        const maxAlpha = 140 * journeyAlphaScale;

        // Walk trail from head (near comet) towards far tail
        for (let i = this.trail.length - 1; i > startIndex; i--) {
            const idxFromHead = this.trail.length - 1 - i; // 0 at head
            const u = segmentCount > 0 ? idxFromHead / segmentCount : 0; // 0..1

            // Fade smoothly from bright near the head to faint at the far tail.
            const fade = (1 - u) * (1 - u); // quadratic for smoother falloff
            const alpha = maxAlpha * fade;
            const weight = baseWeight * (0.6 + 0.6 * fade);

            stroke(255, alpha);
            strokeWeight(weight);

            const p1 = this.trail[i];
            const p0 = this.trail[i - 1];
            line(p1.x, p1.y, p0.x, p0.y);
        }
    }
}



