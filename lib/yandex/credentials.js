function cleanEnv(name) {
  const raw = process.env[name];
  if (!raw) return '';
  return raw.trim().replace(/^['"]|['"]$/g, '');
}

/**
 * @returns {{ apiKey: string, folderId: string }}
 */
function getYandexCredentials() {
  return {
    apiKey: cleanEnv('YANDEX_API_KEY'),
    folderId: cleanEnv('YANDEX_FOLDER_ID'),
  };
}

/**
 * @param {string} apiKey
 * @param {string} folderId
 */
function validateCredentials(apiKey, folderId) {
  if (!apiKey || !folderId) {
    return { ok: false, code: 'YANDEX_NOT_CONFIGURED' };
  }

  if (apiKey.startsWith('sk-') || apiKey.startsWith('pk-')) {
    return { ok: false, code: 'YANDEX_WRONG_KEY_TYPE' };
  }

  if (!folderId.startsWith('b1')) {
    return { ok: false, code: 'YANDEX_WRONG_FOLDER' };
  }

  if (apiKey.length < 20) {
    return { ok: false, code: 'YANDEX_KEY_TOO_SHORT' };
  }

  return { ok: true };
}

const USER_MESSAGES = {
  YANDEX_NOT_CONFIGURED:
    'Озвучка не настроена: добавьте **YANDEX_API_KEY** и **YANDEX_FOLDER_ID** в Vercel.',
  YANDEX_WRONG_KEY_TYPE:
    'В **YANDEX_API_KEY** указан не тот ключ.\n\n' +
    'Сейчас похоже на ключ OpenAI (`sk-...`) или другого сервиса. ' +
    'Нужен **API-ключ сервисного аккаунта Yandex Cloud** (обычно начинается с `AQVN...`).\n\n' +
    'Создайте: [console.cloud.yandex.ru](https://console.cloud.yandex.ru) → каталог → ' +
    'Сервисные аккаунты → API-ключ → роль `ai.speechkit.tts.user`.',
  YANDEX_WRONG_FOLDER:
    '**YANDEX_FOLDER_ID** должен быть ID каталога (`b1...` из URL консоли), не ID облака.',
  YANDEX_KEY_TOO_SHORT: '**YANDEX_API_KEY** слишком короткий — скопируйте ключ целиком.',
};

function messageForCode(code) {
  return USER_MESSAGES[code] || USER_MESSAGES.YANDEX_NOT_CONFIGURED;
}

module.exports = {
  getYandexCredentials,
  validateCredentials,
  messageForCode,
  USER_MESSAGES,
};
