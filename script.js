const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const state = {
    creatorName: "",
    questions: [],
    currentQuestion: 0,
    answers: [],
    scores: [],
    playerMode: false
};

const screens = {
    home: $("#homeScreen"),
    builder: $("#builderScreen"),
    share: $("#shareScreen"),
    playerWelcome: $("#playerWelcomeScreen"),
    quiz: $("#quizScreen"),
    result: $("#resultScreen")
};

function showScreen(screen) {
    Object.values(screens).forEach(item => item.classList.remove("active"));
    screen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function createEmptyQuestion() {
    return {
        question: "",
        options: ["", "", "", ""],
        correct: null
    };
}

function createDefaultQuestions(name) {
    return [
        {
            question: `What is ${name}'s favourite color?`,
            options: ["Black", "Pink", "Blue", "Purple"],
            correct: 3
        },
        {
            question: `What kind of place does ${name} enjoy the most?`,
            options: ["Beach", "Cafe", "Mountains", "Home"],
            correct: 1
        },
        {
            question: `What makes ${name} happy instantly?`,
            options: ["A cute gift", "A compliment", "Good food", "A funny message"],
            correct: 0
        },
        {
            question: `What is ${name} most likely to do on a free day?`,
            options: ["Sleep", "Watch movies", "Go outside", "Work on a hobby"],
            correct: 3
        },
        {
            question: `What kind of messages does ${name} like most?`,
            options: ["Funny", "Sweet", "Random", "All of these"],
            correct: 3
        },
        {
            question: `What scares ${name} the most?`,
            options: ["Darkness", "Heights", "Losing someone", "Being ignored"],
            correct: 2
        },
        {
            question: `What would ${name} choose first?`,
            options: ["Chocolate", "Flowers", "A cute plushie", "Money"],
            correct: 2
        },
        {
            question: `What type of friend does ${name} value the most?`,
            options: ["Funny friend", "Honest friend", "Supportive friend", "Loyal friend"],
            correct: 3
        }
    ];
}

function replaceName(text) {
    return text.replace(/\{\{name\}\}/gi, state.creatorName);
}

function loadBuilderQuestion() {
    const question = state.questions[state.currentQuestion];

    $("#builderNumber").textContent = String(state.currentQuestion + 1).padStart(2, "0");

    $("#builderProgress").style.width = `${((state.currentQuestion + 1) / 8) * 100}%`;

    $("#questionInput").value = question.question;

    const options = $$(".answer-option");

    options.forEach((option, index) => {
        option.querySelector("input").value = question.options[index] || "";
        option.classList.toggle("selected", question.correct === index);
    });

    $("#previousQuestionBtn").style.visibility =
        state.currentQuestion === 0 ? "hidden" : "visible";

    $("#nextQuestionBtn").innerHTML =
        state.currentQuestion === 7
            ? `Complete Quiz <span>✓</span>`
            : `Next <span>→</span>`;
}

function saveBuilderQuestion() {
    const question = state.questions[state.currentQuestion];

    question.question = $("#questionInput").value.trim();

    $$(".answer-option").forEach((option, index) => {
        question.options[index] = option.querySelector("input").value.trim();
    });
}

function validateBuilderQuestion() {
    const question = state.questions[state.currentQuestion];

    if (!question.question) {
        alert("Please write a question first.");
        return false;
    }

    if (question.options.some(option => !option)) {
        alert("Please fill all four options.");
        return false;
    }

    if (question.correct === null) {
        alert("Please select the correct answer.");
        return false;
    }

    return true;
}

function bytesToBase64Url(bytes) {
    let binary = "";

    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function base64UrlToBytes(base64) {
    const normalized = base64
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);

    return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function encodeQuiz(data) {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    return bytesToBase64Url(bytes);
}

function decodeQuiz(encoded) {
    try {
        const bytes = base64UrlToBytes(encoded);
        const json = new TextDecoder().decode(bytes);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function generateQuizLink() {
    const quizData = {
        name: state.creatorName,
        questions: state.questions
    };

    const encoded = encodeQuiz(quizData);

    return `${window.location.origin}${window.location.pathname}#quiz=${encoded}`;
}

function startBuilder() {
    const name = $("#creatorName").value.trim();

    if (!name) {
        $("#creatorName").focus();
        $("#creatorName").classList.add("shake");

        setTimeout(() => {
            $("#creatorName").classList.remove("shake");
        }, 400);

        return;
    }

    state.creatorName = name;
    state.questions = createDefaultQuestions(name);
    state.currentQuestion = 0;
    state.playerMode = false;

    $("#builderName").textContent = name;

    showScreen(screens.builder);
    loadBuilderQuestion();
}

function createSharePage() {
    $("#shareName").textContent = state.creatorName;
    $("#shareLink").value = generateQuizLink();

    showScreen(screens.share);
}

function startPreview() {
    const link = generateQuizLink();
    window.history.replaceState(null, "", link);
    loadPlayerQuiz({
        name: state.creatorName,
        questions: state.questions
    });
}

function loadPlayerQuiz(data) {
    state.creatorName = data.name;
    state.questions = data.questions;
    state.currentQuestion = 0;
    state.answers = [];
    state.scores = [];
    state.playerMode = true;

    $("#playerCreatorName").textContent = state.creatorName;

    showScreen(screens.playerWelcome);
}

function startPlayerQuiz() {
    state.currentQuestion = 0;
    state.answers = new Array(8).fill(null);
    state.scores = new Array(8).fill(0);

    showScreen(screens.quiz);
    renderPlayerQuestion();
}

function renderPlayerQuestion() {
    const question = state.questions[state.currentQuestion];

    $("#quizQuestionNumber").textContent =
        `Question ${String(state.currentQuestion + 1).padStart(2, "0")}`;

    $("#quizProgress").style.width =
        `${((state.currentQuestion + 1) / 8) * 100}%`;

    $("#liveScore").textContent =
        state.scores.reduce((total, score) => total + score, 0);

    $("#quizQuestion").textContent = replaceName(question.question);

    const container = $("#quizOptions");
    container.innerHTML = "";

    question.options.forEach((optionText, index) => {
        const button = document.createElement("button");

        button.className = "quiz-option";

        button.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span>${optionText}</span>
        `;

        button.addEventListener("click", () => selectPlayerAnswer(index));

        container.appendChild(button);
    });

    const nextButton = $("#nextAnswerBtn");

    nextButton.disabled = true;

    nextButton.innerHTML =
        state.currentQuestion === 7
            ? `Complete Quiz <span>✓</span>`
            : `Next Question <span>→</span>`;
}

function selectPlayerAnswer(selectedIndex) {
    if (state.answers[state.currentQuestion] !== null) {
        return;
    }

    const question = state.questions[state.currentQuestion];
    const buttons = $$(".quiz-option");

    state.answers[state.currentQuestion] = selectedIndex;

    buttons.forEach((button, index) => {
        button.classList.add("locked");

        if (index === question.correct) {
            button.classList.add("correct");
        }

        if (index === selectedIndex && selectedIndex !== question.correct) {
            button.classList.add("wrong");
        }
    });

    if (selectedIndex === question.correct) {
        state.scores[state.currentQuestion] = 5;
    } else {
        state.scores[state.currentQuestion] = 0;
    }

    $("#liveScore").textContent =
        state.scores.reduce((total, score) => total + score, 0);

    $("#nextAnswerBtn").disabled = false;
}

function nextPlayerQuestion() {
    if (state.answers[state.currentQuestion] === null) {
        return;
    }

    if (state.currentQuestion === 7) {
        showResult();
        return;
    }

    state.currentQuestion++;
    renderPlayerQuestion();
}

function showResult() {
    const total = state.scores.reduce((total, score) => total + score, 0);
    const percentage = (total / 40) * 100;

    $("#finalScore").textContent = total;

    if (percentage > 30) {
        $("#resultTitle").textContent = "Best Friend!";
        $("#resultDescription").textContent =
            `Okay ${state.creatorName}, this person actually knows you pretty well. Looks like you found your Best Friend!`;
    } else {
        $("#resultTitle").textContent = "Just Friend!";
        $("#resultDescription").textContent =
            `Well ${state.creatorName}, this person needs to study you a little more. For now... just a friend!`;
    }

    const scoreList = $("#scoreList");
    scoreList.innerHTML = "";

    state.scores.forEach((score, index) => {
        const item = document.createElement("div");

        item.className = "score-item";

        item.innerHTML = `
            <span>Question ${index + 1}</span>
            <strong>${score}/5</strong>
        `;

        scoreList.appendChild(item);
    });

    showScreen(screens.result);
}

function resetHome() {
    window.history.replaceState(
        null,
        "",
        window.location.pathname
    );

    state.creatorName = "";
    state.questions = [];
    state.currentQuestion = 0;
    state.answers = [];
    state.scores = [];
    state.playerMode = false;

    $("#creatorName").value = "";

    showScreen(screens.home);
}

async function copyQuizLink() {
    const input = $("#shareLink");

    try {
        await navigator.clipboard.writeText(input.value);

        $("#copyLinkBtn").textContent = "Copied!";

        setTimeout(() => {
            $("#copyLinkBtn").textContent = "Copy Link";
        }, 1800);
    } catch {
        input.select();
        document.execCommand("copy");
        $("#copyLinkBtn").textContent = "Copied!";

        setTimeout(() => {
            $("#copyLinkBtn").textContent = "Copy Link";
        }, 1800);
    }
}

function checkSharedQuiz() {
    const hash = window.location.hash;

    if (!hash.startsWith("#quiz=")) {
        return false;
    }

    const encoded = hash.substring(6);
    const quizData = decodeQuiz(encoded);

    if (!quizData || !quizData.name || !Array.isArray(quizData.questions)) {
        return false;
    }

    if (quizData.questions.length !== 8) {
        return false;
    }

    loadPlayerQuiz(quizData);

    return true;
}

$("#createQuizBtn").addEventListener("click", startBuilder);

$("#creatorName").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        startBuilder();
    }
});

$$(".answer-option").forEach(option => {
    option.addEventListener("click", event => {
        if (event.target.tagName === "INPUT") {
            return;
        }

        const index = Number(option.dataset.index);

        state.questions[state.currentQuestion].correct = index;

        $$(".answer-option").forEach(item => {
            item.classList.remove("selected");
        });

        option.classList.add("selected");
    });

    option.querySelector("input").addEventListener("input", event => {
        const index = Number(option.dataset.index);
        state.questions[state.currentQuestion].options[index] =
            event.target.value;
    });
});

$("#nextQuestionBtn").addEventListener("click", () => {
    saveBuilderQuestion();

    if (!validateBuilderQuestion()) {
        return;
    }

    if (state.currentQuestion === 7) {
        createSharePage();
        return;
    }

    state.currentQuestion++;
    loadBuilderQuestion();
});

$("#previousQuestionBtn").addEventListener("click", () => {
    saveBuilderQuestion();

    if (state.currentQuestion > 0) {
        state.currentQuestion--;
        loadBuilderQuestion();
    }
});

$("#copyLinkBtn").addEventListener("click", copyQuizLink);

$("#previewQuizBtn").addEventListener("click", startPreview);

$("#newQuizBtn").addEventListener("click", resetHome);

$("#playerReadyBtn").addEventListener("click", startPlayerQuiz);

$("#nextAnswerBtn").addEventListener("click", nextPlayerQuestion);

$("#giftMessageBtn").addEventListener("click", () => {
    $("#thankYouModal").classList.add("show");
});

$("#closeModal").addEventListener("click", () => {
    $("#thankYouModal").classList.remove("show");
});

$("#modalHomeBtn").addEventListener("click", () => {
    $("#thankYouModal").classList.remove("show");
    resetHome();
});

$("#resultHomeBtn").addEventListener("click", resetHome);

$("#thankYouModal").addEventListener("click", event => {
    if (event.target === $("#thankYouModal")) {
        $("#thankYouModal").classList.remove("show");
    }
});

window.addEventListener("load", () => {
    const sharedQuiz = checkSharedQuiz();

    if (!sharedQuiz) {
        showScreen(screens.home);
    }
});