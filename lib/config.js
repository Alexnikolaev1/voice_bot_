/** @typedef {'alena'|'jane'|'omazh'|'maria'|'lea'|'filipp'|'ermil'|'zahar'|'alexander'|'kirill'} VoiceId */
/** @typedef {'good'|'neutral'|'evil'} Emotion */
/** @typedef {'slow'|'normal'|'fast'} SpeedKey */

const MAX_API_BASE = process.env.MAX_API_BASE || 'https://platform-api.max.ru';

const LIMITS = {
  ttsChars: 5000,
  minTextChars: 1,
};

const DEFAULTS = {
  voice: 'alena',
  speed: 'normal',
  emotion: 'good',
};

const SPEEDS = {
  slow: 0.8,
  normal: 1.0,
  fast: 1.3,
};

const EMOTIONS = {
  good: { label: 'Дружелюбный', api: 'good' },
  neutral: { label: 'Нейтральный', api: 'neutral' },
  evil: { label: 'Экспрессивный', api: 'evil' },
};

module.exports = {
  MAX_API_BASE,
  LIMITS,
  DEFAULTS,
  SPEEDS,
  EMOTIONS,
};
