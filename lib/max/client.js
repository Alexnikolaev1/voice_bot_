const axios = require('axios');
const { MAX_API_BASE, MAX_REQUEST_TIMEOUT_MS, MAX_REQUEST_RETRIES } = require('../config');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getToken() {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) throw new Error('MAX_BOT_TOKEN is not set');
  return token.trim();
}

function buildAuthHeader(token, useBearer = false) {
  return useBearer ? `Bearer ${token}` : token;
}

function isRetryableError(err) {
  const code = err.code;
  return (
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN'
  );
}

/**
 * @param {string} method
 * @param {string} path
 * @param {object} [options]
 * @param {boolean} [useBearer]
 * @param {number} [attempt]
 */
async function request(method, path, options = {}, useBearer = false, attempt = 0) {
  const { params, data, headers, timeout = MAX_REQUEST_TIMEOUT_MS, responseType } = options;
  const url = `${MAX_API_BASE}${path}`;
  const token = getToken();

  try {
    const res = await axios({
      method,
      url,
      params,
      data,
      headers: {
        Authorization: buildAuthHeader(token, useBearer),
        ...headers,
      },
      timeout,
      responseType,
      validateStatus: () => true,
    });

    if (res.status === 401 && !useBearer) {
      return request(method, path, options, true, attempt);
    }

    if (res.status >= 400) {
      const detail = res.data ?? res.statusText;
      console.error(`[max] ${method} ${path} ${res.status}:`, detail);
      const err = new Error(`MAX API ${res.status}`);
      err.response = res;
      throw err;
    }

    return res.data;
  } catch (err) {
    if (err.response) throw err;

    const retryable = isRetryableError(err);
    if (retryable && attempt < MAX_REQUEST_RETRIES - 1) {
      const delay = 800 * (attempt + 1);
      console.warn(`[max] ${method} ${path} retry ${attempt + 2}/${MAX_REQUEST_RETRIES} after ${err.code}`);
      await sleep(delay);
      return request(method, path, options, useBearer, attempt + 1);
    }

    console.error(`[max] ${method} ${path} failed:`, err.code || err.message);
    throw err;
  }
}

/**
 * @param {{ chatId?: number|null, userId?: number|null }} target
 * @param {object} body
 */
async function sendMessage(target, body) {
  const chatId = typeof target === 'object' ? target.chatId : target;
  const userId = typeof target === 'object' ? target.userId : null;

  const base = {
    notify: body.notify !== false,
    ...body,
  };

  if (userId == null && chatId == null) {
    throw new Error('sendMessage: нет chat_id и user_id');
  }

  const primary =
    userId != null ? { ...base, user_id: userId } : { ...base, chat_id: chatId };

  try {
    return await request('POST', '/messages', { data: primary });
  } catch (err) {
    if (userId != null && chatId != null && err.response?.status === 400) {
      return request('POST', '/messages', { data: { ...base, chat_id: chatId } });
    }
    throw err;
  }
}

async function answerCallback(callbackId, body = {}) {
  return request('POST', '/answers', {
    params: { callback_id: callbackId },
    data: body,
    timeout: 12000,
  });
}

module.exports = { sendMessage, answerCallback, request, getToken, isRetryableError };
