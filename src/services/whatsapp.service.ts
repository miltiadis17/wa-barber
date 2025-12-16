import axios from 'axios';
import { config } from '../config';

const { accessToken, phoneNumberId, apiVersion } = config.whatsapp;
const GRAPH_URL = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

interface TextMessage {
  type: 'text';
  text: { body: string };
}

interface ButtonMessage {
  type: 'interactive';
  interactive: {
    type: 'button';
    body: { text: string };
    action: {
      buttons: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
    };
  };
}

interface ListMessage {
  type: 'interactive';
  interactive: {
    type: 'list';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: {
      button: string;
      sections: Array<{
        title?: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

type MessagePayload = TextMessage | ButtonMessage | ListMessage;

export class WhatsAppService {
  private static async sendMessage(
    to: string,
    payload: MessagePayload
  ): Promise<void> {
    if (!accessToken || !phoneNumberId) {
      console.error('❌ Missing WhatsApp credentials');
      return;
    }

    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      ...payload,
    };

    try {
      await axios({
        method: 'POST',
        url: GRAPH_URL,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        data,
      });
    } catch (error: any) {
      console.error(
        '❌ WhatsApp API error:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  static async sendText(to: string, text: string): Promise<void> {
    await this.sendMessage(to, {
      type: 'text',
      text: { body: text },
    });
  }

  static async sendButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<void> {
    // WhatsApp allows max 3 buttons
    const limitedButtons = buttons.slice(0, 3);

    await this.sendMessage(to, {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: limitedButtons.map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title,
            },
          })),
        },
      },
    });
  }

  static async sendList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title?: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>,
    headerText?: string,
    footerText?: string
  ): Promise<void> {
    const message: ListMessage = {
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonText,
          sections,
        },
      },
    };

    if (headerText) {
      message.interactive.header = { type: 'text', text: headerText };
    }

    if (footerText) {
      message.interactive.footer = { text: footerText };
    }

    await this.sendMessage(to, message);
  }
}
