const axios = require('axios');
const { VOICES, isValidVoice } = require('../voices');
const { SPEEDS, EMOTIONS } = require('../config');

const TTS_URL = 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize';

function env(name) {
  const raw = process.env[name];
  if (!raw) return '';
  return raw.trim().replace(/^['"]|['"]$/g, '');
}

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
  const apiKey = env('YANDEX_API_KEY');
  const folderId = env('YANDEX_FOLDER_ID');

  if (!apiKey || !folderId) {
    throw new Error('YANDEX_NOT_CONFIGURED');
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
  const status = err.status;
  if (status === 401) {
    return (
      'Озвучка: неверный **YANDEX_API_KEY** или **YANDEX_FOLDER_ID**.\n\n' +
      'Нужен API-ключ **сервисного аккаунта** (не пароль от Яндекса) и ID каталога `b1...`.\n' +
      'Роль: `ai.speechkit.tts.user`. После смены ключей — Redeploy в Vercel.'
    );
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
  if (err.message === 'YANDEX_NOT_CONFIGURED') {
    return 'Озвучка не настроена: добавьте YANDEX_API_KEY и YANDEX_FOLDER_ID в Vercel.';
  }
  return 'Не удалось синтезировать речь. Попробуйте позже.';
}

module.exports = { synthesize, mapYandexError, VOICES };
