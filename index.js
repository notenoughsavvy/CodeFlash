// CodeFlash app logic. Keep this file in the same folder as index.html.

// Replace or extend these sample cards with the larger flashcardData arrays
// from your original code. Each card must have Front and Back properties.
const flashcardData = {
  html: [
    { Front: "What does HTML stand for?", Back: "HyperText Markup Language." },
    { Front: "Which tag creates the main heading?", Back: "<h1>" },
    { Front: "Which tag creates a hyperlink?", Back: "<a href='...'>" },
    { Front: "Which tags create an unordered list?", Back: "<ul> and <li>." },
    { Front: "Which tag inserts an image?", Back: "<img src='...' alt='...'>" },
    { Front: "Which tag creates a line break?", Back: "<br>" },
    { Front: "What does the alt attribute do?", Back: "Provides alternative text for an image and supports accessibility." },
    { Front: "Which tag creates a form?", Back: "<form>" },
    { Front: "Which tag creates a text input?", Back: "<input type='text'>" },
    { Front: "Which tag links an external CSS file?", Back: "<link rel='stylesheet' href='...'>" }
  ],
  css: [
    { Front: "What does CSS stand for?", Back: "Cascading Style Sheets." },
    { Front: "What is Flexbox used for?", Back: "One-dimensional row or column layouts." },
    { Front: "What is CSS Grid used for?", Back: "Two-dimensional row and column layouts." },
    { Front: "What does justify-between do in Tailwind?", Back: "Places flex items with space between them." },
    { Front: "Which property changes text color?", Back: "color" },
    { Front: "Which property adds space inside an element's border?", Back: "padding" },
    { Front: "Which property adds space outside an element's border?", Back: "margin" },
    { Front: "What does border-radius do?", Back: "Rounds an element's corners." },
    { Front: "What does position: fixed do?", Back: "Positions an element relative to the viewport." },
    { Front: "What is a media query used for?", Back: "Applying styles based on screen or device conditions." }
  ],
  js: [
    { Front: "What is the difference between let and const?", Back: "let can be reassigned; const cannot be reassigned." },
    { Front: "What does Array.push() do?", Back: "Adds one or more items to the end of an array." },
    { Front: "What is the DOM?", Back: "The Document Object Model: a programmable representation of a webpage." },
    { Front: "What is a callback function?", Back: "A function passed to another function to be called later." },
    { Front: "What does === check?", Back: "Strict equality: value and type." },
    { Front: "What does Array.map() do?", Back: "Creates a new array from the results of a function on each item." },
    { Front: "What is a Promise?", Back: "An object representing the eventual result of an asynchronous operation." },
    { Front: "What does JSON.parse() do?", Back: "Converts a JSON string into a JavaScript value." },
    { Front: "What is localStorage?", Back: "Browser storage that persists key-value data between sessions." },
    { Front: "What does addEventListener() do?", Back: "Registers a function to run when a specified event occurs." }
  ]
};

const $ = (id) => document.getElementById(id);
const views = ["login-view", "dashboard-view", "category-view", "flashcard-view", "complete-view"];

let isSignUpMode = false;
let activeCards = [];
let activeCategory = "";
let currentIndex = 0;
let showBack = false;

function showView(viewId) {
  views.forEach(id => $(id).classList.add("hidden"));
  $(viewId).classList.remove("hidden");
  // The completion screen uses flex to center its content.
  if (viewId === "complete-view") $(viewId).classList.add("flex");
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("codeflash_users")) || {};
  } catch {
    return {};
  }
}

function showError(message) {
  $("auth-error").textContent = message;
  $("auth-error").classList.remove("hidden");
}

function clearError() {
  $("auth-error").textContent = "";
  $("auth-error").classList.add("hidden");
}

function setAuthMode() {
  $("form-title").textContent = isSignUpMode ? "Create your account" : "Welcome to CodeFlash";
  $("auth-btn").textContent = isSignUpMode ? "Sign Up" : "Login";
  $("toggle-text").textContent = isSignUpMode ? "Already have an account?" : "Don't have an account?";
  $("toggle-mode-btn").textContent = isSignUpMode ? "Login" : "Sign Up";
  $("password-input").autocomplete = isSignUpMode ? "new-password" : "current-password";
  clearError();
}

$("toggle-mode-btn").addEventListener("click", () => {
  isSignUpMode = !isSignUpMode;
  setAuthMode();
});

$("auth-form").addEventListener("submit", (event) => {
  event.preventDefault();
  clearError();

  const username = $("username-input").value.trim();
  const password = $("password-input").value;

  if (username.length < 2 || password.length < 4) {
    showError("Use a username with at least 2 characters and a password with at least 4 characters.");
    return;
  }

  const users = getUsers();

  if (isSignUpMode) {
    if (users[username]) {
      showError("That username already exists. Please log in.");
      return;
    }
    users[username] = password;
    localStorage.setItem("codeflash_users", JSON.stringify(users));
    isSignUpMode = false;
    setAuthMode();
    $("password-input").value = "";
    showError("Account created. Please log in with your new details.");
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(users, username) || users[username] !== password) {
    showError("Incorrect username or password.");
    return;
  }

  localStorage.setItem("codeflash_current_user", username);
  $("password-input").value = "";
  openDashboard(username);
});

