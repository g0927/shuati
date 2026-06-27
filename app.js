function getBank() { return window.QUESTION_BANK || { questions: [] }; }
const storageKey = "final-review-v3";
const legacyKeys = ["final-review-v2", "final-review-v1"];
const themeStorageKey = "final-review-theme";
const subjectiveTypes = new Set(["填空题", "简答题", "MATLAB题", "计算绘图题", "名词解释", "图表题", "计算题"]);
const minute = 60 * 1000;
const hour = 60 * minute;
const day = 24 * hour;
const objectiveAutoNextDelay = 650;
const examSchedule = [
  {
    subject: "单片机",
    startsAt: "2026-06-27T08:30:00+08:00",
    endsAt: "2026-06-27T11:30:00+08:00",
    label: "6月27日 上午",
  },
  {
    subject: "电力电子",
    startsAt: "2026-06-28T08:30:00+08:00",
    endsAt: "2026-06-28T11:30:00+08:00",
    label: "6月28日 上午",
  },
  {
    subject: "PLC",
    startsAt: "2026-06-30T08:30:00+08:00",
    endsAt: "2026-06-30T11:30:00+08:00",
    label: "6月30日 上午",
  },
  {
    subject: "自动化",
    startsAt: "2026-06-30T14:00:00+08:00",
    endsAt: "2026-06-30T17:00:00+08:00",
    label: "6月30日 下午",
  },
];

const state = {
  selectedSubject: "",
  selectedType: "",
  count: 20,
  listMode: "due",
  view: "home",
  sessionIds: [],
  sessionIndex: 0,
  revealed: false,
  pendingGrade: null,
  selectedOption: null,
  answerStack: [],
  detailItems: [],
  detailIndex: 0,
  touchStartX: 0,
  touchStartY: 0,
  studySwipeActive: false,
  autoNextTimer: null,
  sessionResults: [],
  progress: loadProgress(),
};

const els = {
  homeView: document.querySelector("#homeView"),
  libraryView: document.querySelector("#libraryView"),
  detailView: document.querySelector("#detailView"),
  studyView: document.querySelector("#studyView"),
  subjectChips: document.querySelector("#subjectChips"),
  typeChips: document.querySelector("#typeChips"),
  countInput: document.querySelector("#countInput"),
  availableHint: document.querySelector("#availableHint"),
  priorityTitle: document.querySelector("#priorityTitle"),
  priorityCountdown: document.querySelector("#priorityCountdown"),
  priorityMeta: document.querySelector("#priorityMeta"),
  priorityUnseen: document.querySelector("#priorityUnseen"),
  priorityDue: document.querySelector("#priorityDue"),
  priorityWeak: document.querySelector("#priorityWeak"),
  priorityStartBtn: document.querySelector("#priorityStartBtn"),
  scopeTitle: document.querySelector("#scopeTitle"),
  scopePercent: document.querySelector("#scopePercent"),
  scopeProgress: document.querySelector("#scopeProgress"),
  reviewPlan: document.querySelector("#reviewPlan"),
  totalCount: document.querySelector("#totalCount"),
  seenCount: document.querySelector("#seenCount"),
  unseenCount: document.querySelector("#unseenCount"),
  dueCount: document.querySelector("#dueCount"),
  weakCount: document.querySelector("#weakCount"),
  hardCount: document.querySelector("#hardCount"),
  starredCount: document.querySelector("#starredCount"),
  startBtn: document.querySelector("#startBtn"),
  wrongReviewBtn: document.querySelector("#wrongReviewBtn"),
  openLibraryBtn: document.querySelector("#openLibraryBtn"),
  clearSessionBtn: document.querySelector("#clearSessionBtn"),
  themeToggleBtn: document.querySelector("#themeToggleBtn"),
  libraryThemeBtn: document.querySelector("#libraryThemeBtn"),
  libraryBackBtn: document.querySelector("#libraryBackBtn"),
  libraryScope: document.querySelector("#libraryScope"),
  statusList: document.querySelector("#statusList"),
  detailBackBtn: document.querySelector("#detailBackBtn"),
  detailStarBtn: document.querySelector("#detailStarBtn"),
  detailCard: document.querySelector("#detailCard"),
  detailScope: document.querySelector("#detailScope"),
  detailTitle: document.querySelector("#detailTitle"),
  detailMeta: document.querySelector("#detailMeta"),
  detailIndex: document.querySelector("#detailIndex"),
  detailQuestionText: document.querySelector("#detailQuestionText"),
  detailQuestionMedia: document.querySelector("#detailQuestionMedia"),
  detailOptionList: document.querySelector("#detailOptionList"),
  detailAnswerText: document.querySelector("#detailAnswerText"),
  detailAnswerMedia: document.querySelector("#detailAnswerMedia"),
  detailNextReviewText: document.querySelector("#detailNextReviewText"),
  detailMemoryStats: document.querySelector("#detailMemoryStats"),
  detailMemoryList: document.querySelector("#detailMemoryList"),
  detailPrevBtn: document.querySelector("#detailPrevBtn"),
  detailNextBtn: document.querySelector("#detailNextBtn"),
  studyScope: document.querySelector("#studyScope"),
  studyTitle: document.querySelector("#studyTitle"),
  backHomeBtn: document.querySelector("#backHomeBtn"),
  undoBtn: document.querySelector("#undoBtn"),
  skipBtn: document.querySelector("#skipBtn"),
  studyCard: document.querySelector("#studyCard"),
  questionArea: document.querySelector("#questionArea"),
  questionMeta: document.querySelector("#questionMeta"),
  sessionIndex: document.querySelector("#sessionIndex"),
  sessionProgress: document.querySelector("#sessionProgress"),
  questionText: document.querySelector("#questionText"),
  questionMedia: document.querySelector("#questionMedia"),
  optionList: document.querySelector("#optionList"),
  answerBox: document.querySelector("#answerBox"),
  answerText: document.querySelector("#answerText"),
  answerMedia: document.querySelector("#answerMedia"),
  resultNote: document.querySelector("#resultNote"),
  memoryPanel: document.querySelector("#memoryPanel"),
  nextReviewText: document.querySelector("#nextReviewText"),
  memoryStats: document.querySelector("#memoryStats"),
  memoryList: document.querySelector("#memoryList"),
  starBtn: document.querySelector("#starBtn"),
  actionBar: document.querySelector("#actionBar"),
  resultView: document.querySelector("#resultView"),
  resultPercent: document.querySelector("#resultPercent"),
  resultTagline: document.querySelector("#resultTagline"),
  resultBar: document.querySelector("#resultBar"),
  resultStats: document.querySelector("#resultStats"),
  resultSummary: document.querySelector("#resultSummary"),
  retryWrongBtn: document.querySelector("#retryWrongBtn"),
  resultHomeBtn: document.querySelector("#resultHomeBtn"),
};

