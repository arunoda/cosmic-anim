class Comet {
    constructor(startPosition, size) {
        this.startPosition = createVector(startPosition.x, startPosition.y);
        this.position = createVector(startPosition.x, startPosition.y);
        this.target = this.position;
        this.speed = 0;
        this.size = size;
        this.totalDistance = 0;
        this.allowRender = true;
    }

    show(canShow) {
        this.allowRender = canShow;
    }

    setTarget(targetPosition, speed) {
        this.startPosition = createVector(this.position.x, this.position.y);
        this.target = targetPosition;
        this.speed = speed;

        this.totalDistance = calc_distance(this.target, this.startPosition);
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
        fill(50);
        circle(this.position.x, this.position.y, haloSize);

        // Mid glow
        const glowSize = this.size * 1.8;
        fill(150);
        circle(this.position.x, this.position.y, glowSize);

        // Solid core
        const coreSize = this.size * 0.9;
        fill(255);
        circle(this.position.x, this.position.y, coreSize);
    }

    renderTail() {
        // Only render tail if comet is moving toward a target
        if (this.speed <= 0 || this.totalDistance <= 0) {
            return;
        }

        // Calculate direction from comet to target
        const toTarget = p5.Vector.sub(this.target, this.position);
        const distance = toTarget.mag();
        
        // If already at target, don't render tail
        if (distance < 0.01) {
            return;
        }

        // Normalize direction and reverse it (tail points away from target, opposite to travel direction)
        const direction = p5.Vector.mult(p5.Vector.normalize(toTarget), -1);

        // Calculate journey progress (0 = at start, 1 = at target)
        const journeyTraveled = calc_distance(this.startPosition, this.position);
        let journeyProgress = 0;
        if (this.totalDistance && this.totalDistance > 0) {
            journeyProgress = journeyTraveled / this.totalDistance;
        }
        journeyProgress = constrain(journeyProgress, 0, 1);

        // Tail size follows a bell curve: nothing at start, maximum in middle, nothing at end
        // Using sin(progress * PI) creates a smooth curve that peaks at 0.5 (middle)
        const tailSizeScale = min(1, sin(journeyProgress * PI) * 1.5);

        // Tail properties - scaled by journey progress
        const baseTailLength = this.size * 8; // Base tail length proportional to comet size
        const baseTailStartWidth = this.size * 0.6; // Base width at base (near comet)
        const tailLength = baseTailLength * tailSizeScale;
        const tailStartWidth = baseTailStartWidth * tailSizeScale;
        const tailEndWidth = this.size * 0.1 * tailSizeScale; // Width at tip

        // Calculate tail start position (slightly offset from comet center, behind comet)
        const tailStart = p5.Vector.add(
            this.position,
            p5.Vector.mult(direction, this.size * 0.5)
        );
        
        // Calculate tail end position (extending away from target)
        const tailEnd = p5.Vector.add(tailStart, p5.Vector.mult(direction, tailLength));

        // Draw tail as a gradient triangle/quad
        noStroke();
        
        // Create perpendicular vector for tail width
        const perpendicular = createVector(-direction.y, direction.x);
        
        // Calculate tail vertices
        const startLeft = p5.Vector.add(tailStart, p5.Vector.mult(perpendicular, tailStartWidth / 2));
        const startRight = p5.Vector.add(tailStart, p5.Vector.mult(perpendicular, -tailStartWidth / 2));
        const endLeft = p5.Vector.add(tailEnd, p5.Vector.mult(perpendicular, tailEndWidth / 2));
        const endRight = p5.Vector.add(tailEnd, p5.Vector.mult(perpendicular, -tailEndWidth / 2));

        // Draw tail with gradient fade
        // Use multiple segments for smooth gradient
        const segments = 20;
        for (let i = 0; i < segments; i++) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;
            
            // Calculate positions along tail
            const p1Left = p5.Vector.lerp(startLeft, endLeft, t1);
            const p1Right = p5.Vector.lerp(startRight, endRight, t1);
            const p2Left = p5.Vector.lerp(startLeft, endLeft, t2);
            const p2Right = p5.Vector.lerp(startRight, endRight, t2);
            
            // Fade from bright at start to transparent at end
            // Also scale by journey progress so tail fades at start and end of journey
            const segmentFade = (1 - t1) * (1 - t1); // Quadratic fade along tail
            const alpha = 255 * segmentFade * tailSizeScale;
            
            fill(255, alpha);
            beginShape();
            vertex(p1Left.x, p1Left.y);
            vertex(p1Right.x, p1Right.y);
            vertex(p2Right.x, p2Right.y);
            vertex(p2Left.x, p2Left.y);
            endShape(CLOSE);
        }
    }
}



