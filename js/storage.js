const KEY = 'moodJournal.entries.v1';

export function loadEntries() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function addEntry(entry) {
  const entries = loadEntries();
  entries.push(entry);
  entries.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
  saveEntries(entries);
  return entries;
}

export function deleteEntry(id) {
  const entries = loadEntries().filter(e => e.id !== id);
  saveEntries(entries);
  return entries;
}

export function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function computeStreak(entries) {
  if (entries.length === 0) return 0;

  const days = new Set(entries.map(e => dayKey(e.dateISO)));
  const today = new Date();
  let streak = 0;
  let cursor = new Date(today);

  const todayKey = dayKey(today);
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
