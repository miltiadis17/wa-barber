# 🔧 Admin Panel Documentation

## Overview

The admin panel is a web-based interface for managing the barbershop booking system. It provides full CRUD operations for bookings, masters, and services, along with analytics and statistics.

## Features

### 📊 Dashboard
- Overview statistics (total bookings, today's bookings, upcoming bookings)
- Bookings by service breakdown
- Bookings by master breakdown
- Busiest hours analysis

### 📅 Bookings Management
- View all bookings with filters:
  - Filter by date
  - Filter by master
  - Filter by client phone
  - Filter by status (confirmed/cancelled)
- Edit bookings:
  - Change service
  - Change master
  - Change date/time
  - Update status
- Cancel bookings

### 👨‍🦱 Masters Management
- View all masters
- Add new masters
- Edit master details:
  - Name
  - Active/inactive status
- Delete/deactivate masters
  - If master has bookings, they will be deactivated instead of deleted

### ✂️ Services Management
- View all services
- Add new services
- Edit service details:
  - Name
  - Duration (in minutes)
- Delete services
  - Cannot delete services with existing bookings

## Access

### URL
```
http://localhost:3000/admin
```

### Default Credentials
```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change these credentials in production!

## Authentication

The admin panel uses session-based authentication with:
- Username/password login
- Bcrypt password hashing
- 24-hour session expiry
- HTTP-only cookies

### Changing Admin Password

1. Generate a new password hash:
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your_new_password', 10));"
```

2. Update `.env`:
```env
ADMIN_USERNAME=your_username
ADMIN_PASSWORD_HASH=generated_hash_here
```

3. Restart the application

## API Endpoints

All API endpoints are prefixed with `/api/admin`

### Authentication
- `POST /api/admin/auth/login` - Login
- `POST /api/admin/auth/logout` - Logout
- `GET /api/admin/auth/check` - Check authentication status

### Statistics
- `GET /api/admin/stats` - Get dashboard statistics

### Bookings
- `GET /api/admin/bookings` - Get all bookings (with optional filters)
- `GET /api/admin/bookings/:id` - Get booking by ID
- `PUT /api/admin/bookings/:id` - Update booking
- `DELETE /api/admin/bookings/:id` - Cancel booking

Query parameters for GET /bookings:
- `date` - Filter by date (YYYY-MM-DD)
- `master_id` - Filter by master ID
- `client_phone` - Search by client phone
- `status` - Filter by status (confirmed/cancelled)

### Masters
- `GET /api/admin/masters` - Get all masters
- `GET /api/admin/masters/:id` - Get master by ID
- `POST /api/admin/masters` - Create new master
- `PUT /api/admin/masters/:id` - Update master
- `DELETE /api/admin/masters/:id` - Delete/deactivate master

### Services
- `GET /api/admin/services` - Get all services
- `GET /api/admin/services/:id` - Get service by ID
- `POST /api/admin/services` - Create new service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service

## UI Components

### Pages
1. **Login Page** (`/admin/index.html`)
   - Username/password form
   - Session management

2. **Dashboard** (`/admin/dashboard.html`)
   - Statistics cards
   - Analytics tables

3. **Bookings** (`/admin/bookings.html`)
   - Bookings table with filters
   - Edit modal
   - Cancel functionality

4. **Masters** (`/admin/masters.html`)
   - Masters table
   - Add/Edit modal
   - Delete/deactivate functionality

5. **Services** (`/admin/services.html`)
   - Services table
   - Add/Edit modal
   - Delete functionality

### Navigation
Sidebar navigation allows quick access to all sections:
- Dashboard
- Bookings
- Masters
- Services
- Logout button

## Technical Details

### Frontend Stack
- **Pure HTML/CSS/JavaScript** (no frameworks)
- **Responsive Design** (works on desktop and mobile)
- **Modern UI** with clean, professional styling
- **Modal Dialogs** for forms
- **Client-side Validation**

### Backend Stack
- **Express.js** for routing
- **Express-session** for authentication
- **Bcrypt** for password hashing
- **PostgreSQL** for data storage

### Security Features
- ✅ Password hashing with bcrypt
- ✅ Session-based authentication
- ✅ HTTP-only cookies
- ✅ CSRF protection (session-based)
- ✅ Parameterized SQL queries
- ⚠️ Add HTTPS in production
- ⚠️ Add rate limiting in production

## Development

### Running in Development
```bash
npm run dev
```

The admin panel will be available at:
```
http://localhost:3000/admin
```

### Building for Production
```bash
npm run build
npm start
```

## Customization

### Changing Colors
Edit `/public/css/style.css` and modify the CSS variables:
```css
:root {
    --primary-color: #2563eb;
    --danger-color: #dc2626;
    --success-color: #16a34a;
    /* ... */
}
```

### Adding New Features
1. Create controller in `src/controllers/`
2. Add routes in `src/routes/admin.routes.ts`
3. Create frontend page in `public/`
4. Add navigation link in sidebar

## Troubleshooting

### Cannot Login
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` in `.env`
- Ensure password hash is generated correctly
- Check browser console for errors
- Verify session middleware is working

### Session Expires Too Quickly
Modify session configuration in `src/app.ts`:
```typescript
cookie: {
    maxAge: 48 * 60 * 60 * 1000, // 48 hours instead of 24
}
```

### Admin Panel Not Loading
- Ensure `public/` directory exists with all files
- Check static file middleware in `src/app.ts`
- Verify build completed successfully
- Check browser console for 404 errors

### API Errors
- Check authentication with `/api/admin/auth/check`
- Verify session is active
- Check network tab in browser dev tools
- Review server logs for errors

## Production Deployment

### Security Checklist
- [ ] Change admin username and password
- [ ] Set strong SESSION_SECRET
- [ ] Enable HTTPS
- [ ] Set `cookie.secure = true` in session config
- [ ] Add rate limiting middleware
- [ ] Set up CORS properly
- [ ] Use environment variables for all secrets
- [ ] Enable request logging
- [ ] Set up monitoring and alerts

### Example Production .env
```env
PORT=3000
ADMIN_USERNAME=secure_admin_username
ADMIN_PASSWORD_HASH=<bcrypt_hash_of_strong_password>
SESSION_SECRET=<random_64_char_string>

# Force HTTPS in production
NODE_ENV=production
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lightweight CSS (no frameworks)
- Minimal JavaScript (vanilla JS)
- Efficient API calls with filters
- Session-based auth (no token overhead)
- Optimized SQL queries with indexes

## Future Enhancements

Potential improvements:
- [ ] Add charts/graphs for analytics
- [ ] Export bookings to CSV/Excel
- [ ] Email notifications for new bookings
- [ ] Multi-user support with roles
- [ ] Booking calendar view
- [ ] Dark mode theme
- [ ] Mobile app (PWA)
- [ ] Advanced reporting

---

For more information, see the main [README.md](README.md) and [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