function loadProgress() {
  try {
    const stored = localStorage.getItem(storageKey) || legacyKeys.map((key) => localStorage.getItem(key)).find(Boolean);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(storageKey, JSON.stringify(state.progress));
}

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = next;
  [els.themeToggleBtn, els.libraryThemeBtn].forEach((button) => {
    if (!button) return;
    button.textContent = next === "dark" ? "☀" : "☾";
    button.title = next === "dark" ? "切换到日间主题" : "切换到夜间主题";
  });
  localStorage.setItem(themeStorageKey, next);
}

function haptic(pattern = 12) {
  if (!("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

function getRecord(id) {
  if (!state.progress[id]) state.progress[id] = {};
  const record = state.progress[id];
  record.starred ??= false;
  record.skipped ??= false;
  record.grade ??= null;
  record.count ??= 0;
  record.firstSeen ??= null;
  record.lastSeen ??= null;
  record.objectiveResult ??= null;
  record.dueAt ??= 0;
  record.wrongCount ??= 0;
  record.unsureCount ??= 0;
  record.knownStreak ??= 0;
  record.hardToRemember ??= false;
  record.wrongBook ??= record.hardToRemember;
  record.history ??= [];
  return record;
}

function unique(items) {
  return [...new Set(items)];
}

function subjects() {
  return unique(getBank().questions.map((question) => question.subject));
}

function typesForSubject(subject) {
  return unique(getBank().questions.filter((question) => question.subject === subject).map((question) => question.type));
}

function activeExam() {
  const now = Date.now();
  return examSchedule.find((exam) => now < new Date(exam.endsAt).getTime()) || examSchedule[examSchedule.length - 1];
}

function countdownText(exam) {
  const start = new Date(exam.startsAt).getTime();
  const now = Date.now();
  const diff = start - now;
  if (diff <= 0) return "正在考试";
  const days = Math.floor(diff / day);
  const hours = Math.floor((diff % day) / hour);
  const minutes = Math.max(1, Math.round((diff % hour) / minute));
  if (days) return `${days}天${hours}小时后`;
  if (hours) return `${hours}小时${minutes}分钟后`;
  return `${minutes}分钟后`;
}

function preferredType(subject) {
  const types = typesForSubject(subject);
  return types.find((type) => type === "填空题") || types.find((type) => type === "简答题") || types[0] || "";
}

function scopedDeck(subject, type) {
  return getBank().questions.filter((question) => {
    const record = getRecord(question.id);
    return question.subject === subject && question.type === type && !record.skipped;
  });
}

function statsFor(subject, type) {
  const deck = scopedDeck(subject, type);
  return {
    total: deck.length,
    seen: deck.filter(isSeen).length,
    unseen: deck.filter((question) => !isSeen(question)).length,
    due: deck.filter(isDue).length,
    weak: deck.filter(isWeak).length,
  };
}

function recommendedType(subject) {
  const types = typesForSubject(subject);
  const scored = types.map((type) => {
    const stats = statsFor(subject, type);
    const subjectiveBoost = subjectiveTypes.has(type) ? 2 : 0;
    const score = stats.due * 6 + stats.weak * 5 + stats.unseen * 2 + stats.total * 0.01 + subjectiveBoost;
    return { type, score, stats };
  }).filter((item) => item.stats.total);
  scored.sort((left, right) => right.score - left.score);
  return scored[0]?.type || preferredType(subject);
}

function priorityRecommendation() {
  const availableSubjects = subjects();
  const exam = activeExam();
  const subject = availableSubjects.includes(exam.subject) ? exam.subject : availableSubjects[0] || "";
  const type = recommendedType(subject);
  const stats = statsFor(subject, type);
  const count = Math.min(20, stats.total);
  return { exam, subject, type, stats, count };
}

function applyPriorityRecommendation(startNow = false) {
  const recommendation = priorityRecommendation();
  if (!recommendation.subject || !recommendation.type || !recommendation.count) return;
  state.selectedSubject = recommendation.subject;
  state.selectedType = recommendation.type;
  state.count = recommendation.count;
  syncCountToDeck();
  if (startNow) startSession();
  else renderHome();
}

function deckQuestions() {
  return scopedQuestions().filter((question) => !getRecord(question.id).skipped);
}

function scopedQuestions() {
  return getBank().questions.filter((question) => question.subject === state.selectedSubject && question.type === state.selectedType);
}

function isSeen(question) {
  return (getRecord(question.id).count || 0) > 0;
}

function isDue(question) {
  const record = getRecord(question.id);
  return isSeen(question) && (!record.dueAt || record.dueAt <= Date.now());
}

function isWeak(question) {
  const record = getRecord(question.id);
  return record.grade === "unsure" || record.grade === "unknown" || record.objectiveResult === "wrong";
}

function isHardToRemember(question) {
  const record = getRecord(question.id);
  return !!(record.wrongBook || record.hardToRemember);
}

function isStarred(question) {
  return getRecord(question.id).starred;
}

function isSkipped(question) {
  return getRecord(question.id).skipped;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function reviewWeight(question) {
  const record = getRecord(question.id);
  const gradeWeight = { unknown: 12, unsure: 7, known: 1 }[record.grade] || 2;
  const objectiveWeight = record.objectiveResult === "wrong" ? 10 : 1;
  const dueBoost = isDue(question) ? 8 : 0;
  const weakBoost = isWeak(question) ? 5 : 0;
  return gradeWeight + objectiveWeight + dueBoost + weakBoost + 1 / ((record.count || 0) + 1);
}

function weightedQuestions(items) {
  return shuffle(items).sort((left, right) => Math.random() * reviewWeight(right) - Math.random() * reviewWeight(left));
}

function addUnique(target, source, limit) {
  const ids = new Set(target.map((question) => question.id));
  for (const question of source) {
    if (target.length >= limit) break;
    if (!ids.has(question.id)) {
      ids.add(question.id);
      target.push(question);
    }
  }
}

function makeSession() {
  const deck = deckQuestions();
  const requested = Math.max(1, Math.min(Number(state.count) || 1, deck.length));
  const due = weightedQuestions(deck.filter(isDue));
  const weak = weightedQuestions(deck.filter((question) => isSeen(question) && isWeak(question) && !isDue(question)));
  const unseen = shuffle(deck.filter((question) => !isSeen(question)));
  const seen = weightedQuestions(deck.filter((question) => isSeen(question) && !isWeak(question)));
  const selected = [];
  const dueTarget = due.length ? Math.max(1, Math.floor(requested * 0.45)) : 0;
  const weakTarget = weak.length ? Math.max(1, Math.floor(requested * 0.2)) : 0;

  addUnique(selected, due, Math.min(dueTarget, requested));
  addUnique(selected, weak, Math.min(dueTarget + weakTarget, requested));
  addUnique(selected, unseen, requested);
  addUnique(selected, due, requested);
  addUnique(selected, weak, requested);
  addUnique(selected, seen, requested);
  return selected.map((question) => question.id);
}

function makeWrongBookSession() {
  const deck = deckQuestions().filter(isHardToRemember);
  const requested = Math.max(1, Math.min(Number(state.count) || 1, deck.length));
  return weightedQuestions(deck).slice(0, requested).map((question) => question.id);
}

function currentQuestion() {
  const id = state.sessionIds[state.sessionIndex];
  return getBank().questions.find((question) => question.id === id);
}

function clearAutoNextTimer() {
  if (!state.autoNextTimer) return;
  clearTimeout(state.autoNextTimer);
  state.autoNextTimer = null;
}

function scheduleObjectiveAutoNext(questionId) {
  clearAutoNextTimer();
  state.autoNextTimer = setTimeout(() => {
    state.autoNextTimer = null;
    const question = currentQuestion();
    if (!question || question.id !== questionId) return;
    if (!state.revealed || !state.selectedOption || !isCorrectOption(question, state.selectedOption)) return;
    nextQuestion();
  }, objectiveAutoNextDelay);
}

function answerOptions(question) {
  if (question.options?.length) return question.options;
  if (question.type === "判断题") return ["对", "错"];
  return [];
}

function normalizeAnswer(text) {
  return String(text || "").replace(/^答案[:：]?/, "").replace(/^答[:：]?/, "").trim().toUpperCase();
}

function optionKey(option) {
  const match = String(option).match(/^([A-E])[.．]/i);
  return match ? match[1].toUpperCase() : String(option).trim();
}

function isCorrectOption(question, option) {
  const answer = normalizeAnswer(question.answer);
  const key = optionKey(option);
  if (question.type === "判断题" || question.type === "多选题") return answer.includes(key);
  return answer === key || answer.startsWith(key);
}

function dueText(record) {
  if (!record.count) return "未刷";
  if (!record.dueAt || record.dueAt <= Date.now()) return "现在复习";
  const diff = record.dueAt - Date.now();
  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))} 分钟后`;
  return `${Math.round(diff / hour)} 小时后`;
}

function timeAgo(time) {
  if (!time) return "";
  const diff = Date.now() - time;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.round(diff / minute)} 分钟前`;
  return `${Math.round(diff / hour)} 小时前`;
}

function resultLabel(value) {
  const map = {
    known: "认识",
    unsure: "不确定",
    unknown: "不认识",
    right: "答对",
    wrong: "答错",
    shown: "看答案",
  };
  return map[value] || "已刷";
}

function scheduleDelayFor(result, knownStreak = 0) {
  if (result === "unknown" || result === "wrong") return 2 * minute;
  if (result === "unsure" || result === "shown") return 10 * minute;
  if (result === "known") return knownStreak >= 2 ? 12 * hour : 4 * hour;
  if (result === "right") return 6 * hour;
  return 20 * minute;
}

function updateMemory(record, result) {
  const now = Date.now();
  record.knownStreak = result === "known" || result === "right" ? (record.knownStreak || 0) + 1 : 0;
  if (result === "unknown" || result === "wrong") record.wrongCount = (record.wrongCount || 0) + 1;
  if (result === "unsure") record.unsureCount = (record.unsureCount || 0) + 1;
  record.dueAt = now + scheduleDelayFor(result, record.knownStreak);
  record.history.unshift({ time: now, result });
  record.history = record.history.slice(0, 30);

  if (result === "unknown" || result === "wrong") {
    record.wrongBook = true;
    record.hardToRemember = true;
  }
  if ((result === "known" || result === "right") && record.knownStreak >= 2) {
    record.wrongBook = false;
    record.hardToRemember = false;
  }
}

function markSeen(question, result, patch = {}) {
  const record = getRecord(question.id);
  const now = Date.now();
  if (!record.firstSeen) record.firstSeen = now;
  record.lastSeen = now;
  record.count = (record.count || 0) + 1;
  Object.assign(record, patch);
  updateMemory(record, result);
  saveProgress();
}

function insertRepeat(question, result) {
  const offset = result === "unknown" || result === "wrong" ? 2 : result === "unsure" ? 5 : 0;
  if (!offset) return;
  const upcoming = state.sessionIds.slice(state.sessionIndex + 1);
  if (upcoming.includes(question.id)) return;
  const insertAt = Math.min(state.sessionIndex + 1 + offset, state.sessionIds.length);
  state.sessionIds.splice(insertAt, 0, question.id);
}

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record));
}

