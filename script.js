class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.history = [];
        this.fullExpression = ''; // Track the full chain
        this.clear();
        this.soundEnabled = true;
        this.initAudio();
    }

    clear() {
        this.currentOperand = '';
        this.previousOperand = '';
        this.operation = undefined;
        this.fullExpression = '';
    }

    delete() {
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
    }

    appendNumber(number) {
        // If previous calculation finished (indicated by = in fullExpression)
        if (this.fullExpression.includes('=')) {
            this.currentOperand = '';
            this.fullExpression = '';
            this.operation = undefined;
            this.previousOperand = '';
        }
        if (number === '.' && this.currentOperand.includes('.')) return;
        this.currentOperand = this.currentOperand.toString() + number.toString();
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;

        // If starting a new chain from a result (fullExpression has =)
        if (this.fullExpression.includes('=')) {
            this.fullExpression = `${this.currentOperand} ${operation}`;
        } else if (this.fullExpression === '') {
            this.fullExpression = `${this.currentOperand} ${operation}`;
        } else {
            this.fullExpression += ` ${this.currentOperand} ${operation}`;
        }

        // If chaining (e.g., 2+2+...), compute the previous part first
        if (this.previousOperand !== '') {
            this.compute(); // Internal compute, updates running total
        }

        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                computation = prev / current;
                break;
            default:
                return;
        }

        // Fix floating-point precision (e.g., 0.2 * 0.8 = 0.16000000000000003)
        // Round to 10 decimal places to avoid floating point artifacts
        computation = parseFloat(computation.toPrecision(12));

        this.currentOperand = computation;
        this.operation = undefined;
        this.previousOperand = '';
    }

    // Format number for display with commas and limited decimals
    formatNumber(number) {
        if (number === '' || number === undefined) return '0';
        const num = parseFloat(number);
        if (isNaN(num)) return number.toString();

        // Use toLocaleString for comma formatting
        // Limit decimal places to 10, but remove trailing zeros
        const formatted = num.toLocaleString('en-US', {
            maximumFractionDigits: 10
        });
        return formatted;
    }

    // Called when '=' is pressed
    evaluate() {
        if (this.operation == null && this.fullExpression === '') return;

        // Handle trailing operator case (e.g. "2 + 2 +")
        // User hit = while an operator was pending.
        if (this.currentOperand === '' && this.operation != null) {
            // Trim to be safe, then remove last char (op), then trim again
            let tempExpr = this.fullExpression.trim();
            // Remove the last operator
            this.fullExpression = tempExpr.substring(0, tempExpr.length - 1).trim();

            // The result is the previousOperand (running total)
            this.currentOperand = this.previousOperand;

            // Log to history
            this.addToHistory(this.fullExpression, this.currentOperand);

            // Update for display persistence
            this.fullExpression += ' =';

            // Reset operation state
            this.operation = undefined;
            this.previousOperand = '';
            return;
        }

        if (this.currentOperand !== '') {
            if (this.fullExpression === '') {
                this.fullExpression = `${this.previousOperand} ${this.operation} ${this.currentOperand} =`;
            } else {
                this.fullExpression += ` ${this.currentOperand} =`;
            }

            // History needs the expression without the trailing " ="
            const historyExpression = this.fullExpression.slice(0, -2);

            this.compute();

            this.addToHistory(historyExpression, this.currentOperand);

            // We DO NOT clear fullExpression here. It persists for display.
        }
    }

    addToHistory(expression, result) {
        this.history.unshift({ expression, result });
        this.renderHistory();
    }

    deleteHistoryItem(index) {
        this.history.splice(index, 1);
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.querySelector('.history-list');
        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="no-history">No history yet</p>';
            return;
        }

        historyList.innerHTML = '';
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            // Content Container
            const content = document.createElement('div');
            content.className = 'history-content';

            const expr = document.createElement('div');
            expr.className = 'history-expression';
            expr.innerText = item.expression;

            const res = document.createElement('div');
            res.className = 'history-result';
            res.innerText = `= ${item.result}`;

            content.appendChild(expr);
            content.appendChild(res);

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Delete Item';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteHistoryItem(index);
            };

            historyItem.appendChild(content);
            historyItem.appendChild(deleteBtn);

            historyList.appendChild(historyItem);
        });
    }

    updateDisplay() {
        // Format the current operand for display (commas, fixed decimals)
        this.currentOperandTextElement.innerText = this.formatNumber(this.currentOperand);

        if (this.fullExpression !== '') {
            this.previousOperandTextElement.innerText = this.fullExpression;
        } else if (this.operation != null) {
            this.previousOperandTextElement.innerText = `${this.previousOperand} ${this.operation}`;
        } else {
            this.previousOperandTextElement.innerText = '';
        }

        // Emoji indicator logic
        const emojiIndicator = document.getElementById('emoji-indicator');
        if (emojiIndicator) {
            if (this.fullExpression.includes('=')) {
                // Result shown - smile emoji
                emojiIndicator.textContent = '😊';
            } else if (this.currentOperand !== '' || this.operation != null) {
                // Thinking/working - thinking emoji
                emojiIndicator.textContent = '🤔';
            } else {
                // Empty state
                emojiIndicator.textContent = '';
            }
        }
    }

    // Audio Context for Clicky Sound
    initAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
    }

    playClickSound() {
        if (!this.soundEnabled || !this.audioCtx) return;

        // Resume context if suspended (browser autoplay policy)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        // "Click" sound properties
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.1);
    }

    toggleSound(isEnabled) {
        this.soundEnabled = isEnabled;
    }
}

