const { VOICES, VOICE_IDS, formatVoiceLabel } = require('../voices');
const { EMOTIONS, SPEEDS, LIMITS } = require('../config');
const { callbackBtn, row, inlineKeyboard } = require('../max/keyboard');

const WELCOME = `**Голосовой бот** 🎧

Отправь любой текст — озвучу голосом Yandex SpeechKit.

Настрой голос, темп и интонацию в меню ниже.`;

const HELP = `**Как пользоваться**

• Напиши текст — получишь озвучку
• **Слушать** — голосовое сообщение в чате
• **Скачать** — файл MP3 в чате или кнопка «Скачать MP3» (ссылка 24 ч)
• Лимит: **${LIMITS.ttsChars}** символов за раз
• Команды: /start · /settings · /voice · /help

**Голоса:** ${VOICE_IDS.length} (мужские и женские)
**Темп:** медленный · обычный · быстрый
**Интонация:** дружелюбная · нейтральная · экспрессивная`;

function mainMenuKeyboard() {
  return inlineKeyboard([
    row(callbackBtn('🎤 Голос', 'menu:voices'), callbackBtn('⚙️ Настройки', 'menu:settings')),
    row(callbackBtn('ℹ️ Помощь', 'menu:help')),
  ]);
}

function voiceMenuKeyboard() {
  const buttons = VOICE_IDS.map((id) => callbackBtn(formatVoiceLabel(id), `voice:${id}`));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  rows.push([callbackBtn('← Назад', 'menu:main')]);
  return inlineKeyboard(rows);
}

function settingsMenuKeyboard() {
  return inlineKeyboard([
    row(
      callbackBtn('🐢 Медленно', 'speed:slow'),
      callbackBtn('⚡ Обычно', 'speed:normal'),
      callbackBtn('🚀 Быстро', 'speed:fast')
    ),
    row(
      callbackBtn('😊 Дружелюбно', 'emotion:good'),
      callbackBtn('😐 Нейтрально', 'emotion:neutral'),
      callbackBtn('🔥 Экспрессивно', 'emotion:evil')
    ),
    row(callbackBtn('🎤 Сменить голос', 'menu:voices')),
    row(callbackBtn('← Главное меню', 'menu:main')),
  ]);
}

function formatSettings(settings) {
  const voiceName = VOICES[settings.voice]?.name || settings.voice;
  const speedLabel = { slow: 'медленный', normal: 'обычный', fast: 'быстрый' }[settings.speedKey];
  const emotionLabel = EMOTIONS[settings.emotion]?.label || settings.emotion;

  return (
    `**Твои настройки**\n\n` +
    `🎤 Голос: **${voiceName}**\n` +
    `⏱ Темп: **${speedLabel}**\n` +
    `🎭 Интонация: **${emotionLabel}**`
  );
}

function voiceChanged(name) {
  return `✅ Голос: **${name}**\n\nОтправь текст — озвучу.`;
}

function speedChanged(label) {
  return `✅ Темп: **${label}**`;
}

function emotionChanged(label) {
  return `✅ Интонация: **${label}**`;
}

module.exports = {
  WELCOME,
  HELP,
  mainMenuKeyboard,
  voiceMenuKeyboard,
  settingsMenuKeyboard,
  formatSettings,
  voiceChanged,
  speedChanged,
  emotionChanged,
};