function rememberBeforeAnswer(question) {
  state.answerStack = [{
    questionId: question.id,
    sessionIndex: state.sessionIndex,
    sessionIds: [...state.sessionIds],
    record: cloneRecord(getRecord(question.id)),
  }];
}

function setView(view) {
  state.view = view;
  [els.homeView, els.libraryView, els.detailView, els.studyView, els.resultView].forEach((viewEl) => viewEl.classList.add("hidden"));
  const target = { home: els.homeView, library: els.libraryView, detail: els.detailView, study: els.studyView, result: els.resultView }[view];
  target.classList.remove("hidden");
}

function renderChips() {
  els.subjectChips.innerHTML = "";
  subjects().forEach((subject) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip subject-chip ${subject === state.selectedSubject ? "active" : ""}`;
    button.textContent = subject;
    button.addEventListener("click", () => {
      state.selectedSubject = subject;
      state.selectedType = preferredType(subject);
      syncCountToDeck();
      renderHome();
    });
    els.subjectChips.appendChild(button);
  });

  els.typeChips.innerHTML = "";
  typesForSubject(state.selectedSubject).forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip type-chip ${type === state.selectedType ? "active" : ""}`;
    button.textContent = type;
    button.addEventListener("click", () => {
      state.selectedType = type;
      syncCountToDeck();
      renderHome();
    });
    els.typeChips.appendChild(button);
  });
}

