const { sendMessage } = require('../max/client');
const { sendAudio } = require('../max/uploads');
const { synthesize } = require('../tts/yandex');
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

  const settings = await getSettings(storageKey);
  const audio = await synthesize(finalText, settings);

  await sendAudio(target, audio);

  if (truncated) {
    await sendMessage(target, {
      text: `⚠️ Текст обрезан до **${LIMITS.ttsChars}** символов (лимит SpeechKit).`,
    });
  }
}

module.exports = { handleTTS };
