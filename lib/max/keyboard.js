/**
 * MAX inline keyboard (attachment format).
 * @see https://dev.max.ru/docs-api/methods/POST/messages
 */

function callbackBtn(text, payload) {
  return { type: 'callback', text, payload };
}

function row(...buttons) {
  return buttons;
}

function inlineKeyboard(buttonRows) {
  return {
    type: 'inline_keyboard',
    payload: { buttons: buttonRows },
  };
}

module.exports = { callbackBtn, row, inlineKeyboard };
