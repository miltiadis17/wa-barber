# 📁 Project Structure

## Overview

This is a modular TypeScript application for WhatsApp-based barbershop booking.

```
wa-pingpong/
├── src/                    # TypeScript source code
│   ├── app.ts             # Application entry point
│   ├── config/            # Configuration management
│   │   └── index.ts       # Env vars, business hours, cleanup settings
│   ├── database/          # Database layer
│   │   └── pool.ts        # PostgreSQL connection pool
│   ├── models/            # Data models (database access)
│   │   ├── admin.model.ts
│   │   ├── booking.model.ts
│   │   ├── dialog.model.ts
│   │   ├── master.model.ts
│   │   └── service.model.ts
│   ├── routes/            # Express routes
│   │   └── webhook.routes.ts  # GET/POST /webhook endpoints
│   ├── services/          # Business logic services
│   │   ├── admin.service.ts   # Admin features (view bookings)
│   │   ├── booking.service.ts # Main booking flow logic
│   │   ├── cron.service.ts    # Scheduled tasks (cleanup)
│   │   ├── message-handler.service.ts  # Message routing
│   │   ├── mybookings.service.ts       # Client booking management
│   │   └── whatsapp.service.ts         # WhatsApp API integration
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # Interfaces and types
│   └── utils/             # Utility functions
│       ├── date.utils.ts  # Date/time operations
│       └── slots.utils.ts # Time slot generation & availability
├── tests/                 # Unit tests
│   ├── booking-logic.test.ts
│   ├── date-utils.test.ts
│   ├── dialog-state.test.ts
│   └── slots.test.ts
├── sql/                   # Database scripts
│   └── init.sql          # Schema & initial data
├── dist/                  # Compiled JavaScript (generated)
├── docker-compose.yml     # PostgreSQL container setup
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest test configuration
├── nodemon.json          # Nodemon dev configuration
├── package.json          # Dependencies & scripts
├── .env.example          # Environment variables template
├── .env                  # Local environment (git-ignored)
├── .gitignore            # Git ignore rules
├── README.md             # Full documentation
├── QUICKSTART.md         # Quick start guide
└── PROJECT_STRUCTURE.md  # This file
```

## Key Components

### Entry Point
- **src/app.ts**: Initializes Express server, database connection, and cron jobs

### Configuration
- **src/config/index.ts**: Centralized config with validation

