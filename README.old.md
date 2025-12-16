# WhatsApp Barber Booking Bot

Простейший тестовый бот для [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api), который помогает записаться в барбершоп:
- показывает кнопку «Записаться на стрижку»;
- принимает имя и удобное время в свободном текстовом сообщении;
- отправляет подтверждение, что запрос получен.

## Настройка

1. Скопируйте пример переменных окружения:
   ```bash
   cp .env.example .env
   ```
2. В `.env` пропишите значения:
   - `WA_VERIFY_TOKEN` — придуманный вами токен проверки вебхука (нужно будет указать тот же в Meta).
   - `WA_ACCESS_TOKEN` — access token от Cloud API (можно взять в Sandbox/temporary access token).
   - `WA_PHONE_NUMBER_ID` — ID подключённого WhatsApp номера.
   - `PORT` (опционально) — порт для локального сервера (по умолчанию 3000).

Убедитесь, что Node.js 18+ установлен у вас локально.

## Запуск

```bash
npm install
npm start
```

## Подключение вебхука

1. Пробросьте публичный URL (например, `ngrok http 3000`) до локального сервера.
2. В Meta Developer Console задайте endpoint `https://<ваш-домен>/webhook` и тот же `WA_VERIFY_TOKEN`.
3. Подпишитесь минимум на `messages`.
4. Напишите что-нибудь на номер WhatsApp — бот пришлёт кнопку «Записаться на стрижку» и попросит указать имя и время.

## Пример ручной отправки сообщения

Можно проверить подключение напрямую через `curl`, подставив свой `WA_PHONE_NUMBER_ID`, `to`, токен и шаблон:

```bash
curl -i -X POST \
  https://graph.facebook.com/v22.0/933129683212031/messages \
  -H 'Authorization: Bearer EAAQQFMRquakBQBMKcZAoEIN4J4ybDnrEym9BXKZAssKlcnx2oeydcOaUalRfFIfWLZBikv2qfYrgdJ01MmysANpzeqRGZBVBOVopRkXX6rgwHOD0rkBU7Iohn8QYievJF9bBjDtyY5v0IVZB4qspsReO3DrD54jBMF56LwDU8zYCVIej6eGBBPmCkZAGkIhxL9Tfm5YWBRTBlPRhkOBMvNlZCZBqD0UXP8nX0QVhWRN6ktb2F3EIdqhPJvxlhGwTScHvBZBVnqxOZC9222Kx4CeaIZBZBXyUd6nHxz5WbeRfVwZDZD' \
  -H 'Content-Type: application/json' \
  -d '{ "messaging_product": "whatsapp", "to": "491783177442", "type": "template", "template": { "name": "jaspers_market_image_cta_v1", "language": { "code": "en_US" }, "components": [{ "type": "header", "parameters": [{ "type": "image", "image": { "link": "https://scontent.xx.fbcdn.net/mci_ab/uap/asset_manager/id/?ab_b=e&ab_page=AssetManagerID&ab_entry=1530053877871776" } }] }] } }'
```

Замените значения на свои реальные токены и шаблоны из Meta.
