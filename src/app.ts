import express from 'express';
import { config } from './config';
import { testConnection } from './database/pool';
import { CronService } from './services/cron.service';
import webhookRoutes from './routes/webhook.routes';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/', webhookRoutes);

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
      console.log(`\n💡 Webhook URL: http://localhost:${config.port}/webhook\n`);
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
