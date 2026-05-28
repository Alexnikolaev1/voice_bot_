/**
 * Публичный URL приложения (для ссылок на скачивание).
 */
function getPublicBaseUrl() {
  const explicit = process.env.PUBLIC_BASE_URL?.trim().replace(/\/$/, '');
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`;

  return '';
}

function buildDownloadUrl(audioId) {
  const base = getPublicBaseUrl();
  if (!base || !audioId) return null;
  return `${base}/api/audio?id=${audioId}`;
}

module.exports = { getPublicBaseUrl, buildDownloadUrl };
