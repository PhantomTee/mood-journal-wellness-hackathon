// On-device emotion classification. Uses Transformers.js to run a small
// distilled model (Xenova/distilbert-base-uncased-emotion) fully in the
// browser via WebAssembly/WebGPU — no API key, no server, free to run.
// The model only ever produces a label + confidence score; all user-facing
// text comes from the static templates in prompts.js, so a journal entry
// can never make the app "say" something unsafe.

let pipelinePromise = null;
let loadFailed = false;

async function getPipeline(onProgress) {
  if (loadFailed) return null;
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      try {
        const { pipeline, env } = await import(
          'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'
        );
        env.allowLocalModels = false;
        return await pipeline(
          'text-classification',
          'Xenova/distilbert-base-uncased-emotion',
          { progress_callback: onProgress }
        );
      } catch (err) {
        console.warn('AI model failed to load, falling back to keyword mode.', err);
        loadFailed = true;
        return null;
      }
    })();
  }
  return pipelinePromise;
}

const FALLBACK_LEXICON = {
  joy: ['happy', 'great', 'glad', 'excited', 'fun', 'good', 'proud', 'grateful', 'thankful'],
  sadness: ['sad', 'down', 'cry', 'lonely', 'hopeless', 'empty', 'tired', 'exhausted'],
  anger: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated'],
  fear: ['anxious', 'scared', 'worried', 'nervous', 'afraid', 'stressed', 'overwhelmed'],
  love: ['love', 'loved', 'grateful', 'thankful', 'appreciate'],
  surprise: ['surprised', 'shocked', 'unexpected', 'wow'],
};

function fallbackClassify(text) {
  const lower = text.toLowerCase();
  let best = { label: 'neutral', score: 0.4 };
  let bestCount = 0;
  for (const [label, words] of Object.entries(FALLBACK_LEXICON)) {
    const count = words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    if (count > bestCount) {
      bestCount = count;
      best = { label, score: Math.min(0.5 + count * 0.1, 0.9) };
    }
  }
  return { ...best, source: 'fallback' };
}

export async function classifyMood(text, onProgress) {
  if (!text || !text.trim()) return null;

  const pipe = await getPipeline(onProgress);
  if (!pipe) return fallbackClassify(text);

  try {
    const result = await pipe(text.slice(0, 512));
    const top = Array.isArray(result) ? result[0] : result;
    return { label: top.label, score: top.score, source: 'ai' };
  } catch (err) {
    console.warn('AI classification failed, using fallback.', err);
    return fallbackClassify(text);
  }
}
