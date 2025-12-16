import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),

  // WhatsApp API
  whatsapp: {
    verifyToken: process.env.WA_VERIFY_TOKEN || '',
    accessToken: process.env.WA_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WA_PHONE_NUMBER_ID || '',
    apiVersion: process.env.WA_API_VERSION || 'v17.0',
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'barbershop',
    password: process.env.DB_PASSWORD || 'barbershop_pass',
    database: process.env.DB_NAME || 'barbershop',
  },

  // Business hours (Europe/Berlin timezone)
  businessHours: {
    timezone: 'Europe/Berlin',
    startHour: 12, // 12:00
    endHour: 20,   // 20:00
    slotDuration: 30, // minutes
    workDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday (0 = Sunday)
    daysInAdvance: 14, // Allow booking up to 14 days in advance
  },

  // Cleanup settings
  cleanup: {
    cronSchedule: '0 3 * * *', // Every day at 03:00
    daysToKeep: 3, // Keep bookings for 3 days in the past
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'WA_VERIFY_TOKEN',
  'WA_ACCESS_TOKEN',
  'WA_PHONE_NUMBER_ID',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.warn(
    `⚠️  Warning: Missing environment variables: ${missingEnvVars.join(', ')}`
  );
  console.warn('The application may not work correctly without these variables.');
}
