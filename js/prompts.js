export const REFLECTION_PROMPTS = [
  "What's one small thing that went right today?",
  "What's taking up the most space in your head right now?",
  "Who or what made you smile recently?",
  "What's one thing you'd like to let go of before tomorrow?",
  "What does your body need right now — rest, movement, food, water?",
  "What's something you're looking forward to?",
  "If today had a color, what would it be, and why?",
  "What's one thing you handled well today, even if it felt small?",
  "What would make tomorrow 1% easier?",
  "What are you grateful for in this exact moment?",
  "What's a thought you keep coming back to?",
  "Who could you reach out to if you needed support?",
];

export function randomPrompt(exclude) {
  const pool = REFLECTION_PROMPTS.filter(p => p !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Templated, non-generative care notes keyed by classified emotion.
// Kept static/curated (not model-generated free text) so responses can't be
// steered into anything harmful by adversarial journal input.
export const CARE_NOTES = {
  joy: "It's great that you're feeling good — noticing this moment can help you find your way back to it later.",
  love: "Connection like this is worth savoring. Consider telling the people involved how much they mean to you.",
  surprise: "Unexpected moments can be a lot to process. Give yourself a beat to sit with it before deciding how you feel.",
  neutral: "A steady, even day is still worth logging — patterns over time matter more than any single entry.",
  sadness: "It sounds like today was heavy. Be gentle with yourself, and if it helps, reach out to someone you trust.",
  fear: "Anxious or uneasy feelings are exhausting to carry alone. A short walk, a slow breath, or a trusted friend can help.",
  anger: "Frustration is valid. Before reacting, try naming exactly what feels unfair — it often takes some of the heat out of it.",
  default: "Thank you for checking in with yourself today — that alone is a meaningful habit.",
};

export const SUPPORT_NOTE =
  "If things ever feel like more than you can carry, please reach out to someone you trust or a local mental health professional. You don't have to handle it alone.";