function syncCountToDeck() {
  const total = deckQuestions().length;
  if (!total) state.count = 0;
  else if (!state.count || state.count > total) state.count = Math.min(20, total);
  els.countInput.value = state.count || "";
}

function renderPriority() {
  const recommendation = priorityRecommendation();
  const { exam, subject, type, stats, count } = recommendation;
  els.priorityTitle.textContent = subject && type ? `${subject} · ${type}` : "-";
  els.priorityCountdown.textContent = exam ? countdownText(exam) : "-";
  els.priorityMeta.textContent = exam
    ? `${exam.label}考 ${exam.subject}。建议本组 ${count} 题，先清最近考试科目。`
    : "暂时没有考试安排。";
  els.priorityUnseen.textContent = `未刷 ${stats.unseen}`;
  els.priorityDue.textContent = `待复习 ${stats.due}`;
  els.priorityWeak.textContent = `薄弱 ${stats.weak}`;
  els.priorityStartBtn.disabled = !count;
}

function renderStats() {
  const deck = deckQuestions();
  const seen = deck.filter(isSeen);
  const unseen = deck.filter((question) => !isSeen(question));
  const due = deck.filter(isDue);
  const weak = deck.filter(isWeak);
  const hard = deck.filter(isHardToRemember);
  const starred = deck.filter(isStarred);
  const percent = deck.length ? Math.round((seen.length / deck.length) * 100) : 0;
  const requested = Math.max(1, Math.min(Number(state.count) || 1, deck.length || 1));
  const reviewTarget = due.length ? Math.min(due.length, Math.max(1, Math.floor(requested * 0.45))) : 0;
  const weakTarget = weak.length ? Math.min(weak.length, Math.max(1, Math.floor(requested * 0.2))) : 0;

  els.availableHint.textContent = `共 ${deck.length} 题`;
  els.scopeTitle.textContent = `${state.selectedSubject || "-"} · ${state.selectedType || "-"}`;
  els.scopePercent.textContent = `${percent}%`;
  els.scopeProgress.style.width = `${percent}%`;
  els.reviewPlan.textContent = due.length || weak.length
    ? `考前模式：本组优先塞入 ${reviewTarget} 道到期复习、${weakTarget} 道薄弱题；不认识约 2 题后回炉。`
    : "考前模式：先快速扫未刷题；不确定 10 分钟后复习，不认识 2 分钟后复习。";
  els.totalCount.textContent = deck.length;
  els.seenCount.textContent = seen.length;
  els.unseenCount.textContent = unseen.length;
  els.dueCount.textContent = due.length;
  els.weakCount.textContent = weak.length;
  els.hardCount.textContent = hard.length;
  els.starredCount.textContent = starred.length;
  els.wrongReviewBtn.disabled = hard.length === 0;
  els.wrongReviewBtn.textContent = hard.length ? `错题冲刺 ${hard.length}` : "错题清空";
  els.startBtn.disabled = deck.length === 0;
}

function filteredLibraryQuestions() {
  const scope = scopedQuestions();
  if (state.listMode === "skipped") return scope.filter(isSkipped);
  if (state.listMode === "starred") return scope.filter(isStarred);
  const deck = deckQuestions();
  return deck.filter((question) => {
    if (state.listMode === "due") return isDue(question);
    if (state.listMode === "seen") return isSeen(question);
    if (state.listMode === "weak") return isWeak(question);
    if (state.listMode === "hard") return isHardToRemember(question);
    return !isSeen(question);
  });
}

