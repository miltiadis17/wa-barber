# 🚀 Quick Start Guide

Get your barbershop booking bot running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `WA_VERIFY_TOKEN` - Create a random string (e.g., "my_verify_token_123")
- `WA_ACCESS_TOKEN` - Get from [Meta for Developers](https://developers.facebook.com/apps)
- `WA_PHONE_NUMBER_ID` - Get from WhatsApp Business API settings

## Step 3: Start Database

```bash
npm run db:up
```

Wait 10 seconds for PostgreSQL to initialize with the schema.

## Step 4: Build & Run

```bash
npm run build
npm start
```

Or for development with hot reload:

```bash
npm run dev
```

## Step 5: Expose Webhook (Development)

```bash
# Install ngrok if you haven't
# brew install ngrok  (macOS)
# Or download from https://ngrok.com

ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

## Step 6: Configure WhatsApp Webhook

1. Go to [Meta for Developers](https://developers.facebook.com/apps)
2. Select your app → WhatsApp → Configuration
3. Set **Callback URL**: `https://your-ngrok-url.ngrok.io/webhook`
4. Set **Verify Token**: Same as `WA_VERIFY_TOKEN` in `.env`
5. Click **Verify and Save**
6. Subscribe to **messages** webhook field

## Step 7: Add Admin (Optional)

```bash
docker exec -it barbershop_db psql -U barbershop -d barbershop

INSERT INTO admins (phone, name) VALUES ('1234567890', 'Admin Name');
\q
```

Replace `1234567890` with your WhatsApp phone number (with country code, no +).

## Step 8: Test

Send any message to your WhatsApp Business number!

## Quick Commands

```bash
# Development
npm run dev              # Start with hot reload

# Database
npm run db:up            # Start PostgreSQL
npm run db:down          # Stop PostgreSQL
npm run db:logs          # View database logs

# Build & Production
npm run build            # Compile TypeScript
npm start                # Run production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Troubleshooting

### Database won't start
```bash
npm run db:down
docker volume rm wa-pingpong_postgres_data
npm run db:up
```

### Port 3000 already in use
Change `PORT=3000` to another port in `.env`

### Webhook verification fails
- Ensure `WA_VERIFY_TOKEN` matches in both `.env` and Meta console
- Check ngrok is running and URL is correct
- Verify your server is accessible via the webhook URL

### Messages not received
- Check webhook is verified in Meta console
- Ensure you subscribed to "messages" field
- Check server logs for errors
- Verify database is running

## What's Next?

- Customize services in `sql/init.sql`
- Adjust business hours in `src/config/index.ts`
- Add more masters to the database
- Deploy to production (Railway, Heroku, VPS, etc.)

---

Need help? Check the full README.md for detailed documentation!
