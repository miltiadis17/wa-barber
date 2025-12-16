# 💈 WhatsApp Barbershop Booking Bot

A full-featured barbershop booking service built with WhatsApp Business Cloud API. Allows clients to book appointments through an interactive WhatsApp conversation flow with service selection, master selection, date/time picking, and booking management.

## ✨ Features

### Client Features
- **Interactive Booking Flow**: Service → Master → Date → Time → Confirmation
- **Service Selection**: Choose from Haircut, Beard, or Complex services
- **Master Selection**: Pick your preferred barber (John, Andrew, or Paul)
- **Date Selection**: Book up to 14 days in advance (Mon-Sat)
- **Time Slots**: 30-minute slots from 12:00 to 20:00
- **My Bookings**: View and cancel upcoming appointments
- **Automatic Notifications**: Receive booking confirmations

### Admin Features
- **Whitelist System**: Phone number-based admin access
- **View Bookings**: Check appointments by date
- **Real-time Notifications**: Get notified of new bookings

### System Features
- **PostgreSQL Database**: Reliable data storage with proper constraints
- **Dialog State Management**: Track conversation flow in database
- **Automatic Cleanup**: Daily cron job removes bookings older than 3 days
- **Timezone Support**: Europe/Berlin timezone for all operations
- **Interactive Messages**: List Messages and Reply Buttons for better UX
- **Slot Availability**: Real-time checking with unique constraints

## 🏗️ Architecture

```
src/
├── config/          # Configuration and environment variables
├── database/        # Database connection pool
├── models/          # Data models (Service, Master, Booking, Dialog, Admin)
├── services/        # Business logic
│   ├── whatsapp.service.ts      # WhatsApp API integration
│   ├── booking.service.ts       # Booking flow management
│   ├── mybookings.service.ts    # Client booking management
│   ├── admin.service.ts         # Admin features
│   ├── message-handler.service.ts # Message routing
│   └── cron.service.ts          # Scheduled tasks
├── routes/          # Express routes (webhook)
├── utils/           # Utility functions (date, slots)
├── types/           # TypeScript type definitions
└── app.ts           # Application entry point

sql/
└── init.sql         # Database schema initialization

docker-compose.yml   # PostgreSQL container setup
```

## 📋 Database Schema

### Tables
- **services**: Available services (Haircut, Beard, Complex)
- **masters**: Barbers (John, Andrew, Paul)
- **bookings**: Client appointments with `UNIQUE(master_id, booking_date, booking_time)` constraint
- **dialog_states**: Conversation state tracking (replaces Redis)
- **admins**: Whitelist for admin access

### Key Constraints
- Unique time slots per master to prevent double-booking
- Indexes on frequently queried columns for performance
- Cascade relationships for data integrity

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for PostgreSQL)
- WhatsApp Business Cloud API account ([Get started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started))

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in:
   - `WA_VERIFY_TOKEN`: Your webhook verification token (create any random string)
   - `WA_ACCESS_TOKEN`: WhatsApp Cloud API access token from Meta
   - `WA_PHONE_NUMBER_ID`: Your WhatsApp Business phone number ID
   - Database credentials (or use defaults for local development)

3. **Start PostgreSQL database**
   ```bash
   npm run db:up
   ```

   This starts PostgreSQL in Docker and automatically creates tables with initial data.

4. **Add admin phone numbers** (optional)

   Connect to database and add admin numbers:
   ```bash
   docker exec -it barbershop_db psql -U barbershop -d barbershop
   ```
   ```sql
   INSERT INTO admins (phone, name) VALUES ('1234567890', 'Admin Name');
   ```

5. **Build TypeScript**
   ```bash
   npm run build
   ```

6. **Start the application**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## 🌐 Webhook Setup

1. **Expose your local server** (for development)
   ```bash
   # Using ngrok
   ngrok http 3000
   ```

