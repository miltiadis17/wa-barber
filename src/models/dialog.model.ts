import { pool } from '../database/pool';
import { DialogState, ConversationState, DialogData } from '../types';

export class DialogModel {
  static async getState(phone: string): Promise<DialogState | null> {
    const result = await pool.query<DialogState>(
      'SELECT * FROM dialog_states WHERE phone = $1',
      [phone]
    );
    return result.rows[0] || null;
  }

  static async setState(
    phone: string,
    state: ConversationState,
    data: DialogData = {}
  ): Promise<DialogState> {
    const result = await pool.query<DialogState>(
      `INSERT INTO dialog_states (phone, state, data, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (phone)
       DO UPDATE SET
         state = EXCLUDED.state,
         data = EXCLUDED.data,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [phone, state, JSON.stringify(data)]
    );
    return result.rows[0];
  }

  static async updateData(phone: string, data: Partial<DialogData>): Promise<void> {
    const currentState = await this.getState(phone);
    if (!currentState) return;

    const mergedData = { ...currentState.data, ...data };
    await pool.query(
      `UPDATE dialog_states
       SET data = $1, updated_at = CURRENT_TIMESTAMP
       WHERE phone = $2`,
      [JSON.stringify(mergedData), phone]
    );
  }

  static async resetState(phone: string): Promise<void> {
    await this.setState(phone, 'idle', {});
  }

  static async deleteState(phone: string): Promise<void> {
    await pool.query('DELETE FROM dialog_states WHERE phone = $1', [phone]);
  }
}