function renderStatusList() {
  const filtered = filteredLibraryQuestions();
  state.detailItems = weightedQuestions(filtered);
  els.statusList.innerHTML = "";
  if (!state.detailItems.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    const text = {
      due: "现在没有到期复习题。",
      unseen: "这个范围已经全部遇见过。",
      seen: "这里暂时没有已刷题。",
      weak: "这里暂时没有薄弱题。",
      starred: "这里暂时没有标星题。",
      skipped: "这里暂时没有标为不想背的题。",
      hard: "这里暂时没有错题。答错或点「不认识」后会自动进入。",
    };
    empty.textContent = text[state.listMode];
    els.statusList.appendChild(empty);
    return;
  }

  state.detailItems.slice(0, 120).forEach((question, index) => {
    const record = getRecord(question.id);
    const item = document.createElement("button");
    item.className = "list-item library-item";
    item.type = "button";
    const tags = [];
    if (record.starred) tags.push("★");
    if (record.skipped) tags.push("不想背");
    if (isHardToRemember(question)) tags.push("错题");
    if (record.grade) tags.push(resultLabel(record.grade));
    if (record.objectiveResult) tags.push(resultLabel(record.objectiveResult));
    if (record.wrongCount) tags.push(`错 ${record.wrongCount}`);
    if (record.unsureCount) tags.push(`疑 ${record.unsureCount}`);
    tags.push(dueText(record));
    item.innerHTML = `
      <span class="item-kicker">${question.subject} · ${question.type} · 第 ${question.sourceNo} 题</span>
      <strong>${question.question}</strong>
      <span>${tags.join(" · ")}</span>
    `;
    item.addEventListener("click", () => openDetail(index));
    els.statusList.appendChild(item);
  });
}

function renderHome() {
  setView("home");
  renderPriority();
  renderChips();
  renderStats();
}

function renderLibrary() {
  setView("library");
  els.libraryScope.textContent = `${state.selectedSubject} · ${state.selectedType}`;
  document.querySelectorAll("[data-list]").forEach((item) => item.classList.toggle("active", item.dataset.list === state.listMode));
  renderStatusList();
}

function memoryStatsMarkup(record) {
  return [
    ["遇见", record.count || 0],
    ["错/不认识", record.wrongCount || 0],
    ["不确定", record.unsureCount || 0],
    ["连续认识", record.knownStreak || 0],
  ];
}

function renderMemory(question, target = {}) {
  const record = getRecord(question.id);
  const nextEl = target.next || els.nextReviewText;
  const statsEl = target.stats || els.memoryStats;
  const listEl = target.list || els.memoryList;
  nextEl.textContent = dueText(record);
  statsEl.innerHTML = "";
  memoryStatsMarkup(record).forEach(([label, value]) => {
    const item = document.createElement("div");
    item.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
    statsEl.appendChild(item);
  });

  listEl.innerHTML = "";
  if (!record.history.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = "这题还没有记录。";
    listEl.appendChild(empty);
    return;
  }
  record.history.slice(0, 5).forEach((entry) => {
    const item = document.createElement("p");
    item.textContent = `${resultLabel(entry.result)} · ${timeAgo(entry.time)}`;
    listEl.appendChild(item);
  });
}


function renderMedia(container, media = []) {
  if (!container) return;
  container.innerHTML = "";
  const items = Array.isArray(media) ? media : [];
  container.hidden = !items.length;
  items.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "题目图片";
    img.loading = "lazy";
    container.appendChild(img);
  });
}

function appendMedia(container, media = []) {
  const items = Array.isArray(media) ? media : [];
  if (!container || !items.length) return;
  const wrapper = document.createElement("div");
  wrapper.className = "media-list";
  items.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "题目图片";
    img.loading = "lazy";
    wrapper.appendChild(img);
  });
  container.appendChild(wrapper);
}

function optionMedia(question, option) {
  const key = optionKey(option);
  return question.optionImages?.[key] || [];
}

function openDetail(index) {
  state.detailIndex = Math.max(0, Math.min(index, state.detailItems.length - 1));
  renderDetail();
}

function renderDetail() {
  setView("detail");
  const question = state.detailItems[state.detailIndex];
  if (!question) {
    renderLibrary();
    return;
  }
  const record = getRecord(question.id);
  els.detailScope.textContent = `${question.subject} · ${question.type}`;
  els.detailTitle.textContent = `第 ${question.sourceNo} 题`;
  els.detailMeta.textContent = `${isHardToRemember(question) ? "错题 · " : ""}${resultLabel(record.grade || record.objectiveResult)} · ${dueText(record)}`;
  els.detailIndex.textContent = `${state.detailIndex + 1} / ${state.detailItems.length}`;
  els.detailQuestionText.textContent = question.question;
  renderMedia(els.detailQuestionMedia, question.images);
  els.detailAnswerText.textContent = question.answer;
  renderMedia(els.detailAnswerMedia, question.answerImages);
  els.detailStarBtn.textContent = record.starred ? "★" : "☆";
  els.detailStarBtn.classList.toggle("active", record.starred);
  els.detailOptionList.innerHTML = "";
  answerOptions(question).forEach((option) => {
    const item = document.createElement("li");
    item.className = `option-item ${isCorrectOption(question, option) ? "correct" : ""}`;
    item.textContent = option;
    appendMedia(item, optionMedia(question, option));
    els.detailOptionList.appendChild(item);
  });
  renderMemory(question, {
    next: els.detailNextReviewText,
    stats: els.detailMemoryStats,
    list: els.detailMemoryList,
  });
}

