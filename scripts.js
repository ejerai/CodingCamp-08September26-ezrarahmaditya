(function () {
  'use strict';

  /* theme dark mode */
  const THEME_KEY = 'todolife_theme';
  const themeToggleBtn = document.getElementById('themeToggle');

  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  initTheme();

  /* greeting */
  const greetingTimeEl = document.getElementById('greetingTime');
  const greetingDateEl = document.getElementById('greetingDate');
  const greetingTextEl = document.getElementById('greetingText');

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function pad(n) {
    return n.toString().padStart(2, '0');
  }

  function greetingForHour(hour) {
    if (hour < 5)  return 'Good Night';
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  }

  function tickClock() {
    const now = new Date();
    greetingTimeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    greetingDateEl.textContent = dateFormatter.format(now);
    greetingTextEl.textContent = greetingForHour(now.getHours());
  }

  tickClock();
  setInterval(tickClock, 1000);

  /* focus timer */
  const FOCUS_MINUTES = 25;
  const timerDisplay  = document.getElementById('timerDisplay');
  const timerRing     = document.getElementById('timerRingProgress');
  const timerStartBtn = document.getElementById('timerStart');
  const timerStopBtn  = document.getElementById('timerStop');
  const timerResetBtn = document.getElementById('timerReset');

  const RING_CIRCUMFERENCE = 2 * Math.PI * 52;

  let timerRemaining = FOCUS_MINUTES * 60;
  let timerTotal = FOCUS_MINUTES * 60;
  let timerInterval = null;

  function renderTimer() {
    const minutes = Math.floor(timerRemaining / 60);
    const seconds = timerRemaining % 60;
    timerDisplay.textContent = `${pad(minutes)}:${pad(seconds)}`;

    const elapsedFraction = 1 - timerRemaining / timerTotal;
    const offset = RING_CIRCUMFERENCE * elapsedFraction;
    timerRing.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
    timerRing.style.strokeDashoffset = `${offset}`;
  }

  function startTimer() {
    if (timerInterval) return; 
    timerStartBtn.disabled = true;
    timerInterval = setInterval(() => {
      if (timerRemaining <= 0) {
        stopTimer();
        return;
      }
      timerRemaining -= 1;
      renderTimer();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerStartBtn.disabled = false;
  }

  function resetTimer() {
    stopTimer();
    timerRemaining = FOCUS_MINUTES * 60;
    renderTimer();
  }

  timerStartBtn.addEventListener('click', startTimer);
  timerStopBtn.addEventListener('click', stopTimer);
  timerResetBtn.addEventListener('click', resetTimer);

  renderTimer();

  /* tasks */
  const TASKS_KEY = 'todolife_tasks';

  let tasks = [];

  const taskForm   = document.getElementById('taskForm');
  const taskInput  = document.getElementById('taskInput');
  const taskList   = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const progressLabel = document.getElementById('tasksProgressLabel');
  const progressFill  = document.getElementById('tasksProgressFill');

  function loadTasks() {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch {
      tasks = [];
    }
  }

  function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    tasks.unshift({
      id: generateId(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    });

    saveTasks();
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }

  function updateTaskText(id, newText) {
    const trimmed = newText.trim();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (trimmed) task.text = trimmed;
    saveTasks();
    renderTasks();
  }

  function createTaskElement(task) {
    const item = document.createElement('div');
    item.className = 'task-item' + (task.completed ? ' task-item--completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-item__checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Mark task as ' + (task.completed ? 'active' : 'completed'));
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const textSpan = document.createElement('span');
    textSpan.className = 'task-item__text';
    textSpan.textContent = task.text;
    textSpan.title = 'Double-click to edit';
    textSpan.addEventListener('dblclick', () => startEditing(task.id, item, textSpan));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-item__delete';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    item.appendChild(checkbox);
    item.appendChild(textSpan);
    item.appendChild(deleteBtn);

    return item;
  }

  function startEditing(id, item, textSpan) {
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-item__edit-input';
    editInput.value = textSpan.textContent;
    editInput.maxLength = 200;
    editInput.setAttribute('aria-label', 'Edit task text');

    item.replaceChild(editInput, textSpan);
    editInput.focus();
    editInput.select();

    function commit() {
      updateTaskText(id, editInput.value);
    }

    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { renderTasks(); }
    });

    editInput.addEventListener('blur', () => setTimeout(commit, 100));
  }

  function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      const fragment = document.createDocumentFragment();
      tasks.forEach((task) => fragment.appendChild(createTaskElement(task)));
      taskList.appendChild(fragment);
    }

    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    progressLabel.textContent = `${done} of ${total} done`;
    progressFill.style.width = total === 0 ? '0%' : `${(done / total) * 100}%`;
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
    taskInput.focus();
  });

  loadTasks();
  renderTasks();

  /* quick links */
  const LINKS_KEY = 'todolife_links';

  let links = [];

  const linkForm      = document.getElementById('linkForm');
  const linkNameInput = document.getElementById('linkNameInput');
  const linkUrlInput  = document.getElementById('linkUrlInput');
  const linkList      = document.getElementById('linkList');

  // icon svg
  const ICONS = {
    mail:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path></svg>',
    video:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"></rect><path d="M16 10l5-3v10l-5-3"></path></svg>',
    code:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6L3 12l6 6M15 6l6 6-6 6"></path></svg>',
    search:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>',
    chat:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-11.9 7.8L3 21l1.7-6.1A8.5 8.5 0 1 1 21 11.5z"></path></svg>',
    camera:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7l1.6-3h4.8L16 7"></path><circle cx="12" cy="13.5" r="3.2"></circle></svg>',
    music:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l11-2v12"></path><circle cx="6" cy="18" r="3"></circle><circle cx="17" cy="16" r="3"></circle></svg>',
    share:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="6" r="3"></circle><circle cx="18" cy="18" r="3"></circle><path d="M8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2"></path></svg>',
    cart:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"></circle><circle cx="17" cy="20" r="1.5"></circle><path d="M3 4h2l2.4 11.4a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.6L21 8H6"></path></svg>',
    doc:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"></path><path d="M14 3v5h5"></path></svg>',
    link:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"></path></svg>',
  };

  const ICON_RULES = [
    { keys: ['gmail', 'mail', 'outlook', 'email'], icon: 'mail' },
    { keys: ['calendar', 'kalender'], icon: 'calendar' },
    { keys: ['youtube', 'netflix', 'video', 'twitch'], icon: 'video' },
    { keys: ['github', 'gitlab', 'code', 'stackoverflow'], icon: 'code' },
    { keys: ['google', 'search', 'bing'], icon: 'search' },
    { keys: ['whatsapp', 'discord', 'telegram', 'slack', 'chat'], icon: 'chat' },
    { keys: ['instagram', 'photo', 'gallery'], icon: 'camera' },
    { keys: ['spotify', 'music', 'soundcloud'], icon: 'music' },
    { keys: ['facebook', 'twitter', 'x.com', 'linkedin', 'social'], icon: 'share' },
    { keys: ['shop', 'store', 'cart', 'market', 'tokopedia', 'shopee'], icon: 'cart' },
    { keys: ['docs', 'notion', 'drive', 'sheet', 'document'], icon: 'doc' },
  ];

  function pickIcon(name, url) {
    const haystack = `${name} ${url}`.toLowerCase();
    for (const rule of ICON_RULES) {
      if (rule.keys.some((key) => haystack.includes(key))) {
        return ICONS[rule.icon];
      }
    }
    return ICONS.link;
  }

  function normalizeUrl(url) {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  function loadLinks() {
    try {
      const raw = localStorage.getItem(LINKS_KEY);
      links = raw ? JSON.parse(raw) : [];
    } catch {
      links = [];
    }
  }

  function saveLinks() {
    localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  }

  function addLink(name, url) {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName || !trimmedUrl) return;

    links.push({
      id: generateId(),
      name: trimmedName,
      url: normalizeUrl(trimmedUrl),
    });

    saveLinks();
    renderLinks();
  }

  function deleteLink(id) {
    links = links.filter((l) => l.id !== id);
    saveLinks();
    renderLinks();
  }

  function createLinkElement(link) {
    const chip = document.createElement('a');
    chip.className = 'link-chip';
    chip.href = link.url;
    chip.target = '_blank';
    chip.rel = 'noopener noreferrer';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'link-chip__icon';
    iconWrap.innerHTML = pickIcon(link.name, link.url);

    const label = document.createElement('span');
    label.textContent = link.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'link-chip__remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.setAttribute('aria-label', `Remove ${link.name}`);
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    chip.appendChild(iconWrap);
    chip.appendChild(label);
    chip.appendChild(removeBtn);

    return chip;
  }

  function renderLinks() {
    linkList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    links.forEach((link) => fragment.appendChild(createLinkElement(link)));
    linkList.appendChild(fragment);
  }

  linkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addLink(linkNameInput.value, linkUrlInput.value);
    linkNameInput.value = '';
    linkUrlInput.value = '';
    linkNameInput.focus();
  });

  loadLinks();
  renderLinks();

})();