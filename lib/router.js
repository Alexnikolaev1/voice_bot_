const { getChatId, getMessageText, parseCommand } = require('./utils/update');
const { handleCommand, sendStart } = require('./handlers/commands');
const { handleCallback } = require('./handlers/callbacks');
const { handleTTS } = require('./handlers/tts');
const { sendMessage } = require('./max/client');
const { mainMenuKeyboard } = require('./texts/messages');

/**
 * Route MAX Update to the right handler.
 * @param {object} update
 */
async function routeUpdate(update) {
  const type = update.update_type;

  if (type === 'bot_started') {
    const chatId = getChatId(update);
    if (chatId) await sendStart(chatId);
    return;
  }

  if (type === 'message_callback') {
    await handleCallback(update);
    return;
  }

  if (type === 'message_created') {
    const chatId = getChatId(update);
    const text = getMessageText(update);
    if (!chatId || !text) return;

    const cmd = parseCommand(text);
    if (cmd) {
      const handled = await handleCommand(chatId, cmd);
      if (handled) return;
      await sendMessage(chatId, {
        text: 'Неизвестная команда. Список: /help',
        attachments: [mainMenuKeyboard()],
      });
      return;
    }

    await handleTTS(chatId, text);
    return;
  }

  // Ignore other update types silently
}

async function routeUpdateSafe(update) {
  const chatId = getChatId(update);

  try {
    await routeUpdate(update);
  } catch (err) {
    console.error('[router]', err);
    if (chatId) {
      try {
        await sendMessage(chatId, {
          text: '⚠️ Не получилось обработать запрос. Попробуй ещё раз.',
          attachments: [mainMenuKeyboard()],
        });
      } catch (sendErr) {
        console.error('[router] failed to notify user:', sendErr.message);
      }
    }
  }
}

module.exports = { routeUpdate, routeUpdateSafe };
