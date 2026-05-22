const { answerCallback, sendMessage } = require('../max/client');
const { getRecipient, getStorageKey } = require('../utils/update');
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
  const target = getRecipient(update);
  const storageKey = getStorageKey(target);
  const payload = update.callback?.payload;
  const callbackId = update.callback?.callback_id;

  if (!storageKey || !payload || !callbackId) return;

  if (payload === 'menu:main') {
    await answerCallback(callbackId, { notification: 'Главное меню' });
    await sendMessage(target, { text: WELCOME, attachments: [mainMenuKeyboard()] });
    return;
  }

  if (payload === 'menu:help') {
    await answerCallback(callbackId);
    await sendMessage(target, { text: HELP, attachments: [mainMenuKeyboard()] });
    return;
  }

  if (payload === 'menu:voices') {
    await answerCallback(callbackId);
    await sendMessage(target, { text: '**Выбери голос**', attachments: [voiceMenuKeyboard()] });
    return;
  }

  if (payload === 'menu:settings') {
    const settings = await getSettings(storageKey);
    await answerCallback(callbackId);
    await sendMessage(target, {
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
    await updateSettings(storageKey, { voice: voiceId });
    await answerCallback(callbackId, { notification: VOICES[voiceId].name });
    await sendMessage(target, {
      text: voiceChanged(VOICES[voiceId].name),
      attachments: [mainMenuKeyboard()],
    });
    return;
  }

  if (payload.startsWith('speed:')) {
    const speedKey = payload.slice(6);
    const settings = await updateSettings(storageKey, { speed: speedKey });
    const labels = { slow: 'медленный', normal: 'обычный', fast: 'быстрый' };
    await answerCallback(callbackId, { notification: labels[settings.speedKey] || 'OK' });
    await sendMessage(target, {
      text: `${speedChanged(labels[settings.speedKey])}\n\n${formatSettings(settings)}`,
      attachments: [settingsMenuKeyboard()],
    });
    return;
  }

  if (payload.startsWith('emotion:')) {
    const emotion = payload.slice(8);
    const settings = await updateSettings(storageKey, { emotion });
    const label = EMOTIONS[settings.emotion]?.label || emotion;
    await answerCallback(callbackId, { notification: label });
    await sendMessage(target, {
      text: `${emotionChanged(label)}\n\n${formatSettings(settings)}`,
      attachments: [settingsMenuKeyboard()],
    });
  }
}

module.exports = { handleCallback };
