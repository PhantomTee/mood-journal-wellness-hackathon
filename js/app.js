import { loadEntries, addEntry, deleteEntry, computeStreak } from './storage.js';
import { renderChart } from './chart.js';
import { classifyMood } from './ai.js';
import { randomPrompt, CARE_NOTES, SUPPORT_NOTE } from './prompts.js';
import { EMOTION_GEMS, stoneForMood, setGemVars } from './gems.js';

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
  heroGem: document.getElementById('heroGem'),
};

let selectedMood = null;
let selectedTags = new Set();
let currentPrompt = el.promptText.textContent;

function latestStone() {
  const entries = loadEntries();
  if (!entries.length) return null;
  return stoneForMood(entries[entries.length - 1].mood);
}

function showStoneOnHero(stone) {
  setGemVars(el.heroGem, stone);
}

// Rest the hero gem to whatever the last saved reading was (or idle).
showStoneOnHero(latestStone());

el.moodScale.addEventListener('click', (e) => {
  const btn = e.target.closest('.mood-option');
  if (!btn) return;
  selectedMood = Number(btn.dataset.mood);
  [...el.moodScale.children].forEach(c => c.classList.toggle('selected', c === btn));
  showStoneOnHero(stoneForMood(selectedMood));
});

el.moodScale.addEventListener('pointerover', (e) => {
  const btn = e.target.closest('.mood-option');
  if (!btn) return;
  showStoneOnHero(stoneForMood(Number(btn.dataset.mood)));
});

el.moodScale.addEventListener('pointerleave', () => {
  showStoneOnHero(stoneForMood(selectedMood) || latestStone());
});

el.moodScale.addEventListener('focusin', (e) => {
  const btn = e.target.closest('.mood-option');
  if (!btn) return;
  showStoneOnHero(stoneForMood(Number(btn.dataset.mood)));
});

el.moodScale.addEventListener('focusout', () => {
  showStoneOnHero(stoneForMood(selectedMood) || latestStone());
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
    const stone = stoneForMood(entry.mood);
    const item = document.createElement('div');
    item.className = 'entry-item';
    const tagsHtml = (entry.tags || []).map(t => `<span>${t}</span>`).join('');
    item.innerHTML = `
      <span class="gem entry-gem" data-stone="${stone ? stone.id : ''}"></span>
      <div class="entry-body">
        <div class="entry-meta">
          <span class="entry-date">${formatDate(entry.dateISO)}</span>
          <button class="delete-btn" data-id="${entry.id}">Delete</button>
        </div>
        ${stone ? `<p class="entry-stone">${stone.name} · ${stone.feeling}</p>` : ''}
        ${tagsHtml ? `<div class="entry-tags">${tagsHtml}</div>` : ''}
        ${entry.text ? `<p class="entry-text">${escapeHtml(entry.text)}</p>` : ''}
        ${entry.aiEmotion ? `<div class="entry-tags"><span>Refraction: ${entry.aiEmotion}</span></div>` : ''}
      </div>
    `;
    if (stone) setGemVars(item.querySelector('.entry-gem'), stone);
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
  showStoneOnHero(stoneForMood(selectedMood) || latestStone());
});

async function runAiInsight(text, entryId) {
  if (!text || !text.trim()) {
    el.aiStatus.textContent = 'Take a reading to see your refraction.';
    el.aiInsight.innerHTML = '';
    return;
  }

  el.saveEntry.disabled = true;
  el.aiStatus.textContent = 'Reading the light… (loading on-device model, first time only)';
  el.aiInsight.innerHTML = '';

  const result = await classifyMood(text, (progress) => {
    if (progress && progress.status === 'progress' && progress.file) {
      const pct = progress.progress ? Math.round(progress.progress) : 0;
      el.aiStatus.textContent = `Refracting… ${pct}%`;
    }
  });

  el.saveEntry.disabled = false;

  if (!result) {
    el.aiStatus.textContent = 'Could not refract this entry.';
    return;
  }

  el.aiStatus.textContent = result.source === 'ai'
    ? 'Refracted on-device.'
    : 'Refracted with lightweight keyword mode — model unavailable.';

  const label = result.label.toLowerCase();
  const note = CARE_NOTES[label] || CARE_NOTES.default;
  const gem = EMOTION_GEMS[label];
  const supportBlock = HEAVY_EMOTIONS.has(label) && result.score > 0.6
    ? `<div class="care-note">${SUPPORT_NOTE}</div>`
    : '';

  el.aiInsight.innerHTML = `
    <span class="emotion-tag-row">
      <span class="gem entry-gem" id="insightGem"></span>
      <span class="emotion-tag">${gem ? gem.name : label}<small>${label}</small></span>
    </span>
    <p>${note}</p>
    ${supportBlock}
  `;
  if (gem) setGemVars(document.getElementById('insightGem'), gem);

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
    el.saveHint.textContent = 'Choose today\'s stone first.';
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
  showStoneOnHero(stoneForMood(entry.mood));
  el.heroGem.classList.remove('gem-settle');
  void el.heroGem.offsetWidth; // restart the animation
  el.heroGem.classList.add('gem-settle');
  el.saveHint.textContent = 'Reading saved ✓';
  setTimeout(() => { el.saveHint.textContent = ''; }, 2500);

  const text = entry.text;
  resetForm();
  await runAiInsight(text, entry.id);
  renderAll();
});

renderAll();
