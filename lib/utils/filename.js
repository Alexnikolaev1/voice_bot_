/**
 * Безопасное имя файла из текста озвучки.
 * @param {string} text
 */
function buildAudioFilename(text) {
  const base =
    text
      .slice(0, 40)
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'ozvuchka';

  const date = new Date().toISOString().slice(0, 10);
  return `${base}-${date}.mp3`;
}

/**
 * @param {string} name
 */
function safeContentDispositionFilename(name) {
  const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return ascii || 'ozvuchka.mp3';
}

module.exports = { buildAudioFilename, safeContentDispositionFilename };
