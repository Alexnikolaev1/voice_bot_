const axios = require('axios');
const { VOICES, isValidVoice } = require('../voices');
const { SPEEDS, EMOTIONS } = require('../config');

const TTS_URL = 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize';
const {
  getYandexCredentials,
  validateCredentials,
  messageForCode,
} = require('../yandex/credentials');

function buildParams(text, settings, withEmotion = true) {
  let voice = settings.voice;
  if (!isValidVoice(voice)) voice = 'alena';

  const params = new URLSearchParams({
    text,
    lang: 'ru-RU',
    voice,
    format: 'mp3',
    sampleRateHertz: '48000',
    speed: String(settings.speed),
  });

  if (withEmotion) {
    const emotionKey = settings.emotion in EMOTIONS ? settings.emotion : 'good';
    params.append('emotion', EMOTIONS[emotionKey].api);
  }

  return params;
}

/**
 * @param {string} text
 * @param {{ voice: string, speed: number, emotion: string }} settings
 * @returns {Promise<Buffer>}
 */
async function synthesize(text, settings) {
  const { apiKey, folderId } = getYandexCredentials();
  const check = validateCredentials(apiKey, folderId);
  if (!check.ok) {
    const err = new Error(check.code);
    err.code = check.code;
    throw err;
  }

  const headers = {
    Authorization: `Api-Key ${apiKey}`,
    'x-folder-id': folderId,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  async function requestTts(withEmotion) {
    const response = await axios.post(TTS_URL, buildParams(text, settings, withEmotion).toString(), {
      headers,
      responseType: 'arraybuffer',
      timeout: 25000,
      validateStatus: () => true,
    });

    if (response.status === 200) {
      return Buffer.from(response.data);
    }

    const body = Buffer.from(response.data).toString('utf8');
    console.error(`[tts] ${response.status}:`, body.slice(0, 400));

    const err = new Error(`YANDEX_TTS_${response.status}`);
    err.status = response.status;
    err.body = body;
    throw err;
  }

  try {
    return await requestTts(true);
  } catch (err) {
    if (err.status === 400 && err.body) {
      console.warn('[tts] retry without emotion');
      return requestTts(false);
    }
    throw err;
  }
}

function mapYandexError(err) {
  if (err.code && messageForCode(err.code)) {
    return messageForCode(err.code);
  }

  const status = err.status;
  const body = err.body || '';

  if (status === 401 || body.includes('Unknown api key')) {
    return messageForCode('YANDEX_WRONG_KEY_TYPE');
  }
  if (status === 403) {
    return 'Озвучка: нет прав у сервисного аккаунта. Назначьте роль **ai.speechkit.tts.user** на каталог.';
  }
  if (status === 429) {
    return 'Слишком много запросов к SpeechKit — подождите минуту.';
  }
  if (status === 400) {
    return 'Текст или настройки голоса не подходят для SpeechKit.';
  }
  return 'Не удалось синтезировать речь. Попробуйте позже.';
}

module.exports = { synthesize, mapYandexError, VOICES };
