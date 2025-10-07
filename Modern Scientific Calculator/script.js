// --- Calculator Class ---
class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '';
        this.previousOperand = '';
    }

    delete() {
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
    }

    appendNumber(number) {
        // If user types '.' with no preceding number, prepend '0'.
        if (number === '.' && (this.currentOperand === '' || this.currentOperand.slice(-1) === ' ')) {
            this.currentOperand += '0';
        }

        // CORRECTED: Only prevents adding a decimal if the CURRENT number already has one.
        const parts = this.currentOperand.toString().split(' ');
        const lastPart = parts[parts.length - 1];
        if (number === '.' && lastPart.includes('.')) return;

        this.currentOperand = this.currentOperand.toString() + number.toString();
    }

    chooseOperation(operation) {
        const functions = ['sin', 'cos', 'tan', 'log', '√', 'ln', '^'];
        if (functions.includes(operation)) {
            let func;
            // CORRECTED: Differentiates between log base 10 and natural log.
            switch (operation) {
                case '√':
                    func = 'sqrt(';
                    break;
                case 'log':
                    func = 'log10(';
                    break;
                case 'ln':
                    func = 'log(';
                    break;
                default:
                    func = operation + '(';
            }
            this.currentOperand += func;
        } else {
            // Adds spaces around binary operators like +,-,*,÷ for proper parsing.
            this.currentOperand += ` ${operation} `;
        }
    }

    negate() {
        if (this.currentOperand === '') return;
        
        // IMPROVED: More robustly negates the last number in the expression.
        const parts = this.currentOperand.toString().split(/([+\-*/\s()])/);
        let lastNumberIndex = -1;

        for (let i = parts.length - 1; i >= 0; i--) {
            if (parts[i] && !isNaN(parseFloat(parts[i]))) {
                lastNumberIndex = i;
                break;
            }
        }

        if (lastNumberIndex !== -1) {
            parts[lastNumberIndex] = (parseFloat(parts[lastNumberIndex]) * -1).toString();
            this.currentOperand = parts.join('');
        }
    }


    compute() {
        try {
            // Replaces all visual symbols with math.js compatible functions/symbols.
            let expression = this.currentOperand
                .replace(/÷/g, '/')
                .replace(/×/g, '*')
                .replace(/π/g, 'pi');

            const result = math.evaluate(expression);
            // Formats result to a fixed precision to avoid floating point errors.
            const formattedResult = parseFloat(math.format(result, {
                notation: 'fixed',
                precision: 10
            }));

            this.previousOperand = this.currentOperand + ' =';
            this.currentOperand = formattedResult.toString();
        } catch (error) {
            this.currentOperand = 'Error';
        }
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.formatDisplayNumber(this.currentOperand);
        this.previousOperandTextElement.innerText = this.previousOperand;
    }

    formatDisplayNumber(number) {
        const stringNumber = number.toString();
        if (stringNumber === 'Error' || stringNumber === 'NaN') return 'Error';
        const [integerPart, decimalPart] = stringNumber.split('.');

        if (!integerPart && decimalPart != null) return `0.${decimalPart}`;
        if (!integerPart) return '';

        const formattedInteger = parseFloat(integerPart).toLocaleString('en', {
            maximumFractionDigits: 0
        });
        return decimalPart != null ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    }
}


// --- DOM Element Selection ---
const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operation]');
const equalsButton = document.querySelector('[data-equals]');
const deleteButton = document.querySelector('[data-delete]');
const allClearButton = document.querySelector('[data-all-clear]');
const constantButtons = document.querySelectorAll('[data-constant]');
const negateButton = document.querySelector('[data-negate]');
const previousOperandTextElement = document.querySelector('[data-previous-operand]');
const currentOperandTextElement = document.querySelector('[data-current-operand]');

const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

// --- Event Listeners ---
numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
    });
});

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.innerText);
        calculator.updateDisplay();
    });
});

constantButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
    });
});

negateButton.addEventListener('click', () => {
    calculator.negate();
    calculator.updateDisplay();
});

equalsButton.addEventListener('click', () => {
    calculator.compute();
    calculator.updateDisplay();
});

allClearButton.addEventListener('click', () => {
    calculator.clear();
    calculator.updateDisplay();
});

deleteButton.addEventListener('click', () => {
    calculator.delete();
    calculator.updateDisplay();
});

// --- Keyboard Input ---
window.addEventListener('keydown', e => {
    const key = e.key;
    if (key >= '0' && key <= '9' || key === '.') calculator.appendNumber(key);
    if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculator.compute();
    }
    if (key === 'Backspace') calculator.delete();
    if (key === 'Escape') calculator.clear();
    if (['+', '-', '*', '/', '^'].includes(key)) {
        e.preventDefault();
        calculator.chooseOperation(key === '/' ? '÷' : key === '*' ? '*' : key);
    }
    calculator.updateDisplay();
});


// --- Theme Toggling Logic ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

function applyTheme(theme) {
    body.classList.toggle('dark', theme === 'dark');
    themeToggle.checked = theme === 'dark';
}

themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    localStorage.setItem('calculator-theme', newTheme);
    applyTheme(newTheme);
    drawGraph(); // Redraw graph with new theme colors
});

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('calculator-theme') || 'light';
    applyTheme(savedTheme);
});


// --- Graphing Logic ---
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const functionInput = document.getElementById('functionInput');
const plotButton = document.getElementById('plotButton');

function drawGraph() {
    const width = canvas.width;
    const height = canvas.height;
    const isDarkMode = document.body.classList.contains('dark');
    const axisColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const gridColor = isDarkMode ? '#374151' : '#E5E7EB';
    const functionColor = isDarkMode ? '#60A5FA' : '#3B82F6';
    const backgroundColor = isDarkMode ? '#111827' : '#F9FAFB';

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const scale = 40;
    const originX = width / 2;
    const originY = height / 2;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = scale; i < width; i += scale) {
        ctx.beginPath();
        ctx.moveTo(originX + i, 0);
        ctx.lineTo(originX + i, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(originX - i, 0);
        ctx.lineTo(originX - i, height);
        ctx.stroke();
    }
    for (let i = scale; i < height; i += scale) {
        ctx.beginPath();
        ctx.moveTo(0, originY + i);
        ctx.lineTo(width, originY + i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, originY - i);
        ctx.lineTo(width, originY - i);
        ctx.stroke();
    }

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    const expression = functionInput.value;
    if (!expression) return;

    ctx.strokeStyle = functionColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px < width; px++) {
        const x = (px - originX) / scale;
        try {
            const y = math.evaluate(expression, {
                x
            });
            const py = originY - y * scale;
            if (px === 0 || !isFinite(py)) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        } catch (e) {}
    }
    ctx.stroke();
}

plotButton.addEventListener('click', drawGraph);
document.addEventListener('DOMContentLoaded', drawGraph);