// Select DOM elements
const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-action="add"], [data-action="subtract"], [data-action="multiply"], [data-action="divide"]');
const equalsButton = document.querySelector('[data-action="calculate"]');
const deleteButton = document.querySelector('[data-action="delete"]');
const allClearButton = document.querySelector('[data-action="clear"]');
const previousOperandTextElement = document.querySelector('.previous-operand');
const currentOperandTextElement = document.querySelector('.current-operand');
const soundToggle = document.getElementById('sound-toggle');
const historyBtn = document.getElementById('history-btn');
const historyView = document.querySelector('.history-view');
const closeHistoryBtn = document.getElementById('close-history');
const clearHistoryBtn = document.getElementById('clear-history');
const themeToggle = document.getElementById('theme-toggle');

const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

// Theme Toggle
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    try { calculator.playClickSound(); } catch (e) { }
});

// Event Listeners for Sound
const allButtons = document.querySelectorAll('button');
allButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.playClickSound();
    });
});

// Sound Toggle
soundToggle.addEventListener('change', () => {
    calculator.toggleSound(soundToggle.checked);
});

// History Toggle
historyBtn.addEventListener('click', () => {
    historyView.classList.remove('hidden');
});

closeHistoryBtn.addEventListener('click', () => {
    historyView.classList.add('hidden');
});

clearHistoryBtn.addEventListener('click', () => {
    calculator.clearHistory();
});

// Number Buttons
numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.dataset.number);
        calculator.updateDisplay();
    });
});

// Operator Buttons
operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        let opSymbol;
        if (action === 'add') opSymbol = '+';
        if (action === 'subtract') opSymbol = '-';
        if (action === 'multiply') opSymbol = '×';
        if (action === 'divide') opSymbol = '÷';

        calculator.chooseOperation(opSymbol);
        calculator.updateDisplay();
    });
});

// Equals Button
equalsButton.addEventListener('click', () => {
    calculator.evaluate();
    calculator.updateDisplay();
});

// Other Keys
allClearButton.addEventListener('click', () => {
    calculator.clear();
    calculator.updateDisplay();
});

deleteButton.addEventListener('click', () => {
    calculator.delete();
    calculator.updateDisplay();
});

// Keyboard Support
document.addEventListener('keydown', (e) => {
    // Special handling for Enter/Esc key in popup inputs
    const popup = document.getElementById('feature-popup');
    if (popup && !popup.classList.contains('hidden')) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('popup-enter').click();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            // Check if there is data to clear first
            if (popupInput.value !== '' || popupInput2.value !== '' || popupResult.textContent !== '') {
                popupInput.value = '';
                popupInput2.value = '';
                popupResult.textContent = '';
                popupInput.focus();
            } else {
                // If already empty, close the popup
                document.getElementById('popup-close').click();
            }
        }
        return;
    }

    // Skip if typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    let key = e.key;

    // Map keys to button selectors
    let button;

    // Numbers and Decimal
    if ((key >= '0' && key <= '9') || key === '.') {
        button = document.querySelector(`[data-number="${key}"]`);
    }

    // Operators
    if (key === '+') button = document.querySelector('[data-action="add"]');
    if (key === '-') button = document.querySelector('[data-action="subtract"]');
    if (key === '*') button = document.querySelector('[data-action="multiply"]');
    if (key === '/') button = document.querySelector('[data-action="divide"]');

    // Equals / Enter
    if (key === 'Enter' || key === '=') {
        e.preventDefault();
        button = document.querySelector('[data-action="calculate"]');
    }

    // Backspace / Delete
    if (key === 'Backspace' || key === 'Delete') {
        button = document.querySelector('[data-action="delete"]');
    }

    // Escape (Clear All)
    if (key === 'Escape') {
        button = document.querySelector('[data-action="clear"]');
    }

    if (button) {
        button.click();

        // Add visual feedback
        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 100);
    }
});

