module.exports = function handler(_req, res) {
  const folder = (process.env.YANDEX_FOLDER_ID || '').trim().replace(/^['"]|['"]$/g, '');
  const key = (process.env.YANDEX_API_KEY || '').trim();

  res.status(200).json({
    ok: true,
    service: 'max-tts-bot',
    version: '2.0.0',
    checks: {
      maxToken: Boolean(process.env.MAX_BOT_TOKEN),
      yandexKey: Boolean(key),
      yandexFolder: Boolean(folder),
      yandexFolderLooksValid: folder.startsWith('b1'),
      yandexReady: Boolean(key && folder.startsWith('b1')),
    },
    hint: folder && !folder.startsWith('b1')
      ? 'YANDEX_FOLDER_ID должен начинаться с b1 (ID каталога в console.cloud.yandex.ru)'
      : undefined,
  });
};
