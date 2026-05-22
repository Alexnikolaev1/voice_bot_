const { sendMessage } = require('../max/client');
const {
  WELCOME,
  HELP,
  mainMenuKeyboard,
  voiceMenuKeyboard,
  settingsMenuKeyboard,
  formatSettings,
} = require('../texts/messages');
const { getSettings } = require('../storage/settings');

async function sendStart(chatId) {
  await sendMessage(chatId, {
    text: WELCOME,
    attachments: [mainMenuKeyboard()],
  });
}

async function sendHelp(chatId) {
  await sendMessage(chatId, { text: HELP, attachments: [mainMenuKeyboard()] });
}

async function sendVoiceMenu(chatId) {
  await sendMessage(chatId, {
    text: '**Выбери голос**',
    attachments: [voiceMenuKeyboard()],
  });
}

async function sendSettings(chatId) {
  const settings = await getSettings(chatId);
  await sendMessage(chatId, {
    text: formatSettings(settings),
    attachments: [settingsMenuKeyboard()],
  });
}

/**
 * @param {number} chatId
 * @param {{ command: string }} cmd
 */
async function handleCommand(chatId, cmd) {
  switch (cmd.command) {
    case '/start':
      await sendStart(chatId);
      return true;
    case '/help':
      await sendHelp(chatId);
      return true;
    case '/voice':
      await sendVoiceMenu(chatId);
      return true;
    case '/settings':
    case '/currentvoice':
      await sendSettings(chatId);
      return true;
    default:
      return false;
  }
}

module.exports = { handleCommand, sendStart, sendHelp, sendVoiceMenu, sendSettings };
