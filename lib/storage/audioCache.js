const crypto = require('crypto');

const TTL_SEC = 60 * 60 * 24; // 24 часа
const MAX_BYTES = 4 * 1024 * 1024;

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

/**
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {Promise<string|null>} id для /api/audio?id=
 */
async function saveAudio(buffer, filename) {
  if (!buffer?.length || buffer.length > MAX_BYTES) return null;

  const id = crypto.randomBytes(12).toString('hex');
  const record = JSON.stringify({
    filename: filename || 'ozvuchka.mp3',
    data: buffer.toString('base64'),
  });

  try {
    const store = await getStore();
    if (store) {
      await store.set(`dl:${id}`, record, { ex: TTL_SEC });
      return id;
    }
  } catch (err) {
    console.warn('[audioCache] KV save failed:', err.message);
  }

  memory.set(id, { record, expires: Date.now() + TTL_SEC * 1000 });
  return id;
}

/**
 * @param {string} id
 * @returns {Promise<{ buffer: Buffer, filename: string }|null>}
 */
async function getAudio(id) {
  if (!id || !/^[a-f0-9]{24}$/.test(id)) return null;

  let raw;

  try {
    const store = await getStore();
    if (store) {
      raw = await store.get(`dl:${id}`);
    }
  } catch (err) {
    console.warn('[audioCache] KV get failed:', err.message);
  }

  if (!raw) {
    const mem = memory.get(id);
    if (!mem || mem.expires < Date.now()) return null;
    raw = mem.record;
  }

  try {
    const { filename, data } = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { buffer: Buffer.from(data, 'base64'), filename: filename || 'ozvuchka.mp3' };
  } catch {
    return null;
  }
}

async function setLastAudioId(storageKey, audioId) {
  if (!storageKey || !audioId) return;
  const key = `last:${storageKey}`;

  try {
    const store = await getStore();
    if (store) {
      await store.set(key, audioId, { ex: TTL_SEC });
      return;
    }
  } catch (err) {
    console.warn('[audioCache] last save failed:', err.message);
  }

  memory.set(key, { audioId, expires: Date.now() + TTL_SEC * 1000 });
}

async function getLastAudioId(storageKey) {
  if (!storageKey) return null;
  const key = `last:${storageKey}`;

  try {
    const store = await getStore();
    if (store) {
      return (await store.get(key)) || null;
    }
  } catch (err) {
    console.warn('[audioCache] last get failed:', err.message);
  }

  const mem = memory.get(key);
  if (!mem || mem.expires < Date.now()) return null;
  return mem.audioId;
}

module.exports = { saveAudio, getAudio, setLastAudioId, getLastAudioId, TTL_SEC };
