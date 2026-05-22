const axios = require('axios');
const { MAX_API_BASE } = require('../config');

function getToken() {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) throw new Error('MAX_BOT_TOKEN is not set');
  return token;
}

function authHeaders(extra = {}) {
  return {
    Authorization: getToken(),
    ...extra,
  };
}

/**
 * @param {string} method
 * @param {string} path
 * @param {object} [options]
 */
async function request(method, path, options = {}) {
  const { params, data, headers, timeout = 15000, responseType } = options;
  const url = `${MAX_API_BASE}${path}`;

  try {
    const res = await axios({
      method,
      url,
      params,
      data,
      headers: authHeaders(headers),
      timeout,
      responseType,
    });
    return res.data;
  } catch (err) {
    const detail = err.response?.data ?? err.message;
    console.error(`[max] ${method} ${path}:`, detail);
    throw err;
  }
}

async function sendMessage(chatId, body) {
  return request('POST', '/messages', {
    data: { chat_id: chatId, notify: true, format: 'markdown', ...body },
  });
}

async function answerCallback(callbackId, body = {}) {
  return request('POST', '/answers', {
    params: { callback_id: callbackId },
    data: body,
    timeout: 8000,
  });
}

module.exports = { sendMessage, answerCallback, request, getToken };
