import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { testConnection } from './database/pool';
import { CronService } from './services/cron.service';
import webhookRoutes from './routes/webhook.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration for admin panel
app.use(
  session({
    secret: config.admin.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Serve static files for admin panel
app.use('/admin', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', webhookRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start cron jobs
    CronService.start();

    // Start Express server
    app.listen(config.port, () => {
      console.log(`\n🚀 Barbershop Booking Bot is running!`);
      console.log(`📡 Port: ${config.port}`);
      console.log(`🌍 Timezone: ${config.businessHours.timezone}`);
      console.log(`⏰ Business hours: ${config.businessHours.startHour}:00 - ${config.businessHours.endHour}:00`);
      console.log(`📅 Booking days in advance: ${config.businessHours.daysInAdvance}`);
      console.log(`\n💡 Webhook URL: http://localhost:${config.port}/webhook`);
      console.log(`🔧 Admin Panel: http://localhost:${config.port}/admin`);
      console.log(`   Username: ${config.admin.username}`);
      console.log(`   Password: admin123 (change in production!)\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
