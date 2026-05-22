/**
 * Extract chat id from MAX Update object.
 * @param {object} update
 * @returns {number|null}
 */
function getChatId(update) {
  if (update.chat_id != null) return update.chat_id;
  const recipient = update.message?.recipient;
  if (recipient?.chat_id != null) return recipient.chat_id;
  if (recipient?.user_id != null) return recipient.user_id;
  return null;
}

/**
 * @param {object} update
 * @returns {string|null}
 */
function getMessageText(update) {
  const text = update.message?.body?.text;
  return typeof text === 'string' ? text.trim() : null;
}

/**
 * @param {object} update
 * @returns {{ command: string, args: string }|null}
 */
function parseCommand(text) {
  if (!text?.startsWith('/')) return null;
  const [head, ...rest] = text.split(/\s+/);
  const command = head.split('@')[0].toLowerCase();
  return { command, args: rest.join(' ').trim() };
}

module.exports = { getChatId, getMessageText, parseCommand };
