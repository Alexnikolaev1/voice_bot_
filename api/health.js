const { getYandexCredentials, validateCredentials } = require('../lib/yandex/credentials');

module.exports = function handler(_req, res) {
  const { apiKey, folderId } = getYandexCredentials();
  const yandexCheck = validateCredentials(apiKey, folderId);

  let yandexHint;
  if (apiKey.startsWith('sk-') || apiKey.startsWith('pk-')) {
    yandexHint =
      'YANDEX_API_KEY похож на OpenAI (sk-...). Нужен API-ключ сервисного аккаунта Yandex Cloud (AQVN...).';
  } else if (folderId && !folderId.startsWith('b1')) {
    yandexHint = 'YANDEX_FOLDER_ID должен начинаться с b1 (ID каталога в console.cloud.yandex.ru).';
  } else if (!yandexCheck.ok) {
    yandexHint = 'Проверьте YANDEX_API_KEY и YANDEX_FOLDER_ID в Vercel → Redeploy.';
  }

  res.status(200).json({
    ok: true,
    service: 'max-tts-bot',
    version: '2.0.0',
    checks: {
      maxToken: Boolean(process.env.MAX_BOT_TOKEN),
      yandexKeyPresent: Boolean(apiKey),
      yandexFolderPresent: Boolean(folderId),
      yandexFolderLooksValid: folderId.startsWith('b1'),
      yandexKeyLooksValid: yandexCheck.ok,
      yandexKeyNotOpenAI: !apiKey.startsWith('sk-') && !apiKey.startsWith('pk-'),
      yandexReady: yandexCheck.ok,
    },
    hint: yandexHint,
  });
};
