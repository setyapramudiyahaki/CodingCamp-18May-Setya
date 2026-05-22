/**
 * Personal Dashboard — Vanilla JS + LocalStorage
 * Features: greeting, Pomodoro SVG ring, todos, quick links, theme, toasts
 */

/* ==========================================================================
   Constants & storage keys
   ========================================================================== */

const STORAGE_KEYS = {
  theme: "dashboard_theme",
  userName: "dashboard_userName",
  timerMinutes: "dashboard_timerMinutes",
  tasks: "dashboard_tasks",
  taskSort: "dashboard_taskSort",
  links: "dashboard_links",
};

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~339.292

/* ==========================================================================
   Storage helpers
   ========================================================================== */

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

/* ==========================================================================
   Toast notifications
   ========================================================================== */

const toastContainer = document.getElementById("toast-container");

/**
 * Show a toast message (success = green, error = red).
 * @param {string} message
 * @param {"success"|"error"} type
 */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "alert");
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast--fade-out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 3200);
}

/* ==========================================================================
   Theme (Challenge 1)
   ========================================================================== */

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle.querySelector(".theme-toggle__icon");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  saveString(STORAGE_KEYS.theme, theme);
}

function initTheme() {
  const saved = loadString(STORAGE_KEYS.theme, "light");
  applyTheme(saved === "dark" ? "dark" : "light");
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

/* ==========================================================================
   Greeting & clock
   ========================================================================== */

const liveTimeEl = document.getElementById("live-time");
const liveDateEl = document.getElementById("live-date");
const greetingTextEl = document.getElementById("greeting-text");

/**
 * Return time-of-day greeting label.
 * @param {number} hour 0–23
 */
function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function updateGreeting() {
  const now = new Date();
  liveTimeEl.textContent = formatTime(now);
  liveDateEl.textContent = formatDate(now);

  const name = loadString(STORAGE_KEYS.userName, "").trim();
  const greeting = getGreeting(now.getHours());
  greetingTextEl.textContent = name ? `${greeting}, ${name}!` : `${greeting}!`;
}

setInterval(updateGreeting, 1000);
updateGreeting();

/* ==========================================================================
   Custom name (Challenge 2)
   ========================================================================== */

const btnSetName = document.getElementById("btn-set-name");
const nameModal = document.getElementById("name-modal");
const nameForm = document.getElementById("name-form");
const nameInput = document.getElementById("name-input");
const nameCancel = document.getElementById("name-cancel");

btnSetName.addEventListener("click", () => {
  nameInput.value = loadString(STORAGE_KEYS.userName, "");
  nameModal.showModal();
  nameInput.focus();
});

nameCancel.addEventListener("click", () => nameModal.close());

nameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  saveString(STORAGE_KEYS.userName, name);
  updateGreeting();
  nameModal.close();
  showToast(name ? `Welcome, ${name}!` : "Name cleared.", "success");
});

/* ==========================================================================
   Pomodoro timer + SVG ring (Challenge 3: custom duration)
   ========================================================================== */

const timerDisplay = document.getElementById("timer-display");
const timerMinutesInput = document.getElementById("timer-minutes");
const timerRingProgress = document.getElementById("timer-ring-progress");
const btnStart = document.getElementById("timer-start");
const btnPause = document.getElementById("timer-pause");
const btnReset = document.getElementById("timer-reset");

let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let timerInterval = null;

// Configure SVG ring stroke
timerRingProgress.style.strokeDasharray = String(RING_CIRCUMFERENCE);

/**
 * Format seconds as MM:SS.
 */
function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Update ring progress and warning/danger colors.
 */
function updateRing() {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  timerRingProgress.style.strokeDashoffset = String(offset);
  timerDisplay.textContent = formatTimer(remainingSeconds);

  timerRingProgress.classList.remove(
    "timer__ring-progress--warning",
    "timer__ring-progress--danger"
  );

  if (remainingSeconds <= 60 && remainingSeconds > 0) {
    timerRingProgress.classList.add("timer__ring-progress--danger");
  } else if (progress <= 0.25 && remainingSeconds > 0) {
    timerRingProgress.classList.add("timer__ring-progress--warning");
  }
}

/**
 * Load duration from input and persist (1–99 minutes).
 */
