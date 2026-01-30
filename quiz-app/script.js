// API Configuration
const API_BASE_URL = 'api';

// Question bank will be loaded from PHP backend
let QUESTION_BANK = [];

// DOM elements
const setupScreen = document.getElementById('setup-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const categorySelect = document.getElementById('category-select');
const difficultySelect = document.getElementById('difficulty-select');
const startQuizBtn = document.getElementById('start-quiz-btn');

const questionCounterEl = document.getElementById('question-counter');
const timerEl = document.getElementById('timer');
const questionTextEl = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');

const resultSummaryEl = document.getElementById('result-summary');
const restartBtn = document.getElementById('restart-btn');

// Quiz state
let filteredQuestions = [];
let currentIndex = 0;
let userAnswers = []; // store selected option index per question
let timePerQuestion = []; // seconds spent per question
let timerInterval = null;
let timeLeft = 0;
const TIME_LIMIT = 15; // seconds per question
let selectedCategory = '';
let selectedDifficulty = '';

// Chart instances
let accuracyChartInstance = null;
let timeChartInstance = null;

function resetState() {
    filteredQuestions = [];
    currentIndex = 0;
    userAnswers = [];
    timePerQuestion = [];
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = TIME_LIMIT;
}

async function startQuiz() {
    const category = categorySelect.value;
    const difficulty = difficultySelect.value;

    resetState();
    selectedCategory = category;
    selectedDifficulty = difficulty;

    // Fetch questions from JSON file (Static)
    try {
        const response = await fetch(`${API_BASE_URL}/questions.json`);
        
        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }
        
        const allQuestions = await response.json();
        
        // Filter questions locally
        if (allQuestions && allQuestions.length > 0) {
            filteredQuestions = allQuestions.filter(q => {
                const categoryMatch = q.category === category;
                const difficultyMatch = q.difficulty === difficulty;
                return categoryMatch && difficultyMatch;
            });

            // Fallback: if no matches for both, try just category
            if (filteredQuestions.length === 0) {
                filteredQuestions = allQuestions.filter(q => q.category === category);
            }

            // If still empty, use all questions (or handle as error)
            if (filteredQuestions.length === 0) {
                filteredQuestions = allQuestions;
            }

        } else {
            alert('No questions available.');
            return;
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert(`Failed to load questions. Details: ${error.message}\n\nMake sure you are opening this via a server (like Live Server or XAMPP) and not directly as a file.`);
        return;
    }

    userAnswers = new Array(filteredQuestions.length).fill(null);
    timePerQuestion = new Array(filteredQuestions.length).fill(0);

    setupScreen.classList.add('hidden');
    setupScreen.classList.remove('active');
    quizScreen.classList.remove('hidden');
    quizScreen.classList.add('active');

    renderQuestion();
    startTimer();
}

function renderQuestion() {
    const question = filteredQuestions[currentIndex];
    questionTextEl.textContent = question.text;
    questionCounterEl.textContent = `Question ${currentIndex + 1} of ${
        filteredQuestions.length
    }`;

    // update linear progress bar
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill && filteredQuestions.length > 0) {
        const progress = ((currentIndex + 1) / filteredQuestions.length) * 100;
        progressFill.style.width = `${progress}%`;
    }

    optionsContainer.innerHTML = '';
    question.options.forEach((optionText, index) => {
        const row = document.createElement('div');
        row.className = 'option-row';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'option';
        input.value = index;
        input.id = `option-${index}`;
        input.className = 'option-input';

        if (userAnswers[currentIndex] === index) {
            input.checked = true;
        }

        const label = document.createElement('label');
        label.setAttribute('for', input.id);
        label.textContent = optionText;

        row.appendChild(input);
        row.appendChild(label);
        optionsContainer.appendChild(row);
    });

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === filteredQuestions.length - 1;
    submitBtn.disabled = userAnswers.includes(null);
}

