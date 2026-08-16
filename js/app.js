import { loadEntries, addEntry, deleteEntry, computeStreak } from './storage.js';
import { renderChart } from './chart.js';
import { classifyMood } from './ai.js';
import { randomPrompt, CARE_NOTES, SUPPORT_NOTE } from './prompts.js';

const MOOD_EMOJI = { 1: '😢', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };
const HEAVY_EMOTIONS = new Set(['sadness', 'fear', 'anger']);

const el = {
  moodScale: document.getElementById('moodScale'),
  tagRow: document.getElementById('tagRow'),
  journalText: document.getElementById('journalText'),
  promptText: document.getElementById('promptText'),
  shufflePrompt: document.getElementById('shufflePrompt'),
  saveEntry: document.getElementById('saveEntry'),
  saveHint: document.getElementById('saveHint'),
  aiStatus: document.getElementById('aiStatus'),
  aiInsight: document.getElementById('aiInsight'),
  moodChart: document.getElementById('moodChart'),
  chartEmpty: document.getElementById('chartEmpty'),
  entryList: document.getElementById('entryList'),
  historyEmpty: document.getElementById('historyEmpty'),
  streakCount: document.getElementById('streakCount'),
};

let selectedMood = null;
let selectedTags = new Set();
let currentPrompt = el.promptText.textContent;

el.moodScale.addEventListener('click', (e) => {
  const btn = e.target.closest('.mood-option');
  if (!btn) return;
  selectedMood = Number(btn.dataset.mood);
  [...el.moodScale.children].forEach(c => c.classList.toggle('selected', c === btn));
});

el.tagRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.tag-chip');
  if (!btn) return;
  const tag = btn.dataset.tag;
  if (selectedTags.has(tag)) {
    selectedTags.delete(tag);
    btn.classList.remove('selected');
  } else {
    selectedTags.add(tag);
    btn.classList.add('selected');
  }
});

el.shufflePrompt.addEventListener('click', () => {
  currentPrompt = randomPrompt(currentPrompt);
  el.promptText.textContent = currentPrompt;
});

function resetForm() {
  selectedMood = null;
  selectedTags = new Set();
  [...el.moodScale.children].forEach(c => c.classList.remove('selected'));
  [...el.tagRow.children].forEach(c => c.classList.remove('selected'));
  el.journalText.value = '';
  currentPrompt = randomPrompt(currentPrompt);
  el.promptText.textContent = currentPrompt;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function renderAll() {
  const entries = loadEntries();

  el.streakCount.textContent = computeStreak(entries);

  const hasPoints = renderChart(el.moodChart, entries);
  el.chartEmpty.style.display = hasPoints ? 'none' : 'block';
  el.moodChart.style.display = hasPoints ? 'block' : 'none';

  el.historyEmpty.style.display = entries.length ? 'none' : 'block';
  el.entryList.innerHTML = '';

  [...entries].reverse().forEach(entry => {
    const item = document.createElement('div');
    item.className = 'entry-item';
    const tagsHtml = (entry.tags || []).map(t => `<span>${t}</span>`).join('');
    item.innerHTML = `
      <div class="entry-mood-emoji">${MOOD_EMOJI[entry.mood] || ''}</div>
      <div class="entry-body">
        <div class="entry-meta">
          <span class="entry-date">${formatDate(entry.dateISO)}</span>
          <button class="delete-btn" data-id="${entry.id}">Delete</button>
        </div>
        ${tagsHtml ? `<div class="entry-tags">${tagsHtml}</div>` : ''}
        ${entry.text ? `<p class="entry-text">${escapeHtml(entry.text)}</p>` : ''}
        ${entry.aiEmotion ? `<div class="entry-tags"><span>AI: ${entry.aiEmotion}</span></div>` : ''}
      </div>
    `;
    el.entryList.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

el.entryList.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  deleteEntry(btn.dataset.id);
  renderAll();
});

async function runAiInsight(text, entryId) {
  if (!text || !text.trim()) {
    el.aiStatus.textContent = 'Save an entry to get a reflection.';
    el.aiInsight.innerHTML = '';
    return;
  }

  el.saveEntry.disabled = true;
  el.aiStatus.textContent = 'Loading on-device model (first time only)…';
  el.aiInsight.innerHTML = '';

  const result = await classifyMood(text, (progress) => {
    if (progress && progress.status === 'progress' && progress.file) {
      const pct = progress.progress ? Math.round(progress.progress) : 0;
      el.aiStatus.textContent = `Downloading model… ${pct}%`;
    }
  });

  el.saveEntry.disabled = false;

  if (!result) {
    el.aiStatus.textContent = 'Could not analyze this entry.';
    return;
  }

  el.aiStatus.textContent = result.source === 'ai'
    ? 'Analyzed on-device.'
    : 'Analyzed with lightweight keyword mode (model unavailable).';

  const label = result.label.toLowerCase();
  const note = CARE_NOTES[label] || CARE_NOTES.default;
  const supportBlock = HEAVY_EMOTIONS.has(label) && result.score > 0.6
    ? `<div class="care-note">${SUPPORT_NOTE}</div>`
    : '';

  el.aiInsight.innerHTML = `
    <span class="emotion-tag">${label}</span>
    <p>${note}</p>
    ${supportBlock}
  `;

  if (entryId) {
    const entries = loadEntries();
    const idx = entries.findIndex(e => e.id === entryId);
    if (idx !== -1) {
      entries[idx].aiEmotion = label;
      localStorage.setItem('moodJournal.entries.v1', JSON.stringify(entries));
    }
  }
}

el.saveEntry.addEventListener('click', async () => {
  if (!selectedMood) {
    el.saveHint.textContent = 'Pick a mood first.';
    return;
  }

  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    dateISO: new Date().toISOString(),
    mood: selectedMood,
    tags: [...selectedTags],
    text: el.journalText.value.trim(),
    prompt: currentPrompt,
  };

  addEntry(entry);
  renderAll();
  el.saveHint.textContent = 'Saved ✓';
  setTimeout(() => { el.saveHint.textContent = ''; }, 2500);

  const text = entry.text;
  resetForm();
  await runAiInsight(text, entry.id);
  renderAll();
});

renderAll();