function applyDurationFromInput() {
  let minutes = parseInt(timerMinutesInput.value, 10) || 25;
  minutes = Math.min(99, Math.max(1, minutes));
  timerMinutesInput.value = minutes;
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  saveString(STORAGE_KEYS.timerMinutes, String(minutes));
  updateRing();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  btnPause.disabled = true;
  btnStart.disabled = false;
}

function startTimer() {
  if (timerInterval || remainingSeconds <= 0) return;
  btnPause.disabled = false;
  btnStart.disabled = true;

  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      finishTimer();
      return;
    }
    remainingSeconds -= 1;
    updateRing();

    if (remainingSeconds === 0) {
      finishTimer();
    }
  }, 1000);
}

function finishTimer() {
  stopTimer();
  showToast("Focus session complete! Time for a break.", "success");
}

function pauseTimer() {
  stopTimer();
}

function resetTimer() {
  stopTimer();
  applyDurationFromInput();
}

const savedMinutes = parseInt(loadString(STORAGE_KEYS.timerMinutes, "25"), 10) || 25;
timerMinutesInput.value = Math.min(99, Math.max(1, savedMinutes));
totalSeconds = timerMinutesInput.value * 60;
remainingSeconds = totalSeconds;
updateRing();

timerMinutesInput.addEventListener("change", () => {
  pauseTimer();
  applyDurationFromInput();
});

btnStart.addEventListener("click", startTimer);
btnPause.addEventListener("click", pauseTimer);
btnReset.addEventListener("click", resetTimer);

/* ==========================================================================
   To-Do list (Challenges 4 & 5: duplicates + sort)
   ========================================================================== */

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskEmpty = document.getElementById("task-empty");
const taskSortSelect = document.getElementById("task-sort");

let tasks = loadJSON(STORAGE_KEYS.tasks, []);
let taskSort = loadString(STORAGE_KEYS.taskSort, "default");
taskSortSelect.value = taskSort;

function saveTasks() {
  saveJSON(STORAGE_KEYS.tasks, tasks);
}

/**
 * Check if task text already exists (case-insensitive), optionally excluding one id.
 */
function isDuplicateTask(text, excludeId = null) {
  const normalized = text.trim().toLowerCase();
  return tasks.some(
    (t) => t.id !== excludeId && t.text.trim().toLowerCase() === normalized
  );
}

/**
 * Return sorted copy of tasks based on current sort mode.
 */
function getSortedTasks() {
  const list = [...tasks];

  switch (taskSort) {
    case "az":
      return list.sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: "base" }));
    case "za":
      return list.sort((a, b) => b.text.localeCompare(a.text, undefined, { sensitivity: "base" }));
    case "done-last":
      return list.sort((a, b) => {
        if (a.done === b.done) {
          return (a.order ?? 0) - (b.order ?? 0);
        }
        return a.done ? 1 : -1;
      });
    default:
      return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}

function renderTasks() {
  const sorted = getSortedTasks();
  taskList.innerHTML = "";

  taskEmpty.hidden = sorted.length > 0;

  sorted.forEach((task) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    if (task.done) li.classList.add("todo-item--done");
    li.dataset.id = task.id;
    li.setAttribute("role", "listitem");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-item__check";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark "${task.text}" as done`);

    const textSpan = document.createElement("span");
    textSpan.className = "todo-item__text";
    if (task.done) textSpan.classList.add("todo-item__text--done");
    textSpan.textContent = task.text;

    const actions = document.createElement("div");
    actions.className = "todo-item__actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn--icon-only";
    editBtn.setAttribute("aria-label", `Edit "${task.text}"`);
    editBtn.innerHTML = "✏️";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn--danger btn--small";
    deleteBtn.textContent = "Delete";

    checkbox.addEventListener("change", () => {
      const item = tasks.find((t) => t.id === task.id);
      if (!item) return;
      item.done = checkbox.checked;
      li.classList.toggle("todo-item--done", item.done);
      textSpan.classList.toggle("todo-item__text--done", item.done);
      saveTasks();
      if (taskSort === "done-last") renderTasks();
    });

    editBtn.addEventListener("click", () => startEditTask(task, li, textSpan, editBtn));

    deleteBtn.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
      showToast("Task deleted.", "success");
    });

    actions.append(editBtn, deleteBtn);
    li.append(checkbox, textSpan, actions);
    taskList.appendChild(li);
  });
}

