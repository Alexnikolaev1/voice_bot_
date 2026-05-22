const { sendMessage } = require('../max/client');
const { sendAudio } = require('../max/uploads');
const { synthesize } = require('../tts/yandex');
const { getSettings } = require('../storage/settings');
const { LIMITS } = require('../config');
const { mainMenuKeyboard } = require('../texts/messages');

/**
 * @param {number} chatId
 * @param {string} text
 */
async function handleTTS(chatId, text) {
  if (text.length < LIMITS.minTextChars) {
    await sendMessage(chatId, {
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

  await sendMessage(chatId, { text: '⏳ Синтезирую…' });

  const settings = await getSettings(chatId);
  const audio = await synthesize(finalText, settings);

  await sendAudio(chatId, audio);

  if (truncated) {
    await sendMessage(chatId, {
      text: `⚠️ Текст обрезан до **${LIMITS.ttsChars}** символов (лимит SpeechKit).`,
    });
  }
}

module.exports = { handleTTS };
