# MAX TTS Bot

Голосовой бот для мессенджера **MAX**: любой текст → аудио через **Yandex SpeechKit**.  
Serverless на **Vercel**, настройки пользователя в **Vercel KV**.

## Возможности

- Озвучка текста (до 5000 символов)
- 10 голосов Yandex SpeechKit
- Темп речи: медленный / обычный / быстрый
- Интонация: дружелюбная / нейтральная / экспрессивная
- Inline-меню в MAX (без запоминания команд)
- Защита от дублей webhook, проверка секрета
- Актуальный MAX API (`platform-api.max.ru`)

## Структура

```
api/
  webhook.js          # точка входа webhook
  health.js           # проверка конфигурации
lib/
  config.js           # лимиты и константы
  voices.js           # каталог голосов
  router.js           # маршрутизация update_type
  handlers/           # команды, кнопки, TTS
  max/                # клиент MAX, клавиатуры, загрузка audio
  tts/yandex.js       # SpeechKit
  storage/            # настройки и идемпотентность (KV)
  texts/messages.js   # тексты и клавиатуры
  utils/update.js     # разбор Update
```

## Быстрый деплой

### 1. Токены

**Yandex Cloud:** сервисный аккаунт с `ai.speechkit.tts` → `YANDEX_API_KEY`, `YANDEX_FOLDER_ID`.

**MAX:** [dev.max.ru](https://dev.max.ru) → бот → токен → `MAX_BOT_TOKEN`.

### 2. Vercel

```bash
npm install
npx vercel --prod
```

Переменные в Vercel → Settings → Environment Variables:

| Переменная | Обязательно |
|---|---|
| `YANDEX_API_KEY` | да |
| `YANDEX_FOLDER_ID` | да |
| `MAX_BOT_TOKEN` | да |
| `MAX_WEBHOOK_SECRET` | рекомендуется |

Подключите **Vercel KV** (Storage → KV) и передеплойте.

### 3. Webhook MAX

```bash
curl -X POST "https://platform-api.max.ru/subscriptions" \
  -H "Authorization: YOUR_MAX_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://YOUR_APP.vercel.app/api/webhook",
    "secret": "YOUR_RANDOM_SECRET",
    "update_types": ["message_created", "message_callback", "bot_started"]
  }'
```

`MAX_WEBHOOK_SECRET` в Vercel должен совпадать с `secret` в подписке.

### 4. Проверка

- `GET https://YOUR_APP.vercel.app/api/health`
- В MAX: `/start` → меню с кнопками
- Отправьте текст → получите аудио

## Команды

| Команда | Действие |
|---|---|
| `/start` | приветствие и меню |
| `/voice` | выбор голоса |
| `/settings` | темп, интонация, сводка |
| `/help` | справка |

## Локальная разработка

```bash
cp .env.example .env.local
# заполните переменные
npx vercel dev
```

Для webhook с локалки — ngrok и подписка на ngrok URL.

## Голоса

| Ключ | Имя |
|---|---|
| alena | Алёна |
| jane | Джейн |
| omazh | Омаж |
| maria | Мария |
| lea | Леа |
| filipp | Филипп |
| ermil | Ермил |
| zahar | Захар |
| alexander | Александр |
| kirill | Кирилл |
