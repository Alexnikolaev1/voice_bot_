let kv;
const memory = new Map();
const TTL_SEC = 300;

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
 * @param {object} update
 * @returns {string}
 */
function eventKey(update) {
  const type = update.update_type || 'unknown';
  const mid = update.message?.body?.mid;
  const cb = update.callback?.callback_id;
  const ts = update.timestamp;
  return `${type}:${mid || cb || ts}`;
}

/**
 * @returns {Promise<boolean>} true if duplicate (already seen)
 */
async function isDuplicate(update) {
  const key = `evt:${eventKey(update)}`;

  try {
    const store = await getStore();
    if (store) {
      const exists = await store.get(key);
      if (exists) return true;
      await store.set(key, 1, { ex: TTL_SEC });
      return false;
    }
  } catch (err) {
    console.warn('[idempotency] KV error:', err.message);
  }

  if (memory.has(key)) return true;
  memory.set(key, Date.now());
  setTimeout(() => memory.delete(key), TTL_SEC * 1000).unref?.();
  return false;
}

module.exports = { isDuplicate, eventKey };