function moveDetail(offset) {
  if (!state.detailItems.length) return;
  state.detailIndex = (state.detailIndex + offset + state.detailItems.length) % state.detailItems.length;
  renderDetail();
}

function renderStudy() {
  setView("study");
  const question = currentQuestion();
  if (!question) {
    renderComplete();
    return;
  }

  const record = getRecord(question.id);
  const options = answerOptions(question);
  const isSubjective = subjectiveTypes.has(question.type);
  const onlyPrompt = isSubjective && !state.revealed;
  const hideStudyExtras = !state.revealed;
  els.studyScope.textContent = `${question.subject} · ${question.type}`;
  els.studyTitle.textContent = isSubjective ? "回忆答案" : "选择答案";
  els.questionMeta.textContent = `第 ${question.sourceNo} 题`;
  els.sessionIndex.textContent = `${state.sessionIndex + 1} / ${state.sessionIds.length}`;
  els.sessionProgress.style.width = `${((state.sessionIndex + 1) / state.sessionIds.length) * 100}%`;
  els.questionText.textContent = question.question;
  renderMedia(els.questionMedia, question.images);
  els.answerText.textContent = question.answer;
  renderMedia(els.answerMedia, question.answerImages);
  els.answerBox.hidden = !state.revealed;
  els.resultNote.textContent = resultText(question);
  els.resultNote.hidden = !els.resultNote.textContent;
  els.starBtn.textContent = record.starred ? "★" : "☆";
  els.starBtn.title = record.starred ? "取消标星" : "标星";
  els.starBtn.setAttribute("aria-label", record.starred ? "取消标星" : "标星");
  els.starBtn.classList.toggle("active", record.starred);
  els.undoBtn.hidden = !state.answerStack.length;
  els.skipBtn.classList.toggle("active", record.skipped);
  els.studyCard.classList.toggle("tap-to-reveal", onlyPrompt);
  els.memoryPanel.hidden = hideStudyExtras;
  renderMemory(question);

  els.optionList.innerHTML = "";
  options.forEach((option) => {
    const item = document.createElement("li");
    item.className = "option-item";
    item.textContent = option;
    appendMedia(item, optionMedia(question, option));
    if (!isSubjective) {
      item.classList.toggle("selected", state.selectedOption === option);
      if (state.revealed && isCorrectOption(question, option)) item.classList.add("correct");
      if (state.revealed && state.selectedOption === option && !isCorrectOption(question, option)) item.classList.add("wrong");
      item.addEventListener("click", () => chooseObjective(option));
    }
    els.optionList.appendChild(item);
  });

  renderActionBar(question);
}

function resultText(question) {
  if (!state.revealed) return "";
  if (subjectiveTypes.has(question.type) && !state.pendingGrade) return "";
  if (state.pendingGrade) {
    const repeat = state.pendingGrade === "unknown" ? "约 2 题后再出现" : dueText(getRecord(question.id));
    return `已记录：${resultLabel(state.pendingGrade)}，${repeat}`;
  }
  if (state.selectedOption) return isCorrectOption(question, state.selectedOption) ? "答对了，6 小时后复习" : "这题答错了，约 2 题后再出现";
  return `已显示答案，${dueText(getRecord(question.id))}`;
}

function renderActionBar(question) {
  const isSubjective = subjectiveTypes.has(question.type);
  els.actionBar.innerHTML = "";

  if (isSubjective && !state.revealed) {
    return;
  }

  if (isSubjective && state.revealed && !state.pendingGrade) {
    els.actionBar.appendChild(gradeButtons());
    return;
  }

  if (state.revealed) {
    const row = document.createElement("div");
    const next = document.createElement("button");
    next.className = "wide-action";
    next.type = "button";
    next.textContent = state.sessionIndex + 1 >= state.sessionIds.length ? "完成本组" : "继续";
    next.addEventListener("click", nextQuestion);
    row.appendChild(next);
    els.actionBar.appendChild(row);
    return;
  }

  if (!isSubjective) return;
}

function gradeButtons() {
  const row = document.createElement("div");
  row.className = "grade-row";
  [
    ["known", "认识", "good"],
    ["unsure", "不确定", "unsure"],
    ["unknown", "不认识", "bad"],
  ].forEach(([grade, text, tone]) => {
    const button = document.createElement("button");
    button.className = `grade-btn ${tone}`;
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => gradeSubjective(grade));
    row.appendChild(button);
  });
  return row;
}

function revealSubjectiveAnswer() {
  const question = currentQuestion();
  if (!question || !subjectiveTypes.has(question.type) || state.revealed) return;
  state.revealed = true;
  state.pendingGrade = null;
  state.selectedOption = null;
  renderStudy();
}

function gradeSubjective(grade) {
  const question = currentQuestion();
  if (!question) return;
  rememberBeforeAnswer(question);
  state.sessionResults.push({ questionId: question.id, result: grade });
  markSeen(question, grade, { grade, objectiveResult: null });
  insertRepeat(question, grade);
  nextQuestion();
}

function chooseObjective(option) {
  if (state.revealed) return;
  revealObjective(option);
}

function revealObjective(option) {
  const question = currentQuestion();
  if (!question) return;
  rememberBeforeAnswer(question);
  const result = option ? (isCorrectOption(question, option) ? "right" : "wrong") : "shown";
  state.sessionResults.push({ questionId: question.id, result });
  state.selectedOption = option;
  state.revealed = true;
  markSeen(question, result, { objectiveResult: result });
  insertRepeat(question, result);
  renderStudy();
  if (result === "right") scheduleObjectiveAutoNext(question.id);
}

