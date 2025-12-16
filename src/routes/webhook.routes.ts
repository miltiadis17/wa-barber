import { Router, Request, Response } from 'express';
import { config } from '../config';
import { MessageHandlerService } from '../services/message-handler.service';
import { WhatsAppMessage } from '../types';

const router = Router();

/**
 * GET /webhook - Webhook verification
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];

  console.log('📨 Webhook verification request');

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

/**
 * POST /webhook - Receive messages
 */
router.post('/webhook', async (req: Request, res: Response) => {
  console.log('📨 Webhook POST request received');

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      console.log('⚠️  No messages in webhook payload');
      return res.sendStatus(200);
    }

    const message = messages[0] as WhatsAppMessage;

    console.log(`📱 Message from ${message.from}:`, {
      type: message.type,
      text: message.text?.body,
      interactive: message.interactive,
    });

    // Process message asynchronously
    MessageHandlerService.handleMessage(message).catch((error) => {
      console.error('Error processing message:', error);
    });

    // Respond immediately to WhatsApp
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.sendStatus(200); // Always return 200 to WhatsApp
  }
});

export default router;