2. **Configure webhook in Meta Developer Console**
   - Go to your WhatsApp App in [Meta for Developers](https://developers.facebook.com/apps)
   - Navigate to WhatsApp > Configuration
   - Set Callback URL: `https://your-domain.com/webhook`
   - Set Verify Token: Same as `WA_VERIFY_TOKEN` in your `.env`
   - Subscribe to webhook fields: `messages`

3. **Test webhook**
   ```bash
   curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=YOUR_TOKEN"
   ```

## 📱 Usage

### For Clients

1. **Start conversation**: Send any message to your WhatsApp Business number
2. **Book appointment**: Click "Book Now" button
3. **Follow the flow**:
   - Select service (List Message)
   - Select master (List Message)
   - Select date (List Message)
   - Select time (List Message)
   - Confirm booking (Reply Buttons)
4. **Manage bookings**: Click "My Bookings" to view or cancel

### For Admins

1. **Access admin panel**: Send "admin" or click the Admin button
2. **View bookings**: Select a date to see all appointments
3. **Notifications**: Receive automatic alerts for new bookings

## ⚙️ Configuration

Edit `src/config/index.ts` to customize:

```typescript
businessHours: {
  timezone: 'Europe/Berlin',
  startHour: 12,        // 12:00
  endHour: 20,          // 20:00
  slotDuration: 30,     // minutes
  workDays: [1,2,3,4,5,6], // Mon-Sat
  daysInAdvance: 14,    // Booking window
}

cleanup: {
  cronSchedule: '0 3 * * *',  // 03:00 daily
  daysToKeep: 3,              // Keep bookings 3 days in past
}
```

## 🧹 Automatic Cleanup

A cron job runs daily at 03:00 (Europe/Berlin) to delete bookings older than 3 days:

```typescript
// Manually trigger cleanup (for testing)
import { CronService } from './services/cron.service';
await CronService.runCleanupNow();
```

## 🗄️ Database Commands

```bash
# Start database
npm run db:up

# Stop database
npm run db:down

# View logs
npm run db:logs

# Connect to database
docker exec -it barbershop_db psql -U barbershop -d barbershop

# Backup database
docker exec barbershop_db pg_dump -U barbershop barbershop > backup.sql

# Restore database
docker exec -i barbershop_db psql -U barbershop barbershop < backup.sql
```

## 🧪 Testing

### Manual Testing Checklist

**Booking Flow:**
- [ ] Service selection displays all services
- [ ] Master selection displays all masters
- [ ] Date selection shows next 14 working days (Mon-Sat only)
- [ ] Time slots show only available times (12:00-19:30)
- [ ] Confirmation creates booking in database
- [ ] Duplicate slot booking is prevented (unique constraint)

**My Bookings:**
- [ ] Displays only future bookings
- [ ] Cancel booking works correctly
- [ ] Shows booking details properly

**Admin Features:**
- [ ] Non-admin users cannot access admin panel
- [ ] Admin can view bookings by date
- [ ] Admin receives notifications for new bookings

**Edge Cases:**
- [ ] Past time slots are filtered out for today
- [ ] Fully booked dates show "no available slots"
- [ ] Dialog state persists across messages
- [ ] Concurrent bookings handle race conditions

### Test Database Queries

```sql
-- Check available slots for a master on a date
SELECT booking_time FROM bookings
WHERE master_id = 1 AND booking_date = '2024-12-20'
AND status = 'confirmed';

-- View all upcoming bookings
SELECT b.*, s.name as service, m.name as master
FROM bookings b
JOIN services s ON b.service_id = s.id
JOIN masters m ON b.master_id = m.id
WHERE booking_date >= CURRENT_DATE
ORDER BY booking_date, booking_time;

-- Check dialog states
SELECT * FROM dialog_states;

-- Test cleanup query (don't run in production!)
SELECT * FROM bookings
WHERE booking_date < CURRENT_DATE - INTERVAL '3 days';
```

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# Check logs
npm run db:logs

# Restart database
npm run db:down && npm run db:up
```

### Webhook Not Receiving Messages
- Verify webhook URL is publicly accessible
- Check verify token matches in both .env and Meta console
- Ensure you're subscribed to "messages" webhook field
- Check webhook logs in Meta Developer Console

### TypeScript Compilation Errors
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

## 📚 API Reference

### WhatsApp Interactive Messages

**List Message** (up to 10 items):
```typescript
WhatsAppService.sendList(phone, bodyText, buttonText, sections);
```

**Reply Buttons** (up to 3 buttons):
```typescript
WhatsAppService.sendButtons(phone, bodyText, buttons);
```

**Text Message**:
```typescript
WhatsAppService.sendText(phone, text);
```

## 🛡️ Security Considerations

- Webhook verification using verify token
- SQL injection prevention via parameterized queries
- Input validation for dates and times
- Admin whitelist for privileged operations
- Rate limiting (recommended for production)

## 🚢 Deployment

### Production Checklist
- [ ] Set strong database credentials
- [ ] Use environment variables for all secrets
- [ ] Enable SSL/HTTPS for webhook endpoint
- [ ] Set up proper logging (e.g., Winston, Pino)
- [ ] Configure process manager (PM2, systemd)
- [ ] Set up database backups
- [ ] Monitor cron job execution
- [ ] Add rate limiting middleware
- [ ] Set up error tracking (Sentry, etc.)

### Example PM2 Setup
```bash
npm install -g pm2
pm2 start dist/app.js --name barbershop-bot
pm2 save
pm2 startup
```

## 📝 License

ISC

## 🤝 Contributing

This is a pet project, but feel free to fork and customize for your own needs!

## 📞 Support

For WhatsApp Cloud API issues, refer to the [official documentation](https://developers.facebook.com/docs/whatsapp/cloud-api).

---

Built with ❤️ using WhatsApp Business Cloud API
