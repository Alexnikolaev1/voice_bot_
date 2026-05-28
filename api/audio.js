const { getAudio } = require('../lib/storage/audioCache');
const { safeContentDispositionFilename } = require('../lib/utils/filename');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const id = req.query?.id;
  if (!id || !/^[a-f0-9]{24}$/.test(String(id))) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const entry = await getAudio(String(id));
  if (!entry) {
    return res.status(404).json({
      error: 'not_found',
      message: 'Файл не найден или срок хранения истёк (24 ч). Озвучьте текст заново.',
    });
  }

  const filename = safeContentDispositionFilename(entry.filename);

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', entry.buffer.length);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');

  return res.status(200).send(entry.buffer);
};
