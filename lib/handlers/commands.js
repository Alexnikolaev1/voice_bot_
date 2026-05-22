const { sendMessage, isRetryableError } = require('../max/client');
const { getStorageKey } = require('../utils/update');
const {
  WELCOME,
  HELP,
  mainMenuKeyboard,
  voiceMenuKeyboard,
  settingsMenuKeyboard,
  formatSettings,
} = require('../texts/messages');
const { getSettings } = require('../storage/settings');

async function sendStart(target) {
  try {
    await sendMessage(target, {
      text: WELCOME,
      format: 'markdown',
      attachments: [mainMenuKeyboard()],
    });
  } catch (err) {
    if (!isRetryableError(err)) throw err;
    console.warn('[sendStart] fallback: plain text without keyboard');
    await sendMessage(target, {
      text: 'Голосовой бот. Отправь текст — озвучу. Команды: /help /voice /settings',
    });
  }
}

async function sendHelp(target) {
  await sendMessage(target, { text: HELP, attachments: [mainMenuKeyboard()] });
}

async function sendVoiceMenu(target) {
  await sendMessage(target, {
    text: '**Выбери голос**',
    attachments: [voiceMenuKeyboard()],
  });
}

async function sendSettings(target) {
  const key = getStorageKey(target);
  const settings = await getSettings(key);
  await sendMessage(target, {
    text: formatSettings(settings),
    attachments: [settingsMenuKeyboard()],
  });
}

/**
 * @param {{ chatId: number|null, userId: number|null }} target
 * @param {{ command: string }} cmd
 */
async function handleCommand(target, cmd) {
  switch (cmd.command) {
    case '/start':
      await sendStart(target);
      return true;
    case '/help':
      await sendHelp(target);
      return true;
    case '/voice':
      await sendVoiceMenu(target);
      return true;
    case '/settings':
    case '/currentvoice':
      await sendSettings(target);
      return true;
    default:
      return false;
  }
}

module.exports = { handleCommand, sendStart, sendHelp, sendVoiceMenu, sendSettings };