function saveCurrentAnswer() {
    const selected = document.querySelector('input[name="option"]:checked');
    if (selected) {
        userAnswers[currentIndex] = parseInt(selected.value, 10);
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = TIME_LIMIT;
    timerEl.textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft -= 1;
        timerEl.textContent = timeLeft;
        timePerQuestion[currentIndex] += 1;

        if (timeLeft <= 0) {
            // Time up: move to next question or auto-submit
            clearInterval(timerInterval);
            if (currentIndex < filteredQuestions.length - 1) {
                saveCurrentAnswer();
                currentIndex += 1;
                renderQuestion();
                startTimer();
            } else {
                // Last question time out -> submit quiz
                saveCurrentAnswer();
                finishQuiz();
            }
        }
    }, 1000);
}

function goToNextQuestion() {
    saveCurrentAnswer();
    if (currentIndex < filteredQuestions.length - 1) {
        currentIndex += 1;
        renderQuestion();
        startTimer();
    }
}

function goToPreviousQuestion() {
    saveCurrentAnswer();
    if (currentIndex > 0) {
        currentIndex -= 1;
        renderQuestion();
        startTimer();
    }
}

async function finishQuiz() {
    saveCurrentAnswer();
    clearInterval(timerInterval);

    const totalQuestions = filteredQuestions.length;
    let correctCount = 0;
    let incorrectCount = 0;

    filteredQuestions.forEach((q, index) => {
        if (userAnswers[index] === q.correctIndex) {
            correctCount += 1;
        } else {
            incorrectCount += 1;
        }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const totalTime = timePerQuestion.reduce((sum, t) => sum + t, 0);
    const avgTime = totalQuestions > 0 ? (totalTime / totalQuestions).toFixed(1) : 0;

    // Calculate Grade locally
    const grade = percentage >= 80 ? 'Excellent' : (percentage >= 60 ? 'Good' : (percentage >= 40 ? 'Fair' : 'Needs Improvement'));
    const passed = percentage >= 50;

    // Display results without server request
    resultSummaryEl.innerHTML = `
        <p><strong>Total Questions:</strong> ${totalQuestions}</p>
        <p><strong>Correct Answers:</strong> ${correctCount}</p>
        <p><strong>Incorrect Answers:</strong> ${incorrectCount}</p>
        <p><strong>Score:</strong> ${percentage}%</p>
        <p><strong>Performance:</strong> ${grade}</p>
        <p><strong>Status:</strong> ${passed ? 'Passed ✓' : 'Failed ✗'}</p>
        <p><strong>Total Time Spent:</strong> ${totalTime} seconds</p>
        <p><strong>Average Time per Question:</strong> ${avgTime} seconds</p>
    `;

    // Switch screens
    quizScreen.classList.add('hidden');
    quizScreen.classList.remove('active');
    resultScreen.classList.remove('hidden');
    resultScreen.classList.add('active');

    renderCharts(correctCount, incorrectCount, timePerQuestion);
}

function renderCharts(correctCount, incorrectCount, timeData) {
    const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
    const timeCtx = document.getElementById('timeChart').getContext('2d');

    if (accuracyChartInstance) {
        accuracyChartInstance.destroy();
    }
    if (timeChartInstance) {
        timeChartInstance.destroy();
    }

    accuracyChartInstance = new Chart(accuracyCtx, {
        type: 'pie',
        data: {
            labels: ['Correct', 'Incorrect'],
            datasets: [
                {
                    data: [correctCount, incorrectCount],
                    backgroundColor: ['#16a34a', '#ef4444'],
                },
            ],
        },
    });

    const labels = filteredQuestions.map((q, idx) => `Q${idx + 1}`);

    timeChartInstance = new Chart(timeCtx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Time (s)',
                    data: timeData,
                    backgroundColor: '#2563eb',
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

function restartQuiz() {
    resetState();

    resultScreen.classList.add('hidden');
    resultScreen.classList.remove('active');
    setupScreen.classList.remove('hidden');
    setupScreen.classList.add('active');
}

// Event listeners
startQuizBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', goToNextQuestion);
prevBtn.addEventListener('click', goToPreviousQuestion);
submitBtn.addEventListener('click', finishQuiz);
restartBtn.addEventListener('click', restartQuiz);

// Enable submit when all questions have answers
optionsContainer.addEventListener('change', () => {
    saveCurrentAnswer();
    submitBtn.disabled = userAnswers.includes(null);
});
