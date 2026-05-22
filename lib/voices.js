const VOICES = {
  alena: { name: 'Алёна', gender: 'female' },
  jane: { name: 'Джейн', gender: 'female' },
  omazh: { name: 'Омаж', gender: 'female' },
  maria: { name: 'Мария', gender: 'female' },
  lea: { name: 'Леа', gender: 'female' },
  filipp: { name: 'Филипп', gender: 'male' },
  ermil: { name: 'Ермил', gender: 'male' },
  zahar: { name: 'Захар', gender: 'male' },
  alexander: { name: 'Александр', gender: 'male' },
  kirill: { name: 'Кирилл', gender: 'male' },
};

const VOICE_IDS = Object.keys(VOICES);

function isValidVoice(id) {
  return Boolean(VOICES[id]);
}

function voiceIcon(gender) {
  return gender === 'female' ? '🔸' : '🔹';
}

function formatVoiceLabel(id) {
  const v = VOICES[id];
  if (!v) return id;
  return `${voiceIcon(v.gender)} ${v.name}`;
}

module.exports = { VOICES, VOICE_IDS, isValidVoice, voiceIcon, formatVoiceLabel };