function undoLastAnswer() {
  clearAutoNextTimer();
  const snapshot = state.answerStack.pop();
  if (!snapshot) return;
  state.sessionIds = [...snapshot.sessionIds];
  state.sessionIndex = snapshot.sessionIndex;
  state.progress[snapshot.questionId] = cloneRecord(snapshot.record);
  state.revealed = false;
  state.pendingGrade = null;
  state.selectedOption = null;
  saveProgress();
  renderStudy();
}

function undoLastAnswerBySwipe() {
  if (!state.answerStack.length) return;
  undoLastAnswer();
}

function startStudySwipe(x, y, target) {
  if (!els.studyView.classList.contains("active")) return;
  if (!target.closest("#studyCard")) return;
  state.touchStartX = x;
  state.touchStartY = y;
  state.studySwipeActive = true;
}

function finishStudySwipe(x, y) {
  if (!state.studySwipeActive) return;
  state.studySwipeActive = false;
  checkStudySwipe(x, y);
}

function moveStudySwipe(x, y) {
  if (!state.studySwipeActive) return;
  if (checkStudySwipe(x, y)) state.studySwipeActive = false;
}

function checkStudySwipe(x, y) {
  const deltaX = x - state.touchStartX;
  const deltaY = y - state.touchStartY;
  if (Math.abs(deltaX) > 52 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
    undoLastAnswerBySwipe();
    return true;
  }
  return false;
}

function nextQuestion() {
  clearAutoNextTimer();
  if (state.sessionIndex + 1 >= state.sessionIds.length) {
    showResult();
    return;
  }
  state.sessionIndex += 1;
  state.revealed = false;
  state.pendingGrade = null;
  state.selectedOption = null;
  renderStudy();
}

function showResult() {
  clearAutoNextTimer();
  setView("result");
  const results = state.sessionResults;
  const total = results.length;
  if (!total) {
    goHome();
    return;
  }

  const counts = { known: 0, unsure: 0, unknown: 0, right: 0, wrong: 0, shown: 0 };
  results.forEach(({ result }) => {
    if (counts[result] !== undefined) counts[result] += 1;
  });
  const correct = counts.known + counts.right;
  const incorrect = counts.unknown + counts.wrong;
  const neutral = counts.unsure + counts.shown;
  const percent = Math.round((correct / total) * 100);

  els.resultPercent.textContent = `${percent}%`;
  els.resultBar.style.width = `${percent}%`;

  if (percent >= 90) els.resultTagline.textContent = "稳了！继续保持 🔥";
  else if (percent >= 70) els.resultTagline.textContent = "还不错，再巩固一下 💪";
  else if (percent >= 50) els.resultTagline.textContent = "还差一点，加油 💬";
  else els.resultTagline.textContent = "多刷几遍，总会熟悉的 ✍️";

  els.resultStats.innerHTML = "";
  const statItems = [];
  if (counts.known) statItems.push(["认识", counts.known]);
  if (counts.unsure) statItems.push(["不确定", counts.unsure]);
  if (counts.unknown) statItems.push(["不认识", counts.unknown]);
  if (counts.right) statItems.push(["答对", counts.right]);
  if (counts.wrong) statItems.push(["答错", counts.wrong]);
  if (counts.shown) statItems.push(["看答案", counts.shown]);

  statItems.forEach(([label, value]) => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
    els.resultStats.appendChild(div);
  });

  const hintParts = [];
  if (incorrect) hintParts.push(`${incorrect} 道需要重刷`);
  if (neutral) hintParts.push(`${neutral} 道模棱两可`);
  if (!incorrect && !neutral) hintParts.push("全部拿下！");
  els.resultSummary.textContent = `本组 ${total} 题，${hintParts.join("，")}。`;

  const wrongIds = results
    .filter(({ result }) => result === "wrong" || result === "unknown")
    .map(({ questionId }) => questionId);
  const uniqueWrongIds = unique(wrongIds);
  state._retryIds = uniqueWrongIds;
  els.retryWrongBtn.disabled = !uniqueWrongIds.length;
  els.retryWrongBtn.textContent = uniqueWrongIds.length ? `再刷错题（${uniqueWrongIds.length}）` : "全部拿下";
}

function goHome() {
  clearAutoNextTimer();
  state.sessionIds = [];
  state.sessionIndex = 0;
  state.revealed = false;
  state.pendingGrade = null;
  state.selectedOption = null;
  state.answerStack = [];
  state.sessionResults = [];
  state._retryIds = null;
  renderHome();
}

function retryWrong() {
  clearAutoNextTimer();
  const ids = state._retryIds;
  if (!ids || !ids.length) {
    goHome();
    return;
  }
  state.sessionIds = shuffle(ids);
  state.sessionIndex = 0;
  state.revealed = false;
  state.pendingGrade = null;
  state.selectedOption = null;
  state.answerStack = [];
  state.sessionResults = [];
  state._retryIds = null;
  renderStudy();
}

function startWrongBookSession() {
  clearAutoNextTimer();
  const ids = makeWrongBookSession();
  if (!ids.length) {
    state.listMode = "hard";
    renderLibrary();
    return;
  }
  state.sessionIds = ids;
  state.sessionIndex = 0;
  state.revealed = false;
  state.pendingGrade = null;
  state.selectedOption = null;
  state.answerStack = [];
  state.sessionResults = [];
  state._retryIds = null;
  renderStudy();
}

function startSession() {
  clearAutoNextTimer();
  state.sessionIds = makeSession();
  state.sessionIndex = 0;
  state.revealed = false;
  state.pendingGrade = null;
  state.selectedOption = null;
  state.answerStack = [];
  state.sessionResults = [];
  state._retryIds = null;
  renderStudy();
}

