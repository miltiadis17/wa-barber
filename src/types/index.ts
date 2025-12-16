export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  created_at: Date;
}

export interface Master {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
}

export interface Booking {
  id: number;
  client_phone: string;
  client_name: string | null;
  service_id: number;
  master_id: number;
  booking_date: string; // YYYY-MM-DD format
  booking_time: string; // HH:MM format
  status: 'confirmed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface BookingWithDetails extends Booking {
  service_name: string;
  master_name: string;
}

export interface DialogState {
  id: number;
  phone: string;
  state: ConversationState;
  data: DialogData;
  created_at: Date;
  updated_at: Date;
}

export type ConversationState =
  | 'idle'
  | 'awaiting_service'
  | 'awaiting_master'
  | 'awaiting_date'
  | 'awaiting_time'
  | 'awaiting_confirmation'
  | 'viewing_bookings'
  | 'admin_viewing';

export interface DialogData {
  service_id?: number;
  master_id?: number;
  booking_date?: string;
  booking_time?: string;
  client_name?: string;
  selected_booking_id?: number;
  admin_view_date?: string;
}

export interface Admin {
  id: number;
  phone: string;
  name: string | null;
  created_at: Date;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'button';
  text?: {
    body: string;
  };
  interactive?: {
    type: string;
    list_reply?: {
      id: string;
      title: string;
    };
    button_reply?: {
      id: string;
      title: string;
    };
  };
}
