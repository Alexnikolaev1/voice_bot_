const axios = require('axios');
const { VOICES, isValidVoice } = require('../voices');
const { SPEEDS, EMOTIONS } = require('../config');

const TTS_URL = 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize';

/**
 * @param {string} text
 * @param {{ voice: string, speed: number, emotion: string }} settings
 * @returns {Promise<Buffer>}
 */
async function synthesize(text, settings) {
  const apiKey = process.env.YANDEX_API_KEY;
  const folderId = process.env.YANDEX_FOLDER_ID;

  if (!apiKey || !folderId) {
    throw new Error('YANDEX_API_KEY or YANDEX_FOLDER_ID is not set');
  }

  let voice = settings.voice;
  if (!isValidVoice(voice)) voice = 'alena';

  const emotionKey = settings.emotion in EMOTIONS ? settings.emotion : 'good';
  const emotion = EMOTIONS[emotionKey].api;

  const params = new URLSearchParams({
    text,
    lang: 'ru-RU',
    voice,
    format: 'mp3',
    sampleRateHertz: '48000',
    folderId,
    speed: String(settings.speed),
    emotion,
  });

  try {
    const response = await axios.post(TTS_URL, params.toString(), {
      headers: {
        Authorization: `Api-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      responseType: 'arraybuffer',
      timeout: 20000,
    });

    return Buffer.from(response.data);
  } catch (err) {
    if (!err.response) throw err;

    const status = err.response.status;
    const body = Buffer.from(err.response.data).toString('utf8');
    console.error(`[tts] ${status}:`, body.slice(0, 300));

    if (status === 401) throw new Error('Неверный ключ Yandex Cloud');
    if (status === 400) throw new Error('Текст или параметры озвучки не подходят');
    if (status === 429) throw new Error('Слишком много запросов — подождите минуту');
    throw new Error(`Ошибка SpeechKit (${status})`);
  }
}

module.exports = { synthesize, VOICES };
