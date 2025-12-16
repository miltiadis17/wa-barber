
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const GRAPH_URL = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;
const BOOK_BUTTON_ID = 'BOOK_HAIRCUT';

app.use(express.json());

if (!VERIFY_TOKEN || !ACCESS_TOKEN || !PHONE_NUMBER_ID) {
  console.warn(
    'Missing one of WA_VERIFY_TOKEN, WA_ACCESS_TOKEN or WA_PHONE_NUMBER_ID. ' +
      'Webhook will not work until all env vars are set.'
  );
}

const sendWhatsAppMessage = async (to, payload) => {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error('❌ Missing WA_ACCESS_TOKEN or WA_PHONE_NUMBER_ID; cannot send reply.');
    return;
  }

  const data = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    ...payload,
  };

  await axios({
    method: 'POST',
    url: GRAPH_URL,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    data,
  });
};

const sendText = (to, body) =>
  sendWhatsAppMessage(to, {
    type: 'text',
    text: { body },
  });

const sendBookingMenu = (to) =>
  sendWhatsAppMessage(to, {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: 'Барбершоп FreshCut. Записать вас на стрижку?',
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: BOOK_BUTTON_ID,
              title: 'Записаться',
            },
          },
        ],
      },
    },
  });

const sendBookingAcknowledgement = (to, details) =>
  sendText(
    to,
    `Принял запрос: "${details}". Администратор подтвердит запись и уточнит детали. Если нужно поправить время — просто напишите.`
  );

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  console.log('📨 Received webhook POST request');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (!message) {
    console.log('⚠️ No message found in webhook payload');
    return res.sendStatus(200);
  }

  const from = message.from;
  const incomingText = message.text?.body?.trim() || '';
  const lowerText = incomingText.toLowerCase();
  const buttonId = message.interactive?.button_reply?.id;

  console.log(`✅ Message from ${from}: "${incomingText}"`);

  try {
    if (buttonId === BOOK_BUTTON_ID) {
      await sendText(
        from,
        'Отлично! Напишите имя и желаемый день/время. Мы подтвердим запись в ответ.'
      );
      await sendText(from, 'Пример: Иван, завтра 18:30, классическая стрижка');
      return res.sendStatus(200);
    }

    const looksLikeBookingDetails =
      /\d{1,2}[:.]\d{2}/.test(lowerText) ||
      /\b(завтра|сегодня|понед|вторн|сред|четв|пятн|субб|воскр)\b/.test(lowerText);

    if (lowerText.includes('стриж') || lowerText.includes('запис')) {
      await sendText(
        from,
        'Супер! Напишите имя и удобное время, чтобы я забронировал слот.'
      );
      await sendBookingMenu(from);
      return res.sendStatus(200);
    }

    if (looksLikeBookingDetails && incomingText.length >= 4) {
      await sendBookingAcknowledgement(from, incomingText);
      await sendBookingMenu(from);
      return res.sendStatus(200);
    }

    await sendText(
      from,
      'Привет! Я бот барбершопа FreshCut. Помогу записаться на стрижку.'
    );
    await sendBookingMenu(from);
    console.log('✅ Booking menu sent successfully');
  } catch (error) {
    console.error('❌ Failed to send message to WhatsApp API:', error.response?.data || error.message);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`WhatsApp barber booking bot listening on port ${PORT}`);
});
