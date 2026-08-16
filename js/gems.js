// The five stones — our mood scale, in mood-ring vocabulary.
// mood 1..5 maps directly to the existing storage format.
export const STONES = [
  { mood: 1, id: 'onyx',        name: 'Onyx',         feeling: 'Heavy',  a: '#2a2730', b: '#0f0d12', glow: 'rgba(90,85,110,0.35)' },
  { mood: 2, id: 'smoky-quartz', name: 'Smoky Quartz', feeling: 'Uneasy', a: '#7a6353', b: '#4a3a2e', glow: 'rgba(154,122,94,0.35)' },
  { mood: 3, id: 'citrine',     name: 'Citrine',      feeling: 'Mixed',  a: '#e8b84b', b: '#a9762a', glow: 'rgba(232,184,75,0.4)' },
  { mood: 4, id: 'emerald',     name: 'Emerald',      feeling: 'Calm',   a: '#4fa377', b: '#245c42', glow: 'rgba(79,163,119,0.4)' },
  { mood: 5, id: 'sapphire',    name: 'Sapphire',     feeling: 'Bright', a: '#5b7fd6', b: '#2e3f8f', glow: 'rgba(91,127,214,0.45)' },
];

export function stoneForMood(mood) {
  return STONES.find(s => s.mood === Number(mood)) || null;
}

// A couple of extra cuts for the AI "refraction" panel, which sees finer
// emotional grain than the 5-point scale.
export const EMOTION_GEMS = {
  joy:      { name: 'Emerald',     a: '#4fa377', b: '#245c42', glow: 'rgba(79,163,119,0.4)' },
  love:     { name: 'Rose Quartz', a: '#d98ea6', b: '#a3506c', glow: 'rgba(217,142,166,0.4)' },
  surprise: { name: 'Citrine',     a: '#e8b84b', b: '#a9762a', glow: 'rgba(232,184,75,0.4)' },
  neutral:  { name: 'Quartz',      a: '#b9b3c4', b: '#7a7488', glow: 'rgba(185,179,196,0.35)' },
  sadness:  { name: 'Smoky Quartz', a: '#7a6353', b: '#4a3a2e', glow: 'rgba(154,122,94,0.35)' },
  fear:     { name: 'Citrine',     a: '#e8b84b', b: '#a9762a', glow: 'rgba(232,184,75,0.4)' },
  anger:    { name: 'Garnet',      a: '#b5543f', b: '#6e2c1f', glow: 'rgba(181,84,63,0.4)' },
};

export function setGemVars(el, stone) {
  if (!stone) {
    el.style.removeProperty('--gem-a');
    el.style.removeProperty('--gem-b');
    el.style.removeProperty('--gem-glow');
    el.classList.add('gem-idle');
    return;
  }
  el.classList.remove('gem-idle');
  el.style.setProperty('--gem-a', stone.a);
  el.style.setProperty('--gem-b', stone.b);
  el.style.setProperty('--gem-glow', stone.glow);
}
