module.exports = function handler(_req, res) {
  res.status(200).json({
    ok: true,
    service: 'max-tts-bot',
    version: '2.0.0',
    checks: {
      maxToken: Boolean(process.env.MAX_BOT_TOKEN),
      yandex: Boolean(process.env.YANDEX_API_KEY && process.env.YANDEX_FOLDER_ID),
    },
  });
};
