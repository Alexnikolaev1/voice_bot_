const axios = require('axios');
const FormData = require('form-data');
const { request } = require('./client');
const { saveAudio, setLastAudioId } = require('../storage/audioCache');
const { buildDownloadUrl } = require('../utils/url');
const { buildAudioFilename } = require('../utils/filename');
const { callbackBtn, row, inlineKeyboard, linkBtn } = require('./keyboard');

const READY_RETRIES = 4;
const READY_DELAY_MS = 400;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {Buffer} buffer
 * @param {'audio'|'file'} uploadType
 * @param {string} filename
 */
async function uploadMedia(buffer, uploadType, filename = 'voice.mp3') {
  const { url, token: preToken } = await request('POST', '/uploads', {
    params: { type: uploadType },
  });

  const form = new FormData();
  form.append('data', buffer, {
    filename,
    contentType: 'audio/mpeg',
  });

  const uploadRes = await axios.post(url, form, {
    headers: form.getHeaders(),
    timeout: 30000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const token = uploadRes.data?.token || preToken;
  if (!token) throw new Error(`MAX upload (${uploadType}): no token`);
  return token;
}

async function sendWithAttachment(target, attachment, caption = '') {
  const { sendMessage } = require('./client');

  for (let attempt = 0; attempt <= READY_RETRIES; attempt++) {
    try {
      return await sendMessage(target, {
        text: caption,
        attachments: [attachment],
      });
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'attachment.not.ready' && attempt < READY_RETRIES) {
        await sleep(READY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
}

function buildDownloadKeyboard(audioId, downloadUrl) {
  const rows = [];
  if (audioId) {
    rows.push(row(callbackBtn('📥 Файл в чат', `dl:${audioId}`)));
  }
  if (downloadUrl) {
    rows.push(row(linkBtn('🌐 Скачать MP3', downloadUrl)));
  }
  if (rows.length === 0) return null;
  return inlineKeyboard(rows);
}

/**
 * Озвучка: прослушивание + файл для сохранения + ссылка на скачивание.
 * @param {{ chatId: number|null, userId: number|null }} target
 * @param {Buffer} buffer
 * @param {{ text: string, storageKey?: string|null }} meta
 */
async function deliverVoiceResult(target, buffer, meta = {}) {
  const { text = '', storageKey = null } = meta;
  const filename = buildAudioFilename(text);

  const audioId = await saveAudio(buffer, filename);
  if (storageKey && audioId) {
    await setLastAudioId(storageKey, audioId);
  }

  const downloadUrl = buildDownloadUrl(audioId);
  const extraKb = buildDownloadKeyboard(audioId, downloadUrl);
  const extraAttachments = extraKb ? [extraKb] : [];

  const audioToken = await uploadMedia(buffer, 'audio', filename);
  await sendWithAttachment(
    target,
    { type: 'audio', payload: { token: audioToken } },
    '🎧 Слушайте'
  );

  if (extraAttachments.length) {
    const { sendMessage } = require('./client');
    await sendMessage(target, {
      text: downloadUrl
        ? '📥 **Скачать:** кнопки ниже или файл MP3 следующим сообщением.'
        : '📥 Повторно отправить файл — кнопка ниже.',
      format: 'markdown',
      attachments: extraAttachments,
    });
  }

  const fileToken = await uploadMedia(buffer, 'file', filename);
  await sendWithAttachment(
    target,
    { type: 'file', payload: { token: fileToken } },
    `📎 **${filename}** — откройте и сохраните на устройство.`
  );
}

/**
 * Повторная отправка файла из кэша (кнопка «Файл в чат»).
 */
async function resendCachedFile(target, audioId) {
  const { getAudio } = require('../storage/audioCache');
  const entry = await getAudio(audioId);
  if (!entry) {
    const { sendMessage } = require('./client');
    await sendMessage(target, {
      text: '⚠️ Файл устарел (хранится 24 ч). Отправьте текст для новой озвучки.',
    });
    return;
  }

  const fileToken = await uploadMedia(entry.buffer, 'file', entry.filename);
  await sendWithAttachment(
    target,
    { type: 'file', payload: { token: fileToken } },
    `📎 ${entry.filename}`
  );
}

module.exports = {
  uploadMedia,
  deliverVoiceResult,
  resendCachedFile,
};