function openDashboard(username) {
  $("welcome-msg").textContent = `Welcome back, ${username}!`;
  $("stat-total").textContent = Object.values(flashcardData).reduce((sum, cards) => sum + cards.length, 0);
  showView("dashboard-view");
}

$("start-learning-btn").addEventListener("click", () => {
  updateCategoryCounts();
  showView("category-view");
});

$("back-to-dash-btn").addEventListener("click", () => {
  const username = localStorage.getItem("codeflash_current_user");
  if (username) openDashboard(username);
  else showView("login-view");
});

function updateCategoryCounts() {
  ["html", "css", "js"].forEach(category => {
    $(category + "-count").textContent = `${flashcardData[category].length} questions available`;
  });
}

document.querySelectorAll(".category-btn").forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.category;
    const fullList = flashcardData[category] || [];

    if (fullList.length === 0) {
      $("category-error").textContent = "There are no cards in this category yet.";
      $("category-error").classList.remove("hidden");
      return;
    }

    const chosenCount = $("question-count-select").value;
    const count = chosenCount === "all" ? fullList.length : Number(chosenCount);
    activeCards = fullList.slice(0, count);
    activeCategory = category;
    currentIndex = 0;
    showBack = false;

    $("category-error").classList.add("hidden");
    $("session-title").textContent = `${category === "js" ? "JavaScript" : category.toUpperCase()} flashcards`;
    showView("flashcard-view");
    updateCard();
  });
});

function updateCard() {
  if (!activeCards.length) return;

  const card = activeCards[currentIndex];
  // textContent is used so HTML examples display as text, not as real HTML elements.
  $("textcontent").textContent = showBack ? card.Back : card.Front;
  $("card-side-label").textContent = showBack ? "ANSWER" : "QUESTION · CLICK TO REVEAL";
  $("reveal-btn").textContent = showBack ? "Show question" : "Reveal answer";
  $("card-number").textContent = `Question ${currentIndex + 1} of ${activeCards.length}`;

  const percent = Math.round(((currentIndex + 1) / activeCards.length) * 100);
  $("progress-percent").textContent = `${percent}%`;
  $("progress-bar").style.width = `${percent}%`;
  $("prev-btn").disabled = activeCards.length <= 1;
  $("prev-btn").classList.toggle("opacity-50", activeCards.length <= 1);
  $("next-btn").textContent = currentIndex === activeCards.length - 1 ? "Finish session →" : "Next question →";
}

function revealCard() {
  showBack = !showBack;
  updateCard();
}

function goNext() {
  if (currentIndex >= activeCards.length - 1) {
    finishSession();
    return;
  }
  currentIndex++;
  showBack = false;
  updateCard();
}

function goPrevious() {
  if (currentIndex > 0) currentIndex--;
  showBack = false;
  updateCard();
}

function finishSession() {
  $("complete-message").textContent = `You reviewed ${activeCards.length} ${activeCategory === "js" ? "JavaScript" : activeCategory.toUpperCase()} cards. Nice work!`;
  showView("complete-view");
}

$("flashcard").addEventListener("click", revealCard);
$("reveal-btn").addEventListener("click", revealCard);
$("next-btn").addEventListener("click", goNext);
$("prev-btn").addEventListener("click", goPrevious);
$("finish-btn").addEventListener("click", () => {
  const username = localStorage.getItem("codeflash_current_user");
  if (username) openDashboard(username);
  else showView("login-view");
});
$("change-category-btn").addEventListener("click", () => {
  updateCategoryCounts();
  showView("category-view");
});
$("study-again-btn").addEventListener("click", () => {
  updateCategoryCounts();
  showView("category-view");
});
$("complete-dashboard-btn").addEventListener("click", () => {
  const username = localStorage.getItem("codeflash_current_user");
  if (username) openDashboard(username);
  else showView("login-view");
});
$("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("codeflash_current_user");
  $("username-input").value = "";
  $("password-input").value = "";
  clearError();
  showView("login-view");
});

document.addEventListener("keydown", (event) => {
  if ($("flashcard-view").classList.contains("hidden")) return;
  if (event.code === "Space" && !["INPUT", "BUTTON", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    revealCard();
  } else if (event.key === "ArrowRight") {
    goNext();
  } else if (event.key === "ArrowLeft") {
    goPrevious();
  }
});

// Restore the session after refreshing, if a user is logged in.
updateCategoryCounts();
const savedUser = localStorage.getItem("codeflash_current_user");
if (savedUser && getUsers()[savedUser]) openDashboard(savedUser);
else showView("login-view");
