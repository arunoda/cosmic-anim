class ConfigUI {
    constructor(stageConfig, resetCallback, startFromStageCallback, claimAnimationCallback, sendRemoteCommandCallback) {
        this.stageConfig = stageConfig;
        this.resetCallback = resetCallback;
        this.startFromStageCallback = startFromStageCallback;
        this.claimAnimationCallback = claimAnimationCallback;
        this.sendRemoteCommandCallback = sendRemoteCommandCallback;
        this.panelVisible = false;
        this.button = null;
        this.panel = null;
        this.playButton = null;
        this.showAnimationButton = null; // Button to claim animation view
        this.configOnlyContainer = null; // Container for config-only view
        this.inputs = {};
        this.stageSecondsInputs = {}; // Store seconds inputs for each stage
        this.showButtonThreshold = 100; // Show button when mouse is within 100px from top
        this.isShowingAnimation = true; // Default to animation view
    }

    init() {
        // Load saved config from localStorage
        this.loadConfigFromStorage();
        
        // Create config-only container (shown when not displaying animation)
        this.createConfigOnlyView();
        
        // Create toggle button (for animation view)
        if (!this.button) {
            this.button = createButton("⚙");
            this.button.position(windowWidth - 50, 10);
            this.button.size(40, 40);
            this.button.style("background-color", "#3c3c3c");
            this.button.style("color", "#c8c8c8");
            this.button.style("border", "1px solid #969696");
            this.button.style("border-radius", "5px");
            this.button.style("font-size", "20px");
            this.button.style("cursor", "pointer");
            this.button.style("transition", "background-color 0.2s, opacity 0.3s");
            this.button.style("opacity", "0");
            this.button.style("pointer-events", "none");
            this.button.mouseOver(() => {
                this.button.style("background-color", "#646464");
            });
            this.button.mouseOut(() => {
                this.button.style("background-color", "#3c3c3c");
            });
            this.button.mousePressed(() => {
                this.panelVisible = !this.panelVisible;
                this.updatePanelVisibility();
            });
        }
        
        // Create panel container (for animation view overlay)
        if (!this.panel) {
            this.panel = createDiv();
            this.panel.style("position", "absolute");
            this.panel.style("background-color", "rgba(40, 40, 40, 0.9)");
            this.panel.style("border", "2px solid #646464");
            this.panel.style("border-radius", "8px");
            this.panel.style("padding", "15px");
            this.panel.style("width", "280px");
            this.panel.style("font-family", "monospace");
            this.panel.style("z-index", "1000");
            
            // Panel title
            const title = createElement("h3", "Stage Configuration");
            title.parent(this.panel);
            title.style("margin", "0 0 15px 0");
            title.style("color", "#c8c8c8");
            title.style("font-size", "14px");
            title.style("font-weight", "normal");
            
            // Create play button
            this.createPlayButton();
            
            // Create input elements
            this.createInputs();
        }
        
        this.updatePanelPosition();
        this.updatePanelVisibility();
        this.updateInputValues();
        this.updateViewMode(this.isShowingAnimation);
    }

    updatePanelPosition() {
        if (this.button) {
            this.button.position(windowWidth - 50, 10);
        }
        if (this.panel) {
            // Position panel further left to ensure it's fully visible
            this.panel.position(windowWidth - 320, 60);
        }
    }

    updatePanelVisibility() {
        if (this.panel) {
            this.panel.style("display", this.panelVisible ? "block" : "none");
        }
        // Keep button visible when panel is open
        this.updateButtonVisibility();
    }

    updateButtonVisibility() {
        if (!this.button) return;
        
        // Show button if panel is open or mouse is near top
        const shouldShow = this.panelVisible || (typeof mouseY !== 'undefined' && mouseY <= this.showButtonThreshold);
        
        if (shouldShow) {
            this.button.style("opacity", "1");
            this.button.style("pointer-events", "auto");
        } else {
            this.button.style("opacity", "0");
            this.button.style("pointer-events", "none");
        }
    }

    render() {
        // Update button visibility based on mouse position (only in animation view)
        if (this.isShowingAnimation) {
            this.updateButtonVisibility();
        }
    }

    renderConfigOnly() {
        // Show config-only view (when not showing animation)
        if (this.configOnlyContainer) {
            this.configOnlyContainer.style("display", "block");
        }
    }

    createConfigOnlyView() {
        if (this.configOnlyContainer) return;
        
        this.configOnlyContainer = createDiv();
        this.configOnlyContainer.style("position", "absolute");
        this.configOnlyContainer.style("top", "0");
        this.configOnlyContainer.style("left", "0");
        this.configOnlyContainer.style("width", "100%");
        this.configOnlyContainer.style("height", "100%");
        this.configOnlyContainer.style("background-color", "#1e1e1e");
        this.configOnlyContainer.style("display", "none");
        this.configOnlyContainer.style("z-index", "100");
        this.configOnlyContainer.style("overflow-y", "auto");
        
        // Center content
        const contentWrapper = createDiv();
        contentWrapper.parent(this.configOnlyContainer);
        contentWrapper.style("display", "flex");
        contentWrapper.style("flex-direction", "column");
        contentWrapper.style("align-items", "center");
        contentWrapper.style("justify-content", "center");
        contentWrapper.style("min-height", "100%");
        contentWrapper.style("padding", "40px 20px");
        
        // Title
        const title = createElement("h1", "Animation Configuration");
        title.parent(contentWrapper);
        title.style("color", "#c8c8c8");
        title.style("font-family", "monospace");
        title.style("font-size", "32px");
        title.style("margin-bottom", "20px");
        title.style("font-weight", "normal");
        
        // Status message
        const statusMsg = createElement("p", "Another tab is currently displaying the animation.");
        statusMsg.parent(contentWrapper);
        statusMsg.style("color", "#969696");
        statusMsg.style("font-family", "monospace");
        statusMsg.style("font-size", "14px");
        statusMsg.style("margin-bottom", "30px");
        
        // Show Animation button
        this.showAnimationButton = createButton("▶ Show Animation");
        this.showAnimationButton.parent(contentWrapper);
        this.showAnimationButton.style("padding", "15px 40px");
        this.showAnimationButton.style("margin-bottom", "40px");
        this.showAnimationButton.style("background-color", "#4a7c59");
        this.showAnimationButton.style("color", "#ffffff");
        this.showAnimationButton.style("border", "none");
        this.showAnimationButton.style("border-radius", "6px");
        this.showAnimationButton.style("font-size", "16px");
        this.showAnimationButton.style("font-family", "monospace");
        this.showAnimationButton.style("cursor", "pointer");
        this.showAnimationButton.style("transition", "background-color 0.2s");
        this.showAnimationButton.mouseOver(() => {
            this.showAnimationButton.style("background-color", "#5a9c69");
        });
        this.showAnimationButton.mouseOut(() => {
            this.showAnimationButton.style("background-color", "#4a7c59");
        });
        this.showAnimationButton.mousePressed(() => {
            if (this.claimAnimationCallback) {
                this.claimAnimationCallback();
            }
        });
        
        // Config panel (always visible in config-only mode)
        const configPanel = createDiv();
        configPanel.parent(contentWrapper);
        configPanel.style("background-color", "rgba(40, 40, 40, 0.95)");
        configPanel.style("border", "2px solid #646464");
        configPanel.style("border-radius", "8px");
        configPanel.style("padding", "25px");
        configPanel.style("width", "100%");
        configPanel.style("max-width", "500px");
        configPanel.style("font-family", "monospace");
        
        // Panel title
        const panelTitle = createElement("h2", "Stage Configuration");
        panelTitle.parent(configPanel);
        panelTitle.style("margin", "0 0 20px 0");
        panelTitle.style("color", "#c8c8c8");
        panelTitle.style("font-size", "18px");
        panelTitle.style("font-weight", "normal");
        
        // Create global play button for config-only view
        this.createConfigOnlyPlayButton(configPanel);
        
        // Create inputs for config-only view
        this.createConfigOnlyInputs(configPanel);
    }

    createConfigOnlyPlayButton(container) {
        const playButton = createButton("▶ Play");
        playButton.parent(container);
        playButton.style("display", "block");
        playButton.style("width", "100%");
        playButton.style("padding", "12px");
        playButton.style("margin-bottom", "20px");
        playButton.style("background-color", "#4a7c59");
        playButton.style("color", "#ffffff");
        playButton.style("border", "none");
        playButton.style("border-radius", "6px");
        playButton.style("font-size", "14px");
        playButton.style("font-family", "monospace");
        playButton.style("cursor", "pointer");
        playButton.style("transition", "background-color 0.2s");
        playButton.mouseOver(() => {
            playButton.style("background-color", "#5a9c69");
        });
        playButton.mouseOut(() => {
            playButton.style("background-color", "#4a7c59");
        });
        playButton.mousePressed(() => {
            if (this.isShowingAnimation) {
                // If showing animation, call callback directly
                if (this.resetCallback) {
                    this.resetCallback();
                }
            } else {
                // If config-only mode, send remote command
                if (this.sendRemoteCommandCallback) {
                    this.sendRemoteCommandCallback({ type: 'reset' });
                }
            }
        });
    }

    createConfigOnlyInputs(container) {
        const configs = [
            { key: "delayBeforeAppear", label: "Delay Before Appear (seconds)", stage: 0 },
            { key: "timeToFirstTarget", label: "Time to First Target (seconds)", stage: 1 },
            { key: "stayAtFirstTarget", label: "Stay at First Target (seconds)", stage: 2 },
            { key: "timeToSecondTarget", label: "Time to Second Target (seconds)", stage: 3 }
        ];
        
        configs.forEach((config, index) => {
            // Create label
            const label = createElement("label", config.label);
            label.parent(container);
            label.style("display", "block");
            label.style("color", "#b4b4b4");
            label.style("font-size", "13px");
            if (index > 0) {
                label.style("margin-top", "15px");
            }
            label.style("margin-bottom", "8px");
            
            // Create input row with seconds input and play button
            const inputRow = createDiv();
            inputRow.parent(container);
            inputRow.style("display", "flex");
            inputRow.style("gap", "10px");
            inputRow.style("margin-bottom", "10px");
            
            // Create input
            const input = createInput(this.stageConfig[config.key].toString());
            input.parent(inputRow);
            input.style("flex", "1");
            input.style("box-sizing", "border-box");
            input.style("background-color", "#2a2a2a");
            input.style("color", "#c8c8c8");
            input.style("border", "1px solid #646464");
            input.style("border-radius", "4px");
            input.style("padding", "8px 12px");
            input.style("font-size", "14px");
            input.style("font-family", "monospace");
            
            // Create seconds input for jumping to specific time in stage
            const secondsInput = createInput("0");
            secondsInput.parent(inputRow);
            secondsInput.style("width", "70px");
            secondsInput.style("box-sizing", "border-box");
            secondsInput.style("background-color", "#2a2a2a");
            secondsInput.style("color", "#c8c8c8");
            secondsInput.style("border", "1px solid #646464");
            secondsInput.style("border-radius", "4px");
            secondsInput.style("padding", "8px 12px");
            secondsInput.style("font-size", "14px");
            secondsInput.style("font-family", "monospace");
            secondsInput.style("flex-shrink", "0");
            
            // Validate seconds input
            secondsInput.input(() => {
                const value = parseFloat(secondsInput.value());
                if (isNaN(value) || value < 0) {
                    secondsInput.value("0");
                }
            });
            
            // Create play button for this stage
            const stagePlayButton = createButton("▶");
            stagePlayButton.parent(inputRow);
            stagePlayButton.style("padding", "8px 16px");
            stagePlayButton.style("background-color", "#4a7c59");
            stagePlayButton.style("color", "#ffffff");
            stagePlayButton.style("border", "none");
            stagePlayButton.style("border-radius", "4px");
            stagePlayButton.style("font-size", "14px");
            stagePlayButton.style("font-family", "monospace");
            stagePlayButton.style("cursor", "pointer");
            stagePlayButton.style("transition", "background-color 0.2s");
            stagePlayButton.style("flex-shrink", "0");
            stagePlayButton.style("white-space", "nowrap");
            stagePlayButton.mouseOver(() => {
                stagePlayButton.style("background-color", "#5a9c69");
            });
            stagePlayButton.mouseOut(() => {
                stagePlayButton.style("background-color", "#4a7c59");
            });
            stagePlayButton.mousePressed(() => {
                const seconds = parseFloat(secondsInput.value()) || 0;
                if (this.isShowingAnimation) {
                    // If showing animation, call callback directly
                    if (this.startFromStageCallback) {
                        this.startFromStageCallback(config.stage, seconds);
                    }
                } else {
                    // If config-only mode, send remote command
                    if (this.sendRemoteCommandCallback) {
                        this.sendRemoteCommandCallback({
                            type: 'startFromStage',
                            stage: config.stage,
                            seconds: seconds
                        });
                    }
                }
            });
            
            // Store seconds input reference (support multiple inputs for same stage)
            if (!this.stageSecondsInputs[config.stage]) {
                this.stageSecondsInputs[config.stage] = secondsInput;
            } else if (Array.isArray(this.stageSecondsInputs[config.stage])) {
                this.stageSecondsInputs[config.stage].push(secondsInput);
            } else {
                this.stageSecondsInputs[config.stage] = [this.stageSecondsInputs[config.stage], secondsInput];
            }
            
            // Store reference - support multiple inputs for same key
            if (!this.inputs[config.key]) {
                this.inputs[config.key] = input;
            } else if (Array.isArray(this.inputs[config.key])) {
                this.inputs[config.key].push(input);
            } else {
                // Convert to array if we have multiple inputs
                this.inputs[config.key] = [this.inputs[config.key], input];
            }
            
            // Add change handler
            input.input(() => {
                const value = parseFloat(input.value());
                const isDivisorField = config.key === "timeToFirstTarget" || config.key === "timeToSecondTarget";
                const isValid = !isNaN(value) && (isDivisorField ? value > 0 : value >= 0);
                
                if (isValid) {
                    this.stageConfig[config.key] = value;
                    this.saveConfigToStorage();
                    // Also update other inputs for the same key
                    const inputsForKey = Array.isArray(this.inputs[config.key]) 
                        ? this.inputs[config.key] 
                        : [this.inputs[config.key]];
                    inputsForKey.forEach(otherInput => {
                        if (otherInput && otherInput !== input) {
                            otherInput.value(value.toString());
                        }
                    });
                } else {
                    input.value(this.stageConfig[config.key].toString());
                }
            });
        });
    }

    updateViewMode(showingAnimation) {
        this.isShowingAnimation = showingAnimation;
        
        if (showingAnimation) {
            // Hide config-only view
            if (this.configOnlyContainer) {
                this.configOnlyContainer.style("display", "none");
            }
            // Show overlay button
            if (this.button) {
                this.button.style("display", "block");
            }
        } else {
            // Show config-only view
            if (this.configOnlyContainer) {
                this.configOnlyContainer.style("display", "block");
            }
            // Hide overlay button
            if (this.button) {
                this.button.style("display", "none");
            }
        }
    }

    createPlayButton() {
        this.playButton = createButton("▶ Play");
        this.playButton.parent(this.panel);
        this.playButton.style("display", "block");
        this.playButton.style("width", "100%");
        this.playButton.style("padding", "8px");
        this.playButton.style("margin-bottom", "15px");
        this.playButton.style("background-color", "#4a7c59");
        this.playButton.style("color", "#ffffff");
        this.playButton.style("border", "none");
        this.playButton.style("border-radius", "4px");
        this.playButton.style("font-size", "12px");
        this.playButton.style("font-family", "monospace");
        this.playButton.style("cursor", "pointer");
        this.playButton.style("transition", "background-color 0.2s");
        this.playButton.mouseOver(() => {
            this.playButton.style("background-color", "#5a9c69");
        });
        this.playButton.mouseOut(() => {
            this.playButton.style("background-color", "#4a7c59");
        });
        this.playButton.mousePressed(() => {
            if (this.resetCallback) {
                this.resetCallback();
            }
        });
    }

    createInputs() {
        // Create input for each config value
        const configs = [
            { key: "delayBeforeAppear", label: "Delay Before Appear (seconds)", stage: 0 },
            { key: "timeToFirstTarget", label: "Time to First Target (seconds)", stage: 1 },
            { key: "stayAtFirstTarget", label: "Stay at First Target (seconds)", stage: 2 },
            { key: "timeToSecondTarget", label: "Time to Second Target (seconds)", stage: 3 }
        ];
        
        configs.forEach((config, index) => {
            // Create label
            const label = createElement("label", config.label);
            label.parent(this.panel);
            label.style("display", "block");
            label.style("color", "#b4b4b4");
            label.style("font-size", "11px");
            if (index > 0) {
                label.style("margin-top", "10px");
            }
            label.style("margin-bottom", "5px");
            
            // Create container for input and play button (side by side)
            const inputRow = createDiv();
            inputRow.parent(this.panel);
            inputRow.style("display", "flex");
            inputRow.style("gap", "5px");
            inputRow.style("margin-bottom", "5px");
            
            // Create input
            const input = createInput(this.stageConfig[config.key].toString());
            input.parent(inputRow);
            input.style("flex", "1");
            input.style("box-sizing", "border-box");
            input.style("background-color", "#2a2a2a");
            input.style("color", "#c8c8c8");
            input.style("border", "1px solid #646464");
            input.style("border-radius", "4px");
            input.style("padding", "4px 8px");
            input.style("font-size", "12px");
            input.style("font-family", "monospace");
            
            // Create seconds input for jumping to specific time in stage
            const secondsInput = createInput("0");
            secondsInput.parent(inputRow);
            secondsInput.style("width", "50px");
            secondsInput.style("box-sizing", "border-box");
            secondsInput.style("background-color", "#2a2a2a");
            secondsInput.style("color", "#c8c8c8");
            secondsInput.style("border", "1px solid #646464");
            secondsInput.style("border-radius", "4px");
            secondsInput.style("padding", "4px 8px");
            secondsInput.style("font-size", "12px");
            secondsInput.style("font-family", "monospace");
            secondsInput.style("flex-shrink", "0");
            
            // Validate seconds input
            secondsInput.input(() => {
                const value = parseFloat(secondsInput.value());
                if (isNaN(value) || value < 0) {
                    secondsInput.value("0");
                }
            });
            
            // Create play button for this stage
            const stagePlayButton = createButton("▶");
            stagePlayButton.parent(inputRow);
            stagePlayButton.style("padding", "4px 12px");
            stagePlayButton.style("background-color", "#4a7c59");
            stagePlayButton.style("color", "#ffffff");
            stagePlayButton.style("border", "none");
            stagePlayButton.style("border-radius", "4px");
            stagePlayButton.style("font-size", "12px");
            stagePlayButton.style("font-family", "monospace");
            stagePlayButton.style("cursor", "pointer");
            stagePlayButton.style("transition", "background-color 0.2s");
            stagePlayButton.style("flex-shrink", "0");
            stagePlayButton.style("white-space", "nowrap");
            stagePlayButton.mouseOver(() => {
                stagePlayButton.style("background-color", "#5a9c69");
            });
            stagePlayButton.mouseOut(() => {
                stagePlayButton.style("background-color", "#4a7c59");
            });
            stagePlayButton.mousePressed(() => {
                if (this.startFromStageCallback) {
                    const seconds = parseFloat(secondsInput.value()) || 0;
                    this.startFromStageCallback(config.stage, seconds);
                }
            });
            
            // Store seconds input reference
            this.stageSecondsInputs[config.stage] = secondsInput;
            
            // Add change handler
            input.input(() => {
                const value = parseFloat(input.value());
                // Fields used as divisors (timeToFirstTarget, timeToSecondTarget) must be > 0
                // Other fields can be >= 0
                const isDivisorField = config.key === "timeToFirstTarget" || config.key === "timeToSecondTarget";
                const isValid = !isNaN(value) && (isDivisorField ? value > 0 : value >= 0);
                
                if (isValid) {
                    this.stageConfig[config.key] = value;
                    this.saveConfigToStorage();
                    // Also update other inputs for the same key (config-only view)
                    const existingInput = this.inputs[config.key];
                    if (existingInput) {
                        const inputsForKey = Array.isArray(existingInput) 
                            ? existingInput 
                            : [existingInput];
                        inputsForKey.forEach(otherInput => {
                            if (otherInput && otherInput !== input) {
                                otherInput.value(value.toString());
                            }
                        });
                    }
                } else {
                    // Reset to current config value if invalid
                    input.value(this.stageConfig[config.key].toString());
                }
            });
            
            // Store reference - support multiple inputs for same key
            if (!this.inputs[config.key]) {
                this.inputs[config.key] = input;
            } else if (Array.isArray(this.inputs[config.key])) {
                this.inputs[config.key].push(input);
            } else {
                // Convert to array if we have multiple inputs
                this.inputs[config.key] = [this.inputs[config.key], input];
            }
        });
    }

    updateInputValues() {
        // Update input values to match current config
        // This updates all inputs (both overlay and config-only view)
        for (let key in this.inputs) {
            if (this.inputs[key]) {
                // If it's an array (multiple inputs for same key), update all
                if (Array.isArray(this.inputs[key])) {
                    this.inputs[key].forEach(input => {
                        if (input) input.value(this.stageConfig[key].toString());
                    });
                } else {
                    this.inputs[key].value(this.stageConfig[key].toString());
                }
            }
        }
    }

    saveConfigToStorage() {
        try {
            localStorage.setItem("cosmicStageConfig", JSON.stringify(this.stageConfig));
        } catch (e) {
            console.warn("Could not save config to localStorage:", e);
        }
    }

    loadConfigFromStorage() {
        try {
            const saved = localStorage.getItem("cosmicStageConfig");
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all keys exist
                this.stageConfig.delayBeforeAppear = parsed.delayBeforeAppear ?? this.stageConfig.delayBeforeAppear;
                this.stageConfig.timeToFirstTarget = parsed.timeToFirstTarget ?? this.stageConfig.timeToFirstTarget;
                this.stageConfig.stayAtFirstTarget = parsed.stayAtFirstTarget ?? this.stageConfig.stayAtFirstTarget;
                this.stageConfig.timeToSecondTarget = parsed.timeToSecondTarget ?? this.stageConfig.timeToSecondTarget;
            }
        } catch (e) {
            console.warn("Could not load config from localStorage:", e);
        }
    }
}