/**
 * Inline edit: Enter or blur saves; Escape cancels.
 */
function startEditTask(task, li, textSpan, editBtn) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "todo-item__edit-input";
  input.value = task.text;
  input.maxLength = 200;
  li.replaceChild(input, textSpan);
  editBtn.disabled = true;
  input.focus();
  input.select();

  function cancelEdit() {
    li.replaceChild(textSpan, input);
    editBtn.disabled = false;
  }

  function commitEdit() {
    const newText = input.value.trim();
    if (!newText) {
      showToast("Task cannot be empty.", "error");
      cancelEdit();
      return;
    }
    if (isDuplicateTask(newText, task.id)) {
      showToast("This task already exists.", "error");
      input.focus();
      return;
    }
    const item = tasks.find((t) => t.id === task.id);
    if (item) {
      item.text = newText;
      textSpan.textContent = newText;
      if (item.done) textSpan.classList.add("todo-item__text--done");
      else textSpan.classList.remove("todo-item__text--done");
      saveTasks();
      showToast("Task updated.", "success");
    }
    li.replaceChild(textSpan, input);
    editBtn.disabled = false;
    renderTasks();
  }

  input.addEventListener("blur", commitEdit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      input.removeEventListener("blur", commitEdit);
      cancelEdit();
    }
  });
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (isDuplicateTask(trimmed)) {
    showToast("This task already exists.", "error");
    taskInput.focus();
    return;
  }

  const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order ?? 0), 0);
  tasks.push({
    id: crypto.randomUUID(),
    text: trimmed,
    done: false,
    order: maxOrder + 1,
  });

  taskInput.value = "";
  saveTasks();
  renderTasks();
  showToast("Task added.", "success");
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(taskInput.value);
});

taskSortSelect.addEventListener("change", () => {
  taskSort = taskSortSelect.value;
  saveString(STORAGE_KEYS.taskSort, taskSort);
  renderTasks();
});

renderTasks();

/* ==========================================================================
   Quick links (Google favicon)
   ========================================================================== */

const linkForm = document.getElementById("link-form");
const linkNameInput = document.getElementById("link-name");
const linkUrlInput = document.getElementById("link-url");
const linkChips = document.getElementById("link-chips");
const linksEmpty = document.getElementById("links-empty");

let links = loadJSON(STORAGE_KEYS.links, []);

function saveLinks() {
  saveJSON(STORAGE_KEYS.links, links);
}

/**
 * Normalize URL and ensure protocol.
 */
function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Extract hostname for Google favicon API.
 */
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

/**
 * Google favicon service URL for a domain.
 */
function getFaviconUrl(url) {
  const domain = getDomain(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

function renderLinks() {
  linkChips.innerHTML = "";
  linksEmpty.hidden = links.length > 0;

  links.forEach((link) => {
    const chip = document.createElement("div");
    chip.className = "link-chip";
    chip.setAttribute("role", "listitem");

    const anchor = document.createElement("a");
    anchor.className = "link-chip__anchor";
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    const favicon = document.createElement("img");
    favicon.className = "link-chip__favicon";
    favicon.src = getFaviconUrl(link.url);
    favicon.alt = "";
    favicon.width = 18;
    favicon.height = 18;
    favicon.loading = "lazy";

    const label = document.createElement("span");
    label.textContent = link.name;

    anchor.append(favicon, label);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "link-chip__remove";
    removeBtn.setAttribute("aria-label", `Remove ${link.name}`);
    removeBtn.textContent = "×";

    removeBtn.addEventListener("click", () => {
      links = links.filter((l) => l.id !== link.id);
      saveLinks();
      renderLinks();
      showToast("Link removed.", "success");
    });

    chip.append(anchor, removeBtn);
    linkChips.appendChild(chip);
  });
}

linkForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = linkNameInput.value.trim();
  const urlRaw = linkUrlInput.value.trim();

  if (!name || !urlRaw) {
    showToast("Please enter both name and URL.", "error");
    return;
  }

  links.push({
    id: crypto.randomUUID(),
    name,
    url: normalizeUrl(urlRaw),
  });

  linkNameInput.value = "";
  linkUrlInput.value = "";
  saveLinks();
  renderLinks();
  showToast("Link added.", "success");
});

renderLinks();

/* ==========================================================================
   Initialize
   ========================================================================== */

initTheme();