// ========== ADVANCED FEATURES ==========

// Feature Functions
function checkEvenOdd(n) {
    if (!Number.isInteger(n)) return `${n} is not an integer`;
    return n % 2 === 0 ? `${n} is Even` : `${n} is Odd`;
}

function calculateSquare(n) {
    const result = n * n;
    return `${n}² = ${calculator.formatNumber(result)}`;
}

function calculateCube(n) {
    const result = n * n * n;
    return `${n}³ = ${calculator.formatNumber(result)}`;
}

function calculateSquareRoot(n) {
    if (n < 0) return 'Cannot calculate square root of negative number';
    const result = Math.sqrt(n);
    return `√${n} = ${calculator.formatNumber(parseFloat(result.toPrecision(12)))}`;
}

function calculateCubeRoot(n) {
    const result = Math.cbrt(n);
    return `∛${n} = ${calculator.formatNumber(parseFloat(result.toPrecision(12)))}`;
}

function generateTable(n) {
    let table = `Multiplication Table for ${n}:\n`;
    for (let i = 1; i <= 10; i++) {
        table += `${n} × ${i} = ${calculator.formatNumber(n * i)}\n`;
    }
    return table.trim();
}

// Percentage calculations
function calculatePercentage(mode, val1, val2) {
    switch (mode) {
        case '1': // Whole + Part → %
            // What % is val2 of val1?
            if (val1 === 0) return 'Cannot divide by zero';
            const pct = (val2 / val1) * 100;
            return `${val2} is ${calculator.formatNumber(parseFloat(pct.toPrecision(12)))}% of ${val1}`;
        case '2': // Whole + % → Part
            // What is val2% of val1?
            const part = (val1 * val2) / 100;
            return `${val2}% of ${val1} = ${calculator.formatNumber(parseFloat(part.toPrecision(12)))}`;
        case '3': // Part + % → Whole
            // If val1 is val2% of whole, what is whole?
            if (val2 === 0) return 'Cannot divide by zero';
            const whole = (val1 * 100) / val2;
            return `If ${val1} is ${val2}%, whole = ${calculator.formatNumber(parseFloat(whole.toPrecision(12)))}`;
        default:
            return 'Unknown mode';
    }
}

// Prime check
function checkPrime(n) {
    if (!Number.isInteger(n)) return `${n} is not an integer`;
    if (n < 2) return `${n} is NOT a prime number`;
    if (n === 2) return `${n} is a PRIME number ✓`;
    if (n % 2 === 0) return `${n} is NOT a prime number (divisible by 2)`;

    for (let i = 3; i <= Math.sqrt(n); i += 2) {
        if (n % i === 0) {
            return `${n} is NOT a prime number (divisible by ${i})`;
        }
    }
    return `${n} is a PRIME number ✓`;
}

// Popup Logic
const featurePopup = document.getElementById('feature-popup');
const popupTitle = document.getElementById('popup-title');
const popupInput = document.getElementById('popup-input');
const popupEnter = document.getElementById('popup-enter');
const popupClose = document.getElementById('popup-close');
const popupResult = document.getElementById('popup-result');
const popupInput2 = document.getElementById('popup-input2');
const percentageModeSelector = document.getElementById('percentage-mode-selector');

let currentFeature = null;

const featureButtons = document.querySelectorAll('.feature-btn');
featureButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        try {
            calculator.playClickSound();
        } catch (e) {
            console.log('Sound error:', e);
        }
        currentFeature = btn.dataset.feature;

        // Set title based on feature
        const titles = {
            evenodd: 'Even or Odd',
            square: 'Square (x²)',
            cube: 'Cube (x³)',
            sqrt: 'Square Root (√)',
            cbrt: 'Cube Root (∛)',
            table: 'Multiplication Table',
            percentage: 'Percentage Calculator',
            prime: 'Prime Number Check'
        };
        popupTitle.textContent = titles[currentFeature] || 'Feature';

        // Clear previous input/result
        popupInput.value = '';
        popupInput2.value = '';
        popupResult.textContent = '';

        // Show/hide percentage mode selector and second input
        if (currentFeature === 'percentage') {
            percentageModeSelector.classList.remove('hidden');
            popupInput2.classList.remove('hidden');
            // Set default placeholders for mode 1
            updatePercentagePlaceholders();
        } else {
            percentageModeSelector.classList.add('hidden');
            popupInput2.classList.add('hidden');
            popupInput.placeholder = 'Enter a number';
        }

        // Show popup
        featurePopup.classList.remove('hidden');
        popupInput.focus();
    });
});