### Database Layer
- **src/database/pool.ts**: PostgreSQL connection pool with error handling
- **src/models/**: Data access layer with parameterized queries

### Business Logic
- **src/services/booking.service.ts**: Core booking flow (service → master → date → time → confirm)
- **src/services/mybookings.service.ts**: View/cancel bookings
- **src/services/admin.service.ts**: Admin panel features
- **src/services/message-handler.service.ts**: Routes messages to appropriate service
- **src/services/whatsapp.service.ts**: WhatsApp API wrapper (text, buttons, lists)
- **src/services/cron.service.ts**: Scheduled cleanup job

### Routes
- **src/routes/webhook.routes.ts**:
  - `GET /webhook`: Verification endpoint
  - `POST /webhook`: Receive WhatsApp messages

### Utilities
- **src/utils/date.utils.ts**: Date formatting, timezone handling
- **src/utils/slots.utils.ts**: Time slot generation and availability checking

### Types
- **src/types/index.ts**: TypeScript interfaces for type safety

## Database Schema

### Tables
1. **services** - Available services (Haircut, Beard, Complex)
2. **masters** - Barbers (John, Andrew, Paul)
3. **bookings** - Client appointments
   - UNIQUE constraint: `(master_id, booking_date, booking_time)`
4. **dialog_states** - Conversation state tracking
5. **admins** - Admin whitelist

### Key Features
- Parameterized queries prevent SQL injection
- Indexes on frequently queried columns
- Foreign key constraints for data integrity
- Unique constraint prevents double-booking

## User Flows

### Client Booking Flow
```
User sends message
  ↓
Show main menu (buttons)
  ↓
Select "New Booking"
  ↓
Select service (list message)
  ↓
Select master (list message)
  ↓
Select date (list message)
  ↓
Select time (list message)
  ↓
Confirm booking (reply buttons)
  ↓
Create booking in DB
  ↓
Send confirmation + notify admins
```

### My Bookings Flow
```
User selects "My Bookings"
  ↓
Display upcoming bookings (list message)
  ↓
User selects a booking
  ↓
Show details with cancel option (buttons)
  ↓
User cancels
  ↓
Update booking status in DB
```

### Admin Flow
```
Admin sends message (phone in whitelist)
  ↓
Show admin panel (buttons)
  ↓
Select "View Bookings"
  ↓
Select date (list message)
  ↓
Display all bookings for that date (text)
```

## Interactive Messages Used

### List Message (up to 10 items)
- Service selection
- Master selection
- Date selection
- Time selection
- Booking selection (My Bookings)
- Admin date selection

### Reply Buttons (up to 3 buttons)
- Main menu (New Booking / My Bookings)
- Confirmation (Confirm / Cancel / Back)
- Booking details (Cancel Booking / Back / Main Menu)
- Admin menu (View Bookings / Main Menu)

## State Management

Dialog states stored in PostgreSQL table:
- `idle` - No active flow
- `awaiting_service` - Waiting for service selection
- `awaiting_master` - Waiting for master selection
- `awaiting_date` - Waiting for date selection
- `awaiting_time` - Waiting for time selection
- `awaiting_confirmation` - Waiting for booking confirmation
- `viewing_bookings` - In My Bookings flow
- `admin_viewing` - In admin panel

State data (JSON):
```typescript
{
  service_id?: number,
  master_id?: number,
  booking_date?: string,
  booking_time?: string,
  selected_booking_id?: number,
  admin_view_date?: string
}
```

## Scheduled Tasks

### Daily Cleanup (03:00 Europe/Berlin)
- Deletes bookings older than 3 days
- Runs via node-cron
- Configurable in `src/config/index.ts`

## Testing

### Test Coverage
- **slots.test.ts**: Time slot generation logic
- **date-utils.test.ts**: Date/time utilities
- **dialog-state.test.ts**: State transition validation
- **booking-logic.test.ts**: Booking constraints and validation

### Run Tests
```bash
npm test                # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## Development Workflow

1. **Make changes** in `src/`
2. **Run dev server**: `npm run dev` (auto-reloads on changes)
3. **Run tests**: `npm test`
4. **Build**: `npm run build`
5. **Deploy**: `npm start` (runs compiled JS from `dist/`)

## Configuration Points

### Business Hours
Edit `src/config/index.ts`:
```typescript
businessHours: {
  startHour: 12,
  endHour: 20,
  slotDuration: 30,
  workDays: [1,2,3,4,5,6], // Mon-Sat
  daysInAdvance: 14
}
```

### Services & Masters
Edit `sql/init.sql` or insert via database:
```sql
INSERT INTO services (name, duration_minutes) VALUES ('New Service', 30);
INSERT INTO masters (name, is_active) VALUES ('New Master', TRUE);
```

### Cleanup Schedule
Edit `src/config/index.ts`:
```typescript
cleanup: {
  cronSchedule: '0 3 * * *',  // Cron expression
  daysToKeep: 3                // Days to keep in past
}
```

## Security Features

- ✅ Webhook verification with verify token
- ✅ Parameterized SQL queries (no SQL injection)
- ✅ Admin whitelist (phone-based)
- ✅ Input validation for dates/times
- ✅ Unique constraints prevent race conditions
- ⚠️ Add rate limiting for production

## Performance Optimizations

- Database connection pooling
- Indexed columns for fast queries
- Async/await for non-blocking operations
- Efficient state management in database

## Production Deployment

### Checklist
- [ ] Set strong DB credentials
- [ ] Use HTTPS for webhook
- [ ] Enable database backups
- [ ] Set up monitoring/logging
- [ ] Add rate limiting
- [ ] Use process manager (PM2)
- [ ] Configure error tracking

### Environment Variables (Production)
```env
PORT=3000
WA_VERIFY_TOKEN=strong_random_token
WA_ACCESS_TOKEN=production_token_from_meta
WA_PHONE_NUMBER_ID=your_phone_id
DB_HOST=production_db_host
DB_PORT=5432
DB_USER=secure_user
DB_PASSWORD=strong_password
DB_NAME=barbershop
```

---

For more details, see README.md
