/* Personal Dashboard — Vanilla JS + LocalStorage */

const STORAGE_KEYS = {
  theme: "dashboard_theme",
  userName: "dashboard_userName",
  timerMinutes: "dashboard_timerMinutes",
  tasks: "dashboard_tasks",
  links: "dashboard_links",
};

/* ---------- Storage helpers ---------- */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadString(key, fallback = "") {
  return localStorage.getItem(key) ?? fallback;
}

function saveString(key, value) {
  localStorage.setItem(key, value);
}

/* ---------- Theme ---------- */

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle.querySelector(".theme-toggle__icon");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  saveString(STORAGE_KEYS.theme, theme);
}

function initTheme() {
  const saved = loadString(STORAGE_KEYS.theme, "light");
  applyTheme(saved === "dark" ? "dark" : "light");
}

themeToggle.addEventListener("click", () => {
  const next =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "light"
      : "dark";
  applyTheme(next);
});

/* ---------- Greeting & clock ---------- */

const liveClock = document.getElementById("live-clock");
const liveDate = document.getElementById("live-date");
const greetingText = document.getElementById("greeting-text");
const userNameInput = document.getElementById("user-name");

function getGreeting(hour) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function updateClockAndGreeting() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  liveClock.textContent = `${h}:${m}:${s}`;
  liveDate.textContent = formatDate(now);

  const name = userNameInput.value.trim();
  const greeting = getGreeting(now.getHours());
  greetingText.textContent = name ? `${greeting}, ${name}` : greeting;
}

userNameInput.value = loadString(STORAGE_KEYS.userName, "");
userNameInput.addEventListener("input", () => {
  saveString(STORAGE_KEYS.userName, userNameInput.value);
  updateClockAndGreeting();
});

setInterval(updateClockAndGreeting, 1000);
updateClockAndGreeting();

/* ---------- Focus timer ---------- */

const timerDisplay = document.getElementById("timer-display");
const timerMinutesInput = document.getElementById("timer-minutes");
const btnStart = document.getElementById("timer-start");
const btnStop = document.getElementById("timer-stop");
const btnReset = document.getElementById("timer-reset");

let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let timerInterval = null;

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTimer(remainingSeconds);
}

function setDurationFromInput() {
  const minutes = Math.min(120, Math.max(1, parseInt(timerMinutesInput.value, 10) || 25));
  timerMinutesInput.value = minutes;
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  saveString(STORAGE_KEYS.timerMinutes, String(minutes));
  renderTimer();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      stopTimer();
      return;
    }
    remainingSeconds -= 1;
    renderTimer();
    if (remainingSeconds === 0) stopTimer();
  }, 1000);
}

const savedMinutes = parseInt(loadString(STORAGE_KEYS.timerMinutes, "25"), 10) || 25;
timerMinutesInput.value = savedMinutes;
totalSeconds = savedMinutes * 60;
remainingSeconds = totalSeconds;
renderTimer();

timerMinutesInput.addEventListener("change", () => {
  stopTimer();
  setDurationFromInput();
});

btnStart.addEventListener("click", startTimer);
btnStop.addEventListener("click", stopTimer);
btnReset.addEventListener("click", () => {
  stopTimer();
  setDurationFromInput();
});

/* ---------- Tasks ---------- */

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

let tasks = loadJSON(STORAGE_KEYS.tasks, []);

function saveTasks() {
  saveJSON(STORAGE_KEYS.tasks, tasks);
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;
    li.setAttribute("role", "listitem");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-item__checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark "${task.text}" as done`);

    const textSpan = document.createElement("span");
    textSpan.className = "task-item__text";
    if (task.done) textSpan.classList.add("task-item__text--done");
    textSpan.textContent = task.text;

    const actions = document.createElement("div");
    actions.className = "task-item__actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn--secondary btn--small";
    editBtn.textContent = "Edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn--danger";
    deleteBtn.textContent = "Delete";

    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      textSpan.classList.toggle("task-item__text--done", task.done);
      saveTasks();
    });

    editBtn.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "task-item__edit-input";
      input.value = task.text;
      input.maxLength = 200;
      li.replaceChild(input, textSpan);
      editBtn.disabled = true;
      input.focus();
      input.select();

      function finishEdit() {
        const newText = input.value.trim();
        if (newText) {
          task.text = newText;
          textSpan.textContent = newText;
          if (task.done) textSpan.classList.add("task-item__text--done");
          saveTasks();
        }
        li.replaceChild(textSpan, input);
        editBtn.disabled = false;
      }

      input.addEventListener("blur", finishEdit);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
        if (e.key === "Escape") {
          li.replaceChild(textSpan, input);
          editBtn.disabled = false;
        }
      });
    });

    deleteBtn.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.append(editBtn, deleteBtn);
    li.append(checkbox, textSpan, actions);
    taskList.appendChild(li);
  });
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({
    id: crypto.randomUUID(),
    text,
    done: false,
  });
  taskInput.value = "";
  saveTasks();
  renderTasks();
});

renderTasks();

/* ---------- Quick links ---------- */

const linkForm = document.getElementById("link-form");
const linkNameInput = document.getElementById("link-name");
const linkUrlInput = document.getElementById("link-url");
const linkPills = document.getElementById("link-pills");

let links = loadJSON(STORAGE_KEYS.links, []);

function saveLinks() {
  saveJSON(STORAGE_KEYS.links, links);
}

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function renderLinks() {
  linkPills.innerHTML = "";
  links.forEach((link) => {
    const pill = document.createElement("div");
    pill.className = "link-pill";
    pill.setAttribute("role", "listitem");

    const anchor = document.createElement("a");
    anchor.className = "link-pill__anchor";
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.name;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "link-pill__remove";
    removeBtn.setAttribute("aria-label", `Remove ${link.name}`);
    removeBtn.textContent = "×";

    removeBtn.addEventListener("click", () => {
      links = links.filter((l) => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    pill.append(anchor, removeBtn);
    linkPills.appendChild(pill);
  });
}

linkForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = linkNameInput.value.trim();
  const url = linkUrlInput.value.trim();
  if (!name || !url) return;

  links.push({
    id: crypto.randomUUID(),
    name,
    url: normalizeUrl(url),
  });

  linkNameInput.value = "";
  linkUrlInput.value = "";
  saveLinks();
  renderLinks();
});

renderLinks();

/* ---------- Init ---------- */

initTheme();
