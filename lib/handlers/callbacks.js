const { answerCallback, sendMessage } = require('../max/client');
const { getSettings, updateSettings } = require('../storage/settings');
const { VOICES } = require('../voices');
const { EMOTIONS } = require('../config');
const {
  WELCOME,
  HELP,
  mainMenuKeyboard,
  voiceMenuKeyboard,
  settingsMenuKeyboard,
  formatSettings,
  voiceChanged,
  speedChanged,
  emotionChanged,
} = require('../texts/messages');

/**
 * @param {object} update
 */
async function handleCallback(update) {
  const chatId = update.message?.recipient?.chat_id ?? update.message?.recipient?.user_id;
  const payload = update.callback?.payload;
  const callbackId = update.callback?.callback_id;

  if (!chatId || !payload || !callbackId) return;

  if (payload === 'menu:main') {
    await answerCallback(callbackId, { notification: 'Главное меню' });
    await sendMessage(chatId, { text: WELCOME, attachments: [mainMenuKeyboard()] });
    return;
  }

  if (payload === 'menu:help') {
    await answerCallback(callbackId);
    await sendMessage(chatId, { text: HELP, attachments: [mainMenuKeyboard()] });
    return;
  }

  if (payload === 'menu:voices') {
    await answerCallback(callbackId);
    await sendMessage(chatId, { text: '**Выбери голос**', attachments: [voiceMenuKeyboard()] });
    return;
  }

  if (payload === 'menu:settings') {
    const settings = await getSettings(chatId);
    await answerCallback(callbackId);
    await sendMessage(chatId, {
      text: formatSettings(settings),
      attachments: [settingsMenuKeyboard()],
    });
    return;
  }

  if (payload.startsWith('voice:')) {
    const voiceId = payload.slice(6);
    if (!VOICES[voiceId]) {
      await answerCallback(callbackId, { notification: 'Неизвестный голос' });
      return;
    }
    await updateSettings(chatId, { voice: voiceId });
    await answerCallback(callbackId, { notification: VOICES[voiceId].name });
    await sendMessage(chatId, {
      text: voiceChanged(VOICES[voiceId].name),
      attachments: [mainMenuKeyboard()],
    });
    return;
  }

  if (payload.startsWith('speed:')) {
    const speedKey = payload.slice(6);
    const settings = await updateSettings(chatId, { speed: speedKey });
    const labels = { slow: 'медленный', normal: 'обычный', fast: 'быстрый' };
    await answerCallback(callbackId, { notification: labels[settings.speedKey] || 'OK' });
    await sendMessage(chatId, {
      text: `${speedChanged(labels[settings.speedKey])}\n\n${formatSettings(settings)}`,
      attachments: [settingsMenuKeyboard()],
    });
    return;
  }

  if (payload.startsWith('emotion:')) {
    const emotion = payload.slice(8);
    const settings = await updateSettings(chatId, { emotion });
    const label = EMOTIONS[settings.emotion]?.label || emotion;
    await answerCallback(callbackId, { notification: label });
    await sendMessage(chatId, {
      text: `${emotionChanged(label)}\n\n${formatSettings(settings)}`,
      attachments: [settingsMenuKeyboard()],
    });
  }
}

module.exports = { handleCallback };
