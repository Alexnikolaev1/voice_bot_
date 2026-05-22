# Бот не отвечает — чеклист

## 1. Webhook на MAX (самая частая причина)

Бот **не узнаёт** про Vercel, пока вы не создадите подписку в MAX.

**URL должен быть:**
`https://ВАШ-ПРОЕКТ.vercel.app/api/webhook`

**Не** `botapi.max.ru` — только **`platform-api.max.ru`**.

PowerShell (подставьте токен и URL):

```powershell
cd "c:\Users\Александр\PycharmProjects\Voicebot"
.\scripts\subscribe-webhook.ps1 `
  -Token "ВАШ_MAX_BOT_TOKEN" `
  -WebhookUrl "https://ВАШ-ПРОЕКТ.vercel.app/api/webhook" `
  -Secret "тот_же_секрет_что_в_Vercel"
```

Если `MAX_WEBHOOK_SECRET` в Vercel **не задан** — параметр `-Secret` не передавайте.

Проверить подписки:

```powershell
Invoke-RestMethod -Uri "https://platform-api.max.ru/subscriptions" -Headers @{ Authorization = "ВАШ_ТОКЕН" }
```

## 2. Переменные в Vercel

Project → **Settings** → **Environment Variables** → **Production**:

| Переменная | Обязательно |
|------------|-------------|
| `MAX_BOT_TOKEN` | да |
| `YANDEX_API_KEY` | для озвучки |
| `YANDEX_FOLDER_ID` | для озвучки |
| `MAX_WEBHOOK_SECRET` | только если задавали `secret` в подписке |

После изменений: **Deployments** → последний деплой → **Redeploy**.

## 3. Быстрая проверка URL

В браузере:

`https://ВАШ-ПРОЕКТ.vercel.app/api/health`

Должно быть `"maxToken": true` и `"yandex": true`.

`https://ВАШ-ПРОЕКТ.vercel.app/api/webhook` (GET)

Должен вернуть JSON с `"ok": true`.

## 4. Логи Vercel

**Deployments** → ваш деплой → **Functions** → `api/webhook` → **Logs**.

При `/start` должно появиться: `[webhook] message_created` или `[webhook] bot_started`.

- **Нет логов** — MAX не шлёт на ваш URL (п. 1).
- **401** — не совпадает `MAX_WEBHOOK_SECRET`.
- **400** — неверный формат тела (напишите в issue).
- **`[max] POST /messages 401`** — неверный `MAX_BOT_TOKEN`.

## 5. /start в MAX

Работают оба сценария:

- событие `bot_started` (первый запуск);
- сообщение `/start` (`message_created`).

Если после п. 1–4 тишина — пришлите скрин логов Vercel за момент отправки `/start`.
