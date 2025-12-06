class Earth {
    constructor() {
        this.updatePosition();
    }

    updatePosition() {
        // Radius scales more aggressively with width
        // Using a larger multiplier so Earth gets bigger as width increases
        this.radius = width * 0.8;

        // Visible height is 25% of height (only top portion of circle visible)
        const visibleHeight = height * 0.25;

        // Position circle center so that the top arc of the circle is visible
        // The visible portion goes from (height - visibleHeight) to height
        // Circle center y = height - visibleHeight + radius
        // This positions the circle so only the top portion is visible
        this.position = createVector(width / 2, height - visibleHeight + this.radius);
    }

    render() {
        // City skyline + trees along the visible horizon,
        // aligned with the curvature of the Earth.
        this.renderBuildings();

        // Draw Earth on top so the skyline appears to emerge from it,
        // removing any visible gap between buildings and the surface.
        fill(230);
        noStroke();
        circle(this.position.x, this.position.y, this.radius * 2);
    }

    renderBuildings() {
        push();
        translate(this.position.x, this.position.y);

        const r = this.radius;
        const buildingCount = 60;
        // Radius where city elements (buildings / trees) are anchored.
        const buildingRadius = r * 1.0;

        // Only draw elements along the visible top arc of the circle
        const startAngle = PI + QUARTER_PI * 0.45;
        const endAngle = TWO_PI - QUARTER_PI * 0.45;

        rectMode(CORNER);
        noStroke();

        for (let i = 0; i < buildingCount; i++) {
            const t = buildingCount === 1 ? 0.5 : i / (buildingCount - 1);
            const a = lerp(startAngle, endAngle, t);

            const x = cos(a) * buildingRadius;
            const y = sin(a) * buildingRadius;

            push();
            translate(x, y);

            // Rotate so elements point outward, following the Earth's curvature.
            // Local -Y axis is aligned along the radial "away from center" direction.
            rotate(a + HALF_PI);

            const baseWidth = r * 0.035;
            const baseHeight = r * 0.13;

            // Deterministic variation for a more organic skyline
            const heightScale = 0.7 + 0.3 * sin(i * 0.9);
            const widthScale = 0.8 + 0.4 * cos(i * 0.7);

            const w = baseWidth * widthScale;
            const h = baseHeight * heightScale;

            // Middle 10% of the screen (45% to 55%) only has trees, no buildings
            const middleStart = 0.43;
            const middleEnd = 0.55;
            const isInMiddle = t >= middleStart && t <= middleEnd;

            // Decide whether this slot is a building or a tree
            let isTree;
            if (isInMiddle) {
                // Force trees in the middle section
                isTree = true;
            } else {
                // Outside middle: use probability to decide - very few trees
                const treeChance = 0.5 + 0.5 * sin(i * 1.4);
                isTree = treeChance > 0.92; // ~5–8% become trees
            }

            if (isTree) {
                // Trees in middle section are larger, trees with buildings are smaller
                if (isInMiddle) {
                    this.drawTree(w * 0.2, h * 0.9, i);
                } else {
                    this.drawTree(w * 0.12, h * 0.6, i);
                }
            } else {
                // Base of each building sits on the circle edge and extends upward
                this.drawBuilding(w, h, i);
            }

            pop();
        }

        pop();
    }

    drawBuilding(w, h, seed) {
        // Base facade tone: darker so windows pop, with deterministic per-building variation.
        // Depends only on seed (index), so it stays constant across frames.
        const baseGray = 130 + 35 * sin(seed * 0.7) + 25 * cos(seed * 1.3);
        const bodyGray = constrain(baseGray, 90, 170);

        // Number of floors (stories): 3–7 floors
        const floors = 3 + floor(4 * (0.5 + 0.5 * sin(seed * 0.9)));
        const floorHeight = h / floors;

        // Draw main building body
        fill(bodyGray);
        rect(-w / 2, -h, w, h, 1);

        // Windows configuration per floor
        const minCols = 1;
        const maxCols = 4;
        const windowCols =
            minCols +
            floor((maxCols - minCols + 1) * (0.5 + 0.5 * cos(seed * 1.1)));

        const marginX = w * 0.18;
        const marginY = floorHeight * 0.25;

        const innerWidth = max(w - marginX * 2, w * 0.3);
        const windowWidth = (innerWidth / max(windowCols, 1)) * 0.7;
        const windowSpacingX = innerWidth / max(windowCols, 1);
        const windowHeight = max(
            floorHeight - marginY * 1.6,
            floorHeight * 0.35
        );

        // Cartoonish windows: simple light rectangles, some "off"
        for (let f = 0; f < floors; f++) {
            const yTop = -h + f * floorHeight + marginY;

            for (let c = 0; c < windowCols; c++) {
                const xLeftBase = -w / 2 + marginX + c * windowSpacingX;

                // Use a simple pattern so some windows are darker ("off")
                const windowPhase = sin(seed * 1.3 + f * 0.9 + c * 1.7);
                const windowGray = windowPhase > 0.15 ? 240 : 180;

                fill(windowGray);
                rect(
                    xLeftBase + (windowSpacingX - windowWidth) / 2,
                    yTop,
                    windowWidth,
                    windowHeight,
                    0.8
                );
            }
        }
    }

    drawTree(w, h, seed) {
        // Simple cartoon tree: darker trunk + fluffy circular canopy.
        // Use seed for deterministic variety in size and tone.
        const trunkHeight = h * (0.5 + 0.3 * (sin(seed * 0.8) + 1)/2);
        const trunkWidth = w *2 ;

        // Base shade for this tree - determines overall tree color
        const baseCanopyGray = 120 + 80 * sin(seed * 0.7);
        const constrainedBaseGray = constrain(baseCanopyGray, 100, 200);

        // Trunk is always darker than the base canopy shade
        const trunkGray = constrainedBaseGray * 0.5 + 20 * cos(seed * 0.5);
        fill(constrain(trunkGray, 60, 120));
        rect(-trunkWidth / 2, -trunkHeight, trunkWidth, trunkHeight, 0.8);

        // Canopy: overlapping circles for a puffy, cartoon look
        const canopyRadius = h * (0.32 + 0.06 * cos(seed * 0.9));
        const centerY = -trunkHeight - canopyRadius * 0.3;

        // Define canopy circle configurations: [xOffset, yOffset, radiusScale]
        const canopyCircles = [
            [0, 0, 2.0],                    // Main central puff
            [-0.9, 0.15, 1.6],             // Left side puff
            [0.9, 0.1, 1.6],               // Right side puff
            [0, -0.7, 1.4]                 // Top puff
        ];

        // Generate circles with colors varying around the base shade
        const variationRange = 60; // How much variation from base shade
        const minGray = max(80, constrainedBaseGray - variationRange);
        const maxGray = min(250, constrainedBaseGray + variationRange);
        
        for (let i = 0; i < canopyCircles.length; i++) {
            // Deterministic pseudo-random based on seed and index
            const hash = (seed * 17 + i * 23) % 1000;
            const normalized = hash / 1000;
            const gray = minGray + normalized * (maxGray - minGray);
            
            const [xOffset, yOffset, radiusScale] = canopyCircles[i];
            const x = xOffset * canopyRadius;
            const y = centerY + yOffset * canopyRadius;
            const radius = canopyRadius * radiusScale;
            
            fill(gray);
            circle(x, y, radius);
        }
    }
}