// Update placeholders based on percentage mode
function updatePercentagePlaceholders() {
    const mode = document.querySelector('input[name="pct-mode"]:checked')?.value || '1';
    if (mode === '1') {
        popupInput.placeholder = 'Whole Amount';
        popupInput2.placeholder = 'Part Amount';
    } else if (mode === '2') {
        popupInput.placeholder = 'Whole Amount';
        popupInput2.placeholder = 'Percentage (%)';
    } else if (mode === '3') {
        popupInput.placeholder = 'Part Amount';
        popupInput2.placeholder = 'Percentage (%)';
    }
}

// Listen to percentage mode changes
// Listen to percentage mode changes
document.querySelectorAll('input[name="pct-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
        updatePercentagePlaceholders();
        // Clear inputs on mode change
        popupInput.value = '';
        popupInput2.value = '';
        popupResult.textContent = '';
    });
});

popupEnter.addEventListener('click', () => {
    try { calculator.playClickSound(); } catch (e) { }
    const num = parseFloat(popupInput.value);
    const num2 = parseFloat(popupInput2.value);

    // For percentage, need both inputs
    if (currentFeature === 'percentage') {
        if (isNaN(num) || isNaN(num2)) {
            popupResult.textContent = 'Please enter both values';
            return;
        }
        const mode = document.querySelector('input[name="pct-mode"]:checked').value;
        const result = calculatePercentage(mode, num, num2);
        popupResult.textContent = result;

        // Save to history
        calculator.history.unshift({ expression: `[%] ${num}, ${num2}`, result: result });
        calculator.renderHistory();
        return;
    }

    if (isNaN(num)) {
        popupResult.textContent = 'Please enter a valid number';
        return;
    }

    let result;
    let icon = '';
    switch (currentFeature) {
        case 'evenodd':
            result = checkEvenOdd(num);
            icon = '#';
            break;
        case 'square':
            result = calculateSquare(num);
            icon = 'x²';
            break;
        case 'cube':
            result = calculateCube(num);
            icon = 'x³';
            break;
        case 'sqrt':
            result = calculateSquareRoot(num);
            icon = '√';
            break;
        case 'cbrt':
            result = calculateCubeRoot(num);
            icon = '∛';
            break;
        case 'table':
            result = generateTable(num);
            icon = '📋';
            break;
        case 'prime':
            result = checkPrime(num);
            icon = 'P';
            break;
        default:
            result = 'Unknown feature';
    }

    popupResult.textContent = result;

    // Save to history with icon
    if (currentFeature === 'table') {
        calculator.history.unshift({ expression: `[${icon}] Table of ${num}`, result: '1-10' });
    } else {
        calculator.history.unshift({ expression: `[${icon}] ${num}`, result: result.split('=')[1]?.trim() || result });
    }
    calculator.renderHistory();
});

popupClose.addEventListener('click', () => {
    try { calculator.playClickSound(); } catch (e) { }
    featurePopup.classList.add('hidden');
});

// Close popup on overlay click
featurePopup.addEventListener('click', (e) => {
    if (e.target === featurePopup) {
        featurePopup.classList.add('hidden');
    }
});

// Enter key in popup input
popupInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        popupEnter.click();
    }
    // ESC to clear input
    if (e.key === 'Escape') {
        popupInput.value = '';
        popupResult.textContent = '';
    }
});

// ========== SOUND OPTIONS ==========

const soundTypeSelector = document.getElementById('sound-type');
let currentSoundType = 'click1';

soundTypeSelector.addEventListener('change', () => {
    currentSoundType = soundTypeSelector.value;
});

// Override playClickSound to use different sounds
Calculator.prototype.playClickSound = function () {
    if (!this.soundEnabled || !this.audioCtx) return;

    try {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        // Different sounds based on selection
        switch (currentSoundType) {
            case 'click1': // Classic Click
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(this.audioCtx.currentTime + 0.1);
                break;
            case 'click2': // Soft Pop
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.08);
                gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
                oscillator.start();
                oscillator.stop(this.audioCtx.currentTime + 0.08);
                break;
            case 'click3': // Beep
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
                oscillator.start();
                oscillator.stop(this.audioCtx.currentTime + 0.05);
                break;
            case 'click4': // Tap
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.06);
                gainNode.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.06);
                oscillator.start();
                oscillator.stop(this.audioCtx.currentTime + 0.06);
                break;
        }
    } catch (e) {
        console.log('Sound error:', e);
    }
};
