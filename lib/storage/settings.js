const { DEFAULTS, SPEEDS } = require('../config');
const { isValidVoice } = require('../voices');

let kv;
const memory = new Map();

async function getStore() {
  if (kv !== undefined) return kv;
  try {
    kv = await import('@vercel/kv').then((m) => m.kv);
  } catch {
    kv = null;
  }
  return kv;
}

function normalize(raw) {
  const voice = isValidVoice(raw?.voice) ? raw.voice : DEFAULTS.voice;
  const speedKey = raw?.speed in SPEEDS ? raw.speed : DEFAULTS.speed;
  const emotion = raw?.emotion && ['good', 'neutral', 'evil'].includes(raw.emotion)
    ? raw.emotion
    : DEFAULTS.emotion;

  return {
    voice,
    speed: SPEEDS[speedKey],
    speedKey,
    emotion,
  };
}

/**
 * @param {number|string} chatId
 */
async function getSettings(chatId) {
  const key = `user:${chatId}`;

  try {
    const store = await getStore();
    if (store) {
      const raw = await store.get(key);
      return normalize(typeof raw === 'object' ? raw : null);
    }
  } catch (err) {
    console.warn('[settings] KV read failed:', err.message);
  }

  return normalize(memory.get(key));
}

/**
 * @param {number|string} chatId
 * @param {Partial<{ voice: string, speed: string, emotion: string }>} patch
 */
async function updateSettings(chatId, patch) {
  const current = await getSettings(chatId);
  const next = normalize({
    voice: patch.voice ?? current.voice,
    speed: patch.speed ?? current.speedKey,
    emotion: patch.emotion ?? current.emotion,
  });

  const stored = {
    voice: next.voice,
    speed: next.speedKey,
    emotion: next.emotion,
  };

  const key = `user:${chatId}`;

  try {
    const store = await getStore();
    if (store) {
      await store.set(key, stored, { ex: 60 * 60 * 24 * 365 });
      return next;
    }
  } catch (err) {
    console.warn('[settings] KV write failed:', err.message);
  }

  memory.set(key, stored);
  return next;
}

module.exports = { getSettings, updateSettings };
