const { sendMessage } = require('../max/client');
const { deliverVoiceResult } = require('../max/uploads');
const { synthesize, mapYandexError } = require('../tts/yandex');
const { getSettings } = require('../storage/settings');
const { getStorageKey } = require('../utils/update');
const { LIMITS } = require('../config');
const { mainMenuKeyboard } = require('../texts/messages');

/**
 * @param {{ chatId: number|null, userId: number|null }} target
 * @param {string} text
 */
async function handleTTS(target, text) {
  const storageKey = getStorageKey(target);

  if (text.length < LIMITS.minTextChars) {
    await sendMessage(target, {
      text: 'Напиши текст для озвучки — хотя бы одно слово.',
      attachments: [mainMenuKeyboard()],
    });
    return;
  }

  let finalText = text;
  let truncated = false;

  if (text.length > LIMITS.ttsChars) {
    finalText = text.slice(0, LIMITS.ttsChars);
    truncated = true;
  }

  await sendMessage(target, { text: '⏳ Синтезирую…' });

  try {
    const settings = await getSettings(storageKey);
    const audio = await synthesize(finalText, settings);

    await deliverVoiceResult(target, audio, {
      text: finalText,
      storageKey,
    });

    if (truncated) {
      await sendMessage(target, {
        text: `⚠️ Текст обрезан до **${LIMITS.ttsChars}** символов (лимит SpeechKit).`,
        format: 'markdown',
      });
    }
  } catch (err) {
    console.error('[tts]', err.status || err.message, err.body?.slice?.(0, 200));
    await sendMessage(target, {
      text: `⚠️ ${mapYandexError(err)}`,
      attachments: [mainMenuKeyboard()],
    });
  }
}

module.exports = { handleTTS };