function skipCurrentQuestion() {
  clearAutoNextTimer();
  const question = currentQuestion();
  if (!question) return;
  const record = getRecord(question.id);
  record.skipped = true;
  saveProgress();
  state.answerStack = state.answerStack.filter((snapshot) => snapshot.questionId !== question.id);
  state.sessionIds = state.sessionIds.filter((id) => id !== question.id);
  state.revealed = false;
  state.pendingGrade = null;
  state.selectedOption = null;
  if (state.sessionIndex >= state.sessionIds.length) {
    showResult();
    return;
  }
  renderStudy();
}

function toggleCurrentMark(field) {
  const question = currentQuestion();
  if (!question) return;
  const record = getRecord(question.id);
  record[field] = !record[field];
  saveProgress();
  if (field === "skipped") nextQuestion();
  else renderStudy();
}

function toggleDetailStar() {
  const question = state.detailItems[state.detailIndex];
  if (!question) return;
  const record = getRecord(question.id);
  record.starred = !record.starred;
  saveProgress();
  renderDetail();
}

function init() {
  applyTheme(localStorage.getItem(themeStorageKey) || "light");
  const recommendation = priorityRecommendation();
  state.selectedSubject = recommendation.subject || subjects()[0] || "";
  state.selectedType = recommendation.type || preferredType(state.selectedSubject);
  state.count = recommendation.count || Math.min(20, deckQuestions().length);
  syncCountToDeck();

  [els.themeToggleBtn, els.libraryThemeBtn].forEach((button) => {
    button.addEventListener("click", () => { const cur = document.body.dataset.theme || "light"; const idx = ["light","dark","rem"].indexOf(cur); applyTheme(["light","dark","rem"][(idx + 1) % 3]); });
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, .option-item, summary");
    if (!target || target.disabled) return;
    haptic(target.classList.contains("bad") || target.classList.contains("wrong") ? 24 : 10);
  }, { capture: true });

  els.countInput.addEventListener("input", () => {
    const total = deckQuestions().length;
    state.count = Math.max(1, Math.min(Number(els.countInput.value) || 1, total || 1));
    renderStats();
  });

  els.countInput.addEventListener("change", () => {
    syncCountToDeck();
    renderHome();
  });

  document.querySelectorAll("[data-count]").forEach((button) => {
    button.addEventListener("click", () => {
      const total = deckQuestions().length;
      state.count = button.dataset.count === "all" ? total : Number(button.dataset.count);
      syncCountToDeck();
      renderHome();
    });
  });

  document.querySelectorAll("[data-list]").forEach((button) => {
    button.addEventListener("click", () => {
      state.listMode = button.dataset.list;
      renderLibrary();
    });
  });

  els.priorityStartBtn.addEventListener("click", () => applyPriorityRecommendation(true));
  els.startBtn.addEventListener("click", startSession);
  els.wrongReviewBtn.addEventListener("click", startWrongBookSession);
  els.openLibraryBtn.addEventListener("click", renderLibrary);
  els.clearSessionBtn.addEventListener("click", () => {
    state.listMode = "due";
    applyPriorityRecommendation(false);
  });
  els.libraryBackBtn.addEventListener("click", renderHome);
  els.detailBackBtn.addEventListener("click", renderLibrary);
  els.detailStarBtn.addEventListener("click", toggleDetailStar);
  els.detailPrevBtn.addEventListener("click", () => moveDetail(-1));
  els.detailNextBtn.addEventListener("click", () => moveDetail(1));
  els.detailCard.addEventListener("touchstart", (event) => {
    state.touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  els.detailCard.addEventListener("touchend", (event) => {
    const delta = event.changedTouches[0].clientX - state.touchStartX;
    if (Math.abs(delta) > 56) moveDetail(delta > 0 ? -1 : 1);
  }, { passive: true });
  els.questionArea.addEventListener("click", (event) => {
    if (event.target.closest("button, summary, details, .option-item, .answer-box, .memory-panel")) return;
    revealSubjectiveAnswer();
  });
  els.studyCard.addEventListener("touchstart", (event) => {
    const point = event.changedTouches[0];
    startStudySwipe(point.clientX, point.clientY, event.target);
  }, { passive: true });
  document.addEventListener("touchend", (event) => {
    const point = event.changedTouches[0];
    finishStudySwipe(point.clientX, point.clientY);
  }, { passive: true });
  document.addEventListener("touchmove", (event) => {
    const point = event.changedTouches[0];
    moveStudySwipe(point.clientX, point.clientY);
  }, { passive: true });
  els.studyCard.addEventListener("pointerdown", (event) => {
    startStudySwipe(event.clientX, event.clientY, event.target);
  });
  document.addEventListener("pointerup", (event) => {
    finishStudySwipe(event.clientX, event.clientY);
  });
  document.addEventListener("pointermove", (event) => {
    moveStudySwipe(event.clientX, event.clientY);
  });
  els.studyCard.addEventListener("mousedown", (event) => {
    startStudySwipe(event.clientX, event.clientY, event.target);
  });
  document.addEventListener("mouseup", (event) => {
    finishStudySwipe(event.clientX, event.clientY);
  });
  document.addEventListener("mousemove", (event) => {
    moveStudySwipe(event.clientX, event.clientY);
  });
  els.backHomeBtn.addEventListener("click", goHome);
  els.resultHomeBtn.addEventListener("click", goHome);
  els.retryWrongBtn.addEventListener("click", retryWrong);
  els.undoBtn.addEventListener("click", undoLastAnswer);
  els.starBtn.addEventListener("click", () => toggleCurrentMark("starred"));
  els.skipBtn.addEventListener("click", skipCurrentQuestion);

  renderHome();
}

init();
