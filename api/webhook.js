const { routeUpdateSafe } = require('../lib/router');
const { isDuplicate } = require('../lib/storage/idempotency');

function verifySecret(req) {
  const expected = process.env.MAX_WEBHOOK_SECRET;
  if (!expected) return true;
  const received = req.headers['x-max-bot-api-secret'];
  return received === expected;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'max-tts-bot',
      version: '2.0.0',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!verifySecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const update = req.body;
  if (!update?.update_type) {
    return res.status(400).json({ error: 'Invalid update' });
  }

  // Respond immediately — MAX retries slow endpoints
  res.status(200).json({ ok: true });

  try {
    if (await isDuplicate(update)) {
      console.log('[webhook] duplicate skipped:', update.update_type);
      return;
    }
    await routeUpdateSafe(update);
  } catch (err) {
    console.error('[webhook]', err);
  }
};
